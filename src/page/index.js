import React, { Component } from 'react';
import { connect } from 'react-redux';
import { onArrive, clearAll, filterType, filterKeys } from '../action';
import {Tables} from './table';
import Dialog from './dialog';
import io from 'socket.io-client';
import Menu from 'antd/es/Menu';
import Icon from 'antd/es/Icon';
import Row from 'antd/es/Row';
import Col from 'antd/es/Col';
const filters = ['All', 'JS', 'XHR', 'CSS', 'Img', 'Other'];

class Home extends Component {
  constructor (props) {
    super(props);

    this.state = {
      showRequestDetail: false,
      requestDetail: null,
      check: 'All',
      keys: '',
      hideConnectUrls: true,
      showQRCode: false
    };
  }

  componentDidMount () {
    window.ios = io;
    const socket = io.connect('http://' + location.hostname + ':9998');
    socket.on('pageReady', (data) => {
      this.setState(data);
    });

    socket.on('data', data => {
      var length = data.toString().length;
      var maxLen = 1 * 1024 * 1024;
      var obj = JSON.parse(data);
      var socketData = obj.socketData || '';
      var path = obj.path;
      var isSocketIOURL = /^\/(socket\.io|network)/.test(path);

      if (isSocketIOURL) {
        console.warn('socket.io本身的请求，忽略');
        return;
      }

      //obj.originLength = socketData.length;

      if (obj.originLength > maxLen) {
        obj.socketData = '内容太长，无法查看！';
      }

      this.props.onArrive(obj);
    });

    socket.on('connectreq', data => {
      if (data.hostname === location.hostname && data.port === '9998') {
        // 忽略插件本身的请求
      } else {
        this.props.onArrive(data);
      }
    });
  }

  componentDidUpdate () {
    var reqRows = document.querySelectorAll('.request-row');
    let len = reqRows.length;
    let {isClick} = this;

    // 如果不是隐藏click导致的渲染，滚动到最后
    if (len && !isClick) {
      reqRows[len - 1].scrollIntoView();
    }

    if (isClick) {
      this.isClick = false;
    }
  }

  render () {
    const { proxyPath, sslPath, httpPort, check, showQRCode } = this.state || {};
    const _url = 'http://' + location.hostname + ':' + httpPort;

    return <div className="app-body">
      <Menu mode='horizontal' selectedKeys={['1']} theme='dark'>
        <Menu.Item key='mail'>hiproxy-plugin-network</Menu.Item>
        <Menu.Item><a onClick={()=>{this.props.clearAll();this.onClose();}}><Icon type='delete' />Clear</a></Menu.Item>
        <Menu.Item><a href={_url + proxyPath}><Icon type='file-text' />PAC File</a></Menu.Item>
        <Menu.Item><a href={_url + sslPath}
                      onMouseLeave={this.hideQRCode.bind(this)}
                      onMouseMove={this.showQRCode.bind(this)}
                      onMouseEnter={this.showQRCode.bind(this)}><Icon type='cloud-download' />SSL Certificate</a></Menu.Item>
        <Menu.Item><a href='https://github.com/hiproxy/hiproxy-plugin-network' target='_blank'><Icon type='github' />GitHub</a></Menu.Item>
      </Menu>
      {showQRCode ? <img className="qrcode" src={jrQrcode.getQrBase64(_url + sslPath)} />:null}
      <section className='bars'>
        <ul className='content'>
          <li className='item'><input
            className='filter'
            placeholder='filter'
            keys={this.state.keys}
            onChange={this.filterKeys.bind(this)} /></li>
          <li className='item'>
            <label className='chebox-label'>
              <input
                type='checkbox'
                className='checkbox'
                checked={this.state.hideConnectUrls}
                onChange={this.changeHideConnectUrls.bind(this)}
              /> Hide CONNECT URLs
            </label>
          </li>
          {
            filters.map(item => {
              let cls = item === check ? 'item checked' : 'item';
              return <li key={item} className={cls} onClick={this.switchFileType.bind(this, item)}>{item}</li>;
            })
          }
        </ul>
      </section>
      <Tables
        data={this.getRequestsData()}
        showRequestDetail={this.showRequestDetail.bind(this)}
        currIndex={this.state.currIndex}
      />
      <Dialog
        showRequestDetail={this.state.showRequestDetail}
        requestDetail={this.state.requestDetail}
        onClose={this.onClose.bind(this)}
      />
    </div>;
  }

  showQRCode () {
    this.setState({
      showQRCode: true
    })
  }

  hideQRCode () {
    this.setState({
      showQRCode: false
    })
  }

  getRequestsData () {
    let reqs = this.props.requests;
    if (this.state.hideConnectUrls === true) {
      reqs = reqs.filter(req => req.type !== 'connect');
    }

    return reqs.sort((a, b) => a.startTime - b.startTime);
  }

  filterKeys (e) {
    let val = e.currentTarget.value;
    // this.filterKeys(val);
    this.setState({
      keys: val
    }, this.props.filterKeys(val));
  }

  switchFileType (type) {
    let {check} = this.state;
    if (type !== check) {
      this.setState({
        check: type
      }, this.props.filterType(type));
    }
  }

  showRequestDetail (item) {
    let {id, key} = item;

    this.isClick = true;

    this.setState({
      showRequestDetail: true,
      requestDetail: this.props.requests.filter(req => req.id === id)[0] || {},
      currIndex: id
    });
  }

  onClose () {
    this.setState({
      currIndex: -1,
      showRequestDetail: false
    });
  }

  changeHideConnectUrls () {
    this.setState({
      hideConnectUrls: !this.state.hideConnectUrls
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
  clearAll,
  filterType,
  filterKeys
};

export default connect(mapStateToProps, mapDispatchToProps)(Home);
