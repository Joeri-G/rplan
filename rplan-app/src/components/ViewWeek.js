import React, {Component} from 'react';
import API from '../axios-config';
import NewAppointment from './NewAppointment';
import ViewAppointment from './ViewAppointment';
import Dropdown from './Dropdown';
import './css/ViewWeek.css';

export default class ViewWeek extends Component {
  constructor(props) {
    super(props);

    let savedDate = (typeof localStorage.savedDate === 'string') ? new Date(localStorage.savedDate) : new Date();

    this.state = {
      currentdate: savedDate,
      startdate: getNextDayOfWeek(savedDate, 1),
      target: '063c270a-7772-4143-8e9a-833f4ef74a18',
      mode: "class",
      startHour: 7,
      endHour: 17
    };
  }

  async componentDidMount() {

  }

  setDate = (date) => {
    let startdate = this.getNextDayOfWeek(date, 1);
    let currentdate = date;
    this.setState({
      startdate: startdate,
      currentdate: currentdate
    });
  }

  render() {
    return (
      <React.Fragment>
        <Datepicker dateCallback={null} selectorCallback={null} defaultDate={this.state.currentdate.toISOString().substring(0, 10)} />
        <Calendar mode={this.state.mode} startdate={this.state.startdate} currentdate={this.state.currentdate} target={this.state.target} />
      </React.Fragment>
    );
  }
}

class Datepicker extends Component {
  constructor(props) {
    super(props);

    let storedMode = (typeof localStorage.mode === 'string') ? localStorage.mode : null;
    let modes = [
      {text: 'Klassen', value: 'classes', GUID: '1'},
      {text: 'Docenten', 'value': 'teachers', GUID: '2'}
    ];
    let modeObj = {text: 'Mode', value: null};

    for (const m of modes)
      if (m.value === storedMode){
        modeObj = m;
        break; // we found what we're looking for, break the loop
      }


    this.state = {
      classes: [],
      teachers: [],
      mode: storedMode,
      modeObj: modeObj,
      modes: modes
    }
    this.updateMode = this.updateMode.bind(this);
  }

  async componentDidMount() {
    // load classes
    API.get('/classes/').then((response) => {
      if (response.data.succesfull) {
        let data = response.data.response.map((data) => {
          let obj = {
            text: data.name,
            value: data.GUID,
            GUID: data.GUID
          };
          return obj;
        });
        this.setState({classes: data});
      }
    }).catch((error) => {
      console.log(error);
    });


    // load teachers
    API.get('/teachers/').then((response) => {
      if (response.data.succesfull) {
        let data = response.data.response.map((data) => {
          let obj = {
            text: data.name,
            value: data.GUID,
            GUID: data.GUID
          };
          return obj;
        });
        this.setState({teachers: data});
      }
    }).catch((error) => {
      console.log(error);
    });
  }

  updateMode = (e) => {
    let mode = e.target.dataset.value;
    // save mode to localStorage
    localStorage.mode = mode;
    if (this.state.mode !== mode) this.setState({
      mode: mode
    });
  }


  displaySelectOptions = () => {

    const modeDropdown = <Dropdown
      ID="modeInput"
      data={this.state.modes}
      title={this.state.modeObj.text}
      default={this.state.modeObj}
      valuechange={this.updateMode}
      nodefault={false}
      notNULL={true}
    />

    if (this.state.mode) {

      let data = this.state[this.state.mode];

      if (!data) data = [];

      const selectorDropdown = <Dropdown
        ID="selectorInput"
        data={data}
        title={'Maak een keuze'}
        default={this.state.modeObj}
        valuechange={null}
        nodefault={false}
        notNULL={true}
      />

      return (
        <React.Fragment>
          {modeDropdown}
          {selectorDropdown}
        </React.Fragment>
      )
    }


    return modeDropdown;
  }

  render() {
    return (
      <section className="timetableSpecifier">
        <div className="selectSelector">
          {this.displaySelectOptions()}
        </div>
        <div className="selectDate">
          <input type="date" defaultValue={this.props.defaultDate} />
        </div>
      </section>
    );
  }
}

class Calendar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      appointments: [],
      appointmentWindow: false,
      appointmentDay: null
    };
    this.dayClick = this.dayClick.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  async componentDidMount() {
    this.refresh();
  }

  calcPxOffset = (start, end) => {
    let startHour = 7.5;
    let endHour = 17.5;
    let dayheight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--day-height').slice(0, -2), 10);

    start = MYSQLdatetimeToDate(start);
    end = MYSQLdatetimeToDate(end);

    let startmin =  ((start.getHours() - startHour) * 60) + start.getMinutes()
    let endmin = ((end.getHours() - startHour) * 60) + end.getMinutes();

    let pxm = dayheight / ((endHour-startHour) * 60 ) // pixels per minute

    let duration = Math.floor((endmin-startmin) * pxm);

    let offset = (startmin) * pxm;

    return {start: offset, duration: duration};
  }

  parseday = (ap) => {
    let pxValues = this.calcPxOffset(ap.start, ap.endstamp);
    let data = {
      startTimestamp: ap.start,
      endTimestamp: ap.endstamp,
      start: pxValues.start,
      teacher1: ap.teacher1,
      teacher2: ap.teacher2,
      class: ap.class,
      classroom1: ap.classroom1,
      classroom2: ap.classroom2,
      project: ap.project,
      notes: ap.notes,
      duration: pxValues.duration,
      GUID: ap.GUID
    };
    return data;
  }

  dayClick = (day) => {
    // create new appointment

    this.setState({
      appointmentWindow: true,
      appointmentDay: day
    });
  }

  refresh = () => {
    let startdatestring = formatDate(this.props.startdate);
    let enddatestring = formatDate(getNextDayOfWeek(this.props.startdate, 5));
    API.get(`/appointments/${startdatestring}/${enddatestring}/${this.props.target}`).then((response) => {
      if (response.data.succesfull) this.setState({appointments: response.data.response});
    }).catch((error) => {
      // blah blah, error handling and stuff
    });
  }

  render() {
    let appointments = [ [], [], [], [], [] ];
    let day = 1;
    let start, ap;
    for (var i = 0; i < this.state.appointments.length; i++) {
      ap = this.state.appointments[i];
      start = new Date(ap.start.slice(0, 10)); // first 10 chars are an ISO compatible date string
      // check if the date is equal to the day date
      if (Date.parse(start) === Date.parse(getNextDayOfWeek(start, day + 1))) day++;
      appointments[day-1].push(this.parseday(ap));
      if (day > 6) break;
    }
    return (
      <main className="viewWeek">
        <div className="days">
          <Day appointments={appointments[0]} day={formatDate(getNextDayOfWeek(this.props.startdate, 1))} dayClick={this.dayClick} />
          <Day appointments={appointments[1]} day={formatDate(getNextDayOfWeek(this.props.startdate, 2))} dayClick={this.dayClick} />
          <Day appointments={appointments[2]} day={formatDate(getNextDayOfWeek(this.props.startdate, 3))} dayClick={this.dayClick} />
          <Day appointments={appointments[3]} day={formatDate(getNextDayOfWeek(this.props.startdate, 4))} dayClick={this.dayClick} />
          <Day appointments={appointments[4]} day={formatDate(getNextDayOfWeek(this.props.startdate, 5))} dayClick={this.dayClick} />
        </div>
        { this.state.appointmentWindow ? <NewAppointment closeCallback={() => {
          this.setState({
            appointmentWindow: !this.state.appointmentWindow,
            appointmentDay: null
          });
        }} appointmentDay={this.state.appointmentDay} displayMode={this.props.mode} selectedTarget={this.props.target} onSuccess={this.refresh} /> : null }
      </main>
    );
  }
}

class Day extends Component {

  render() {
    // this is a quick hack to allow for different onClicks
    return (
      <section className="dayComponent">
        <p>{getDay(new Date(this.props.day))}</p>
        <div className="dayCover">
          {this.props.appointments.map((appointment) => {
            return <Appointment key={appointment.GUID} data={appointment} />
          })}
        </div>
        <div className="day" onClick={() => {this.props.dayClick(this.props.day)}}></div>
      </section>
    );
  }
}

class Appointment extends Component {
  constructor(props) {
    super(props);
    this.state = {
      anlargedAppointment: null
    };
    this.closeClick = this.closeClick.bind(this);
  }
  randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  click = () => {
    this.setState({anlargedAppointment: <ViewAppointment data={this.props.data} closeCallback={this.closeClick} />});
  }

  closeClick = () => {
    this.setState({anlargedAppointment: null});
  }

  render() {
    this.style = {
      marginTop: this.props.data.start.toString()+"px",
      height:  this.props.data.duration.toString()+"px"
    };

    let startHour = new Date(this.props.data.startTimestamp).getHours().toString();
    let startMin = new Date(this.props.data.startTimestamp).getMinutes().toString();
    if (startHour.length < 2) startHour = `0${startHour}`;
    if (startMin.length < 2) startMin = `0${startMin}`;

    let endHour = new Date(this.props.data.endTimestamp).getHours().toString();
    let endMin = new Date(this.props.data.endTimestamp).getMinutes().toString();
    if (endHour.length < 2) endHour = `0${endHour}`;
    if (endMin.length < 2) endMin = `0${endMin}`;

    return (
      <React.Fragment>
        <div className="appointment" style={this.style} onClick={this.click}>
          <p className="duration">{`${startHour}:${startMin} - ${endHour}:${endMin}`}</p>
        </div>
        {this.state.anlargedAppointment}
      </React.Fragment>
    );
  }
}

// https://codereview.stackexchange.com/a/33532
function getNextDayOfWeek(date, dayOfWeek) {
  var resultDate = new Date(date.getTime());
  resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);
  return resultDate;
}

function formatDate(d) {
  let month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

// https://itnext.io/create-date-from-mysql-datetime-format-in-javascript-912111d57599
function MYSQLdatetimeToDate(dateTime) {
  let dateTimeParts= dateTime.split(/[- :]/); // regular expression split that creates array with: year, month, day, hour, minutes, seconds values
  dateTimeParts[1]--; // monthIndex begins with 0 for January and ends with 11 for December so we need to decrement by one

  return new Date(...dateTimeParts); // our Date object
}

function getDay(date) {
  let days = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
  return days[date.getDay()];
}
