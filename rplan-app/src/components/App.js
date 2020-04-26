import React, { Component } from 'react';
import ViewWeek from './ViewWeek';
import './css/ViewWeek.css';

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userdata: this.props.userdata
    }
  }
  render() {
    console.log(this.state.displaymode);
    return (
      <main>
        {this.props.displaymode ? <ViewWeek /> : null}
      </main>
    );
  }
}
