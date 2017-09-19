import { createStore, applyMiddleware } from 'redux';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import reducer from './reducer';
import thunk from 'redux-thunk';
import Home from './page';
let Store = createStore(reducer, applyMiddleware(thunk));


const mainRender = () => {
    render(
        <Provider store={Store}>
            <Home/>
        </Provider>,
        document.querySelector('#app')
    )
};

mainRender();
