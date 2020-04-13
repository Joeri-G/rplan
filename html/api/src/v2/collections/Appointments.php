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

  //modified answer from https://stackoverflow.com/a/12323025
  private function validateDate($date, $format = 'Y-m-d') {
    $d = \DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) == $date;
  }

  private function list() {
    //we can only list appointments in a specific timeframe to prevent complete chaos
    if ($this->validateDate($this->selector)) {
      //if a second date is set use that date as the end date
      //will come later
      $enddate = (isset($this->selector2)) ? $this->selector2 : null;
      $data = $this->listTimestamp($this->selector, $enddate);
    }
    elseif ($this->request->checkSelector()) {
      $data = $this->listGUID($this->selector);
    }
    else {
      $this->response->sendError(17);
      return false;
    }
    $this->response->sendSuccess($data);
  }

  private function listTimestamp(string $start = "2000-01-01", string $end = null) {
    //1 week = 60 * 60 * 24 * 7 = 604800
    $enddate = strtotime($start) + 604800;
    $enddate = date("Y-m-d", $enddate);
    //if an end date is supplied
    //make sure the range is not more than one month
    //60 * 60 * 24 * 30 = 2592000
    if (!is_null($end) && $this->validateDate($end) && (strtotime($end) - strtotime($start) <= 2592000)) {
      $enddate = $end;
    }

    $stmt = $this->conn->prepare(
      "SELECT start, duration, teacher1, teacher2, class, classroom1, classroom2, project, notes, GUID
      FROM appointments
      WHERE DATE(start) >= :start AND DATE(start) <= :end
      "
    );
    $stmt->execute([
      "start" => $start,
      "end" => $enddate
    ]);

    return $stmt->fetchAll(\PDO::FETCH_ASSOC);
  }

  private function listGUID(string $GUID) {
    return ["working on it"];
  }

  private function add() {

  }

  private function update() {

  }

  private function delete() {

  }

}
