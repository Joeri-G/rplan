import React from 'react';
import ReactDOM from 'react-dom';
import Page from './Page';
import Test from './Test';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <React.StrictMode>
    {(window.location.pathname === "/test/") ? <Test/> : <Page />}
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
