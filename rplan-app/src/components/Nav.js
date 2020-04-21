import React, { Component } from 'react';
import './css/Nav.css';

export default class Nav extends Component {
  render() {
    return (
        <nav>
          <div className="navInner">
            <a href="#planner" onClick={this.props.reload}>Weekplanner</a>
            <a href="#planner-full" onClick={this.props.reload}>Dagplanner</a>
            <a href="#projects" onClick={this.props.reload}>Projecten</a>
            <a href="#admin" onClick={this.props.reload}>Panel</a>
          </div>
        </nav>
    )
  }
}
