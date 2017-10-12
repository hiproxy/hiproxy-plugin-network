import React, { Component } from 'react';
import { connect } from 'react-redux';
import { onArrive, clearAll } from '../action';
import {Table} from './table';
import Dialog from './dialog';
import './index.less';
import io from 'socket.io-client';

class Home extends Component {
  constructor (props) {
    super(props);

    this.state = {
      showRequestDetail: false,
      requestDetail: null
    };
  }

  componentDidMount () {
    const socket = io.connect('http://127.0.0.1:9998');

    socket.on('pageReady', (data) => {
      this.setState(data);
    });

    socket.on('data', data => {
      this.props.onArrive(JSON.parse(data));
    });
  }

  render () {
    const { proxyPath, sslPath } = this.state || {};
    return <div>
      <header className='navbar'>
        <h1 className='navbar-brand'>Hiproxy devtool</h1>
        <div className='right-nav'>
          <a className='btn btn-link' onClick={this.props.clearAll}>clear</a>
          <a href={proxyPath} className='btn btn-link'>proxy.pac</a>
          <a href={sslPath} className='btn btn-link'>ssl-certificate</a>
          <a href='https://github.com/picturepan2/spectre' className='btn btn-link'>GitHub</a>
        </div>
      </header>
      <Table data={this.props.requests} showRequestDetail={this.showRequestDetail.bind(this)} />
      <Dialog showRequestDetail={this.state.showRequestDetail} requestDetail={this.state.requestDetail} />
    </div>;
  }

  showRequestDetail (item) {
    this.setState({
      showRequestDetail: true,
      requestDetail: item
    });
  }
}
const mapStateToProps = (state) => {
  return {
    requests: state.requests
  };
};

const mapDispatchToProps = {
  onArrive,
  clearAll
};

export default connect(mapStateToProps, mapDispatchToProps)(Home);
