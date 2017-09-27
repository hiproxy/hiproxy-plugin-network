import React, { Component } from 'react';

export const  Table =  (props) => {
    return <table className="table table-striped table-hover col-12">
        <thead>
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
            props.data && props.data.map( (t,index) => {
                return <tr className="active" key={index}>
                    <td>{index}</td>
                    <td>{t.path}</td>
                    <td>{t.statusCode}</td>
                    <td>{t.hostname}:{t.port}</td>
                    <td>{getContentType(t.contentType)}</td>
                    <td>0</td>
                    <td>{t.time}</td>
                </tr>
            })
        }
        </tbody>
    </table>
};

function getContentType (contentType) {
    var source = ['text/plain','stylesheet','font','xhr','script','document'];
}