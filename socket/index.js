/**
 * socket
 * @huazihear
 */

'use strict';
var EventEmitter = require('events');
var http = require('http');
var path = require('path');
var fs = require('fs-extra');
var os = require('os');
var url = require('url');
var skt = require('socket.io');
var zlib = require('zlib');
var socketObj = null;
var streamArray = {};
var PORT = 9998;

function SocketServer () {
  var app = http.createServer();
  var io = skt(app);
  var self = this;
  var eventBound = false;
  var cacheDir = path.join(os.tmpdir(), '.hiproxy-network-cache');

  EventEmitter.call(this);
  app.listen(PORT);

  fs.ensureDirSync(cacheDir);
  fs.emptyDirSync(cacheDir);

  io.on('connection', function (socket) {
    socketObj = socket;
    streamArray = {};
    var me = this;

    if (!eventBound) {
      eventBound = true;

      self.on('response', function (req, res, proxy) {
        var hiproxy = global.hiproxyServer;
        if (!streamArray[req.requestId]) {
          streamArray[req.requestId] = '';
        }

        // gzip过后,content-length没了,所以计算一下
        if (res.headers && res.headers['content-encoding'] === 'gzip') {
          res.headers['content-length'] = sizeof(streamArray[req.requestId], 'utf-8');
        }

        var urlInfo = url.parse(req.url);
        var reqPort = Number(urlInfo.port);
        
        if (!urlInfo.hostname) {
          return;
        }

        // 忽略hiproxy以及插件的请求，不发送到浏览器端
        if (urlInfo.hostname === '127.0.0.1' && (reqPort === PORT || reqPort === hiproxy.httpPort || reqPort === hiproxy.httpsPort)) {
          log.debug('hiproxy or plugin requests, ignore', req.url);
          return;
        }

        if (urlInfo.hostname === 'hi.proxy') {
          log.debug('hi.proxy request, ignore', req.url);
          return;
        }

        let key = req.requestId;
        let socketData = parseRequest(req, res, proxy, streamArray[key]);

        let filePath = path.join(os.tmpdir(), '.hiproxy-network-cache', key);

        fs.writeFile(filePath, res.body, function (err) {
          if (err) {
            log.error('write network file error:', key, error);
          } else {
            log.debug('write network file success:', key);
          }
        });

        for (var id in me.sockets) {
          me.sockets[id].emit('data', socketData);
        }
      });

      self.on('connect', function (hostname, port, request, socket, head) {
        for (var key in me.sockets) {
          me.sockets[key].emit('connectreq', {
            type: 'connect',
            hostname: hostname,
            port: port,
            method: 'CONNECT',
            headers: {},
            body: '',
            id: request.requestId,
            startTime: request._startTime,
            url: url.parse('https://' + hostname + (port ? ':' + port : ':443'))
          });
        }
      });
    } else {
      streamArray = {};
    }

    socketObj.emit('ready', getPageData());
  });
}

SocketServer.prototype = {
  constructor: SocketServer,
  getSocketData: function (reqId) {
    return streamArray[reqId];
  },
  __proto__: EventEmitter.prototype
};

function getPageData () {
  var t = hiproxyServer;
  return {
    httpPort: t.httpPort,
    httpsPort: t.httpsPort,
    pacPath: '/proxy.pac?type=view',
    certPath: '/ssl-certificate',
    workspace: t.dir,
    localIP: t.localIP
  };
}

function parseRequest (req, res, proxy, data) {
  var result = JSON.parse(JSON.stringify(proxy || {}));

  res.headers = res.headers || {};
  result.headers = result.headers || {};
  result.originLength = data.length;
  result.socketData = '';
  result.resContentType = res.headers['content-type'] || '';
  result.reqContentType = result.headers['content-type'] || '';
  result.id = req.requestId;
  result.newUrl = req.newUrl;
  result.statusCode = res.statusCode;
  result.statusMessage = res.statusMessage || '';
  result.time = Date.now() - req._startTime;
  result.resHeaders = JSON.parse(JSON.stringify(res.headers));
  result.url = url.parse(req.url);
  result.body = req.body;
  result.querystring = (result.path || '').split('?').slice(1).join('?');
  result.startTime = req._startTime;
  result.bodyLength = (res.body || '').length;

  //通过contentType和method判断出来显示方式和queryData
  result.queryObject = getQueryObject(req.method, result.url.query, result.resContentType, req.body);

  return JSON.stringify(result);
}

function getQueryObject (method, query, contentType, body) {

  if (method && method.toLowerCase() === 'get') {
    return {
      keyName: 'Query String Parameters',
      object: query2string(query)
    }
  }

  if (contentType && contentType.indexOf('application/json') > -1) {
    return {
      keyName: 'Request Payload',
      object: query2string(body)
    }
  }

  if (contentType && contentType.indexOf('x-www-form-urlencoded') > -1) {
    return {
      keyName: 'Form Data',
      object: query2string(body)
    }
  }

  return {
    keyName: 'Plain Text',
    object: {
      'Plain Text': body || query || ''
    }
  };
}

function query2string(query) {
  if (typeof query !== 'string') {
    return query;
  }
  var result = {}
  var queryArr = query.split("&");
  queryArr.forEach(function(item){
      var value = item.split("=")[1];
      var key = item.split("=")[0];
      result[key] = decodeURIComponent(value);
  });
  return result;
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
