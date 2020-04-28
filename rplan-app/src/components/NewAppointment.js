import React, {Component} from 'react';
import API from '../axios-config';
import './css/NewAppointment.css';

export default class NewAppointment extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: null,
      hasTime: false,
      startTime: null,
      endTime: null,
      availability: {
        "classrooms": [],
        "teachers": [],
        "classes": [],
        "projects": []
      }
    }
  }
  selectTimeframe = () => {
    return (
      <React.Fragment>
        <div className="durationInput">
          <span>
            <label htmlFor="startTimeInput">Starttijd: </label>
            <input type="time" name="startTimeInput" id="startTimeInput" />
          </span>
          <span>
            <label htmlFor="endTimeInput">Eindtijd: </label>
            <input type="time" name="endTimeInput" id="endTimeInput" />
          </span>
        </div>
        <button className="durationInputContinue" onClick={this.verifyTime}>Verder</button>
      </React.Fragment>
    );
  }
  verifyTime = () => {
    let startTime = document.querySelector("#startTimeInput").value;
    let endTime = document.querySelector("#endTimeInput").value;

    if (endTime === "" || startTime === "") {
      this.setState({
        hasTime: false,
        message: "Invalid time"
      });
      return;
    }

    let d1 = new Date();
    let d2 = new Date();

    d1.setHours(parseInt(startTime.slice(0,2)));
    d1.setMinutes(parseInt(startTime.slice(3,5)));
    d2.setHours(parseInt(endTime.slice(0,2)));
    d2.setMinutes(parseInt(endTime.slice(3,5)));
    let comparableStart = d1.getTime();
    let comparableEnd = d2.getTime();

    if (endTime < startTime) {
      this.setState({
        hasTime: false,
        message: "Endtime must be after starttime"
      });
      return;
    }

    this.setState({
      hasTime: true,
      startTime: startTime,
      endTime: endTime,
      message: null
    });
  }

  selectAppointmentProperties = () => {
    // clear the state from older requests, things have changed now
    this.setState({
      availability: {
        "classrooms": [],
        "teachers": [],
        "classes": [],
        "projects": []
      }
    });
    return (
      <div className="propertyInput">
        {/* display selectclass or selectteacter depending on displaymode */}
        <input type="hidden" value={this.props.selectedTarget} id={(this.props.displayMode === 'class') ? "class1Input"  : "teacher1Input"} />

      </div>
    );
  }

  requestAvailableResources = () => {

  }

  render() {
    return (
      <section>
        <div className="modal" onClick={this.props.closeCallback}></div>
        <div className="modalContent newAppointment">
          <h1>Nieuwe afspraak</h1>
          <p>{this.props.appointmentDay}</p>
          {(this.state.message) ? <p className="message">{this.state.message}</p> : null}
          <input type="hidden" value={this.props.appointmentDay} id="dateInput" />
          {(!this.state.hasTime) ? this.selectTimeframe() : this.selectAppointmentProperties() }
        </div>
      </section>
    );
  }
}
