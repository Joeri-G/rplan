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
    $this->selector3 = $this->request->selector3;

    if (is_null($this->selector)) {
      $this->response->sendError(6);
      return false;
    }
    switch ($this->action) {
      case 'GET': //list all appointments or select a specific one
        $this->list();
        break;

      case 'POST':  //add an appointment
        $this->add();
        break;

      case 'DELETE':  //delete one or all appointments
        $this->delete();
        break;
      //
      case 'PUT': //update an appointment
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
    // Only list appointments in a specific timeframe to prevent having to return 2000 rows
    if (!$this->validateDate($this->selector) && !$this->request->isValidGUID($this->selector)) {
      $this->response->sendError(17);
      return false;
    }

    if ($this->request->isValidGUID($this->selector)) {
      $this->listGUID($this->selector);
      return true;
    }


    if ($this->validateDate($this->selector2)) {
      if ($this->request->isValidGUID($this->selector3)) {
        // Return daterange with GUID
        $enddate = (isset($this->selector2)) ? $this->selector2 : null;
        $this->listTimestampGUID($this->selector, $enddate, $this->selector3);
        return true;
      }
      $enddate = (isset($this->selector2)) ? $this->selector2 : null;
      $this->listTimestamp($this->selector, $enddate);
      return true;
    }
  }

  private function listTimestampGUID(string $start = "2000-01-01", string $end = "2000-01-01", string $GUID = null) {
    if (!$this->validateDate($start) || !$this->validateDate($end) || !$this->request->isValidGUID($GUID)) {
      $this->response->sendError(20);
      return false;
    }
    // check if a filter has been given else, look in every field
    if (!isset($_GET['f']) || !in_array($_GET['f'], ['class', 'classroom', 'project', 'teacher', 'GUID'])) {
      $stmt = $this->conn->prepare(
        "SELECT start, endstamp, teacher1, teacher2, class, classroom1, classroom2, project, laptops, notes, GUID
        FROM appointments
        WHERE DATE(start) >= :start AND DATE(start) <= :end AND (
          teacher1 = :g OR teacher1 = :g OR teacher2 = :g OR class = :g OR classroom1 = :g OR classroom2 = :g OR project = :g OR GUID = :g
        ) ORDER BY start"
      );
    }
    else {
      switch ($_GET['f']) {
        case 'class':
          $filter = 'class = :g';
          break;
        case 'classroom':
          $filter = 'classroom1 = :g OR classroom2';
          break;
        case 'project':
          $filter = 'project = :g';
          break;
        case 'teacher':
          $filter = 'teacher1 = :g OR teacher2 = :g';
          break;
        case 'GUID':
          $filter = 'GUID = :g';
          break;
        default:
          break;
      }
      $stmt = $this->conn->prepare( // this is safe-ish since we checked $filter against a list of known-safe values
        "SELECT start, endstamp, teacher1, teacher2, class, classroom1, classroom2, project, laptops, notes, GUID
        FROM appointments
        WHERE DATE(start) >= :start AND DATE(start) <= :end AND ($filter)
        ORDER BY start"
      );
    }
    $stmt->execute([
      "g" => $GUID,
      "start" => $start,
      "end" => $end
    ]);
    $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    $this->response->sendSuccess($data);
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
        "SELECT start, endstamp, teacher1, teacher2, class, classroom1, classroom2, project, laptops, notes, GUID
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
        "SELECT start, endstamp, teacher1, teacher2, class, classroom1, classroom2, project, laptops, notes, GUID
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
      "SELECT start, endstamp, teacher1, teacher2, class, classroom1, classroom2, project, laptops, notes
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
    if ($_SESSION['userLVL'] < 2) {
      $this->response->sendError(9);
      return;
    }
    // yay, lots of input checks
    // make sure the values are set
    if (!$this->checkPost([
      'class',
      'classroom1',
      'classroom2',
      'teacher1',
      'teacher2',
      'project',
      'laptops',
      'note',
      'start',
      'end'
    ])) {
      $this->response->sendError(8);
      return;
    }

    // if the given value is not a valid GUID make it null
    $class = ($this->request->isValidGUID($_POST['class'])) ? $_POST['class'] : null;
    $classroom1 = ($this->request->isValidGUID($_POST['classroom1'])) ? $_POST['classroom1'] : null;
    $classroom2 = ($this->request->isValidGUID($_POST['classroom2'])) ? $_POST['classroom2'] : null;
    $teacher1 = ($this->request->isValidGUID($_POST['teacher1'])) ? $_POST['teacher1'] : null;
    $teacher2 = ($this->request->isValidGUID($_POST['teacher2'])) ? $_POST['teacher2'] : null;
    $project = ($this->request->isValidGUID($_POST['project'])) ? $_POST['project'] : null;
    $laptops = ((int) $_POST['laptops'] > 0) ? $_POST['laptops'] : 0;
    $note = ($_POST['note'] !== 'null') ? $_POST['note'] : "";

    $start = $_POST['start'];
    $end = $_POST['end'];

    $GUID = $this->db->generateGUID();

    // make sure the appointment contains a project and a teacher or class
    if (!$project || !($class || $teacher1 || $teacher2)) {
      $this->response->sendError(23);
      return;
    }

    // replace _ in input
    $start = str_replace('_', ' ', $start);
    $end = str_replace('_', ' ', $end);

    // do input checks

    $s = \DateTime::createFromFormat('Y-m-d H:i', $start);
    $e = \DateTime::createFromFormat('Y-m-d H:i', $end);
    // make sure the first date is smaller than the second
    if (!$s|| !$e || $e->getTimestamp() <= $s->getTimestamp()) {


      $this->response->sendError(21);
      return;
    }

    // load settings
    $settings = $this->db->loadSettings();

    // check for startHour and endHour
    $starthour = (isset($settings['startHour'])) ? (int) $settings['startHour']['value'] : 0;
    $endhour = (isset($settings['endHour'])) ? (int) $settings['endHour']['value'] : 0;

    if ((int)$s->format('G') < $starthour || (int)$e->format('G') >= $endhour) {
      $this->response->sendError(22);
      return;
    }

    // make sure the resources are available
    if ($class && !$this->checkClassAvailability($start, $end, $class)) {
      $this->response->sendError(27); // have to write a specific error
      return;
    }

    if (($classroom1 || $classroom2) && !$this->checkClassroomAvailability($start, $end, $classroom1, $classroom2)) {
      $this->response->sendError(28); // have to write a specific error
      return;
    }

    if (($teacher1 || $teacher2) && !$this->checkTeacherAvailability($start, $end, $teacher1, $teacher2)) {
      $this->response->sendError(26); // have to write a specific error
      return;
    }

    if ($project && !$this->checkProject($start, $end, $project)) {
      $this->response->sendError(29); // have to write a specific error
      return;;
    }

    if ($laptops && !$this->checkLaptopAvailability($start, $end, (int) $laptops, (int) $settings['totalLaptops']['value'])) {
      $this->response->sendError(25); // have to write a specific error
      return;
    }

    $stmt = $this->conn->prepare(
      "INSERT INTO appointments (
        start,
        endstamp,
        teacher1,
        teacher2,
        class,
        classroom1,
        classroom2,
        laptops,
        project,
        notes,
        USER,
        IP,
        GUID
      ) VALUES (
        :start,
        :endstamp,
        :teacher1,
        :teacher2,
        :class,
        :classroom1,
        :classroom2,
        :laptops,
        :project,
        :notes,
        :USER,
        :IP,
        :GUID
      )"
    );

    $stmt->execute([
      'start' => $start,
      'endstamp' => $end,
      'teacher1' => $teacher1,
      'teacher2' => $teacher2,
      'class' => $class,
      'classroom1' => $classroom1,
      'classroom2' => $classroom2,
      'laptops' => $laptops,
      'project' => $project,
      'notes' => $note,
      'USER' => $_SESSION['GUID'],
      'IP' => $_SERVER['REMOTE_ADDR'],
      'GUID' => $GUID
    ]);

    $data = [
      'start' => $start,
      'endstamp' => $end,
      'teacher1' => $teacher1,
      'teacher2' => $teacher2,
      'class' => $class,
      'classroom1' => $classroom1,
      'classroom2' => $classroom2,
      'laptops' => $laptops,
      'project' => $project,
      'notes' => $note,
      'GUID' => $GUID
    ];

    $this->response->sendSuccess($data);
    return true;
  }

  private function update() {
    if ($_SESSION['userLVL'] < 2) {
      $this->response->sendError(9);
      return;
    }

    if (!$this->request->isValidGUID($this->selector)) {
      $this->response->sendError(17);
      return;
    }

    $GUID = $this->selector;

    parse_str(file_get_contents("php://input"), $_PUT);
    if (!$this->checkPUT([
      'class',
      'classroom1',
      'classroom2',
      'teacher1',
      'teacher2',
      'project',
      'laptops',
      'note',
      'start',
      'end'
    ])) {
      $this->response->sendError(8);
      return;
    }

    // if the given value is not a valid GUID make it null
    $class = ($this->request->isValidGUID($_PUT['class'])) ? $_PUT['class'] : null;
    $classroom1 = ($this->request->isValidGUID($_PUT['classroom1'])) ? $_PUT['classroom1'] : null;
    $classroom2 = ($this->request->isValidGUID($_PUT['classroom2'])) ? $_PUT['classroom2'] : null;
    $teacher1 = ($this->request->isValidGUID($_PUT['teacher1'])) ? $_PUT['teacher1'] : null;
    $teacher2 = ($this->request->isValidGUID($_PUT['teacher2'])) ? $_PUT['teacher2'] : null;
    $project = ($this->request->isValidGUID($_PUT['project'])) ? $_PUT['project'] : null;
    $laptops = ((int) $_PUT['laptops'] > 0) ? $_PUT['laptops'] : 0;
    $note = ($_PUT['note'] !== 'null') ? $_PUT['note'] : "";

    $start = $_PUT['start'];
    $end = $_PUT['end'];

    // replace _ in input
    $start = str_replace('_', ' ', $start);
    $end = str_replace('_', ' ', $end);

    // make sure the appointment contains a project and a teacher or class
    if (!$project || !($class || $teacher1 || $teacher2)) {
      $this->response->sendError(23);
      return;
    }

    // do input checks

    $s = \DateTime::createFromFormat('Y-m-d H:i', $start);
    $e = \DateTime::createFromFormat('Y-m-d H:i', $end);
    // make sure the first date is smaller than the second

    if (!$s|| !$e || $e->getTimestamp() <= $s->getTimestamp()) {
      $this->response->sendError(21);
      return;
    }

    // load settings
    $settings = $this->db->loadSettings();

    // check for startHour and endHour
    $starthour = (isset($settings['startHour'])) ? (int) $settings['startHour']['value'] : 0;
    $endhour = (isset($settings['endHour'])) ? (int) $settings['endHour']['value'] : 0;

    if ((int)$s->format('G') < $starthour || (int)$e->format('G') >= $endhour) {
      $this->response->sendError(22);
      return;
    }

    // make sure the resources are available
    if ($class && !$this->checkClassAvailability($start, $end, $class, $GUID)) {
      $this->response->sendError(27); // have to write a specific error
      return;
    }

    if (($classroom1 || $classroom2) && !$this->checkClassroomAvailability($start, $end, $classroom1, $classroom2, $GUID)) {
      $this->response->sendError(28); // have to write a specific error
      return;
    }

    if (($teacher1 || $teacher2) && !$this->checkTeacherAvailability($start, $end, $teacher1, $teacher2, $GUID)) {
      $this->response->sendError(26); // have to write a specific error
      return;
    }

    if ($project && !$this->checkProject($start, $end, $project, $GUID)) {
      $this->response->sendError(29); // have to write a specific error
      return;;
    }

    if ($laptops && !$this->checkLaptopAvailability($start, $end, (int) $laptops, (int) $settings['totalLaptops']['value'], $GUID)) {
      $this->response->sendError(25); // have to write a specific error
      return;
    }

    $stmt = $this->conn->prepare(
      'UPDATE appointments
      SET start = :start, endstamp = :endstamp, teacher1 = :teacher1, teacher2 = :teacher2,
          class = :class, classroom1 = :classroom1, classroom2 = :classroom2, laptops = :laptops,
          project = :project, notes = :notes, USER = :USER, lastChanged = current_timestamp, IP = :IP
      WHERE GUID = :GUID'
    );

    $stmt->execute([
      'start' => $start,
      'endstamp' => $end,
      'teacher1' => $teacher1,
      'teacher2' => $teacher2,
      'class' => $class,
      'classroom1' => $classroom1,
      'classroom2' => $classroom2,
      'laptops' => $laptops,
      'project' => $project,
      'notes' => $note,
      'USER' => $_SESSION['GUID'],
      'IP' => $_SERVER['REMOTE_ADDR'],
      'GUID' => $GUID
    ]);


    $data = [
      'start' => $start,
      'endstamp' => $end,
      'teacher1' => $teacher1,
      'teacher2' => $teacher2,
      'class' => $class,
      'classroom1' => $classroom1,
      'classroom2' => $classroom2,
      'laptops' => $laptops,
      'project' => $project,
      'notes' => $note,
      'GUID' => $GUID
    ];

    $this->response->sendSuccess($data);
    return true;
  }

  private function delete() {
    // make sure the user has the required permissions
    if ($_SESSION['userLVL'] < 2) {
      $this->response->sendError(9);
      return;
    }

    if (!$this->request->isValidGUID($this->selector)) {
      $this->response->sendError(7);
      return;
    }

    $stmt = $this->conn->prepare('DELETE FROM appointments WHERE GUID = :GUID');
    $stmt->execute(['GUID' => $this->selector]);
    $this->response->sendSuccess(null);
  }

  private function checkPost($keys = []) {
    foreach ($keys as $key) {
      if (!isset($_POST[$key]))
        return false;
    }
    return true;
  }

  private function checkPUT($keys = []) {
    parse_str(file_get_contents("php://input"), $_PUT);
    foreach ($keys as $key) {
      if (!isset($_PUT[$key]))
        return false;
    }
    return true;
  }

  private function checkClassAvailability($start, $end, $class, $currentAppointment = null) {
    // select class that matches GUID and is not in timeframe
    $stmt = $this->conn->prepare(
      'SELECT 1 FROM classes WHERE
      GUID = :GUID AND
      GUID IN (
        SELECT class FROM appointments WHERE
        TIMESTAMP(start) >= TIMESTAMP(:start) AND
        TIMESTAMP(start) <= TIMESTAMP(:end) AND
        class = :GUID
      )'
    );

    if ($currentAppointment) {
      $stmt = null;
      $stmt = $this->conn->prepare(
        'SELECT 1 FROM classes WHERE
        GUID = :GUID AND
        GUID IN (
          SELECT class FROM appointments WHERE
          TIMESTAMP(start) >= TIMESTAMP(:start) AND
          TIMESTAMP(start) <= TIMESTAMP(:end) AND
          class = :GUID AND
          GUID != :curr
        )'
      );
    }

    $stmt->execute([
      'GUID' => $class,
      'start' => $start,
      'end' => $end,
      'curr' => $currentAppointment
    ]);
    if ($stmt->rowCount() > 0) { // if the rowcount is > 0 we found a match in this timeframe
      return false;
    }
    return true;
  }

  private function checkClassroomAvailability($start, $end, $classroom1, $classroom2, $currentAppointment = null) {
    $stmt = $this->conn->prepare(
      'SELECT 1 FROM classrooms WHERE
      (GUID = :c1 OR GUID = :c2) AND
      (GUID IN (
        SELECT classroom1 FROM appointments WHERE
        TIMESTAMP(start) >= TIMESTAMP(:start) AND
        TIMESTAMP(start) <= TIMESTAMP(:end) AND
        classroom1 = :c1
      ) OR GUID IN (
        SELECT classroom2 FROM appointments WHERE
        TIMESTAMP(start) >= TIMESTAMP(:start) AND
        TIMESTAMP(start) <= TIMESTAMP(:end) AND
        classroom2 = :c2
      ))'
    );

    if ($currentAppointment) {
      $stmt = null;
      $stmt = $this->conn->prepare(
        'SELECT 1 FROM classrooms WHERE
        (GUID = :c1 OR GUID = :c2) AND
        (GUID IN (
          SELECT classroom1 FROM appointments WHERE
          TIMESTAMP(start) >= TIMESTAMP(:start) AND
          TIMESTAMP(start) <= TIMESTAMP(:end) AND
          classroom1 = :c1 AND
          GUID != :curr
        ) OR GUID IN (
          SELECT classroom2 FROM appointments WHERE
          TIMESTAMP(start) >= TIMESTAMP(:start) AND
          TIMESTAMP(start) <= TIMESTAMP(:end) AND
          classroom2 = :c2 AND
          GUID != :curr
        ))'
      );
    }

    $stmt->execute([
      'c1' => $classroom1,
      'c2' => $classroom2,
      'start' => $start,
      'end' => $end,
      'curr' => $currentAppointment
    ]);

    if ($stmt->rowCount() > 0)// if the rowcount is > 0 we found a match in this timeframe
      return false;
    return true;
  }

  private function checkTeacherAvailability($start, $end, $teacher1, $teacher2, $currentAppointment = "Empty") {
    // for this one we not only have to make sure the teacher is not occupied, but also that he is available that day

    $stmt = $this->conn->prepare(
      'SELECT teacherAvailability FROM teachers WHERE
      (GUID = :t1 OR GUID = :t2) AND
      (GUID NOT IN (
        SELECT teacher1 FROM appointments WHERE
        TIMESTAMP(start) >= TIMESTAMP(:start) AND
        TIMESTAMP(start) <= TIMESTAMP(:end) AND
        teacher1 = :t1
      ) OR GUID NOT IN (
        SELECT teacher2 FROM appointments WHERE
        TIMESTAMP(start) >= TIMESTAMP(:start) AND
        TIMESTAMP(start) <= TIMESTAMP(:end) AND
        teacher2 = :t2
      ))'
    );

    if ($currentAppointment) {
      $stmt = null;
      $stmt = $this->conn->prepare(
        'SELECT teacherAvailability FROM teachers WHERE
        (GUID = :t1 OR GUID = :t2) AND
        (GUID NOT IN (
          SELECT teacher1 FROM appointments WHERE
          TIMESTAMP(start) >= TIMESTAMP(:start) AND
          TIMESTAMP(start) <= TIMESTAMP(:end) AND
          teacher1 = :t1 AND
          GUID != :curr
        ) OR GUID NOT IN (
          SELECT teacher2 FROM appointments WHERE
          TIMESTAMP(start) >= TIMESTAMP(:start) AND
          TIMESTAMP(start) <= TIMESTAMP(:end) AND
          teacher2 = :t2 AND
          GUID != :curr
        ))'
      );
    }

    $stmt->execute([
      't1' => $teacher1,
      't2' => $teacher2,
      'start' => $start,
      'end' => $end,
      'curr' =>  $currentAppointment
    ]);
    if ($stmt->rowCount() === 0) // if the rowcount is 0 we found a match in this timeframe
      return false;
    $teachers = $stmt->fetchAll(\PDO::FETCH_ASSOC); // decode to a boolean array
    // get day of week
    $dobj = \DateTime::createFromFormat('Y-m-d H:i', $start);
    if (!$dobj) return false;
    $dow = ((int)$dobj->format("N")) - 1; // https://www.php.net/manual/en/function.date.php for reference
    foreach ($teachers as $teacher) {
      $availability = json_decode(strtolower($teacher['teacherAvailability']));
      if (!isset($availability[$dow]) || !$availability[$dow])
        return false;
    }
    return true;
  }

  private function checkProject($start, $end, $project, $currentAppointment = "Empty") {
    $stmt = $this->conn->prepare('SELECT 1 FROM projects WHERE GUID = :GUID');
    $stmt->execute(['GUID' => $project]);
    if ($stmt->rowCount() === 0) {
      return false;
    }
    return true;
  }

  private function checkLaptopAvailability($start, $end, $laptops, $totalLaptops, $currentAppointment = "Empty") {
    // list every appointment in the timeframe
    $stmt = $this->conn->prepare(
      'SELECT laptops FROM appointments WHERE
        DATE(start) >= DATE(:start) AND
        DATE(start) <= DATE(:end) AND
        GUID != :curr'
    );
    $stmt->execute([
      'start' => $start,
      'end' => $end,
      'curr' => $currentAppointment
    ]);
    $takenLaptops = ($laptops < 0) ? 0 : $laptops; // make sure its not a negative int
    $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    foreach ($data as $d) {
      if (!$d['laptops']) continue;
      $takenLaptops += (int) $d['laptops'];
    }
    return ($takenLaptops <= $totalLaptops);
  }
}
