import React, { Component } from 'react';
import Login from './components/Login';
import App from './components/App';
import Nav from './components/Nav';
import Footer from './components/Footer';
import API from './axios-config';

export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedin: true,
      userdata: null,
      target: (typeof localStorage.displaymode === "string") ? localStorage.displaymode : "week"
    }
    this.updateLogin = this.updateLogin.bind(this);
    this.setmode = this.updateLogin.bind(this);
  }

  setmode = (e) => {
    let target = e.target.dataset.target;
    this.setState({target: target});
  }

  render() {
    return (
      <React.Fragment>
        <Nav updateLogin={this.updateLogin} setmode={this.setmode} />
        {
          // if the user isn't loggedin show the login screen
          this.state.loggedin ? <App userdata={this.state.userdata} displaymode={this.state.target} /> : <Login updateLogin={this.updateLogin} />
        }
        <Footer />
      </React.Fragment>)
  }

  async componentDidMount() {
    // Load async data.
    // Update state with new data.
    // Re-render our component.
    let newUserState = await API.get('/login').then((response) => { //on success
      if (response.data.succesfull) {
        console.log("User is logged in");
        return {
          loggedin: true,
          userdata: response.data.response
        };
      }
      console.log("User is not logged in");
      return {
        logged: false,
        userdata: null
      }
    }).catch(
      (error) => { //on error
        if (typeof error.response === 'undefined' || (error.response.status !== 401 && error.response.status !== 403)) {
          // put an error handler here in a future release
        }
        console.log("User is not logged in");
        console.log(error);
        return {
          loggedin: false,
          userdata: null
        }
      });
    //rest of code
    this.setState(newUserState);
  }

  //use this function to update the state when the user logs in or out
  updateLogin = (set = false, userdata = null) => {
    this.setState({
      loggedin: set,
      userdata: userdata
    });
  }
}
