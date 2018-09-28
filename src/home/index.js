/**
 * @file home page module
 * @author zdying
 */

window.modPage = {
  $el: null,

  tableData: [],

  tableDataMap: {},

  currRowKey: '',

  init: function () {
    this.$el = $('#js-network-table');
    this.initEvent();
    this.initSocket();
  },

  initEvent: function () {
    this.$el.on('click', 'tbody tr', function (eve) {
      let $curr = $(eve.currentTarget);
      let key = $curr.attr('id').replace('js-', '');
      let currInfo = this.tableDataMap[key];

      this.currRowKey = key;

      this.$el.find('tbody tr.active').removeClass('active');
      $curr.addClass('active');

      window.$eve.trigger('itemclick.table', currInfo);
    }.bind(this));

    // Hide CONNECT Requests
    $('#js-filter-checkbox').on('click', function (eve) {
      this.renderTable();
    }.bind(this));

    // Filter by text
    $('#js-filter-input').on('input', function (eve) {
      this.renderTable();
    }.bind(this));

    // Filter by content-type
    $('#js-file-types').on('click', '[data-file-type]', function (eve) {
      let $curr = $(eve.currentTarget);
      let $siblings = $curr.siblings();
      
      $siblings.removeClass('active');
      $curr.addClass('active');

      this.renderTable();

      this.scrollToTop('#js-body');
    }.bind(this));

    // Clear all data
    $('#js-clear-all').on('click', function (eve) {
      this.tableData = [];
      this.tableDataMap = {};
      this.renderTable();
      window.networkDetail.hide();
    }.bind(this));

    // Clear highlight row when network detail dialog close
    window.$eve.on('hide.detail', function (eve) {
      this.$el.find('tbody tr.active').removeClass('active');
      this.currRowKey = '';
    }.bind(this));
  },

  initSocket: function () {
    let socket = io('http://127.0.0.1:9998');

    socket.on('ready', (data) => {
      console.log('page ready:', data);
      // {httpPort: 5525, proxyPath: "/proxy.pac?type=view", sslPath: "/ssl-certificate", httpsPort: 10010, workspace: "/Users/zdying/Desktop"}
      $('.js-link-pac').attr('href', data.pacPath);
      $('.js-link-cert').attr('href', data.certPath);
      $('#js-qrcode-cert').attr('src', window.jrQrcode.getQrBase64('http://hi.proxy' + data.sslPath));
      $('.js-hiproxy-server').html(data.localIP + ':' + data.httpPort)
    });

    socket.on('response', data => {
      let obj = JSON.parse(data);
      let path = obj.path;
      let isSocketIOURL = /^\/(socket\.io|network)/.test(path);

      if (isSocketIOURL) {
        console.warn('socket.io本身的请求，忽略');
        return;
      }

      this.onResponse(obj);
    });

    socket.on('request', data => {
      let obj = JSON.parse(data);
      this.onRequest(obj);
    });

    socket.on('connectreq', data => {
      if (data.hostname === location.hostname && data.port === '9998') {
        // 忽略插件本身的请求
      } else {
        this.onRequest(data);
      }
    });
  },

  onRequest: function (data) {
    let {tableData} = this;

    data.statusCode = 'pending';
    data.index = tableData.length;

    this.tableData.push(data);
    this.renderTable();
  },

  onResponse: function (data) {
    let {id} = data;
    let {tableData, tableDataMap} = this;
    let currInfo = tableDataMap[id];
    let {index} = currInfo;

    if (tableData[index]) {
      tableData[index] = data;
    }

    this.updateRow(id, data);
  },

  renderTable: function () {
    let data = this.getRenderData(this.tableData);
    let fixedData = this.fixData(data);
    let html = this.getRowsHTML(fixedData);

    $('#js-table-body').html(html);
    this.scrollToBottom('#js-body');
  },

  updateRow: function (id, data) {
    let html = this.getRowsHTML(this.getRenderData([data]));
    let $row = $('#js-' + id);
    $row.html($(html).html());
  },

  getRenderData: function (data) {
    let renderData = data && data.map((item, index) => {
      let {id, resHeaders = {}, bodyLength, statusCode, url, method, hostname, port, path, time} = item;
      let contentType = resHeaders['content-type'] || '';
      let length = resHeaders['content-length'] || bodyLength;
      let fileType = this.getFileType(item);

      this.tableDataMap[id] = item;
  
      item.index = index;

      if (item.type === 'connect') {
        return {
          index: index,
          key: id,
          name: ['UNKNOW', 'ssl-error'],
          id: id,
          method: 'CONNECT',
          protocol: 'HTTPS',
          status: '',
          address: hostname + ':' + port,
          targetAddress: '',
          targetPath: '',
          type: '',
          size: 'N/A',
          time: 'N/A'
        };
      }
  
      let {host, protocol = ''} = url;

      return {
        index: index,
        key: id,
        name: [item.url.path, fileType],
        id: id,
        method: method || '',
        protocol: protocol.replace(':', '').toUpperCase(),
        status: statusCode,
        address: host,
        targetAddress: hostname ? hostname + (port ? ':' + port : '') : '',
        targetPath: path || '',
        // type: getContentType(contentType),
        type: contentType,
        size: length, // getSizeLabel(length),
        time: time // getTimeLabel(time)
      };
    });

    return renderData;
  },

  fixData: function (list) {
    return this.filterRenderData(list);
  },

  filterRenderData: function (list) {
    // CONNECT request
    let checked = $('#js-filter-checkbox').prop('checked');

    if (checked) {
      list = list.filter(function (item) {
        return item.method !== 'CONNECT';
      });
    }

    let filterText = $('#js-filter-input').val();
    if (filterText) {
      list = list.filter(function (item) {
        let hasText = [
          'name', 'address', 'method', 'protocol', 'targetAddress', 
          'targetPath', 'type', 'status'
        ].some(function (key) {
          return String(item[key]).indexOf(filterText) !== -1;
        });
        return hasText;
      });
    }

    let fileType = $('#js-file-types [data-file-type].active').data('fileType');

    const fileTypes = {
      'doc': /html/,
      'js': /javascript/,
      'json': /json/,
      'css': /css/,
      'img': /(jpg|png|gif|svg|ico|bmp|webp|icon)/,
      'other': /(txt|xml|zip|pdf)/
    };

    if (fileType !== 'all') {
      list = list.filter(function (item) {
        if (fileType === 'other' && !item.type) {
          return true;
        }

        return item.type.match(fileTypes[fileType])
      });
    }

    list = list.slice(-300);

    return list;
  },

  getFileType: function (t) {
    const files = [
      'css', 'file', 'html', 'javascript',
      'jpg', 'png', 'pdf', 'json', 'svg', 'gif', 'ico',
      'txt', 'xml', 'zip'
    ];
    let {resHeaders = {}} = t;
    let contentType = resHeaders['content-type'] || '';
    let fileType = contentType.split(';')[0].split('/')[1] || '';
    if (t.type === 'connect') {
      return 'ssl-error';
    }
  
    fileType = fileType.trim();
  
    if (fileType.indexOf('+')) {
      fileType = fileType.split('+')[0];
    }
  
    if (fileType === 'jpeg') {
      fileType = 'jpg';
    } else if (fileType === 'x-javascript') {
      fileType = 'javascript';
    } else if (fileType === 'x-ico' || fileType === 'x-icon') {
      fileType = 'ico';
    }
  
    if (files.indexOf(fileType) === -1) {
      fileType = 'text';
    }
  
    return fileType;
  },

  getRowsHTML: function (data) {
    let html = data.map((item, index) => {
      let arr = item.name[0].split('/');
      let cls = item.id === this.currRowKey ? 'active' : '';

      return [
        `<tr id="js-${item.key}" class="${cls}">`,
        // `  <td>${arr.slice(-1)}<br/><span class="text-gray">${arr.slice(0, -1).join('/')}</span></td>`,
        `  <td>
             <div class="network-name" title="${item.name[0]}">
               <img class="file-type-img" src="icons/${item.name[1]}.png" alt="">
               <span class="url-path">
               ${arr.slice(-1)[0] || '/'}<br/><span class="text-gray">${arr.slice(0, -1).join('/')}</span>
               </span>
             </div>
           </td>`,
        `  <td title="${item.method}">${item.method}</td>`,
        `  <td title="${item.status}">${item.status}<br/><span class="text-gray">${item.statusMessage || ''}</span></td>`,
        `  <td title="${item.protocol}">${item.protocol}</td>`,
        `  <td title="${item.address}">${item.address}</td>`,
        `  <td title="${item.targetAddress}">${item.targetAddress}</td>`,
        `  <td title="${item.targetPath}">${item.targetPath}</td>`,
        `  <td title="${item.type}">${item.type.split(';')[0]}</td>`,
        `  <td title="${item.size}">${this.formatSize(item.size)}</td>`,
        `  <td title="${item.time}">${this.formatTime(item.time)}</td>`,
        `</tr>`
      ].join('\n');
    });

    return html.join('');
  },

  scrollToBottom: function (selector) {
    let $body = $(selector);
    let offsetHeight = $body[0].offsetHeight;
    let scrollHeight = $body[0].scrollHeight;
    let scrollTop = $body[0].scrollTop;
    let newScrollTop = scrollHeight - offsetHeight;

    if (newScrollTop - scrollTop > 50) {
      return;
    }

    $body.scrollTop(newScrollTop);
  },

  scrollToTop: function (selector) {
    let $body = $(selector);
    $body.scrollTop(0);
  },

  formatTime: function (num) {
    if (num === 'N/A') {
      return num;
    }

    if (num >= 1000) {
      return this.toFixed(num / 1000) + 's';
    } else {
      return num + 'ms';
    }
  },

  formatSize: function (num) {
    if (num === 'N/A') {
      return num;
    }

    let n = 1024 * 1024;
    let labels = ['MB', 'KB', 'B'];

    for (let i = 0; i < labels.length; i++) {
      if (num / n >= 1) {
        return this.toFixed(num/n) + labels[i];
      }

      n /= 1024;
    }

    return num + 'B';
  },

  toFixed: function (num) {
    return num.toFixed(1).replace('.0', '');
  }
}