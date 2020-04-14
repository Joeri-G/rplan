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
      $enddate = (isset($this->selector2)) ? $this->selector2 : null;
      return $this->listTimestamp($this->selector, $enddate);
    }
    elseif ($this->request->isValidGUID()) {
      return $this->listGUID($this->selector);
    }
    else {
      $this->response->sendError(17);
      return false;
    }
  }

  private function listTimestamp(string $start = "2000-01-01", string $end = null) {
    //determine wether we need to list the appointments of one day or a range of days
    if (!is_null($end) && $this->validateDate($end)) {
      //60 * 60 * 24 * 30 = 2592000
      if (strtotime($end) - strtotime($start) > 2592000) {
        $this->response->sendError(18);
        return false;
      }
      if (strtotime($end) - strtotime($start) <= 0) {
        $this->response->sendError(19);
        return false;
      }

      $stmt = $this->conn->prepare(
        "SELECT start, duration, teacher1, teacher2, class, classroom1, classroom2, project, notes, GUID
        FROM appointments
        WHERE DATE(start) >= :start AND DATE(start) <= :end
        ORDER BY start"
      );
      $stmt->execute([
        "start" => $start,
        "end" => $end
      ]);
    }
    else {
      $stmt = $this->conn->prepare(
        "SELECT start, duration, teacher1, teacher2, class, classroom1, classroom2, project, notes, GUID
        FROM appointments
        WHERE DATE(start) = :start
        ORDER BY start"
      );
      $stmt->execute([
        "start" => $start,
      ]);
    }
    $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    $this->response->sendSuccess($data);
    return true;
  }

  private function listGUID(string $GUID) {
    $stmt = $this->conn->prepare(
      "SELECT start, duration, teacher1, teacher2, class, classroom1, classroom2, project, notes
      FROM appointments
      WHERE GUID = :GUID"
    );
    $stmt->execute(["GUID" => $GUID]);
    $data = $stmt->fetch(\PDO::FETCH_ASSOC);
    if (!$data) {
      $this->response->sendError(7);
      return false;
    }
    $data["GUID"] = $GUID;
    $this->response->sendSuccess($data);
    return true;
  }

  private function add() {

  }

  private function update() {

  }

  private function delete() {

  }

}
