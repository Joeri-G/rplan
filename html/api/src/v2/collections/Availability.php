<?php
namespace joeri_g\palweekplanner\v2\collections;
/**
 * Class to list all available resources in a given timeframe
 */
class Availability {
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
    $this->selector3 = $this->request->selector3;

    if (is_null($this->selector)) {
      $this->response->sendError(6);
      return false;
    }
    if ($this->action !== "GET") {
      $this->response->sendError(11);
    }

    // make sure both dates are valid
    if (!$this->validateDate($this->selector, 'Y-m-d_H:i') || !$this->validateDate($this->selector2, 'Y-m-d_H:i')) {
      $this->response->sendError(21);
      return;
    }

    $d1 = \DateTime::createFromFormat('Y-m-d_H:i', $this->selector);
    $d2 = \DateTime::createFromFormat('Y-m-d_H:i', $this->selector2);

    // make sure the first date is smaller than the second
    if ($d2->getTimestamp() <= $d1->getTimestamp()) {
      $this->response->sendError(21);
      return;
    }


    $this->startStamp = $d1->format('Y-m-d h:i');
    $this->endStamp = $d2->format('Y-m-d h:i');

    $this->list();
  }

  //modified answer from https://stackoverflow.com/a/12323025
  private function validateDate($date, $format = 'Y-m-d') {
    $d = \DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) == $date;
  }

  private function list() {
    $resp = new \stdClass;

    $resp->teachers = $this->teachers();
    $resp->classes = $this->classes();
    $resp->classrooms = $this->classrooms();

    $this->response->sendSuccess($resp);
  }
  private function teachers() {
    // This one is the most complicated one since we have to make sure the teacher is not already occupied and then we have to make usre the teacher is present
    $stmt = $this->conn->prepare(
      "SELECT name, teacherAvailability, GUID
      FROM teachers WHERE GUID NOT IN (
      SELECT teacher1 FROM `appointments` WHERE
      		(TIMESTAMP(start) < TIMESTAMP(:end) OR
          TIMESTAMP(endstamp) > TIMESTAMP(:start)) AND
          teacher1 IS NOT NULL
      ) AND GUID NOT IN (
        SELECT teacher2 FROM `appointments` WHERE
          (TIMESTAMP(start) < TIMESTAMP(:end) OR
          TIMESTAMP(endstamp) > TIMESTAMP(:start)) AND
          teacher2 IS NOT NULL
      )"
    );
    $stmt->execute([
      "start" => $this->startStamp,
      "end" => $this->endStamp
    ]);

    $not_occupied = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    $available = [];
    // get the day of the week so that we can match teacherAvailability against it
    $d = \DateTime::createFromFormat('Y-m-d_H:i', $this->selector);
    $dow = $d->format("N");  // https://www.php.net/manual/en/function.date.php for reference

    // make sure the teacher is available today
    foreach ($not_occupied as $teacher) {
      $teacher["teacherAvailability"] = json_decode(strtolower($teacher["teacherAvailability"]));
      if (isset($teacher["teacherAvailability"][$dow-1]) && $teacher["teacherAvailability"][$dow-1]) {
        array_push($available, $teacher);
      }
    }

    return $available;
  }
  private function classes() {
    $stmt = $this->conn->prepare(
      "SELECT year, name, GUID
      FROM classes WHERE GUID NOT IN (
      SELECT class FROM `appointments` WHERE
      		(TIMESTAMP(start) < TIMESTAMP(:end) OR
          TIMESTAMP(endstamp) > TIMESTAMP(:start)) AND
          class IS NOT NULL
      )"
    );

    $stmt->execute([
      "start" => $this->startStamp,
      "end" => $this->endStamp
    ]);
    return $stmt->fetchAll(\PDO::FETCH_ASSOC);
  }
  private function classrooms() {
    // modified from https://stackoverflow.com/questions/325933/determine-whether-two-date-ranges-overlap
    // Select matches from db.classrooms where the GUID does not occur in the classroom1 or classroom2 columns in the given timeframe
    $stmt = $this->conn->prepare(
      "SELECT classroom, GUID
      FROM classrooms WHERE GUID NOT IN (
      SELECT classroom1 FROM `appointments` WHERE
      		(TIMESTAMP(start) < TIMESTAMP(:end) OR
          TIMESTAMP(endstamp) > TIMESTAMP(:start)) AND
          classroom1 IS NOT NULL
      ) AND GUID NOT IN (
        SELECT classroom2 FROM `appointments` WHERE
          (TIMESTAMP(start) < TIMESTAMP(:end) OR
          TIMESTAMP(endstamp) > TIMESTAMP(:start)) AND
          classroom2 IS NOT NULL
      )"
    );

    $stmt->execute([
      "start" => $this->startStamp,
      "end" => $this->endStamp
    ]);
    return $stmt->fetchAll(\PDO::FETCH_ASSOC);
  }
}
