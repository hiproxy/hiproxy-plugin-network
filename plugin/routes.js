'use strict';
var path = require('path');
var fs = require('fs');
var mustache = require('mustache');
var Socket = require('../socket');
var socketInstance;
var getMimeType = require('simple-mime')('text/plain');

module.exports = [
  {
    route: '/devtools',
    render: function (route, request, response) {
      response.writeHead(301, {
        Location: '/devtools/'
      });

      response.end();
    }
  },
  {
    route: '/devtools/(*)',
    render: function (route, request, response) {
      var pageName = route._ || 'index.html';
      var filePath = path.join(__dirname, '..', pageName);

      if (pageName === 'index.html') {

        if (!socketInstance) {
          socketInstance = new Socket();

          hiproxyServer.on('data', function (data, req, res) {
            if(res.headers
                && res.headers['content-type']
                && res.headers['content-type'].indexOf('image') != -1)  {
              data = '暂时不传递此类型的数据';
            }
            socketInstance.emit('data', data.toString(), req, res);
          });

          hiproxyServer.on('response', function (req, res) {
            socketInstance.emit('response', req, res);
          });

          return render(filePath, response);
        }
      }

      sendFile(filePath, response);
    }
  }
];

function render (file, res, data) {
  var statusCode = 200;
  var content = null;

  fs.readFile(file, 'utf-8', function (err, text) {
    if (err) {
      statusCode = 500;
      content = err.stack;
    } else {
      content = mustache.render(text, data);
    }

    res.writeHead(statusCode, {
      'Content-Type': 'text/html',
      'Powder-By': 'hiproxy-plugin-devtools'
    });

    res.end(content);
  });
}

function sendFile (file, res) {
  var mime = getMimeType(file);
  var statusCode = 200;
  var error = null;
  var stream = null;

  try {
    stream = fs.createReadStream(file);
  } catch (err) {
    statusCode = 500;
  }

  res.writeHead(statusCode, {
    'Content-Type': mime,
    'Powered-By': 'hiproxy-plugin-dashboard'
  });

  if (stream) {
    stream.pipe(res);
  } else {
    res.end(error.stack || error.message || error);
  }
}
