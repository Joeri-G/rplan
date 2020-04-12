<?php
namespace joeri_g\palweekplanner\v2\collections;
/**
 * Class with all classroom related actions.
 */
class Classrooms {
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

  private function list() {
    //check selector for validity
    if (!$this->request->checkSelector(6)) {
      http_response_code(400);
      return false;
    }
    //statement depends on selector
    //if wildcard return all classrooms
    if ($this->selector === "*") {
      //is user is admin return more data
      if ($_SESSION["userLVL"] >= 3) {
        $stmt = $this->conn->prepare("SELECT classroom, userCreate, lastChanged, GUID FROM classrooms");
      }
      else {
        $stmt = $this->conn->prepare("SELECT classroom, GUID FROM classrooms");
      }
    }
    else {
      //is user is admin return more data
      if ($_SESSION["userLVL"] >= 3) {
        $stmt = $this->conn->prepare("SELECT classroom, userCreate, lastChanged, GUID FROM classrooms WHERE GUID = :id LIMIT 1");
      }
      else {
        $stmt = $this->conn->prepare("SELECT classroom, GUID FROM classrooms WHERE GUID = :id LIMIT 1");
      }
      $stmt->bindParam("id", $this->selector);
    }
    $stmt->execute();
    $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);


    if (!$data) {
      ($this->selector === "*") ? $this->response->sendSuccess([]) : $this->response->sendError(7);
      return true;
    }
    ($this->selector === "*") ? $this->response->sendSuccess($data) : $this->response->sendSuccess($data[0]);
    return true;
  }

  private function add() {
    $keys = ["classroom"];
    if (!$this->request->POSTisset($keys)) {
      $this->response->sendError(8);
      return false;
    }

    $classroom = $_POST["classroom"];
    $userCreate = $_SESSION["GUID"];
    $GUID = $this->db->generateGUID();

    $stmt = $this->conn->prepare("INSERT INTO classrooms (classroom, userCreate, GUID) VALUES (:classroom, :userCreate, :GUID)");
    $data = [
      "classroom" => $classroom,
      "userCreate" => $userCreate,
      "GUID" => $GUID
    ];
    $stmt->execute($data);
    $data["lastChanged"] = date('Y-m-d H:i:s');
    $this->response->sendSuccess($data);
  }

  private function delete() {
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
      $stmt = $this->conn->prepare("TRUNCATE TABLE classrooms");
      $stmt->execute();
    }
    else {
      $stmt = $this->conn->prepare("DELETE FROM classrooms WHERE GUID = :GUID");
      $stmt->execute(["GUID" => $this->selector]);
    }
    $this->response->sendError(8);
  }

  public function update() {
    parse_str(file_get_contents("php://input"), $_PUT);
    //because the data is provided via a PUT request we cannot acces the data in the body through the $_POST variable and we have to manually parse and store it
    $keys = ["classroom"];
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
    //check if the user has sufficient permissions
    //we cannot update every classroom so a wildcard is not permitted
    if ($_SESSION["userLVL"] < 3 || $this->selector === "*") {
      $this->response->sendError(9);
      return false;
    }
    $classroom = $_PUT["classroom"];
    $userCreate = $_SESSION["GUID"];
    $GUID = $this->selector;
    $stmt = $this->conn->prepare("UPDATE classrooms SET classroom = :classroom, userCreate = :userCreate, lastChanged = current_timestamp WHERE GUID = :GUID");
    $data = [
      "classroom" => $classroom,
      "userCreate" => $userCreate,
      "GUID" => $GUID
    ];
    $stmt->execute($data);
    $data["lastChanged"] = date('Y-m-d H:i:s');
    $this->response->sendSuccess($data);
  }
}
