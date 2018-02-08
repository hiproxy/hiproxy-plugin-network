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
      var length = data.toString().length;
      var maxLen = 1 * 1024 * 1024;
      var obj = JSON.parse(data);
      var path = obj.path;
      var isSocketIOURL = /^\/socket\.io/.test(path);

      if (isSocketIOURL) {
        console.warn('socket.io本身的请求，忽略');
        return;
      }

      if ((obj.socketData || '').length > maxLen) {
        obj.socketData = '内容太长，无法查看！';
      }

      this.props.onArrive(obj);
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
        <Menu.Item><a href='https://github.com/huaziHear/hiproxy-plugin-devtools'>GitHub</a></Menu.Item>
      </Menu>
      <Tables data={this.props.requests} showRequestDetail={this.showRequestDetail.bind(this)} />
      <Dialog showRequestDetail={this.state.showRequestDetail} requestDetail={this.state.requestDetail} onClose={this.onClose.bind(this)} />
    </div>;
  }

  showRequestDetail (item){
    this.setState({
      showRequestDetail: true,
      requestDetail: this.props.requests[item.key]
    });
  }

  onClose () {
    this.setState({
      showRequestDetail: false
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
