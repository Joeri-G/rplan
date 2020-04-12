<?php
namespace joeri_g\palweekplanner\v2\lib;
/*
* function to check if user is authenticated via either a cookie bound to the sessionid or a Authorization header in the request
 */
class AuthCheck {
  public $userLVL = 0;
  public $methods;

  private $conn;
  private $db;

  function __construct(ResponseHandler $response = null, Database $db = null, string $loggedinkey = "loggedin") {
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

    $this->loggedinkey = $loggedinkey;
  }

  private function checkSession() {
    //check if a session has been started already
    if (session_status() == PHP_SESSION_NONE) {
      session_start();
    }
    //check if the session contains a loggedin key
    if (!isset($_SESSION[$this->loggedinkey]) || !$_SESSION[$this->loggedinkey]) {
      return false;
    }
    //update session data
    $stmt = $this->conn->prepare("SELECT username, userLVL FROM users WHERE GUID = :GUID");
    $stmt->execute(["GUID" => $_SESSION["GUID"]]);
    //check if user has been found

    //check if user has been found
    if ($stmt->rowCount() !== 1) {
      return false;
    }
    $data = $stmt->fetch(\PDO::FETCH_ASSOC);
    //update ip
    $stmt = null;
    $stmt = $this->conn->prepare("UPDATE users SET lastLoginTime = current_timestamp, lastLoginIP = :ip WHERE GUID = :GUID");
    $stmt->execute(
      ["ip" => $_SERVER['REMOTE_ADDR'],
      "GUID" => $_SESSION["GUID"]]
    );

    $_SESSION[$this->loggedinkey] = true;
    $_SESSION['username'] = $data["username"];
    $_SESSION['userLVL'] = $data["userLVL"];
    $_SESSION['GUID'] = $_SESSION["GUID"];
    $this->userLVL = $data["userLVL"];
    return true;
  }

  private function checkHeader() {
    //first, check if an authorization header has been provided
    if (!isset($_SERVER['PHP_AUTH_USER'])) {
      return false;
    }
    //check username and password in headers
    $username = $_SERVER['PHP_AUTH_USER'];
    $password = $_SERVER['PHP_AUTH_PW'];

    //make sure the supplied authentication is not longer then 512 chars to prevent slowing down the service
    if (strlen($username) > 512 || strlen($password) > 512) {
      return false;
    }

    //sql query, select data where username = $username
    $stmt = $this->conn->prepare("SELECT password, userLVL, GUID FROM users WHERE username = :username");
    $stmt->execute(["username" => $username]);
    //check if user has been found
    if ($stmt->rowCount() !== 1) {
      return false;
    }

    //check if user has been found
    if ($stmt->rowCount() !== 1) {
      return false;
    }
    $data = $stmt->fetch(\PDO::FETCH_ASSOC);

    //check password
    if (!password_verify($password, $data["password"])) {
      return false;
    }

    //update ip
    $stmt = null;
    $stmt = $this->conn->prepare("UPDATE users SET lastLoginTime = current_timestamp, lastLoginIP = :ip WHERE GUID = :GUID");
    $stmt->execute(
      ["ip" => $_SERVER['REMOTE_ADDR'],
      "GUID" => $data['GUID']]
    );
    if ($stmt->rowCount() !== 1) {
      return false;
    }
    if (session_status() == PHP_SESSION_NONE) {
      session_start();
    }
    $_SESSION[$this->loggedinkey] = true;
    $_SESSION['userLVL'] = $data["userLVL"];
    $_SESSION['username'] = $username;
    $_SESSION['GUID'] = $data["GUID"];
    $this->userLVL = $data["userLVL"];

    return true;
  }

  public function check($methods = 3) {
    switch ($methods) {
      case 1:
        return $this->checkSession();
        break;
      case 2:
        return$this->checkHeader();
        break;
      case 3:
        if ($this->checkHeader() || $this->checkSession()) {
          return true;
        }
        return false;
        break;
      default:
        return false;
        break;
    }

  }
}
