import React, { Component } from 'react';
var source = {
  'text/plain': '',
  'stylesheet': 'css',
  'font': '',
  'xhr': '',
  'javascript': 'javascript',
  'json': 'json',
  'document': 'html'
};

export const Table = (props) => {
  return <table className='table'>
    <thead className='table-header'>
      <tr>
        <th>id</th>
        <th>name</th>
        <th>status</th>
        <th>remote address</th>
        <th>type</th>
        <th>size</th>
        <th>time</th>
      </tr>
    </thead>
    <tbody>
      {
            props.data && props.data.map((t, index) => {
              return <tr className='active' key={index} onClick={props.showRequestDetail.bind(this, t)}>
                <td>{index}</td>
                <td>{t.path}</td>
                <td>{t.statusCode}</td>
                <td>{t.hostname}:{t.port}</td>
                <td>{getContentType(t.contentType)}</td>
                <td>{(t.resHeaders['content-length'] / 1024).toFixed(2)}k</td>
                <td>{t.time}ms</td>
              </tr>;
            })
        }
    </tbody>
  </table>;
};

function getContentType (contentType) {
  for (let key in source) {
    if (source[key] && contentType.indexOf(source[key]) != -1) {
      return key;
    }
  }
}
