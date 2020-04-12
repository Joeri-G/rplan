<?php
namespace joeri_g\palweekplanner\v2\collections;
/**
 * Class with all class related actions.
 * Confusion imminent
 */
class Classes {
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
    //check selector for validity, can be a wildcard, GUID or year with yearSelector
    if (!$this->request->checkSelector() && !($this->selector === "year" && !is_null($this->selector2))) {
      $this->response->sendError(6);
      return false;
    }
    //statement depends on selector
    //if wildcard return all classes
    if ($this->selector === "*") {
      //is user is admin return more data
      if ($_SESSION["userLVL"] >= 3) {
        $stmt = $this->conn->prepare("SELECT year, name, userCreate, lastChanged, GUID FROM classes");
      }
      else {
        $stmt = $this->conn->prepare("SELECT year, name, GUID FROM classes");
      }
    }
    elseif ($this->selector === "year") {
      //year selector, return all classes where the year is equal to the 2nd selector
      if ($_SESSION["userLVL"] >= 3) {
        $stmt = $this->conn->prepare("SELECT year, name, userCreate, lastChanged, GUID FROM classes WHERE year = :year");
      }
      else {
        $stmt = $this->conn->prepare("SELECT year, name, GUID FROM classes WHERE year = :year");
      }
      $stmt->bindParam("year", $this->selector2);
    }
    else {
      //is user is admin return more data
      if ($_SESSION["userLVL"] >= 3) {
        $stmt = $this->conn->prepare("SELECT year, name, userCreate, lastChanged, GUID FROM classes WHERE GUID = :GUID LIMIT 1");
      }
      else {
        $stmt = $this->conn->prepare("SELECT year, name, GUID FROM classes WHERE GUID = :GUID LIMIT 1");
      }
      $stmt->bindParam("GUID", $this->selector);
    }
    $stmt->execute();
    $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);

    if (!$data && !($this->selector === "*" || $this->selector === "year")) {
      //if the selector is a wildcard or year selector return an empty array, else return an empty object
      $this->response->sendError(7);
      return true;
    }
    //if the selector is a wildcard return the array with the data, else return only the first item in the array
    $data = ($this->selector === "*" || $this->selector === "year") ? $data : $data[0];
    $this->response->sendSuccess($data);
  }

  private function add() {
    $keys = ["name", "year"];
    if (!$this->request->POSTisset($keys)) {
      $this->response->sendError(8);
      return false;
    }

    $name = $_POST["name"];
    $year = $_POST['year'];
    $userCreate = $_SESSION["GUID"];
    $GUID = $this->db->generateGUID();

    $stmt = $this->conn->prepare("INSERT INTO classes (name, year, userCreate, GUID) VALUES (:name, :year, :userCreate, :GUID)");

    $data = [
      "name" => $name,
      "year" => $year,
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
      $stmt = $this->conn->prepare("TRUNCATE TABLE classes");
      $stmt->execute();
    }
    else {
      $stmt = $this->conn->prepare("DELETE FROM classes WHERE GUID = :GUID");
      $stmt->execute(["GUID" => $this->selector]);
    }
    $this->response->sendSuccess(null);
  }

  public function update() {
    parse_str(file_get_contents("php://input"), $_PUT);
    //because the data is provided via a PUT request we cannot acces the data in the body through the $_POST variable and we have to manually parse and store it
    $keys = ["year", "name"];
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
    $name = $_PUT["name"];
    $year = $_PUT["year"];
    $userCreate = $_SESSION["GUID"];
    $GUID = $this->selector;
    $stmt = $this->conn->prepare("UPDATE classes SET name = :name, year = :year, userCreate = :userCreate, lastChanged = current_timestamp WHERE GUID = :GUID");
    $data = [
      "name" => $name,
      "year" => $year,
      "userCreate" => $userCreate,
      "GUID" => $GUID
    ];
    $stmt->execute($data);
    $data["lastChanged"] = date('Y-m-d H:i:s');
    $this->response->sendSuccess($data);
  }
}
