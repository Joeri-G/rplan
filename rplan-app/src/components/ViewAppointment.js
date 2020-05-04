import React, {Component} from 'react';
// import API from '../axios-config';
// import Dropdown from './Dropdown';
import './css/ViewAppointment.css';


export default class ViewAppointment extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openModal: true
    }
  }
  modalContent = () => {
    return (
      <React.Fragment>
        <div className="appointmentModal" onClick={this.props.closeCallback}></div>
        <div className="appointmentModalContent">
          <p>TEST</p>
        </div>
      </React.Fragment>
    );
  }

  render() {
    return (this.state.openModal) ? this.modalContent() : null
  }
}
