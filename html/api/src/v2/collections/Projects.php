<?php
namespace joeri_g\palweekplanner\v2\collections;
/**
 * Class with all project related actions.
 */
class Projects {
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
    if (!$this->request->checkSelector()) {
      $this->response->sendError(6);
      return false;
    }
    //statement depends on selector
    //if wildcard return all projects
    if ($this->selector === "*") {
      //is user is admin return more data
      if ($_SESSION["userLVL"] >= 3) {
        $stmt = $this->conn->prepare("SELECT projectTitle, projectCode, projectDescription, projectInstruction, responsibleTeacher, user, lastChanged, IP, GUID FROM projects ORDER BY projectTitle");
      }
      else {
        $stmt = $this->conn->prepare("SELECT projectTitle, projectCode, projectDescription, projectInstruction, responsibleTeacher, GUID FROM projects ORDER BY projectTitle");
      }
    }
    else {
      //is user is admin return more data
      if ($_SESSION["userLVL"] >= 3) {
        $stmt = $this->conn->prepare("SELECT projectTitle, projectCode, projectDescription, projectInstruction, responsibleTeacher, user, lastChanged, IP, GUID FROM projects WHERE GUID = :id LIMIT 1");
      }
      else {
        $stmt = $this->conn->prepare("SELECT projectTitle, projectCode, projectDescription, projectInstruction, responsibleTeacher, GUID FROM projects WHERE GUID = :id LIMIT 1");
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
    $keys = ["projectTitle", "projectCode", "projectDescription", "projectInstruction", "responsibleTeacher"];
    if (!$this->request->POSTisset($keys)) {
      $this->response->sendError(8);
      return false;
    }

    $projectTitle = $_POST["projectTitle"];
    $projectCode = $_POST["projectCode"];
    $projectDescription = $_POST["projectDescription"];
    $projectInstruction = $_POST["projectInstruction"];
    $responsibleTeacher = $_POST["responsibleTeacher"];
    $user = $_SESSION["GUID"];
    $IP = $_SERVER['REMOTE_ADDR'];
    $GUID = $this->db->generateGUID();


    if (!$this->checkProjectData($projectTitle, $projectCode)) {
      $this->response->sendError(12);
      return false;
    }


    $stmt = $this->conn->prepare("INSERT INTO projects (projectTitle, projectCode, projectDescription, projectInstruction, responsibleTeacher, user, IP, GUID)
    VALUES (:projectTitle, :projectCode, :projectDescription, :projectInstruction, :responsibleTeacher, :user, :IP, :GUID)");


    $data = [
      "projectTitle" => $projectTitle,
      "projectCode" => $projectCode,
      "projectDescription" => $projectDescription,
      "projectInstruction" => $projectInstruction,
      "responsibleTeacher" => $responsibleTeacher,
      "user" => $user,
      "IP" => $IP,
      "GUID" => $GUID
    ];
    $stmt->execute($data);

    $data["lastChanged"] = date('Y-m-d H:i:s');
    $this->output = ["successful" => true, "data" => $data];
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
      $stmt = $this->conn->prepare("TRUNCATE TABLE projects");
      $stmt->execute();
    }
    else {
      $stmt = $this->conn->prepare("DELETE FROM projects WHERE GUID = :GUID");
      $stmt->execute(["GUID" => $this->selector]);
    }
    $this->response->sendSuccess(null);
  }

  public function update() {
    parse_str(file_get_contents("php://input"), $_PUT);
    //because the data is provided via a PUT request we cannot acces the data in the body through the $_POST variable and we have to manually parse and store it
    $keys = ["projectTitle", "projectCode", "projectDescription", "projectInstruction", "responsibleTeacher"];
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
    //we cannot update every project so a wildcard is not permitted
    if ($_SESSION["userLVL"] < 3 || $this->selector === "*") {
      $this->response->sendError(9);
      return false;
    }


    $projectTitle = $_PUT["projectTitle"];
    $projectCode = $_PUT["projectCode"];
    $projectDescription = $_PUT["projectDescription"];
    $projectInstruction = $_PUT["projectInstruction"];
    $responsibleTeacher = $_PUT["responsibleTeacher"];
    $user = $_SESSION["GUID"];
    $IP = $_SERVER['REMOTE_ADDR'];
    $GUID = $this->selector;

    if (!$this->checkProjectData($projectTitle, $projectCode, $GUID)) {
      $this->response->sendError(12);
      return false;
    }

    $stmt = $this->conn->prepare("UPDATE projects SET
      projectTitle = :projectTitle,
      projectCode = :projectCode,
      projectDescription = :projectDescription,
      projectInstruction = :projectInstruction,
      responsibleTeacher = :responsibleTeacher,
      user = :user,
      lastChanged = current_timestamp,
      IP = :IP
      WHERE GUID = :GUID");
    $data = [
      "projectTitle" => $projectTitle,
      "projectCode" => $projectCode,
      "projectDescription" => $projectDescription,
      "projectInstruction" => $projectInstruction,
      "responsibleTeacher" => $responsibleTeacher,
      "user" => $user,
      "IP" => $IP,
      "GUID" => $GUID
    ];
    $stmt->execute($data);

    $data["lastChanged"] = date('Y-m-d H:i:s');
    $this->response->sendSuccess($data);
  }

  private function checkProjectData($PT = null, $PC = null, $GUID = "") {
    $stmt = $this->conn->prepare("SELECT 1 FROM projects WHERE (projectTitle = :PT OR projectCode = :PC) AND GUID != :GUID");
    $stmt->execute(["PT" => $PT, "PC" => $PC, "GUID" => $GUID]);
    //if we get a hit return false
    return ($stmt->rowCount() > 0) ? false : true;
  }

}
