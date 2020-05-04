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
      class: (this.props.displayMode === 'classes') ? this.props.selectedTarget : null,
      classroom1: null,
      classroom2: null,
      teacher1: (this.props.displayMode === 'teachers') ? this.props.selectedTarget : null,
      teacher2: null,
      project: null,
      laptops: null,
      note: null
    }
    this.updateSelected = this.updateSelected.bind(this);
    this.updateInp = this.updateInp.bind(this);
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

  updateSelected = (e) => {
    let kvlist = { // list of key value pairs that map ids to values
      teacher1Input: 'teacher1',
      teacher2Input: 'teacher2',
      classInput: 'class',
      classroom1Input: 'classroom1',
      classroom2Input: 'classroom2',
      projectInput: 'project'
    };
    let value = e.target.dataset.value;
    let id = e.target.parentElement.parentElement.getElementsByTagName('input')[0].id;
    if (!kvlist[id]) return
    let obj = {};
    obj[kvlist[id]] = value;
    this.setState(obj);
  }

  updateInp = (e) => {
    let kvlist = {
      laptopInput: 'laptops',
      notesInput: 'note'
    };
    let value = e.target.value;
    let id = e.target.id;
    if (!kvlist[id]) return
    let obj = {};
    obj[kvlist[id]] = value;
    this.setState(obj);
  }

  selectAppointmentProperties = () => {
    return (
      <React.Fragment>
        <div className="propertyInput">
          {/* display selectclass or selectteacter depending on displaymode */}
          {
            (this.props.displayMode === 'class') ? (
              <React.Fragment>
                <input type="hidden" value={this.props.selectedTarget} id="classInput" />
                <Dropdown
                  ID="teacher1Input"
                  data={this.state.availability.teachers}
                  title="Docent"
                  default={{text: "Docent", value: null}}
                  valuechange={this.updateSelected}
                  nodefault={false}
                />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <input type="hidden" value={this.props.selectedTarget} id="teacher1Input" />
                <Dropdown
                  ID="teacher1Input"
                  data={this.state.availability.teachers}
                  title="Docent"
                  default={{text: "Docent", value: null}}
                  valuechange={this.updateSelected}
                  nodefault={false}
                />
              </React.Fragment>
            )
          }
          <Dropdown
            ID="teacher2Input"
            data={this.state.availability.teachers}
            title="Extra Docent"
            default={{text: "Extra Docent", value: null}}
            valuechange={this.updateSelected}
            nodefault={false}
          />
          <Dropdown
            ID="classroom1Input"
            data={this.state.availability.classrooms}
            title="Lokaal"
            default={{text: "Lokaal", value: null}}
            valuechange={this.updateSelected}
            nodefault={false}
          />
          <Dropdown
            ID="classroom2Input"
            data={this.state.availability.classrooms}
            title="Extra Lokaal"
            default={{text: "Extra Lokaal", value: null}}
            valuechange={this.updateSelected}
            nodefault={false}
          />
          <Dropdown
            ID="projectInput"
            data={this.state.projects}
            title="Project"
            default={{text: "Project", value: null}}
            valuechange={this.updateSelected}
            nodefault={false}
          />
          <input type="number" placeholder="Laptops" id="laptopInput" onChange={this.updateInp} />
        </div>
        <input type="text" placeholder="Opmerkingen" id="notesInput" onChange={this.updateInp} />
        <button className="propertyInputContinue" onClick={this.saveAppointment}>Opslaan</button>
      </React.Fragment>
    );
  }

  saveAppointment = () => {
    let c = encodeURIComponent(this.state.class);
    let c1 = encodeURIComponent(this.state.classroom1);
    let c2 = encodeURIComponent(this.state.classroom2);
    let t1 = encodeURIComponent(this.state.teacher1);
    let t2 = encodeURIComponent(this.state.teacher2);
    let p = encodeURIComponent(this.state.project);
    let l = encodeURIComponent(this.state.laptops);
    let n = encodeURIComponent(this.state.note);

    let s = encodeURIComponent(`${this.props.appointmentDay}_${this.state.startTime}`);
    let e = encodeURIComponent(`${this.props.appointmentDay}_${this.state.endTime}`);

    if (!this.state.class && (!this.state.teacher1 && !this.state.teacher2)) {
      this.setState({message: "Tenminste 1 klas of docent is verplicht"});
      return;
    }

    if (!this.state.project) {
      this.setState({message: "Project is verplicht"});
      return;
    }

    let post = `class=${c}&classroom1=${c1}&classroom2=${c2}&teacher1=${t1}&teacher2=${t2}&project=${p}&laptops=${l}&note=${n}&start=${s}&end=${e}`;

    API.post(`/appointments/`, post).then((resp) => {
      this.props.onSuccess();
      this.props.closeCallback();
    }).catch((error) => {
      this.setState({message: error.response.data.error})
    });
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
