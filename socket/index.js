/**
 * socket
 * @huazihear
 */

'use strict';
var EventEmitter = require('events');
var http = require('http');
var url = require('url');
var skt = require('socket.io');
var zlib = require('zlib');
var socketObj = null;
var streamArray = {};

function SocketServer () {
  var app = http.createServer();
  var io = skt(app);
  var self = this;
  var eventBound = false;

  EventEmitter.call(this);
  app.listen(9998);

  io.on('connection', function (socket) {
    socketObj = socket;
    streamArray = {};
    var me = this;

    if (!eventBound) {
      eventBound = true;

      self.on('response', function (req, res) {
        if (streamArray[req.requestId]) {
          // gzip过后,content-length没了,所以计算一下
          if (res.headers['content-encoding'] === 'gzip') {
            res.headers['content-length'] = sizeof(streamArray[req.requestId], 'utf-8');
          }

          for (var key in me.sockets) {
            me.sockets[key].emit('data', parseRequest(req, res, streamArray[req.requestId]));
          }

          delete streamArray[req.requestId];
        }
      });

      self.on('data', function (data, req, res) {
        var reqId = req.requestId;

        if (!streamArray[reqId] &&
            res.headers &&
            res.headers['content-type'] &&
            res.headers['content-type'].indexOf(/(image|ico|bmp)/) !== -1) {
          data = '暂时不传递此类型的数据';
        }

        if (streamArray[reqId]) {
          streamArray[reqId] += data;
        } else {
          streamArray[reqId] = data;
        }
      });

      self.on('connect', function (hostname, port, request, socket, head) {
        for (var key in me.sockets) {
          me.sockets[key].emit('connectreq', {
            type: 'connect',
            hostname: hostname,
            port: port
          });
        }
      });
    }

    socketObj.emit('pageReady', getPageData());
  });
}

SocketServer.prototype = {
  constructor: SocketServer,
  __proto__: EventEmitter.prototype
};

function getPageData () {
  var t = hiproxyServer;
  return {
    httpPort: t.httpPort,
    proxyPath: '/proxy.pac?type=view',
    sslPath: '/ssl-certificate',
    httpsPort: t.httpsPort,
    workspace: t.dir
  };
}

function parseRequest (req, res, data) {
  var result = JSON.parse(JSON.stringify(req.proxyOptions));

  result.socketData = data;
  result.resContentType = res.headers['content-type'] || '';
  result.reqContentType = result.headers['content-type'] || '';
  result.id = req.requestId;
  result.newUrl = req.newUrl;
  result.statusCode = res.statusCode;
  result.time = Date.now() - req._startTime;
  result.resHeaders = JSON.parse(JSON.stringify(res.headers));
  result.url = url.parse(req.url);
  result.body = req.body;
  result.querystring = (result.path || '').split('?').slice(1).join('?');

  return JSON.stringify(result);
}

function sizeof (str, charset) {
  var total = 0;
  var charCode;
  var i;
  var len;

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
