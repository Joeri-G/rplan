import React from 'react';
import ReactDOM from 'react-dom';
import Page from './Page';
import './index.css';
import './root.css';
import * as serviceWorker from './serviceWorker';
import Load from './components/Loading';

ReactDOM.render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
  document.querySelector('#root')
);
//when the page is done loading call Load(false)
window.onload = () => {
  // setTimeout(() => {
    Load(false);
  // }, 200);
};

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
