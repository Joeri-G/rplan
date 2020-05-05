import React, { Component } from 'react';
import './css/Nav.css';

export default class Nav extends Component {
  render() {
    return (
        <nav>
          <div className="navInner">
            <button onClick={this.props.setmode} data-target="weekplanner">Weekplanner</button>
            <button onClick={this.props.setmode} data-target="dyaplanner">Dagplanner</button>
            <button onClick={this.props.setmode} data-target="projects">Projecten</button>
            <button onClick={this.props.setmode} data-target="panel">Panel</button>
            <button onClick={() => {
              localStorage.clear(); 
              this.props.updateLogin();
            }}>Logout</button>
          </div>
        </nav>
    )
  }
}
