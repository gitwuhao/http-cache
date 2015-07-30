'use strict';
/*
 *侦听并解析http缓存策略配置文件
 * @authors     wuhao
 * @date        2015-05-27 14:37:16
 * @version     1.0.0
 */
var fs = require('fs'),
    gulp = require('gulp'),
    /*
     *扩展node的util类
     */
    util = require('./util'),
    events = require('events'),
    ConfigListener = function() {
        //初始化
        this.init.apply(this, arguments);
    };

/*
 *事件继承
 */
util.inherits(ConfigListener, events.EventEmitter);

/*
 *ConfigListener原型
 */
util.merger(ConfigListener.prototype, {
    //配置文件名
    fileName: 'http-cache.json',
    //事件侦听者
    listener: null,
    //初始化
    init: function(config) {
        util.merger(this, config);
        //设置默认的事件侦听者
        if (!this.listener) {
            this.listener = this;
        }

        //读取并解析配置文件
        this.readConfig(this.fileName);

        var me = this;

        //创建配置文件侦听
        this.watcher = gulp.watch(this.fileName);

        this.watcher.on('change', function(event) {
            me.onChage(event);
        });

        //触发init事件
        this.emit('init', {
            type: 'init'
        });

        this.ready();
    },
    ready: util.emptyFn,
    //配置文件改变
    onChage: function(event) {
        var me = this;
        this.readConfig(event.path);
    },
    getDefaultConfig: function() {
        return {
            '*': 0
        };
    },
    //读取并解析配置文件
    readConfig: function(filePath) {
        var me = this;
        fs.readFile(filePath, function(err, data) {
            if (err) {
                console.error(err);
            }
            var json;
            try {
                if (data) {
                    json = JSON.parse(data.toString());
                }
            } catch (e) {
                console.error('parse ' + filePath + ' error', e);
            }
            me.parseConfig(json || me.getDefaultConfig());
        });
    },
    /*
     *将配置文件解析成：
     *{
     *  css:{
     *
     *  },
     *  js : {
     *
     *  },
     *  image : {
     *
     *  },
     *  //其它文件
     *  '^' : {
     *
     *  }
     *}
     */
    parseConfig: function(json) {
        if (json == this.cfg) {
            return;
        }
        //解析配置

        util.it(json, function(key, value) {
            var time = this.getSeconds(value),
                isPath = false;
            time = time < 0 ? -1 : time;
            json[key] = time;
            if (key && ('' + key).indexOf('*') > -1) {
                var newKey = key.replace(/\*/g, '.*').replace(/\.\.\*/g, '.*');
                if (key != newKey) {
                    json[newKey] = time;
                    delete json[key];
                    key = newKey;
                }
            }

            delete json[key];

            key = key.trim();

            //处理路径
            if (/^%.+%$/i.test(key)) {
                key = key.replace(/^%|%$/g, '').trim();
                isPath = true;
            }

            value = {
                reg: new RegExp(key, 'i'),
                time: time
            };

            if (isPath) {
                value.isPath = true;
            }

            json[key] = value;

        }, this);


        this.cfg = {
            css: this.getCSSConfig(json),
            js: this.getJSConfig(json),
            image: this.getImageConfig(json),
            '^': json
        };
        var event = {
            type: 'reloadconfig',
            data: this.cfg
        };
        this.listener.emit(event.type, event);
    },
    /*
     *获取css缓存规则
     */
    getCSSConfig: function(json) {
        var css = {};
        for (var key in json) {
            var value = json[key],
                reg = new RegExp(key, 'i');
            if (/[.]css([?]|$)/i.test(key)) {
                css[key] = value;
                delete json[key];
            } else if (reg.test('a.css') || value.isPath) {
                css[key] = value;
            }
        }
        return css;
    },
    /*
     *获取js缓存规则
     */
    getJSConfig: function(json) {
        var js = {};
        for (var key in json) {
            var value = json[key],
                reg = new RegExp(key, 'i');
            if (/[.](js|json)([?]|$)/i.test(key)) {
                js[key] = value;
                delete json[key];
            } else if (reg.test('a.js') || value.isPath) {
                js[key] = value;
            }
        }
        return js;
    },
    /*
     *获取image缓存规则
     */
    getImageConfig: function(json) {
        var img = {};
        for (var key in json) {
            var value = json[key],
                reg = new RegExp(key, 'i');
            if (/[.](jpg|jpeg|png|gif|bmp)([?]|$)/i.test(key)) {
                img[key] = value;
                delete json[key];
            } else if (reg.test('a.jpg') || reg.test('a.jpeg') || reg.test('a.png') || reg.test('a.gif') || reg.test('a.bmp') || value.isPath) {
                img[key] = value;
            }
        }
        return img;
    },
    ONE_YEAR_OF_SECONDS: 365 * 24 * 60 * 60,
    ONE_MONTH_OF_SECONDS: 30 * 24 * 60 * 60,
    ONE_DAY_OF_SECONDS: 24 * 60 * 60,
    ONE_HOURS_OF_SECONDS: 60 * 60,
    ONE_MINUTES_OF_SECONDS: 60,
    /* 解析秒
     * 单位：y(年)、m(月)、d(日)、h(时)、mi(分)、s(秒,默认秒)
     * time : 10y、3m、1d、12h、5mi、1s、1
     */
    getSeconds: function(time) {
        if (util.isEmpty(time)) {
            return 0;
        }
        var value = '' + time;
        time = value.match(/^(\d+)Y$/i);
        if (time && time[1]) {
            return parseInt(time[1]) * this.ONE_YEAR_OF_SECONDS;
        }

        time = value.match(/^(\d+)M$/i);
        if (time && time[1]) {
            return parseInt(time[1]) * this.ONE_MONTH_OF_SECONDS;
        }

        time = value.match(/^(\d+)D$/i);
        if (time && time[1]) {
            return parseInt(time[1]) * this.ONE_DAY_OF_SECONDS;
        }

        time = value.match(/^(\d+)H$/i);
        if (time && time[1]) {
            return parseInt(time[1]) * this.ONE_HOURS_OF_SECONDS;
        }

        time = value.match(/^(\d+)MI$/i);
        if (time && time[1]) {
            return parseInt(time[1]) * this.ONE_MINUTES_OF_SECONDS;
        }

        time = value.match(/^([-|+]?\d+)(S?)$/i);
        if (time && time[1]) {
            return parseInt(time[1]);
        }
        return 0;
    }
});

module.exports = ConfigListener;
