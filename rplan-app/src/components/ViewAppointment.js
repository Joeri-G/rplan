import React, {Component} from 'react';
import API from '../axios-config';
import Dropdown from './Dropdown';
// import Dropdown from './Dropdown';
import './css/ViewAppointment.css';


export default class ViewAppointment extends Component {
  constructor(props) {
    super(props);

    let s = this.props.appointmentObject.startTimestamp;
    let e = this.props.appointmentObject.endTimestamp

    let formattedStatetime = `${s.slice(0, 10)}_${s.slice(11, 16)}`;
    let formattedEndtime = `${e.slice(0, 10)}_${e.slice(11, 16)}`;
    this.state = {
      // load the data of the appointment into the state
      openModal: true,
      edit: false,
      message: null,
      startTime: formattedStatetime,
      endTime: formattedEndtime,
      GUID: this.props.appointmentObject.GUID,
      class: this.props.appointmentObject.class,
      classroom1: this.props.appointmentObject.classroom1,
      classroom2: this.props.appointmentObject.classroom2,
      teacher1: this.props.appointmentObject.teacher1,
      teacher2: this.props.appointmentObject.teacher2,
      project: this.props.appointmentObject.project,
      laptops: this.props.appointmentObject.laptops,
      note: this.props.appointmentObject.notes,
      availability: {
        "classrooms": [],
        "teachers": [],
        "classes": []
      },
      projects: []
    }
    this.updateSelected = this.updateSelected.bind(this);
  }

  edit = () => {
    this.setState({
      edit: true
    });
  }

  delete = () => {
    if (!window.confirm("Weet u zeker dat u deze afspraak wilt verwijderen?")) return;
    API.delete(`/appointments/${this.props.data.GUID}`).then((response)=>{
      this.props.refreshCallback();
      this.props.closeCallback();
    }).catch((error)=>console.log(error));
  }

  requestAvailableResources = () => {
    let start = this.props.data.startTimestamp;
    let end = this.props.data.endTimestamp;

    let statStamp = `${start.slice(0,10)}_${start.slice(11,16)}`;
    let endStamp = `${end.slice(0,10)}_${end.slice(11,16)}`;
    API.get(`/availability/${statStamp}/${endStamp}`).then((response) => {
      if (!response.data) return;
      let resp = response.data.response;
      // now we need to sanatize the data and put it into objects the <Dropwdown /> can use
      let availability = {
        "classrooms": resp.classrooms.map((data) => {
          return {
            text: data.name,
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
      this.setState({
        availability: availability
      });
    }).catch((error) => {
      console.log(error);
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

  updateSelected = (e) => {
    let kvlist = { // list of key value pairs that map ids to values
      classInputEdit: 'class',
      teacher1InputEdit: 'teacher1',
      teacher2InputEdit: 'teacher2',
      classroom1InputEdit: 'classroom1',
      classroom2InputEdit: 'classroom2',
      projectInputEdit: 'project'
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
      laptopInputEdit: 'laptops',
      notesInputEdit: 'note'
    };
    let value = e.target.value;
    let id = e.target.id;
    if (!kvlist[id]) return
    let obj = {};
    obj[kvlist[id]] = value;
    this.setState(obj);
  }

  modalEdit = () => {
    return (
      <div className="editOptions">
        <div className="propertyInput">
          <Dropdown
            ID="classInputEdit"
            data={this.state.availability.classes}
            title="Klas"
            default={{text: "Klas", value: null}}
            valuechange={this.updateSelected}
            nodefault={false}
          />
          <Dropdown
            ID="projectInputEdit"
            data={this.state.projects}
            title="Project"
            default={{text: "Project", value: null}}
            valuechange={this.updateSelected}
            nodefault={false}
          />
          <Dropdown
            ID="teacher1InputEdit"
            data={this.state.availability.teachers}
            title="Docent"
            default={{text: "Docent", value: null}}
            valuechange={this.updateSelected}
            nodefault={false}
          />
          <Dropdown
            ID="teacher2InputEdit"
            data={this.state.availability.teachers}
            title="Extra Docent"
            default={{text: "Extra Docent", value: null}}
            valuechange={this.updateSelected}
            nodefault={false}
          />
          <Dropdown
            ID="classroom1InputEdit"
            data={this.state.availability.classrooms}
            title="Lokaal"
            default={{text: "Lokaal", value: null}}
            valuechange={this.updateSelected}
            nodefault={false}
          />
          <Dropdown
            ID="classroom2InputEdit"
            data={this.state.availability.classrooms}
            title="Extra Lokaal"
            default={{text: "Extra Lokaal", value: null}}
            valuechange={this.updateSelected}
            nodefault={false}
          />
          <input type="number" placeholder="Laptops" id="laptopInputEdit" onChange={this.updateInp} />
          <input type="text" placeholder="Opmerkingen" id="notesInputEdit" onChange={this.updateInp} />
        </div>
        <div className="editInputs">
        </div>
        <button className="propertyInputContinue" onClick={this.updateAppointment}>Opslaan</button>
      </div>
    );
  }

  updateAppointment = () => {
    let c = encodeURIComponent(this.state.class);
    let c1 = encodeURIComponent(this.state.classroom1);
    let c2 = encodeURIComponent(this.state.classroom2);
    let t1 = encodeURIComponent(this.state.teacher1);
    let t2 = encodeURIComponent(this.state.teacher2);
    let p = encodeURIComponent(this.state.project);
    let l = encodeURIComponent(this.state.laptops);
    let n = encodeURIComponent(this.state.note);

    let s = encodeURIComponent(this.state.startTime);
    let e = encodeURIComponent(this.state.endTime);

    if (!this.state.class && (!this.state.teacher1 && !this.state.teacher2)) {
      this.setState({message: "Tenminste 1 klas of docent is verplicht"});
      return;
    }

    if (!this.state.project) {
      this.setState({message: "Project is verplicht"});
      return;
    }

    let post = `class=${c}&classroom1=${c1}&classroom2=${c2}&teacher1=${t1}&teacher2=${t2}&project=${p}&laptops=${l}&note=${n}&start=${s}&end=${e}`;

    API.put(`/appointments/${this.state.GUID}`, post).then((resp) => {
      this.props.refreshCallback();
      this.props.closeCallback();
    }).catch((error) => {
      console.log(error);
      this.setState({message: error.response.data.error});
    });
  }

  modalContent = () => {
    return (
      <div className="propertyList">
        <span>
          <p>Klas:</p>
          <p>{this.props.data.class}</p>
        </span>
        <span>
          <p>Docent:</p>
          <p>{this.props.data.teacher1}</p>
        </span>
        <span>
          <p>Extra Docent:</p>
          <p>{this.props.data.teacher2}</p>
        </span>
        <span>
          <p>Lokaal:</p>
          <p>{this.props.data.classroom1}</p>
        </span>
        <span>
          <p>Extra Lokaal:</p>
          <p>{this.props.data.classroom2}</p>
        </span>
        <span>
          <p>Laptops:</p>
          <p>{this.props.data.laptops}</p>
        </span>
        <span>
          <p>Project:</p>
          <p>{this.props.data.project}</p>
        </span>
        <span>
          <p>Opmerking:</p>
          <p>{this.props.data.notes}</p>
        </span>
      </div>
    );
  }

  editToggle = () => {
    if (this.state.edit)
      return <img src={`${process.env.PUBLIC_URL}/images/enlarge.svg`} alt="View" onClick={()=>this.setState({edit: false})} />;
    return <img src={`${process.env.PUBLIC_URL}/images/edit.svg`} alt="Edit" onClick={()=>{
      this.setState({edit: true})
      this.requestAvailableResources();
    }} />
  }

  render() {
    let content = null;

    if (this.state.openModal && !this.state.edit) content = this.modalContent();
    if (this.state.openModal && this.state.edit) content = this.modalEdit();

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
              {this.editToggle()}
            </button>
            <button>
              <img src={`${process.env.PUBLIC_URL}/images/closeBlack.svg`} alt="Delete" onClick={this.delete} />
            </button>
          </div>
          {(this.state.message) ? <p className="message">{this.state.message}</p> : null}
          {content}
        </div>
      </React.Fragment>
    );
  }
}
