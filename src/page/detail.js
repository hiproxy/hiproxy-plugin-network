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
    
    $el.on('click', '.close', this.hide.bind(this));

    $el.on('click', 'header .tab', function (eve) {
      let $curr = $(eve.currentTarget);
      let data = $curr.data();
      let role = data.role;

      if (role === 'request') {
        this.renderRequest();
      } else if (role === 'response') {
        this.renderResponse();
      }

      $curr.parent().find('.tab.active').removeClass('active');
      $curr.addClass('active');
    }.bind(this));

    let startLeft = 0;
    let startX = 0;

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
  },

  show: function (info) {
    if (!info || typeof info !== 'object') {
      throw Error('window.networkDetail.show(info) -> `info` should not be empty.'); 
    }
    this.netWorkInfo = info;

    let role = this.$el.find('header .tab.active').data('role');
    if (role === 'request') {
      this.renderRequest();
    } else if (role === 'response') {
      this.renderResponse();
    }

    this.$el.removeClass('hide');
  },

  hide: function () {
    this.$el.addClass('hide');
    this.netWorkInfo = null;
    this.$el.find('header .tab.active').removeClass('active');
    this.$el.find('header .tab').first().addClass('active');
  },

  renderRequest: function () {
    let info = this.netWorkInfo;
    let generalInfo = {
      'Request URL': info.url.href,
      'Proxy URL': info.newUrl || '',
      'Request Method': info.method,
      'Status Code': info.statusCode,
      'Remote Address': info.hostname || ''
    };

    let html = [
      this.renderSection('General', generalInfo),
      this.renderSection('Request Headers', info.headers),
      this.renderSection('Response Headers', info.resHeaders)
    ].join('');

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

    if (netWorkInfo.resContentType.match(regImg)) {
      return this._renderResponse('<img src="' + '/fetchresponse?reqId=' + id + '&contentType=' + resContentType + '"/>')
    }

    $.ajax('/fetchresponse?reqId=' + id + '&contentType=' + resContentType)
    .then(function (body, status, xhr) {
      let text = xhr.responseText;
      this._renderResponse('<pre>' + text.replace(/</g, '&lt;') + '</pre>');
    }.bind(this));
  },

  _renderResponse: function (body) {
    this.$el.find('section.body').scrollTop(0).html(body);
  }
};
