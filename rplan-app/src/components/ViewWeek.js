import React, {Component} from 'react';
import API from '../axios-config';
import NewAppointment from './NewAppointment';
import ViewAppointment from './ViewAppointment';
import Dropdown from './Dropdown';
import './css/ViewWeek.css';

export default class ViewWeek extends Component {
  constructor(props) {
    super(props);

    let savedDate = (typeof localStorage.savedDate === 'string' && localStorage.savedDate !== "" && !isNaN(new Date(localStorage.savedDate))) ? new Date(localStorage.savedDate) : new Date();
    let savedMode = (typeof localStorage.mode === 'string' && localStorage.mode !== '') ? localStorage.mode : 'classes';
    let savedSelector = (typeof localStorage.selector === 'string' && localStorage.selector !== '') ? localStorage.selector : null;

    this.state = {
      currentdate: savedDate,
      startdate: getNextDayOfWeek(savedDate, 1),
      target: savedSelector,
      mode: savedMode
    };

    this.setDate = this.setDate.bind(this);
    this.setSelector = this.setSelector.bind(this);
  }

  setDate = (date) => {
    let d = new Date(date);
    let startdate = getNextDayOfWeek(d, 1);
    let currentdate = d;

    localStorage.savedDate = currentdate;

    this.setState({
      startdate: startdate,
      currentdate: currentdate
    });
  }

  setSelector = (mode, selector) => {
    this.setState({
      mode: mode,
      target: selector
    });
  }

  render() {
    return (
      <React.Fragment>
        <Datepicker
            dateCallback={this.setDate}
            selectorCallback={this.setSelector}
            defaultSelector={this.state.target}
            defaultDate={this.state.currentdate.toISOString().substring(0, 10)}
            appConfig={this.props.appConfig}
          />
        {(this.state.target) ?
          <Calendar
            mode={this.state.mode}
            startdate={this.state.startdate}
            currentdate={this.state.currentdate}
            target={this.state.target}
            appConfig={this.props.appConfig}
          /> : null}
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
      if (m.value === storedMode) {
        modeObj = m;
        break; // we found what we're looking for, break the loop
      }

    this.state = {
      classes: [],
      teachers: [],
      mode: storedMode,
      modeObj: modeObj,
      modes: modes,
      selector: this.props.defaultSelector,
      selectorObj: {text: 'Maak een keuze', value: null},
      dateValue: this.props.defaultDate
    }
    this.updateMode = this.updateMode.bind(this);
  }

  async componentDidMount() {
    // load classes
    API.get('/classes/').then((response) => {
      if (response.data.successful) {
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
      if (response.data.successful) {
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

    // if a mode and selector are provided load the data
    if (!this.state.mode || !this.state.selector) return;
    API.get(`/${this.state.mode}/${this.state.selector}`).then((response) => {
      if (!response.data.successful) return;
      let data = response.data.response;
      let selectorObj = {
        text: data.name,
        value: data.GUID,
        GUID: data.GUID
      };
      this.setState({
        selectorObj: selectorObj
      });
    }).catch((error) => {console.log(error)});
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
                                  title={this.state.selectorObj.text}
                                  default={this.state.modeObj}
                                  valuechange={(e) => {
                                    let val = e.target.dataset.value;
                                    this.props.selectorCallback(this.state.mode, val);
                                    // store the selector and mode in the localStorage
                                    localStorage.mode = this.state.mode;
                                    localStorage.selector = val;
                                  }}
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

  changeWeek = (w) => {
    let weekInc = w * 7;
    let d = new Date(this.state.dateValue);
    d.setDate(d.getDate() + weekInc);
    let dateString = d.toISOString().substring(0, 10);
    this.setState({dateValue: dateString});
    this.props.dateCallback(dateString);
  }

  render() {
    return (
      <section className="timetableSpecifier">
        <div className="selectedParent">
          <div className="selectSelector">
            {this.displaySelectOptions()}
          </div>
          <div className="selectDate">
            <button onClick={()=>this.changeWeek(-1)}>&lt;</button>
            <input type="date" value={this.state.dateValue} onChange={(e) => {
              if (this.state.dateValue !== e.target.value) this.setState({dateValue: e.target.value});
              this.props.dateCallback(e.target.value);
            }} />
            <button onClick={()=>this.changeWeek(+1)}>&gt;</button>
          </div>
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
      hasUpdatedAppointment: false,
      appointmentWindow: false,
      appointmentDay: null,
      target: this.props.target,
      currentdate: this.props.currentdate
    };
    this.dayClick = this.dayClick.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  async componentDidMount() {
    this.refresh();
  }

  componentDidUpdate() {
    // if the prop target is not equal to state target, refresh
    if (this.props.target === this.state.target && this.props.currentdate === this.state.currentdate) return;
    this.setState({
      target: this.props.target,
      currentdate: this.props.currentdate
    }, () => {
      // wrap this in a callback so we can be sure the new state is used
      this.refresh();
    });
  }

  calcPxOffset = (start, end) => {
    // let startHour = this.props.appConfig.startHour;
    // let endHour = this.props.appConfig.endHour;
    let startHour = 7;
    let endHour = 16;
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
      laptops: ap.laptops,
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
      if (response.data.successful) this.setState({appointments: response.data.response, hasUpdatedAppointment: false})
    }).catch((error) => {
      console.log(error);
    });
  }

  __QUICKFIX_update_hasUpdatedAppointment = () => { // I know this is bad practice, but rn I can't be bothered
    this.setState({hasUpdatedAppointment: true});
  }

  render() {
    let appointments = [ [], [], [], [], [] ];
    // loop through appointments
    for (const ap of this.state.appointments) {
      var dayArrOffset = 0; // allways start with an offset of 0
      var appointmentStart = Date.parse(ap.start.slice(0, 10)); // make the startTimestamp into a UNIX timestamp
      while (true) {
        // parse the day of the week that we are going to compare the appointment against (+1 because js thinks weeks start at sunday)
        var dayStart = Date.parse(getNextDayOfWeek(new Date(appointmentStart), dayArrOffset + 1));
        // if we found a match push the appointment into the desired array and break the loop
        if (appointmentStart === dayStart) {
          appointments[dayArrOffset].push(this.parseday(ap));
          break;
        }
        dayArrOffset++;
        if (dayArrOffset > 6) break; // small sageguard to prevent infinite loops when the timestamp is invalid
      }
    };

    const days = []; // quick fix, this resets the days when this.refresh is called
    if (!this.state.hasUpdatedAppointment) {
      this.__QUICKFIX_update_hasUpdatedAppointment();
    }
    else {
      for (var i = 0; i < 5; i++)
      days.push(<Day
        appointments={appointments[i]}
        day={formatDate(getNextDayOfWeek(this.props.startdate, i + 1))}
        dayClick={this.dayClick}
        refreshCallback={this.refresh}
        key={i}
      />);
    }

    return (
      <section className="viewWeek">
        <div className="days">
          {days}
        </div>
        {this.state.appointmentWindow ? <NewAppointment
                                          closeCallback={() => {
                                            this.setState({appointmentWindow: !this.state.appointmentWindow, appointmentDay: null});
                                          }}
                                          appointmentDay={this.state.appointmentDay}
                                          displayMode={this.props.mode}
                                          selectedTarget={this.props.target}
                                          refreshCallback={this.refresh}
                                        /> : null
        }
      </section>
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
            return <Appointment
                      key={appointment.GUID}
                      data={appointment}
                      refreshCallback={this.props.refreshCallback}
                    />
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
      enlargedAppointment: null,
      class: null,
      classroom1: null,
      classroom2: null,
      teacher1: null,
      teacher2: null,
      laptops: null,
      project: null,
      notes: null
    };
    this.closeClick = this.closeClick.bind(this);
  }
  async componentDidMount() {
    // now we're going to load all the data of the resources
    if (this.props.data.class)          this.loadResource('class', 'classes');
    if (this.props.data.classroom1)     this.loadResource('classroom1', 'classrooms');
    if (this.props.data.classroom2)     this.loadResource('classroom2', 'classrooms');
    if (this.props.data.teacher1)       this.loadResource('teacher1', 'teachers');
    if (this.props.data.teacher2)       this.loadResource('teacher2', 'teachers');
    this.setState({
      laptops: this.props.data.laptops,
      notes: this.props.data.notes
    });

    if (!this.props.data.project) return;
    API.get(`/projects/${this.props.data.project}`).then((response) => {
      if (!response.data.successful) return;
      this.setState({
        project: response.data.response.projectTitle
      });
    }).catch((error) => {console.log(error)});

  }

  loadResource = (id, coll) => {
    API.get(`/${coll}/${this.props.data[id]}`).then((response) => {
      if (!response.data.successful) return;
      let obj = {};
      obj[id] = response.data.response.name
      this.setState(obj);
    }).catch((error) => {console.log(error)});
  }
  randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  click = () => {
    this.setState({enlargedAppointment: <ViewAppointment
                                          data={{
                                            startTimestamp: this.props.data.startTimestamp,
                                            endTimestamp: this.props.data.endTimestamp,
                                            class: this.state.class,
                                            classroom1: this.state.classroom1,
                                            classroom2: this.state.classroom2,
                                            teacher1: this.state.teacher1,
                                            teacher2: this.state.teacher2,
                                            laptops: this.state.laptops,
                                            project: this.state.project,
                                            GUID: this.props.data.GUID,
                                            notes: this.state.notes
                                          }}
                                          appointmentObject={this.props.data}
                                          closeCallback={this.closeClick}
                                          refreshCallback={this.props.refreshCallback}
                                        />});
  }

  closeClick = () => {
    this.setState({enlargedAppointment: null});
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

    // if the object is too small to display the text, hide it
    if (this.props.data.duration < 200) return (<React.Fragment>
      <div className="appointment" style={this.style} onClick={this.click}>
        {(this.props.data.duration > 50) ? <p className="duration">{`${startHour}:${startMin} - ${endHour}:${endMin}`}</p> : null}
      </div>
      {this.state.enlargedAppointment}
    </React.Fragment>);


    return (
      <React.Fragment>
        <div className="appointment" style={this.style} onClick={this.click}>
          <p className="duration">{`${startHour}:${startMin} - ${endHour}:${endMin}`}</p>
          <div className="propertyList">
            <span>
              <p>Klas:</p>
              <p>{this.state.class}</p>
            </span>
            <span>
              <p>Docenten:</p>
              <p>
                {this.state.teacher1}
                {(this.state.teacher2 && this.state.teacher2) ? (", "+this.state.teacher2) : null}
              </p>
            </span>
            <span>
              <p>Lokalen:</p>
              <p>
                {this.state.classroom1}
                {(this.state.classroom1 && this.state.classroom2) ? (", "+this.state.classroom2) : null}
              </p>
            </span>
            <span>
              <p>Laptops:</p>
              <p>{this.state.laptops}</p>
            </span>
            <span>
              <p>Project:</p>
              <p>{this.state.project}</p>
            </span>
            <span>
              <p>Opmerking:</p>
              <p>{this.state.notes}</p>
            </span>
          </div>
        </div>
        {this.state.enlargedAppointment}
      </React.Fragment>
    );
  }
}

// https://codereview.stackexchange.com/a/33532
function getNextDayOfWeek(date, dayOfWeek) {
  var resultDate = new Date(date.getTime());
  resultDate.setDate(date.getDate() + (dayOfWeek - date.getDay()) % 7);
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
