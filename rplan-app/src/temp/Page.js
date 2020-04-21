import React, { Component } from 'react';
import './components/css/index.css';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Planner from './components/Planner';
import Admin from './components/Admin';
import Login from './components/Login';

//check if the user is logged in
let defaultUserdata = {
  loggedin: true,
  GUID: null,
  username: null,
  key: null,
  userLVL: 0
}


const Userdata = React.createContext(defaultUserdata);

export default class Page extends Component {
  static defaultUserdata = Userdata
  constructor(props) {
    super(props);
    this.state = {
      subpage: null,
      subpagename: null,
      userdata: defaultUserdata
    }
    console.log(this.state);
    //bind subpage
    this.ssp = this.setSubpage.bind(this);
    console.log(Userdata);
  }

  componentDidMount() {
    //when the hash changes we want to check the page again
    window.addEventListener('popstate', this.setSubpage);
    this.setSubpage();
  }

  logincheck = () => {
    //login check
    // this.setState({userdata :{loggedin: true}});
    let newstate = this.state.userdata;
    newstate.loggedin = true;
    this.setState({userdata: newstate});
    return true;
  }


  setSubpage = () => {
    // make sure the user is logged in
    this.logincheck()
    // detect what body we have to load
    if (window.location.hash === "#admin") this.setState({subpage: <Admin userdata={this.state.userdata} />, subpagename: "admin"});
    else if (!this.state.subpagename !== "planner") {
      this.setState({subpage: <Planner userdata={this.state.userdata} />, subpagename: "planner"});
    }
  }

  render() {
    return (
      <Userdata.Provider>
        <Nav ssp={this.ssp}/>
        <main>
          {this.state.loggedin ? this.state.subpage : <Login />}
        </main>
        <Footer />
      </Userdata.Provider>
    )
  }
}
