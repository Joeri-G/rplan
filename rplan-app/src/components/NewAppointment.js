import React, {Component} from 'react';
import API from '../axios-config';
import Dropdown from './Dropdown';
import './css/NewAppointment.css';

export default class NewAppointment extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: null,
      hasTime: false,
      startTime: null,
      endTime: null,
      loadedAvailability: false,
      availability: {
        "classrooms": [],
        "teachers": [],
        "classes": []
      },
      "projects": [],
      // selected values
      class: null,
      classroom1: null,
      classroom2: null,
      teacher1: null,
      teacher2: null,
      project: null,
      laptops: null,
      note: null
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
    // let comparableStart = d1.getTime();
    // let comparableEnd = d2.getTime();

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
    }, this.requestAvailableResources);
  }

  selectAppointmentProperties = () => {
    return (
      <React.Fragment>
        <div className="propertyInput">
          {/* display selectclass or selectteacter depending on displaymode */}
          <input type="hidden" value={this.props.selectedTarget} id={(this.props.displayMode === 'class') ? "classInput"  : "teacher1Input"} />
          {
            (this.props.displayMode === 'class') ?
            <Dropdown
              ID="teacher1Input"
              data={this.state.availability.teachers}
              title="Docent"
              default="None"
              valuechange={null}
              nodefault={false}
            /> :
            <Dropdown
              ID="classInput"
              data={this.state.availability.classes}
              title="Klas"
              default="None"
              valuechange={null}
              nodefault={false}
            />
          }
          <Dropdown
            ID="teacher2Input"
            data={this.state.availability.teachers}
            title="Extra Docent"
            default="None"
            valuechange={null}
            nodefault={false}
          />
          <Dropdown
            ID="classroom1Input"
            data={this.state.availability.classrooms}
            title="Lokaal"
            default="None"
            valuechange={null}
            nodefault={false}
          />
          <Dropdown
            ID="classroom2Input"
            data={this.state.availability.classrooms}
            title="Extra Lokaal"
            default="None"
            valuechange={null}
            nodefault={false}
          />
          <Dropdown
            ID="projectInput"
            data={this.state.projects}
            title="Project"
            default="None"
            valuechange={null}
            nodefault={false}
          />
          <input type="number" placeholder="Laptops" id="laptopInput" onChange={null} />
        </div>
        <input type="text" placeholder="Opmerkingen" id="notesInput" onChange={null} />
        <button className="propertyInputContinue">Opslaan</button>
      </React.Fragment>
    );
  }

  requestAvailableResources = () => {
    // list
    let statStamp = `${this.props.appointmentDay}_${this.state.startTime}`;
    let endStamp = `${this.props.appointmentDay}_${this.state.endTime}`;
    API.get(`/availability/${statStamp}/${endStamp}`).then((response) => {
      let resp = response.data.response;
      let availability = {
        "classrooms": resp.classrooms.map((data) => {
          return {
            text: data.classroom,
            value: data.GUID,
            GUID: data.GUID
          }}),
        "teachers": resp.teachers.map((data) => {
          return {
            text: data.name,
            value: data.GUID,
            GUID: data.GUID
          }}),
        "classes": resp.classes.map((data) => {
          return {
            text: data.name,
            value: data.GUID,
            GUID: data.GUID
          }})
      };
      // now we need to sanatize the data and put it into objects the <Dropwdown /> can use
      this.setState({
        availability: availability
      });
    }).catch((error) => {
      (error.response) ? this.setState({message: error.response.data.message}) : console.error(error);
    });

    API.get('/projects').then((response) => {
      this.setState({
        projects: response.data.response.map((data) => {
          return {
            text: data.projectTitle,
            value: data.GUID,
            GUID: data.GUID
          }})
      });
    }).catch((error) => {
      (error.response) ? this.setState({message: error.response.data.message}) : console.error(error);
    });

    this.setState({
      loadedAvailability: true
    });
  }

  render() {
    return (
      <section>
        <div className="modal" onClick={this.props.closeCallback}></div>
        <div className="modalContent newAppointment">
          <h1>Nieuwe afspraak</h1>
          <p>
            {getFullDay(new Date(this.props.appointmentDay))} { }
            {formatDateDMY(new Date(this.props.appointmentDay))}
          </p>
          {(this.state.message) ? <p className="message">{this.state.message}</p> : null}
          <input type="hidden" value={this.props.appointmentDay} id="dateInput" />
          {(!this.state.hasTime) ? this.selectTimeframe() : this.selectAppointmentProperties()}
        </div>
      </section>
    );
  }
}

function getFullDay(date) {
  let days = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
  return days[date.getDay()];
}

function formatDateDMY(d) {
  let month = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"][d.getMonth()],
      day = '' + d.getDate(),
      year = d.getFullYear();

  return [day, month, year].join(' ');
}
