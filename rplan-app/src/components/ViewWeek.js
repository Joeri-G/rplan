import React, {Component} from 'react';
import API from '../axios-config';

export default class ViewWeek extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentdate: new Date(),
      startdate: getNextDayOfWeek(new Date(), 1),
      target: '17c7d684-cda2-41ed-924d-e58fa7282571'
    };
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
        <Datepicker dateCallback={null} selectorCallback={null} />
        <Calendar startdate={this.state.startdate} currentdate={this.state.currentdate} target={this.state.target} />
      </React.Fragment>
    );
  }
}

class Datepicker extends Component {
  render() {
    return (
      <section className="datepicker">
        <h1>Datepicker, Class/Teacher And Settings</h1>
      </section>
    );
  }
}

class Calendar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      appointments: []
    };
  }

  async componentDidMount() {
    let startdatestring = formatDate(this.props.startdate);
    let enddatestring = formatDate(getNextDayOfWeek(this.props.startdate, 5));
    API.get(`/appointments/${startdatestring}/${enddatestring}/${this.props.target}`).then((response) => {
      if (response.data.succesfull) this.setState({appointments: response.data.response});
    }).catch((error) => {
      // blah blah, error handling and stuff
    });
  }

  calcPxOffset = (start, end) => {
    let startHour = 8;
    let endHour = 18;
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
      duration: pxValues.duration,
      GUID: ap.GUID
    };
    return data;
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
          <Day appointments={appointments[0]} day={formatDate(getNextDayOfWeek(this.props.startdate, 1))} />
          <Day appointments={appointments[1]} day={formatDate(getNextDayOfWeek(this.props.startdate, 2))} />
          <Day appointments={appointments[2]} day={formatDate(getNextDayOfWeek(this.props.startdate, 3))} />
          <Day appointments={appointments[3]} day={formatDate(getNextDayOfWeek(this.props.startdate, 4))} />
          <Day appointments={appointments[4]} day={formatDate(getNextDayOfWeek(this.props.startdate, 5))} />
        </div>
      </main>
    );
  }
}

class Day extends Component {
  click = () => {
    alert(`You just pressed day ${this.props.day}`);
  }
  render() {
    // this is a quick hack to allow for different onClicks
    return (
      <section>
        <div className="dayCover">
          {this.props.appointments.map((appointment) => {
            return <Appointment key={appointment.GUID} data={appointment} />
          })}
        </div>
        <div className="day" onClick={this.click}></div>
      </section>
    );
  }
}

class Appointment extends Component {
  randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  click = () => {
    alert(`You just pressed appointment ${this.props.data.GUID}`);
  }

  render() {
    this.style = {
      marginTop: this.props.data.start.toString()+"px",
      height:  this.props.data.duration.toString()+"px"
    };

    return (
      <div className="appointment" style={this.style} onClick={this.click}></div>
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
