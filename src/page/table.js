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
  title: 'id',
  dataIndex: 'id',
  key: 'id',
  width: 100
}, {
  title: 'name',
  dataIndex: 'name',
  key: 'name'
}, {
  title: 'status',
  dataIndex: 'status',
  key: 'status',
  width: 100
}, {
  title: 'address',
  dataIndex: 'address',
  key: 'address',
  width: 150
},{
  title: 'type',
  dataIndex: 'type',
  key: 'type',
  width: 150
},{
  title: 'size',
  dataIndex: 'size',
  key: 'size',
  width: 100
},{
  title: 'time',
  dataIndex: 'time',
  key: 'time',
  width: 100
}];

export const Tables = (props) => {
  const dataSource = props.data && props.data.map( (t, index) => {
    const name = t.path.length > 80 ? t.path.substr(0,80)+'...':t.path;
    return {
      key: index,
      name,
      id: index,
      status: t.statusCode,
      address: t.hostname+(t.port ? ':'+t.port : ''),
      type: getContentType(t.contentType),
      size: (t.resHeaders['content-length'] / 1024).toFixed(2),
      time: t.time
    }
  });

  return <Table
    dataSource={dataSource}
    pagination={false}
    columns={columns}
    onRowClick={props.showRequestDetail}
    scroll={{ y: window.innerHeight - 100 }}
  />;
};

function getContentType (contentType) {
  for (let key in source) {
    if (source[key] && contentType.indexOf(source[key]) != -1) {
      return key;
    }
  }
}
