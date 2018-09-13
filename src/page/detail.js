/**
 * @file Network detail dialog
 * @author zdying
 */
'use srtict';

window.networkDetail = window.ND = {
  $el: null,

  netWorkInfo: null,

  init: function () {
    this.$el = $('#js-network-detail');
    
    this.$el.on('click', '.close', this.hide.bind(this));
  },

  show: function (info) {
    if (!info || typeof info !== 'object') {
      throw Error('window.networkDetail.show(info) -> `info` should not be empty.'); 
    }
    this.netWorkInfo = info;
    this.render();
    this.$el.removeClass('hide');
  },

  hide: function () {
    this.$el.addClass('hide');
    this.netWorkInfo = null;
  },

  render: function () {
    let info = this.netWorkInfo;
    let generalInfo = {
      'Request URL': info.url.href,
      'Proxy URL': info.newUrl || '',
      'Request Method': info.method,
      'Status Code': info.statusCode,
      'Remote Address': info.hostname
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
        `<li><strong>${this.fixKey(key)}:</strong> ${info[key]}</li>`
      )
    }

    html.push(`</ul>`);

    return html.join('');
  },

  fixKey: function (key) {
    return key.replace(/^\w|-\w/g, match => match.toUpperCase());
  }
};
