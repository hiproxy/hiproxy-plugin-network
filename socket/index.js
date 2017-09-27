/**
 * socket
 * @huazihear
 */

'use strict';
var EventEmitter = require('events');
var app = require('http').createServer();
var io = require('socket.io')(app);
app.listen(9999);
var zlib = require('zlib');

var streamArray = {};

function SocketServer(){
    EventEmitter.call(this);
    var self = this;

    io.on('connection', function (socket) {
        self.on('response', function (req,res,data) {
            if (streamArray[req.requestId]) {
                socket.emit('data', parseRequest(req,streamArray[req.requestId]));
            }
        });

        self.on('data', function (data, rewrite, req, res) {
            var reqId = req.requestId;

            if (streamArray[reqId]) {
                streamArray[reqId] += data;
            } else {
                streamArray[reqId] = data;
            }
        });

        socket.emit('pageReady', getPageData());
    });
}

SocketServer.prototype = {
    constructor: SocketServer,
    __proto__: EventEmitter.prototype
};

function getPageData() {
    var t = hiproxyServer;
    return {
        proxyPath: 'http://'+t.localIP+':'+t.httpPort+'/proxy.pac?type=view',
        sslPath: 'http://'+t.localIP+':'+t.httpPort+'/ssl-certificate',
        httpsPort: t.httpsPort,
        workspace: t.dir
    }
}

function parseRequest (req,data) {
    var response = JSON.parse(JSON.stringify(req.proxyOptions));
    response.socketData = data;
    response.contentType = req.res.headers['content-type'];
    response.id = req.requestId;
    response.statusCode = req.res.statusCode;
    response.time = Date.now() - req._startTime;

    return JSON.stringify(response);
}

module.exports = SocketServer;