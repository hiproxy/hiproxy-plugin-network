import React, { Component } from 'react';
import './index.css';

export default class Dialog extends Component {
  constructor (props) {
    super(props);

    this.state = {
      tab: 'headers'
    };
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
      <div className='dialog'>
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
