import React, { Component } from 'react';
import './css/Login.css';
import Load from './Loading';
import Dropdown from './Dropdown';
import API from '../axios-config';

console.error('NON-FATAL: There are some checks disabled @ src/components/Login.js:66');

export default class Login extends Component {
  componentDidMount() {
    Load(true);
    setTimeout(() => {
      Load(false)
    }, 1000);
  }
  render() {
    return (
      <main className="login">
        <div>
          <p>Login</p>
          <Schoolselect />
          <input type="text" id="usernameinput" placeholder="Username" />
          <input type="password" id="passwordinput" placeholder="Password" />
          <input type="button" value="submit" onClick={this.loginCheck} />
        </div>
      </main>
    )
  }

  loginCheck = () => {
    let username = document.querySelector('#usernameinput').value;
    let password = document.querySelector('#passwordinput').value;
    //check them with the server or something
    let encodedstring = window.btoa(username+":"+password);
    let conf = {
      headers: {
        Authorization: 'Basic ' + encodedstring
      }
    };
    API.get('/login', conf).then((response) => { // success
      let resp = response.data.response;
      let userdata = {
        GUID: resp.GUID,
        api_key: resp.api_key,
        userLVL: resp.userLVL,
        username: resp.username
      }
      // set locatlstorage
      localStorage.api_key = userdata.api_key;
      this.props.updateLogin(true, userdata);
    }).catch((error) => { // error
      this.incorrect();
    });
  }

  incorrect = () => {

  }
}

class Schoolselect extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [
        {text: "Calandlyceum", value: "http://localhost:3000/"},
        {text: "TEST", value: "http://localhost:3000/test/"}
      ],
      currentpage: {
        text: "Selecteer een school",
        value: "None"
      }
    }
    this.redirect = this.redirect.bind(this);
  }

  componentDidMount() {
    // Loop through data and check if there's a match between the current URL and the value
    for (const item of this.state.data) {
      if (window.location.href === item.value)
      this.setState({currentpage: item});
    }
  }

  redirect = (e) => {
    let target = e.target.dataset.value;
    if (window.location.href !== target && validURL(target)) {
      window.location = target;
    }
  }

  render() {
    return (
    <Dropdown
      ID="Schoolselect"
      data={this.state.data}
      title={this.state.currentpage.text}
      default={this.state.currentpage}
      valuechange={this.redirect}
      nodefault={true}
    />
    );
  }
}

function validURL(value) {
  // ONLY FOR TESTING, REMOVE BEFORE DEPLOY
  return true;

  // Copyright (c) 2010-2013 Diego Perini, MIT licensed
  // https://gist.github.com/dperini/729294
  // see also https://mathiasbynens.be/demo/url-regex
  // modified to allow protocol-relative URLs
  // return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test( value );
}
