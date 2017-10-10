/**
 * socket
 * @huazihear
 */

'use strict';
var EventEmitter = require('events');
var app = require('http').createServer();
var io = require('socket.io')(app);
var zlib = require('zlib');

var streamArray = {};

function SocketServer () {
  EventEmitter.call(this);
  app.listen(9998);

  var self = this;

  io.on('connection', function (socket) {
    self.on('response', function (req, res) {
      if (streamArray[req.requestId]) {
                // gzip过后,content-length没了,所以计算一下
        if (res.headers['content-encoding'] == 'gzip') {
          res.headers['content-length'] = sizeof(streamArray[req.requestId], 'utf-8');
        }

        socket.emit('data', parseRequest(req, res, streamArray[req.requestId]));
      }
    });

    self.on('data', function (data, req, res) {
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

function getPageData () {
  var t = hiproxyServer;
  return {
    proxyPath: 'http://' + t.localIP + ':' + t.httpPort + '/proxy.pac?type=view',
    sslPath: 'http://' + t.localIP + ':' + t.httpPort + '/ssl-certificate',
    httpsPort: t.httpsPort,
    workspace: t.dir
  };
}

function parseRequest (req, res, data) {
  var response = JSON.parse(JSON.stringify(req.proxyOptions));
  response.socketData = data;
  response.contentType = req.res.headers['content-type'];
  response.id = req.requestId;
  response.newUrl = req.newUrl;
  response.statusCode = res.statusCode;
  response.time = Date.now() - req._startTime;
  response.resHeaders = JSON.parse(JSON.stringify(res.headers));
  response.url = req.url;

  return JSON.stringify(response);
}

function sizeof (str, charset) {
  var total = 0,
    charCode,
    i,
    len;
  charset = charset ? charset.toLowerCase() : '';
  if (charset === 'utf-16' || charset === 'utf16') {
    for (i = 0, len = str.length; i < len; i++) {
      charCode = str.charCodeAt(i);
      if (charCode <= 0xffff) {
        total += 2;
      } else {
        total += 4;
      }
    }
  } else {
    for (i = 0, len = str.length; i < len; i++) {
      charCode = str.charCodeAt(i);
      if (charCode <= 0x007f) {
        total += 1;
      } else if (charCode <= 0x07ff) {
        total += 2;
      } else if (charCode <= 0xffff) {
        total += 3;
      } else {
        total += 4;
      }
    }
  }
  return total;
}

module.exports = SocketServer;
