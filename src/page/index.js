import React, { Component } from 'react';
import { connect } from 'react-redux';
import { onArrive } from '../action';
import {Table} from './table';
import './index.less';
import io from 'socket.io-client';

class Home extends Component {

    constructor (props) {
        super(props);
    }

    componentDidMount() {
        const socket = io.connect('http://127.0.0.1:9999');

        socket.on('pageReady',  (data) => {
           this.setState(data);
        });

        socket.on('request',  (data) => {
            this.props.onArrive(data);
        });

        socket.on('data', data => {
            console.log(data)
        });

        socket.on('setRequest', data => {
            console.log(data)
        })

        socket.on('response', data => {
            console.log(data)
        })

        socket.on('setResponse', data => {
            console.log(data)
        })
    }

    render () {
        const { proxyPath, sslPath } = this.state||{};
        return <div className="col-lg-12">
            <header className="navbar bg-secondary s-container container">
                <section className="navbar-section">
                    <h1 className="navbar-brand mr-10 text-primary">Hiproxy devtool</h1>
                </section>
                <a href={proxyPath} className="btn btn-link">proxy.pac</a>
                <a href={sslPath} className="btn btn-link">ssl-certificate</a>
                <section>
                    <a href="https://github.com/picturepan2/spectre" className="btn btn-link">GitHub</a>
                </section>
            </header>
            <Table data={this.props.requests}/>
        </div>
    }
}
const mapStateToProps = (state)=>{
    return {
        requests: state.requests
    }
};

const mapDispatchToProps = {
    onArrive
};

export default connect(mapStateToProps, mapDispatchToProps)(Home);
