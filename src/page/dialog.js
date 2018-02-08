import React, { Component } from 'react';
import './index.css';
let startX = 0;
let maxWidth, minWidth;
let shouldMove = false
let throttle = function(fn, delay, mustRunDelay){
  var timer = null;
  var t_start;
  return function(){
    var context = this, args = arguments, t_curr = +new Date();
    clearTimeout(timer);
    if(!t_start){
      t_start = t_curr;
    }
    if(t_curr - t_start >= mustRunDelay){
      fn.apply(context, args);
      t_start = t_curr;
    }
    else {
      timer = setTimeout(function(){
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
      dialogWidth: '900'
    };

    document.onmousemove = throttle(this.onMousemove.bind(this),50,100);
    document.onmouseup = this.onMouseup.bind(this);
  }

  componentWillReceiveProps () {
    this.setState({
      tab: 'headers'
    });
  }

  componentDidUpdate () {
    var block = document.getElementById('js-code');
    block && hljs.highlightBlock(block);
  }
  onMousedown (eve){
    shouldMove = true;

    maxWidth = 1200;
    minWidth = 100;

    startX = eve.clientX;

    eve.preventDefault();
  };

  onMousemove  (eve){
    if(!shouldMove){
      return
    }

    let {clientX} = eve;
    let delta = startX - clientX;
    startX = startX - delta;
    let width =  this.state.dialogWidth;
    width += delta;
    width = width < minWidth ? minWidth : width>maxWidth? maxWidth: width;
    this.setState({dialogWidth: width});
  };

  onMouseup () {
    shouldMove = false;
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
        return <section className="body">
          <div id="spliter"
               onMouseDown={this.onMousedown.bind(this)}
          ></div>
          <h3 className="header">General</h3>
          <ul className="list">
            <li>
              <strong>Request URL:</strong>  {t.url}
            </li>
            <li>
              <strong>Proxy URL:</strong>  {t.newUrl}
            </li>
            <li>
              <strong>Request Method:</strong> {t.method}
            </li>
            <li>
              <strong>Status Code:</strong> {t.statusCode}
            </li>
            <li>
              <strong>Remote Address:</strong> {t.hostname}
            </li>
          </ul>
          <h3 className="header">Response Headers</h3>
          <ul className="list">
            {parseData(t.resHeaders)}
          </ul>
          <h3 className="header">Request Headers</h3>
          <ul className="list">
            {parseData(t.headers)}
          </ul>
        </section>;
      } else if (tab === 'response') {
        // 获取content-type
        let {resHeaders} = t;
        let contentType = resHeaders['content-type'] || '';
        let fileType = contentType.split(';')[0].split('/')[1] || '';

        fileType = fileType.trim();

        return <pre className="code" id="js-code"><code className={fileType}>{t.socketData}</code></pre>;
      }
    };

    return (
      <div className='dialog' style={{width: this.state.dialogWidth+'px'}}>
        <header>
          <div className="close" onClick={this.close.bind(this)}>&times;</div>
          <div className={tab === 'headers' ? 'tab active' : 'tab'}
            onClick={this.switchTab.bind(this, 'headers')}>Headers</div>
          <div className={tab === 'response' ? 'tab active' : 'tab'}
            onClick={this.switchTab.bind(this, 'response')}>Response</div>
        </header>
        {content()}
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
    result.push(<li><strong>{key}</strong> : {data[key]}</li>);
  }

  return result;
}
