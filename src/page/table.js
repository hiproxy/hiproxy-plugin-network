import React, { Component } from 'react';
import { Table } from 'antd';
import FileIcon from 'react-file-icon';

var source = {
  'text/plain': '',
  'stylesheet': 'css',
  'font': '',
  'xhr': '',
  'image': /(jpg|jpeg|bmp|png|svg|gif)/,
  'javascript': 'javascript',
  'json': 'json',
  'document': 'html'
};

const columns = [/* {
  title: 'ID',
  dataIndex: 'id',
  key: 'id',
  width: 20
}, */{
    title: 'Name',
    dataIndex: 'name',
    width: 200,
    key: 'name',
    render: (val, record) => {
      var value = val[0];
      var fileType = val[1];
      var arr = value.split('/');
      var name = arr.pop() || '';
      var path = arr.join('/');

      if (!path) {
        name = value;
      }
      name = decodeURIComponent(name);

      if (path.length > 50) {
        path = path.substr(0, 50) + '...';
      }

      if (name.length > 50) {
        name = name.substr(0, 50) + '...';
      }

      return (
        <div className='req-path' title={val[0]}>
          <img src={'icons/' + fileType + '.png'} />
          <div>
            <p className='name'>{name}</p>
            <p className='path'>{path}</p>
          </div>
        </div>
      );
    }
  }, {
    title: 'Method',
    dataIndex: 'method',
    key: 'method',
    width: 45
  }, {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 45
  }, {
    title: 'Scheme',
    dataIndex: 'protocol',
    key: 'protocol',
    width: 45
  }, {
    title: 'Domain',
    dataIndex: 'address',
    key: 'address',
    width: 80
  }, {
    title: 'Target Address',
    dataIndex: 'targetAddress',
    key: 'targetAddress',
    width: 70
  }, {
    title: 'Target Path',
    dataIndex: 'targetPath',
    key: 'targetPath',
    width: 100,
    render: (val, record) => {
      let originVal = val;

      if (val.length > 80) {
        val = val.substr(0, 80) + '...';
      }

      return (
        <div className='req-path' title={originVal}>
          {val}
        </div>
      );
    }
  }, {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    width: 50
  }, {
    title: 'Size',
    dataIndex: 'size',
    key: 'size',
    width: 50,
    sorter: (a, b) => a.size - b.size,
    render: (val, record) => {
      return getSizeLabel(val);
    }
  }, {
    title: 'Time',
    dataIndex: 'time',
    key: 'time',
    width: 50,
    sorter: (a, b) => a.time - b.time,
    render: (val, record) => {
      return getTimeLabel(val);
    }
  }];


export const Tables = (props) => {
  const dataSource = props.data && props.data.map( (t, index) => {
    let {resHeaders={}, socketData='', statusCode, url, method, hostname, port, path, time, fileType} = t;
    let contentType = resHeaders['content-type'] || '';
    let length = resHeaders['content-length'] || socketData.length;

    if (t.type === 'connect') {
      return {
        key: index,
        name: ['UNKNOW', 'ssl-error'],
        id: index,
        method: 'CONNECT',
        protocol: 'HTTPS',
        status: '',
        address: hostname + ':' + port,
        targetAddress: '',
        targetPath: '',
        type: '',
        size: 'N/A',
        time: 'N/A'
      };
    }

    let {host, protocol=''} = url;

    return {
      key: index,
      name: [t.url.path, fileType],
      id: index,
      method: method,
      protocol: protocol.replace(':', '').toUpperCase(),
      status: statusCode,
      address: host,
      targetAddress: hostname + (port ? ':' + port : ''),
      targetPath: path || '',
      type: getContentType(contentType),
      size: length, // getSizeLabel(length),
      time: time // getTimeLabel(time)
    };
  });

  return (
    <Table
      bordered
      dataSource={dataSource}
      pagination={false}
      columns={columns}
      onRowClick={props.showRequestDetail}
      scroll={{ y: window.innerHeight - 100 }}
      rowClassName={(record, index) => 'request-row' + (props.currIndex === index ? ' active' : '')}
    />
  );
};

function getContentType (contentType) {
  for (let key in source) {
    let types = source[key];

    if (types) {
      if (typeof types === 'string') {
        if (contentType.indexOf(types) !== -1) {
          return key;
        }
      } else if (typeof types.test === 'function') {
        if (types.test(contentType)) {
          return key;
        }
      }
    }
  }

  return '';
}

function getSizeLabel (num) {
  let k = num / 1024;
  let m = k / 1024;

  if (m > 1) {
    return m.toFixed(2) + ' MB';
  } else if (k > 1) {
    return k.toFixed(2) + ' KB';
  } else {
    return num + ' B';
  }
}

function getTimeLabel (time) {
  let s = time / 1000;

  if (s > 1) {
    return s.toFixed(1) + ' s';
  } else {
    return time + ' ms';
  }
}
