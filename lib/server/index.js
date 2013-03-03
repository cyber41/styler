
var path = require('path'),
    ws = require('ws');

var Client = require('./module/client'),
    log = require('./module/logger'),
    watcher = require('./module/watcher'),
    client = null;


var config = require(path.resolve(__dirname, process.argv[2] || '../../config/server')),
    server = new ws.Server({
        host: config.host,
        port: config.port
    });


server.on('listening', function () {
    log.server(config);
});

server.on('error', function (err) {
    console.log(err);
});

server.on('connection', function (socket) {
    log.connection(socket);
    client = new Client(socket);
    client.on('settings', function (settings) {
        watcher.start(settings, function (err) {
            if (err) throw err;
        });
    });
});

watcher.on('change', function (host, path) {
    if (client.socket.readyState == ws.OPEN) {
        client.send({change: true, host: host, path: path});
    }
});
