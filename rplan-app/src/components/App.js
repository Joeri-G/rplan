import React, { Component } from 'react';
import ViewWeek from './ViewWeek';
import './css/ViewWeek.css';

export default class App extends Component {
  constructor(props) {
    super(props);

    if (typeof localStorage.displaymode !== "string") localStorage.displaymode = "week";
    let displaymode = localStorage.displaymode;

    this.state = {
      userdata: this.props.userdata,
      displaymode: displaymode
    }
  }
  render() {
    console.log(this.state.displaymode);
    return (
      <main>
        {this.state.displaymode ? <ViewWeek /> : null}
      </main>
    );
  }
}
