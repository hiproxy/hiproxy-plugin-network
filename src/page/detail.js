/**
 * @file Network detail dialog
 * @author zdying
 */
'use srtict';

window.networkDetail = window.ND = {
  $el: null,

  netWorkInfo: null,

  init: function () {
    let $el = this.$el = $('#js-network-detail');
    
    // Close network detail dialog
    $el.on('click', '.close', this.hide.bind(this));

    $el.on('click', 'header .tab', function (eve) {
      let $curr = $(eve.currentTarget);
      let data = $curr.data();
      let role = data.role;
      if (role === 'request') {
        this.renderRequest();
      } else if (role === 'response') {
        this.renderResponse();
      } else if (role === 'preview') {
        this.renderPreview();
      }

      $curr.parent().find('.tab.active').removeClass('active');
      $curr.addClass('active');
    }.bind(this));

    let startLeft = 0;
    let startX = 0;

    // Network detail dialog resizer
    $el.find('#js-spliter').on('mousedown', function (eve) {
      startLeft = parseInt($el.css('left'), 10);
      startX = eve.pageX;
      return false;
    }.bind(this));

    $(document).on('mousemove', function (eve) {
      if (!startX) {
        return;
      }

      let pageX = eve.pageX;
      let dx = pageX - startX;
      let left = startLeft + dx;

      $el.css('left', left);

      return false;
    }.bind(this));

    $(document).on('mouseup', function (eve) {
      startX = 0;
      startLeft = 0;
    }.bind(this));

    // Show detail dialog when click network table row
    window.$eve.on('itemclick.table', function (eve, data) {
      this.show(data);
    }.bind(this));
  },

  show: function (info) {
    if (!info || typeof info !== 'object') {
      throw Error('window.networkDetail.show(info) -> `info` should not be empty.'); 
    }
    this.netWorkInfo = info;
    this.$el.find('header .tab.preview').hide();
    if (info.resContentType.indexOf('json') > -1) {
      this.$el.find('header .tab.preview').show();
    }
    let role = this.$el.find('header .tab.active').data('role');
    if (role === 'request') {
      this.renderRequest();
    } else if (role === 'response') {
      this.renderResponse();
    } else if (role === 'preview') {
      this.$el.find('header .tab.active').removeClass('active');
      this.$el.find('header .tab[data-role=request]').addClass('active');
      this.renderRequest();
    }

    this.$el.removeClass('hide');
    window.$eve.trigger('show.detail');
  },

  hide: function () {
    this.$el.addClass('hide');
    this.netWorkInfo = null;
    this.$el.find('header .tab.active').removeClass('active');
    this.$el.find('header .tab').first().addClass('active');
    window.$eve.trigger('hide.detail', {});
  },
  renderPreview: function () {
    //TODO 这里需要一个插件来处理了
    let netWorkInfo = this.netWorkInfo;
    let id = netWorkInfo.id;
    let resContentType = netWorkInfo.resContentType;

    $.ajax('/fetchresponse?reqId=' + id + '&contentType=' + resContentType, {dataType: 'text'})
    .then(function (body, status, xhr) {
      let json = JSON.parse(xhr.responseText);
      jsonv(
        this.$el.find('section.body').scrollTop(0)[0],
        json
      )
    }.bind(this));

    
  },
  renderRequest: function () {
    let info = this.netWorkInfo;
    let generalInfo = {
      'Request URL': info.url.href,
      'Proxy URL': info.newUrl || '',
      'Request Method': info.method,
      'Status Code': info.statusCode || '',
      'Remote Address': info.hostname || ''
    };
    let html = [
      this.renderSection('General', generalInfo),
      this.renderSection('Request Headers', info.headers),
      this.renderSection('Response Headers', info.resHeaders)
    ];
    if (info.queryObject.object) {
      html.push(
        this.renderSection(info.queryObject.keyName, info.queryObject.object)
      )
    }
    html.join('');

    this.$el.find('section.body').scrollTop(0).html(html);
  },

  renderSection: function (title, info) {
    let html = [
      `<h3 class="group-header">${title}</h3>`,
      `<ul class="list">`,
    ];

    for (let key in info) {
      
      html.push(
        `<li><strong>${this.fixKey(key)}:</strong> <span>${info[key]}</span></li>`
      )
    }

    html.push(`</ul>`);

    return html.join('');
  },

  fixKey: function (key) {
    return key.replace(/^\w|-\w/g, match => match.toUpperCase());
  },

  renderResponse: function () {
    let netWorkInfo = this.netWorkInfo;
    let regImg = /png|jpg|jpeg|gif|webp|bmp|svg|ico|icon/;
    let id = netWorkInfo.id;
    let resContentType = netWorkInfo.resContentType;

    if (netWorkInfo.method === 'CONNECT') {
      return this._renderResponse('');
    }

    if (netWorkInfo.resContentType.match(regImg)) {
      return this._renderResponse('<img src="' + '/fetchresponse?reqId=' + id + '&contentType=' + resContentType + '"/>')
    }

    $.ajax('/fetchresponse?reqId=' + id + '&contentType=' + resContentType, {dataType: 'text'})
    .then(function (body, status, xhr) {
      let text = xhr.responseText;
      this._renderResponse('<pre>' + text.replace(/</g, '&lt;') + '</pre>');
    }.bind(this));
  },

  _renderResponse: function (body) {
    this.$el.find('section.body').scrollTop(0).html(body);
  }
};
