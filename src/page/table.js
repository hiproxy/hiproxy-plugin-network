import React, { Component } from 'react';
import { Table } from 'antd';

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
  width: 50
}, {
  title: 'Name',
  dataIndex: 'name',
  width: 300,
  key: 'name',
  render: (value, record) => {
    console.log('value', value);
    var arr = value.split('/');
    var name = arr.pop();
    var path = arr.join('/');

    if (!path) {
      name = value;
    }

    return (
      <div className="req-path">
        <img src="" />
        <p className="name">{name}</p>
        <p className="path">{path}</p>
      </div>
    )
  }
}, {
  title: 'Status',
  dataIndex: 'status',
  key: 'status',
  width: 100
}, {
  title: 'Address',
  dataIndex: 'address',
  key: 'address',
  width: 150
},{
  title: 'Type',
  dataIndex: 'type',
  key: 'type',
  width: 150
},{
  title: 'Size',
  dataIndex: 'size',
  key: 'size',
  width: 100
},{
  title: 'Time',
  dataIndex: 'time',
  key: 'time',
  width: 100
}];

export const Tables = (props) => {
  const dataSource = props.data && props.data.map( (t, index) => {
    return {
      key: index,
      name: t.path,
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
      className="abc"
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
