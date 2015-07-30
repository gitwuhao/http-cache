'use strict';

var util = require('./util'),
    ConfigListener = require('./configListener');
/*
 *初始化事件侦听
 * @authors     wuhao
 * @date        2015-05-28 15:21:38
 * @version     1.0.0
 */
exports.init = function(server) {

    util.merger(server, {
        //缓存规则
        expiredConfig: null,
        /*
         *获取最小过期时间(s)
         */
        getMinExpiredTime: function(url, list) {
            if (!list) {
                return null;
            }
            var time = null;
            util.it(list, function(key, value) {
                if (value && value.reg && value.reg.test(url)) {
                    if (time == null) {
                        time = value.time;
                    } else if (value.time < time) {
                        time = value.time;
                    }
                }
            });
            return time;
        },
        /*
         *一直不缓存
         */
        setNeverCache: function(headers) {
            delete headers['ETag'];
            delete headers['Last-Modified'];
            headers['Expires'] = '-1';
            headers['Cache-Control'] = 'max-age=0';
        },
        /*
         *实时缓存，每次会和服务器ETag比较
         */
        setRealTimeCache: function(headers) {
            headers['Expires'] = '-1';
            headers['Cache-Control'] = 'max-age=0';
        },
        /*
         *过期缓存，过期后才会从服务器获取
         */
        setExpiredTimeCache: function(headers, time) {
            var date = new Date();
            date.setTime(date.getTime() + (time * 1000));
            headers['Expires'] = date.toUTCString();
            headers['Cache-Control'] = 'max-age=' + time;
        }
    });

    /*
     *侦听writeheadbefore事件
     */
    server.on('writeheadbefore', function(event) {
        var time = null,
            type = null,
            url = event.url,
            headers = event.headers,
            cfg = this.expiredConfig || {};
        //图片类型
        if (/[.](jpg|jpeg|png|gif|bmp)([?]|$)/i.test(url)) {
            type = 'image';
            time = this.getMinExpiredTime(url, cfg.image || {});
            //css类型
        } else if (/[.]css([?]|$)/i.test(url)) {
            type = 'css';
            time = this.getMinExpiredTime(url, cfg.css || {});
            //js类型
        } else if (/[.](js|json)([?]|$)/i.test(url)) {
            type = 'js';
            time = this.getMinExpiredTime(url, cfg.js || {});
            //其它类型
        } else {
            type = 'other';
            time = this.getMinExpiredTime(url, cfg['^'] || {});
        }

        //默认为一直不缓存
        if (time == null) {
            time = -1;
        }

        //-1为一直不缓存
        if (time == -1) {
            this.setNeverCache(headers);
            //0为实时缓存
        } else if (time == 0) {
            this.setRealTimeCache(headers);
            //设置过期缓存
        } else {
            this.setExpiredTimeCache(headers, time);
        }

        headers['X-Cache-Type'] = type;
    });

    /*
     *侦听reloadconfig事件
     */
    server.on('reloadconfig', function(event) {
        this.expiredConfig = event.data || {};
        console.info('> reloadconfig:', this.expiredConfig);
    });

    /*
     *创建配置文件侦听者
     */
    new ConfigListener({
        //server为侦听者，将事件传递到server上
        listener: server
    });

};
