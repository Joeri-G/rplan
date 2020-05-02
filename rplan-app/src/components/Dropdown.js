import React, { Component } from 'react';
import './css/Dropdown.css';

export default class Dropdown extends Component {
  constructor(props) {
    super(props);
    this.setValue = this.setValue.bind(this);

    this.state = {
      title: this.props.title,
      displayOptions: false,
      id: this.props.ID,
      value: (typeof this.props.default.value !== undefined && this.props.default.value !== null) ? this.props.default.value : null,
      haschanged: false
    }
  }

  setValue = (e) => {
    let val = e.target.dataset.value;
    let title = e.target.dataset.title;
    this.setState({value: val, title: title, haschanged: true});
    this.toggleOptions();
    //now execute the callback
    if (typeof this.props.valuechange === 'function')
      this.props.valuechange(e);
  }

  toggleOptions = () => {
    this.setState((state) => ({displayOptions: !state.displayOptions}));
  }

  render() {
    let clickCatchStyle = {
      width: "100vw",
      height: "100vh",
      position: "absolute",
      top: "0",
      left:"0",
      background: "rgba(0,0,0,0)",
      display: (this.state.displayOptions) ? "block" : "none"
    }
    return (
      <React.Fragment>
        {/* empty element that sits behind the dropdown so that when we click outside of the dropdown this catches it and closes it */}
        <div style={clickCatchStyle} onClick={() => {this.setState({displayOptions: !this.state.displayOptions})}}></div>
        <div className="customDropdownButton">
          <button className="optionButton titleButton" onClick={this.toggleOptions}>{(this.state.haschanged) ? this.state.title : this.props.title}</button>
          <input type="hidden" value={(!this.state.value) ? "" : this.state.value} id={this.state.id} />
          <DropOption display={this.state.displayOptions} data={this.props.data} callback={this.setValue} />
        </div>
      </React.Fragment>
    )
  }
}

class DropOption extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: "",
      allshown: true,
      nomatches: false
    }
  }

  filter = (e) => {
    this.setState({
      filter: e.target.value.toUpperCase()
    });
  }
  render() {
    let nomatches = true;
    let d = [{text: "Geen selectie", value: null, GUID: "00000000-0000-0000-0000-000000000000"}].concat(this.props.data);

    const options = d.map((data, key) => {
      let text = data.text.toUpperCase();
      let filter = this.state.filter;
      data.display = false;
      if (text.indexOf(filter) > -1) {
        nomatches = false;
        data.display = true;
      }
      return (
      <button
        key={data.GUID}
        className="optionButton"
        onClick={this.props.callback}
        style={{display: data.display ? 'block' : 'none'}}
        data-value={data.value}
        data-title={data.text}
      >{data.text}</button>);
    });

    return (
      <div className="customDropdownButtonOptions" style={{display:this.props.display?'block':'none'}}>
        <input type="search" placeholder="Filter" onChange={this.filter} />
        <button className="optionButton" style={{display: (nomatches) ? 'block' : 'none'}}>Geen match</button>
        {options}
      </div>
    );
  }
}
