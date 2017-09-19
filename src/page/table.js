import React, { Component } from 'react';

export const  Table =  (props) => {
    return <table className="table table-striped table-hover col-12">
        <thead>
        <tr>
            <th>id</th>
            <th>name</th>
            <th>method</th>
            <th>status</th>
            <th>protocol</th>
            <th>domain</th>
            <th>remote address</th>
            <th>type</th>
        </tr>
        </thead>
        <tbody>
        {
            props.data && props.data.map( (t,index) => {
                return <tr className="active" key={index}>
                    <td>{index}</td>
                    <td>{t.name}</td>
                    <td>{t.status}</td>
                    <th>{t.protocol}</th>
                    <th>{t.domain}</th>
                    <th>{t.remoteAddress}</th>
                    <th>{t.type}</th>
                </tr>
            })
        }
        </tbody>
    </table>
};