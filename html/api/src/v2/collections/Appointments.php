<?php
namespace joeri_g\palweekplanner\v2\collections;
/**
 * All appointment related actions
 */
class Appointments {

  function __construct($response = null, $db = null, $request = null) {
    if (is_null($response)) {
      echo "No response object provided";
      return false;
    }
    $this->response = $response;
    if (is_null($db) || is_null($db->conn)) {
      $this->response->sendError(1);
      return false;
    }
    $this->db = $db;
    $this->conn = $db->conn;

    if (is_null($request)) {
      $this->response->sendError(5);
      return false;
    }

    $this->request = $request;
    $this->action = $this->request->action;
    $this->selector = $this->request->selector;
    $this->selector2 = $this->request->selector2;

    if (is_null($this->selector)) {
      $this->response->sendError(6);
      return false;
    }
    switch ($this->action) {
      case 'GET': //list all appointments or select a specific one
        $this->list();
        break;

      case 'POST':  //add an appointment (admin)
        $this->add();
        break;

      case 'DELETE':  //delete one or all appointments (admin)
        $this->delete();
        break;

      case 'PUT': //update an appointment (admin)
        $this->update();
        break;

      default:
        $this->response->sendError(11);
        break;
    }
  }

  private function list() {

  }

  private function add() {

  }

  private function update() {

  }

  private function delete() {

  }

}
