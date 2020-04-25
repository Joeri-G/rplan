import React, {Component} from 'react';
import API from '../axios-config';

export default class ViewWeek extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentdate: new Date(),
      startdate: getNextDayOfWeek(new Date(), 1)
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
        <Datepicker dateCallback={null} />
        <Calendar startdate={this.state.startdate} currentdate={this.state.currentdate} />
      </React.Fragment>
    );
  }
}

class Datepicker extends Component {
  render() {
    return (
      <section className="datepicker">
        <h1>Datepicker</h1>
      </section>
    );
  }
}

class Calendar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      startdate: this.props.startdate,
      startdatestring: formatDate(this.props.startdate),
      enddate: getNextDayOfWeek(this.props.startdate, 5),
      enddatestring: formatDate(getNextDayOfWeek(this.props.startdate, 5))
    };
  }

  async componentDidMount() {
    API.get(`/appointments/${this.state.startdatestring}/${this.state.enddatestring}`).then((response) => {
      console.log(1);
    }).catch((error) => {
      console.log(2);
    });
  }


  render() {
    let appointments = [
      {s: 100, d: 200, id: "063c7451-5e78-4e2f-87be-5c62aa6193c5"},
      {s: 700, d: 150, id: "e5029f97-b859-4e3a-a0b4-724463c5d1bb"}
    ];
    return (
      <main className="viewWeek">
        <Day appointments={appointments} />
        <Day appointments={appointments} />
        <Day appointments={appointments} />
        <Day appointments={appointments} />
        <Day appointments={appointments} />
      </main>
    );
  }
}

class Day extends Component {
  constructor(props) {
    super(props);
    this.dayheight = getComputedStyle(document.documentElement).getPropertyValue('--day-height').slice(0, -2);
    this.dayheight = parseInt(this.dayheight, 10);
  }

  render() {
    return (
      <div className="day">
        {this.props.appointments.map((appointment) => {
          return <Appointment key={appointment.id} data={appointment} />
        })}
      </div>
    );
  }
}

class Appointment extends Component {
  constructor(props) {
    super(props);
    this.start = this.props.data.s;
    this.duration = this.props.data.d;
  }

  randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  render() {
    this.style = {
      marginTop: this.start.toString()+"px",
      height: this.duration.toString()+"px"
    };

    return (
      <div className="appointment" style={this.style}></div>
    );
  }
}

// https://codereview.stackexchange.com/a/33532
function getNextDayOfWeek(date, dayOfWeek) {
    // Code to check that date and dayOfWeek are valid left as an exercise ;)
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
