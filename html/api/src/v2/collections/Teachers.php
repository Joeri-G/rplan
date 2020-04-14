<?php
namespace joeri_g\palweekplanner\v2\collections;
/**
 * Class with all teacher related actions
 */
class Teachers {
  private $selector;
  private $action;
  private $db;
  private $conn;

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
      case 'GET': //list all classes or select a specific one
        $this->list();
        break;

      case 'POST':  //add a class (admin)
        $this->add();
        break;

      case 'DELETE':  //delete one or all classes (admin)
        $this->delete();
        break;

      case 'PUT': //update a class (admin)
        $this->update();
        break;

      default:
        $this->response->sendError(11);
        break;
    }
  }

  public function list() {
    //check selector for validity
    if (!$this->request->checkSelector()) {
      $this->output = ["successful" => false, "error" => "Invalid selector"];
      http_response_code(400);
      return false;
    }
    //statement depends on selector
    //if wildcard return all classes
    if ($this->selector === "*") {
      //is user is admin return more data
      if ($_SESSION["userLVL"] >= 3) {
        $stmt = $this->conn->prepare("SELECT name, teacherAvailability, lastChanged, GUID FROM teachers ORDER BY name");
      }
      else {
        $stmt = $this->conn->prepare("SELECT name, teacherAvailability, GUID FROM teachers ORDER BY name");
      }
    }
    else {
      //is user is admin return more data
      if ($_SESSION["userLVL"] >= 3) {
        $stmt = $this->conn->prepare("SELECT name, teacherAvailability, lastChanged, GUID FROM teachers WHERE GUID = :id LIMIT 1");
      }
      else {
        $stmt = $this->conn->prepare("SELECT name, teacherAvailability, GUID FROM teachers WHERE GUID = :id LIMIT 1");
      }
      $stmt->bindParam("id", $this->selector);
    }
    $stmt->execute();
    $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);

    if (!$data) {
      //if the selector is a wildcard return an empty array, else return an error because the GUID does not exist
      ($this->selector === "*") ? $this->response->sendSuccess([]) : $this->response->sendError(7);
      return true;
    }
    foreach ($data as $i => $teacher) {
      $data[$i]["teacherAvailability"] = json_decode($teacher["teacherAvailability"]);
    }
    //if the selector is a wildcard return the array with the data, else return only the first item in the array
    ($this->selector === "*") ? $this->response->sendSuccess($data) : $this->response->sendSuccess($data[0]);
    return true;
  }

  public function add() {
    //make sure the neccesary data is provided
    $keys = ["name", "teacherAvailability"];
    if (!$this->request->POSTisset($keys)) {
    $this->response->sendError(8);
      return false;
    }
    //check the teacherAvailability must be array of 7 booleans
    $teacherAvailability = $_POST["teacherAvailability"];

    if (gettype($teacherAvailability) !== "array" || sizeof($teacherAvailability) !== 7) {
      $this->response->sendError(13);
      return false;
    }
    foreach ($teacherAvailability as $n => $day) {
      //HTTP makes everything a string so check if its a "1" or a "0"
      $teacherAvailability[$n] = ($day === "0" || $day === "1") ? true : false;
    }

    $teacherAvailability = json_encode($teacherAvailability);
    $name = $_POST["name"];
    $GUID = $this->db->generateGUID();


    $stmt = $this->conn->prepare("INSERT INTO teachers (name, teacherAvailability, GUID) VALUES (:name, :teacherAvailability, :GUID)");
    $data = [
      "name" => $name,
      "teacherAvailability" => $teacherAvailability,
      "GUID" => $GUID
    ];
    $stmt->execute($data);

    $data["lastChanged"] = date('Y-m-d H:i:s');
    $this->response->sendSuccess($data);
  }

  public function delete() {
    //check selector for validity
    if (!$this->request->checkSelector()) {
      $this->response->sendError(6);
      return false;
    }
    //check if the user has sufficient permissions
    if ($_SESSION["userLVL"] < 3) {
      $this->response->sendError(9);
      return false;
    }
    if ($this->selector == "*") {
      $stmt = $this->conn->prepare("TRUNCATE TABLE teachers");
      $stmt->execute();
    }
    else {
      $stmt = $this->conn->prepare("DELETE FROM teachers WHERE GUID = :GUID");
      $stmt->execute(["GUID" => $this->selector]);
    }
    $this->response->sendSuccess(null);
  }

  public function update() {
    parse_str(file_get_contents("php://input"), $_PUT);
    //because the data is provided via a PUT request we cannot acces the data in the body through the $_POST variable and we have to manually parse and store it
    $keys = ["name", "teacherAvailability"];
    if (!$this->request->PUTisset($keys)) {
      $this->response->sendError(8);
      return false;
    }
    //check selector for validity
    if (!$this->request->checkSelector()) {
      $this->response->sendError(6);
      return false;
    }
    //check if the user has sufficient permissions
    //we cannot update every classroom so a wildcard is not permitted
    if ($_SESSION["userLVL"] < 3 || $this->selector === "*") {
      $this->response->sendError(9);
      return false;
    }

    //make sure the teacherAvailability is valid
    $teacherAvailability = $_PUT["teacherAvailability"];

    if (gettype($teacherAvailability) !== "array" || sizeof($teacherAvailability) !== 7) {
      $this->response->sendError(13);
      return false;
    }
    foreach ($teacherAvailability as $n => $day) {
      //HTTP makes everything a string so check if its a "1" or a "0"
      $teacherAvailability[$n] = ($day === "0" || $day === "1") ? true : false;
    }
    $teacherAvailability = json_encode($teacherAvailability);
    $name = $_PUT["name"];
    $GUID = $this->selector;

    $stmt = $this->conn->prepare("UPDATE teachers SET name = :name, teacherAvailability = :teacherAvailability, lastChanged = current_timestamp WHERE GUID = :GUID");
    $data = [
      "name" => $name,
      "teacherAvailability" => $teacherAvailability,
      "GUID" => $GUID,
    ];
    $stmt->execute($data);
    //parse the JSON back to an array
    $data["teacherAvailability"] = json_decode($data["teacherAvailability"]);
    $data["lastChanged"] = date('Y-m-d H:i:s');
    $this->response->sendSuccess($data);
  }
}
