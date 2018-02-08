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
  width: 300,
  key: 'name',
  render: (val, record) => {
    console.log('value', value, record);
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
  title: 'Status',
  dataIndex: 'status',
  key: 'status',
  width: 50
}, {
  title: 'Address',
  dataIndex: 'address',
  key: 'address',
  width: 150
},{
  title: 'Type',
  dataIndex: 'type',
  key: 'type',
  width: 100
},{
  title: 'Size',
  dataIndex: 'size',
  key: 'size',
  width: 80
},{
  title: 'Time',
  dataIndex: 'time',
  key: 'time',
  width: 80
}];

const files = [
  'css', 'file', 'html', 'javascript',
  'jpg', 'png', 'pdf', 'json', 'svg', 'gif',
  'txt', 'xml', 'zip'
];

export const Tables = (props) => {
  const dataSource = props.data && props.data.map( (t, index) => {
    let {resHeaders} = t;
    let contentType = resHeaders['content-type'] || '';
    let fileType = contentType.split(';')[0].split('/')[1] || '';

    fileType = fileType.trim();

    if (files.indexOf(fileType) === -1) {
      fileType = 'file';
    }
    
    return {
      key: index,
      name: [t.path, fileType],
      id: index,
      status: t.statusCode,
      address: t.hostname+(t.port ? ':'+t.port : ''),
      type: getContentType(t.contentType || 'text/plain'),
      size: (t.resHeaders['content-length'] / 1024).toFixed(2),
      time: t.time
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
