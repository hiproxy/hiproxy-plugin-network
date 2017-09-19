/**
 * socket
 * @huazihear
 */

'use strict';
var EventEmitter = require('events');
var app = require('http').createServer();
var io = require('socket.io')(app);
app.listen(9999);

function SocketServer(){
    EventEmitter.call(this);
    var self = this;

    io.on('connection', function (socket) {
        //self.on('request', function (req, res) {
        //    var requestJson = parseRequest(req);
        //    socket.emit('request', requestJson)
        //});
        //self.on('response', function (req, res) {
        //    var requestJson = parseRequest(req);
        //    socket.emit('request', requestJson)
        //});
        //self.on('setRequest', function (req, res) {
        //    var requestJson = parseRequest(req);
        //    socket.emit('request', requestJson)
        //});
        //self.on('setResponse', function (req, res) {
        //    var requestJson = parseRequest(req);
        //    socket.emit('request', requestJson)
        //});
        self.on('data', function (data, rewrite, req, res) {
            socket.emit('data', parseRequest(req,data))
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
    return response;
}

module.exports = SocketServer;