import React, { Component } from 'react';
import { Table } from 'antd';
import FileIcon from 'react-file-icon';

var source = {
  'text/plain': '',
  'stylesheet': 'css',
  'font': '',
  'xhr': '',
  'javascript': 'javascript',
  'json': 'json',
  'document': 'html'
};

const columns = [{
  title: 'ID',
  dataIndex: 'id',
  key: 'id',
  width: 20
}, {
  title: 'Name',
  dataIndex: 'name',
  width: 200,
  key: 'name',
  render: (val, record) => {
    var value = val[0];
    var fileType = val[1];
    var arr = value.split('/');
    var name = arr.pop();
    var path = arr.join('/');

    if (!path) {
      name = value;
    }

    return (
      <div className="req-path">
        <img src={"icons/" + fileType + '.png'} />
        <div>
          <p className="name">{name}</p>
          <p className="path">{path}</p>
        </div>
      </div>
    )
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
},{
  title: 'Domain',
  dataIndex: 'address',
  key: 'address',
  width: 80
},{
  title: 'Target Address',
  dataIndex: 'targetAddress',
  key: 'targetAddress',
  width: 70
},{
  title: 'Target Path',
  dataIndex: 'targetPath',
  key: 'targetPath',
  width: 100
},{
  title: 'Type',
  dataIndex: 'type',
  key: 'type',
  width: 50
},{
  title: 'Size',
  dataIndex: 'size',
  key: 'size',
  width: 50
},{
  title: 'Time',
  dataIndex: 'time',
  key: 'time',
  width: 50
}];

const files = [
  'css', 'file', 'html', 'javascript',
  'jpg', 'png', 'pdf', 'json', 'svg', 'gif',
  'txt', 'xml', 'zip'
];

export const Tables = (props) => {
  const dataSource = props.data && props.data.map( (t, index) => {
    let {resHeaders, url, method, hostname, port, path, time} = t;
    let contentType = resHeaders['content-type'] || '';
    let fileType = contentType.split(';')[0].split('/')[1] || '';
    let length = resHeaders['content-length'] || t.socketData.length;

    fileType = fileType.trim();

    if (fileType.indexOf('+')) {
      fileType = fileType.split('+')[0];
    }

    if (files.indexOf(fileType) === -1) {
      fileType = 'file';
    }

    console.log('t', t);

    let {host, protocol} = url;
    
    return {
      key: index,
      name: [t.path, fileType],
      id: index,
      method: method,
      protocol: protocol.replace(':', '').toUpperCase(),
      status: t.statusCode,
      address: host,
      targetAddress: hostname + (port ? ':' + port : ''),
      targetPath: path,
      type: getContentType(t.contentType || 'text/plain'),
      size: getSizeLabel(length),
      time: time + 'ms'
    }
  });

  return (
    <Table
      bordered
      dataSource={dataSource}
      pagination={false}
      columns={columns}
      onRowClick={props.showRequestDetail}
      scroll={{ y: window.innerHeight - 100 }}
    />
  );
};

function getContentType (contentType) {
  for (let key in source) {
    if (source[key] && contentType.indexOf(source[key]) != -1) {
      return key;
    }
  }
}

function getSizeLabel (num) {
  let k = num / 1024;
  let m = k / 1024;

  if (m > 1) {
    return m.toFixed(2) + ' MB';
  } else if (k > 1) {
    return k.toFixed(2) + ' KB';
  } else {
    return num + ' B'
  }
}
