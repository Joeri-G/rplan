<?php
namespace joeri_g\palweekplanner\v2\collections;
/**
 * return user data
 */
class Userdata {
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
      case 'GET':
        $this->list();
        break;
      //
      // case 'POST':
      //   $this->add();
      //   break;
      //
      // case 'DELETE':
      //   $this->delete();
      //   break;
      //
      // case 'PUT':
      //   $this->update();
      //   break;

      default:
        $this->response->sendError(11);
        break;
    }
  }
  private function list() {
    $data = [
      "username" => $_SESSION['username'],
      "userLVL" => $_SESSION['userLVL'],
      "api_key" => $_SESSION['api_key'],
      "GUID" => $_SESSION['GUID']
    ];
    $this->response->sendsuccess($data);
  }
}
