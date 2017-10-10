import React, { Component } from 'react';
import './index.less';

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

  render () {
    const { showRequestDetail, requestDetail } = this.props;
    const tab = this.state.tab;

    if (!showRequestDetail) {
      return null;
    }
    const t = requestDetail;

    const content = () => {
      if (tab === 'headers') {
        return <section>
          <h3>General</h3>
          <ul>
            <li>Request URL: {t.url}</li>
            <li>Proxy URL: {t.newUrl}</li>
            <li>Request Method: {t.method}</li>
            <li>Status Code: {t.statusCode}</li>
            <li>Remote Address: {t.hostname}</li>
          </ul>
          <h3>Response Headers</h3>
          <ul>
            {parseData(t.resHeaders)}
          </ul>
          <h3>Request Headers</h3>
          <ul>
            {parseData(t.headers)}
          </ul>
        </section>;
      } else if (tab === 'response') {
        console.log(t.socketData);
        return <textarea style={{height: (window.innerHeight - 70) + 'px'}} className='code-container' defaultValue={t.socketData} />;
      }
    };

    return <div className='dialog'>
      <header>
        <div className={tab === 'headers' ? 'active' : ''}
          onClick={this.switchTab.bind(this, 'headers')}>Headers</div>
        <div className={tab === 'response' ? 'active' : ''}
          onClick={this.switchTab.bind(this, 'response')}>Response</div>
      </header>
      {content()}
    </div>;
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
    result.push(<li>{key}:{data[key]}</li>);
  }

  return result;
}
