var static = require('./lib/node-static'),
    eventListener = require('./lib/eventListener'),
    http = require('http'),
    port = 8099,
    staticServer;

//
// Create a node-static server to serve the current directory
//
staticServer = new static.Server('../');

eventListener.init(staticServer);

http.createServer(function(request, response) {
    staticServer.serve(request, response, function(err, res) {
        var headers = request.headers;
        if (err) { // An error as occured
            console.error("> Error serving " + request.url + " - " + err.message);
            response.writeHead(err.status, err.headers);
            response.end();
        } else { // The file was served successfully
            console.log("> " + request.url + " - " + res.message);
            //console.log('\n【'+headers['user-agent']+'】');
        }
    });
}).listen(port);



console.log("> node-static(" + static.version.join('.') + ") is listening on http://127.0.0.1:" + port);
