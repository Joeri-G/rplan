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
      value: (typeof this.props.default.value !== undefined && this.props.default.value !== null) ? this.props.default.value : "None",
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
    return (
      <div className="customDropdownButton">
        <button className="optionButton titleButton" onClick={this.toggleOptions}>{(this.state.haschanged) ? this.state.title : this.props.title}</button>
        <input type="hidden" value={this.state.value} id={this.state.id} />
        <DropOption display={this.state.displayOptions} data={this.props.data} callback={this.setValue} />
      </div>
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
    let d = [{text: "Geen selectie", value: "None", GUID: "00000000-0000-0000-0000-000000000000"}].concat(this.props.data);

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
