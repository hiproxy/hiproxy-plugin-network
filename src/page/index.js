import React, { Component } from 'react';
import { connect } from 'react-redux';
import { onArrive, clearAll } from '../action';
import {Tables} from './table';
import Dialog from './dialog';
import io from 'socket.io-client';
import { Menu, Icon, Row, Col } from 'antd';

class Home extends Component {
  constructor (props) {
    super(props);

    this.state = {
      showRequestDetail: false,
      requestDetail: null
    };
  }

  componentDidMount () {
    window.ios = io;
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
      <Menu mode="horizontal" selectedKeys={[1]} theme="dark">
        <Menu.Item key="mail">Hiproxy-plugin-devtools</Menu.Item>
        <Menu.Item><a onClick={this.props.clearAll}>clear</a></Menu.Item>
        <Menu.Item><a href={proxyPath}>proxy.pac</a></Menu.Item>
        <Menu.Item><a href={sslPath} >ssl-certificate</a></Menu.Item>
        <Menu.Item><a href='https://github.com/picturepan2/spectre'>GitHub</a></Menu.Item>
      </Menu>
      <Tables data={this.props.requests} showRequestDetail={this.showRequestDetail.bind(this)} />
      <Dialog showRequestDetail={this.state.showRequestDetail} requestDetail={this.state.requestDetail} />
    </div>;
  }

  showRequestDetail (item){
    this.setState({
      showRequestDetail: true,
      requestDetail: this.props.requests[item.key]
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
