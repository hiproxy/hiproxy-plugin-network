import React, { Component } from 'react';
// import JSONUtil from './jsonUtils';
import './index.css';
let startX = 0;
let maxWidth, minWidth;
let shouldMove = false;
let throttle = function (fn, delay, mustRunDelay) {
  var timer = null;
  var t_start;
  return function () {
    var context = this, args = arguments, t_curr = +new Date();
    clearTimeout(timer);
    if (!t_start) {
      t_start = t_curr;
    }
    if (t_curr - t_start >= mustRunDelay) {
      fn.apply(context, args);
      t_start = t_curr;
    } else {
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    }
  };
};

export default class Dialog extends Component {
  constructor (props) {
    super(props);

    this.state = {
      tab: 'headers',
      dialogWidth: 900,
      viewParsed: true
    };

    document.onmousemove = throttle(this.onMousemove.bind(this), 50, 100);
    document.onmouseup = this.onMouseup.bind(this);
  }

  componentWillReceiveProps () {
    this.setState({
      // tab: 'headers',
      viewParsed: true
    });
  }

  componentDidUpdate () {
    var block = document.getElementById('js-code');
    // var text = block && block.textContent || '';
    // block && text.length < 20 * 1024 && hljs.highlightBlock(block);
  }
  onMousedown (eve) {
    shouldMove = true;
    maxWidth = 1200;
    minWidth = 100;
    startX = eve.clientX;
    eve.preventDefault();
  }

  onMousemove (eve) {
    if (!shouldMove) {
      return;
    }
    let {clientX} = eve;
    let delta = startX - clientX;
    startX = startX - delta;
    let width = parseInt(document.querySelector('.dialog').style.width);
    width += delta;
    width = width < minWidth ? minWidth : width > maxWidth ? maxWidth : width;
    document.querySelector('.dialog').style.width = width + 'px';
  }

  onMouseup () {
    shouldMove = false;
  }
  changeViewJson () {
    let viewParsed = this.state.viewParsed;
    this.setState({viewParsed: !viewParsed});
  }
  render () {
    const { showRequestDetail, requestDetail, onClose } = this.props;
    const tab = this.state.tab;
    if (!showRequestDetail) {
      return null;
    }
    const t = requestDetail;

    const content = () => {
      if (tab === 'headers') {
        return <section className='body'>
          <h3 className='header'>General</h3>
          <ul className='list'>
            <li><strong>Request URL:</strong>  {t.url.href}</li>
            <li><strong>Proxy URL:</strong>  {t.newUrl}</li>
            <li><strong>Request Method:</strong> {t.method}</li>
            <li><strong>Status Code:</strong> {t.statusCode}</li>
            <li><strong>Remote Address:</strong> {t.hostname}</li>
          </ul>
          <h3 className='header'>Response Headers</h3>
          <ul className='list'>{parseData(t.resHeaders)}</ul>
          <h3 className='header'>Request Headers</h3>
          <ul className='list'>{parseData(t.headers)}</ul>
          {this.renderParams(t)}
        </section>;
      } else if (tab === 'response') {
        // 获取content-type
        let {resHeaders} = t;
        let contentType = resHeaders['content-type'] || '';
        let fileType = contentType.split(';')[0].split('/')[1] || '';

        fileType = fileType.trim();

        if (fileType === 'x-javascript') {
          fileType = 'javascript';
        } else if (fileType === 'x-ico' || fileType === 'x-icon') {
          fileType = 'ico';
        }

        let targetURL = t.protocol + '//' + t.hostname + (t.port ? ':' + t.port : '') + t.path;

        if (/^(html|css|javascript|json|text)$/.test(fileType)) {
          if (t.originLength > 1 * 1024 * 1024) {
            return <div style={{padding: '10px'}}>文件内容太长，<a href={targetURL} target='_blank'>点击此处</a>在新窗口中打开。</div>;
          } else {
            let data = t.socketData;

            if (fileType === 'json') {
              try {
                data = JSON.stringify(JSON.parse(t.socketData), null, 2);
              } catch (err) {
                // ...
                data = t.socketData;
              }
            }
            return (
              <pre className='code' id='js-code'>
                <code className={fileType}>{data}</code>
              </pre>
            );
          }
        } else if (/^(png|jpg|jpeg|gif|ico|svg\+xml)$/.test(fileType)) {
          return <div className='content'><img src={targetURL} /></div>;
        } else {
          return <div style={{padding: '10px'}}>暂时不支持此类型文件预览，<a href={targetURL} target='_blank'>点击此处</a>在新窗口中打开。</div>;
        }
      }
    };

    return (
      <div className='dialog' style={{width: this.state.dialogWidth + 'px'}}>
        <div id='spliter'
          onMouseDown={this.onMousedown.bind(this)}
        />
        <header>
          <div className='close' onClick={this.close.bind(this)}>&times;</div>
          <div className={tab === 'headers' ? 'tab active' : 'tab'}
            onClick={this.switchTab.bind(this, 'headers')}>Headers</div>
          <div className={tab === 'response' ? 'tab active' : 'tab'}
            onClick={this.switchTab.bind(this, 'response')}>Response</div>
        </header>
        {content()}
      </div>
    );
  }

  renderParams (t) {
    let bodyType = getBodyType(t);
    let method = t.method.toLocaleLowerCase();
    let bodyOrqs = method === 'get' ? t.querystring : t.body;
    let bodyData = getBody(t);
    let body = '';
    let { viewParsed } = this.state;

    if (!bodyType || !bodyData) {
      return null;
    }

    if (bodyType === 'Request Payload' || !viewParsed) {
      body = <pre><code>{viewParsed ? bodyData : bodyOrqs}</code></pre>;
    } else {
      body = <ul className='list'>{bodyData}</ul>;
    }

    return (
      <div>
        <h3 className='header'>
          { bodyType }
          <span
            style={{marginLeft: '20px', fontSize: '12px', color: '#838383'}}
            onClick={this.changeViewJson.bind(this)}
          >
            { viewParsed ? 'view source' : 'view parsed'}
          </span>
        </h3>
        {body}
      </div>
    );
  }

  close (eve) {
    let {onClose} = this.props;

    onClose && onClose();
  }

  switchTab (tab) {
    this.setState({tab});
  }

  showRequestDetail (item) {
    this.setState({
      showRequestDetail: true,
      requestDetail: item
    });
  }
}

function parseData (data) {
  let result = [];

  for (let key in data) {
    result.push(<li key={key}><strong>{key}</strong> : {data[key]}</li>);
  }

  return result;
}

function getQueryObjFromURL (params) {
  if (!params) {
    return null;
  }

  let res = {};
  let fields = params.split('&');

  fields.forEach((field) => {
    let kv = field.split('=');
    let key = kv[0];
    let value = kv.slice(1).join('=');

    if (key) {
      if (key in res) {
        res[key] = [].concat(res[key], value);
      } else {
        res[key] = decodeURIComponent(value);
      }
    }
  });

  return res;
}

function getBody (t) {
  let isJson = false;
  let body = t.body;
  let querystring = t.querystring;
  let data = null;
  let method = t.method.toLocaleLowerCase();
  let contentType = t.headers['content-type'] || '';
  let isJSON = contentType.indexOf('json') !== -1;

  if (method === 'get') {
    data = getQueryObjFromURL(querystring);
  } else if (method === 'post') {
    if (isJSON) {
      try {
        data = JSON.parse(body);
      } catch (e) {
        isJSON = false;
        data = getQueryObjFromURL(body);
      }
    } else {
      data = getQueryObjFromURL(body);
    }
  }

  return isJSON ? JSON.stringify(data, null, 2) : parseData(data);
}

function getBodyType (ctx) {
  let method = ctx.method.toLocaleLowerCase();
  if (method === 'get') {
    return 'Query String Paramenters';
  }

  if (method == 'post') {
    let isJson = false;
    try {
      JSON.parse(ctx.body);
      isJson = true;
    } catch (e) {}

    return isJson ? 'Request Payload' : 'Form data';
  }

  return null;
}
