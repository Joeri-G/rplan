import React, {Component} from 'react';
import API from '../axios-config';
// import Dropdown from './Dropdown';
import './css/ViewAppointment.css';


export default class ViewAppointment extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openModal: true,
      edit: false,
      class: null,
      classroom1: null,
      classroom2: null,
      teacher1: null,
      teacher2: null,
      project: null,
      notes: null
    }
  }

  async componentDidMount() {
    // now we're going to load all the data of the resources
    if (this.props.data.class)          this.loadResource('class', 'classes');
    if (this.props.data.classroom1)     this.loadResource('classroom1', 'classrooms');
    if (this.props.data.classroom2)     this.loadResource('classroom2', 'classrooms');
    if (this.props.data.teacher1)       this.loadResource('teacher1', 'teachers');
    if (this.props.data.teacher2)       this.loadResource('teacher2', 'teachers');
    if (this.props.data.project)        this.loadResource('project', 'projects');
    this.setState({
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

  edit = () => {
    alert('Working on it');
  }

  delete = () => {
    if (!window.confirm("Weet u zeker dat u deze afspraak wilt verwijderen? (Dit is kan niet ongedaan worden gemaakt)")) return;
    API.delete(`/appointments/${this.props.data.GUID}`).then((response)=>{
      this.props.refreshCallback();
      this.props.closeCallback();
    }).catch(error=>console.log);
  }

  modalContent = () => {
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
        <div className="appointmentModal" onClick={this.props.closeCallback}></div>
        <div className="appointmentModalContent">
          <p className="duration">{`${startHour}:${startMin} - ${endHour}:${endMin}`}</p>
          <div className="actionButtons">
            <button>
              <img src={`${process.env.PUBLIC_URL}/images/edit.svg`} alt="Edit" onClick={this.edit} />
            </button>
            <button>
              <img src={`${process.env.PUBLIC_URL}/images/closeBlack.svg`} alt="Delete" onClick={this.delete} />
            </button>
          </div>
          <div className="propertyList">
            <span>
              <p>Klas:</p>
              <p>{this.state.class}</p>
            </span>
            <span>
              <p>Docent:</p>
              <p>{this.state.teacher1}</p>
            </span>
            <span>
              <p>Extra Docent:</p>
              <p>{this.state.teacher2}</p>
            </span>
            <span>
              <p>Lokaal:</p>
              <p>{this.state.classroom1}</p>
            </span>
            <span>
              <p>Extra Lokaal:</p>
              <p>{this.state.classroom2}</p>
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
      </React.Fragment>
    );
  }

  render() {
    return (this.state.openModal) ? this.modalContent() : null
  }
}
