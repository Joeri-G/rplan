import React, { Component } from 'react';
import './css/Dropdown.css';

export default class Dropdown extends Component {
  constructor(props) {
    super(props);

    let defaultdata = [];
    if (!this.props.nodefault) defaultdata = [{text: "Geen selectie", value: "None" }];
    let data = defaultdata.concat(this.props.data);
    this.setValue = this.setValue.bind(this);

    this.state = {
      title: this.props.title,
      displayOptions: false,
      data: data,
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
        <DropOption display={this.state.displayOptions} data={this.state.data} callback={this.setValue} />
      </div>
    )
  }
}

class DropOption extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: this.props.data.map((data, value) => {
        // set the display to true by default
        data.display = true;
        return data;
      }),
      allshown: true,
      nomatches: false
    }
  }

  renderOption = (data, key) => {return null};

  filter = (e) => {
    this.resetFilter();
    //loop through this.state.data, if [i].text matched => [i].display = true, else [i].display = false
    const filteredData = [];
    let nomatches = true;
    for (const data of this.state.data) {
      let text = data.text.toUpperCase();
      let filter = e.target.value.toUpperCase();
      data.display = false;
      if (text.indexOf(filter) > -1) {
        nomatches = false;
        data.display = true;
      }
      filteredData.push(data);
    }

    this.setState({
      data: filteredData,
      allshown: false,
      nomatches: nomatches
    });
  }

  resetFilter = () => {
    if (this.state.allshown) return;
    const resetData = this.state.data.map((data, key) => {
      data.display = true;
      return data;
    });
    this.setState({
      data: resetData,
      allshown: true
    });
  }

  render() {
    const options = this.state.data.map((data, key) =>
      <button key={key} className="optionButton" onClick={this.props.callback} style={{display: data.display ? 'block' : 'none'}} data-value={data.value} data-title={data.text}>{data.text}</button>
    );
    return (
      <div className="customDropdownButtonOptions" style={{display:this.props.display?'block':'none'}}>
        <input type="search" placeholder="Filter" onChange={this.filter} />
        <button className="optionButton" style={{display: (this.state.nomatches) ? 'block' : 'none'}}>Geen match</button>
        {options}
      </div>
    );
  }
}
