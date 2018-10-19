/**
 * socket
 * @huazihear
 */

'use strict';
var EventEmitter = require('events');
var http = require('http');
var path = require('path');
var os = require('os');
var fs = require('fs');
var url = require('url');
var skt = require('socket.io');
var socketObj = null;
var PORT = 9998;

function SocketServer () {
  var app = http.createServer();
  var io = skt(app);
  var self = this;
  var eventBound = false;
  var cacheDir = path.join(os.tmpdir(), '.hiproxy-network-cache');

  EventEmitter.call(this);
  app.listen(PORT);

  mkdirSync(cacheDir);

  io.on('connection', function (socket) {
    socketObj = socket;
    var me = this;

    if (!eventBound) {
      eventBound = true;

      self.on('request', function (req, res) {
        var shouldIgnore = shouldIgnoreRequest(req);

        if (shouldIgnore) {
          return;
        }

        var socketData = parseRequest(req, res);

        for (var id in me.sockets) {
          me.sockets[id].emit('request', socketData);
        }
      });

      self.on('response', function (req, res, proxy) {
        var shouldIgnore = shouldIgnoreRequest(req);

        if (shouldIgnore) {
          return;
        }

        // gzip过后,content-length没了,所以计算一下
        if (res.headers && res.headers['content-encoding'] === 'gzip') {
          delete res.headers['content-length'];
        }


        let key = req.requestId;
        let socketData = parseRequest(req, res, proxy);

        let filePath = path.join(os.tmpdir(), '.hiproxy-network-cache', key);

        fs.writeFile(filePath, res.body, function (err) {
          if (err) {
            log.error('write network file error:', key, error);
          } else {
            log.debug('write network file success:', key);
          }
        });

        for (var id in me.sockets) {
          me.sockets[id].emit('response', socketData);
        }
      });

      self.on('connect', function (hostname, port, request, socket, head) {
        for (var key in me.sockets) {
          request.url = 'https://' + request.url;
          me.sockets[key].emit('connectreq', parseRequest(request, {headers:{}}, {}));
        }
      });
    }

    socketObj.emit('ready', getPageData());
  });
}

SocketServer.prototype = {
  constructor: SocketServer,
  __proto__: EventEmitter.prototype
};

function shouldIgnoreRequest (req) {
  var hiproxy = global.hiproxyServer;
  var urlInfo = url.parse(req.url);
  var reqPort = Number(urlInfo.port);
    
  if (!urlInfo.hostname) {
    return true;
  }

  // 忽略hiproxy以及插件的请求，不发送到浏览器端
  if (urlInfo.hostname === '127.0.0.1' && (reqPort === PORT || reqPort === hiproxy.httpPort || reqPort === hiproxy.httpsPort)) {
    log.debug('hiproxy or plugin requests, ignore', req.url);
    return true;
  }

  if (urlInfo.hostname === 'hi.proxy') {
    log.debug('hi.proxy request, ignore', req.url);
    return true;
  }

  return false;
}

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
  var resultInfo = {};
  var urlInfo = url.parse(req.url);

  resultInfo.id = req.requestId;
  resultInfo.proxy = JSON.parse(JSON.stringify(proxy || {}));
  resultInfo.req = getReqInfo(req);
  resultInfo.originalReq = req.originalInfo || {};
  resultInfo.res = getResInfo(res);
  resultInfo.originalRes = res.originalInfo || {};
  resultInfo.time = Date.now() - req._startTime;
  resultInfo.urlInfo = urlInfo;
  //通过contentType和method判断出来显示方式和queryData
  resultInfo.queryObject = getQueryObject(req.method, urlInfo.query, req.headers['content-type'], req.body);

  return JSON.stringify(resultInfo);
}

function getReqInfo(req) {
  var obj = {};
  var props = [
    // 标准属性
    'headers',
    'httpVersion',
    'method',
    'rawHeaders',
    'rawTrailers',
    'trailers',
    'url',

    // 自定义属性
    'requestId',
    // 'body',
    '_startTime'
  ];

  props.forEach(function (key) {
    if (typeof req[key] === 'object') {
      obj[key] = JSON.parse(JSON.stringify(req[key]));
    } else {
      obj[key] = req[key];
    }
  });

  obj.urlInfo = url.parse(obj.url);

  return obj;
}

function getResInfo(res) {
  var obj = {};
  var props = [
    // 标准属性
    'headers',
    'httpVersion',
    'method',
    'rawHeaders',
    'rawTrailers',
    'statusCode',
    'statusMessage',
    'trailers'//,

    // 自定义属性
    // 'body'
  ];

  props.forEach(function (key) {
    if (typeof res[key] === 'object') {
      obj[key] = JSON.parse(JSON.stringify(res[key]));
    } else {
      obj[key] = res[key];
    }
  });

  obj.body = {
    length: (res.body || '').length
  }

  return obj;
}

function getQueryObject (method, query, contentType, body) {
  if (query && method && method.toLowerCase() === 'get') {
    return {
      keyName: 'Query String Parameters',
      object: query2string(query)
    }
  }

  if (body && contentType && contentType.indexOf('application/json') > -1) {
    return {
      keyName: 'Request Payload',
      object: JSON.parse(body)
    }
  }

  if (body && contentType && contentType.indexOf('x-www-form-urlencoded') > -1) {
    return {
      keyName: 'Form Data',
      object: query2string(body)
    }
  }

  return body || query ? {
    keyName: 'Plain Text',
    object: {
      'Plain Text': body || query || ''
    }
  } : null;
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
//同步创建一个目录，存在会报错清空
function mkdirSync (path) {
  try {
    fs.mkdirSync(path);
  } catch (e) {
    deleteall(path);
  }
}
function deleteall (path) {
  var files = [];	
  if(fs.existsSync(path)) {		
    files = fs.readdirSync(path);		
    files.forEach(function(file, index) {			
      var curPath = path + "/" + file;			
      if(fs.statSync(curPath).isDirectory()) { 
        deleteall(curPath);			
      } else {
        fs.unlinkSync(curPath);			
      }		
    });		
  }
}

module.exports = SocketServer;
