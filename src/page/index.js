/**
 * @file home page module
 * @author zdying
 */

window.modPage = {
  $el: null,

  tableData: [],

  tableDataMap: {},

  init: function () {
    this.$el = $('#js-network-table');
    this.initEvent();
    this.initSocket();
  },

  initEvent: function () {
    this.$el.on('click', 'tbody tr', function (eve) {
      let $curr = $(eve.currentTarget);
      let data = $curr.data();
      let key = data.key;
      let currInfo = this.tableDataMap[key];

      window.networkDetail.show(currInfo);
    }.bind(this));

    $('#js-filter-checkbox').on('click', function (eve) {
      this.renderTable();
    }.bind(this));

    $('#js-filter-input').on('input', function (eve) {
      this.renderTable();
    }.bind(this));

    $('#js-file-types').on('click', '[data-file-type]', function (eve) {
      let $curr = $(eve.currentTarget);
      let $siblings = $curr.siblings();
      
      $siblings.removeClass('active');
      $curr.addClass('active');

      this.renderTable();
    }.bind(this));

    $('#js-clear-all').on('click', function (eve) {
      this.tableData = [];
      this.tableDataMap = {};
      this.renderTable();
      window.networkDetail.hide();
    }.bind(this));
  },

  initSocket: function () {
    let socket = io('http://127.0.0.1:9998');

    socket.on('pageReady', (data) => {
      console.log('page ready:', data);
    });

    socket.on('data', data => {
      let maxLen = 1 * 1024 * 1024;
      let obj = JSON.parse(data);
      let path = obj.path;
      let isSocketIOURL = /^\/(socket\.io|network)/.test(path);

      if (isSocketIOURL) {
        console.warn('socket.io本身的请求，忽略');
        return;
      }

      this.onArrive(obj);
    });

    socket.on('connectreq', data => {
      if (data.hostname === location.hostname && data.port === '9998') {
        // 忽略插件本身的请求
      } else {
        this.onArrive(data);
      }
    });
  },

  onArrive: function (data) {
    this.tableData.push(data);

    this.tableData = this.tableData.slice(-200);

    this.renderTable();
  },

  renderTable: function () {
    let data = this.getRenderData();
    let html = this.getTableHTML(data);

    $('#js-table-body').html(html);
    this.scrollToBottom();
  },

  getRenderData: function () {
    let data = this.tableData;

    let renderData = data && data.map((item, index) => {
      let {id, resHeaders = {}, socketData = '', statusCode, url, method, hostname, port, path, time} = item;
      let contentType = resHeaders['content-type'] || '';
      let length = resHeaders['content-length'] || socketData.length;
      let fileType = this.getFileType(item);

      this.tableDataMap[id] = item;
  
      if (item.type === 'connect') {
        return {
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
        key: id,
        name: [item.url.path, fileType],
        id: id,
        method: method,
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

    renderData = this.filterRenderData(renderData);

    return renderData;
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

  getTableHTML: function (data) {
    let html = data.map(item => {
      let arr = item.name[0].split('/');
      return [
        `<tr data-key=${item.key}>`,
        // `  <td>${arr.slice(-1)}<br/><span class="text-gray">${arr.slice(0, -1).join('/')}</span></td>`,
        `  <td>
             <div class="network-name" title="${item.name[0]}">
               <img class="file-type-img" src="icons/${item.name[1]}.png" alt="">
               <span class="url-path">
               ${arr.slice(-1)[0] || '/'}<br/><span class="text-gray">${arr.slice(0, -1).join('/')}</span>
               </span>
             </div>
           </td>`,
        `  <td>${item.method}</td>`,
        `  <td>${item.status}<br/><span class="text-gray">${item.statusMessage || ''}</span></td>`,
        `  <td>${item.protocol}</td>`,
        `  <td>${item.address}</td>`,
        `  <td>${item.targetAddress}</td>`,
        `  <td>${item.targetPath}</td>`,
        `  <td>${item.type.split(';')[0]}</td>`,
        `  <td>${item.size}b</td>`,
        `  <td><strong>${item.time}ms</strong></td>`,
        `</tr>`
      ]
    });

    return html.join('');
  },

  scrollToBottom() {
    let $body = $('#js-body');
    let offsetHeight = $body[0].offsetHeight;
    let scrollHeight = $body[0].scrollHeight;
    let scrollTop = $body[0].scrollTop;
    let newScrollTop = scrollHeight - offsetHeight;

    if (newScrollTop - scrollTop > 50) {
      return;
    }

    $body.scrollTop(newScrollTop);
  }
}