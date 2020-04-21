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
    $stmt = $this->conn->prepare("SELECT username, userLVL, api_key FROM users WHERE GUID = :GUID");
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
    $_SESSION['api_key'] = $data["api_key"];
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
    $stmt = $this->conn->prepare("SELECT password, api_key, userLVL, GUID FROM users WHERE username = :username");
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
    $_SESSION['api_key'] = $data["api_key"];
    $this->userLVL = $data["userLVL"];

    return true;
  }

  /**
 * Get header Authorization
 * */
  function getAuthorizationHeader() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
      $headers = trim($_SERVER["Authorization"]);
    }
    else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { //Nginx or fast CGI
      $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
      $requestHeaders = apache_request_headers();
      // Server-side fix for bug in old Android versions (a nice side-effect of this fix means we don't care about capitalization for Authorization)
      $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
      //print_r($requestHeaders);
      if (isset($requestHeaders['Authorization'])) {
        $headers = trim($requestHeaders['Authorization']);
      }
    }
    return $headers;
  }
  /**
  * get access token from header
  * */
  function getBearerToken() {
    $headers = $this->getAuthorizationHeader();
    // HEADER: Get the access token from the header
    if (!empty($headers)) {
      if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
        return $matches[1];
      }
    }
    return null;
  }

  private function checkBearerToken() {
    // make sure a bearere token is provided
    $token = $this->getBearerToken();
    if (is_null($token)) return false;
    $stmt = $this->conn->prepare('SELECT username, userLVL, GUID FROM users WHERE api_key = :key');
    $stmt->execute([
      'key' => $token
    ]);
    //check if user has been found
    if ($stmt->rowCount() !== 1) {
      return false;
    }
    $data = $stmt->fetch(\PDO::FETCH_ASSOC);

    $_SESSION[$this->loggedinkey] = true;
    $_SESSION['username'] = $data["username"];
    $_SESSION['userLVL'] = $data["userLVL"];
    $_SESSION['GUID'] = $data["GUID"];
    $_SESSION['api_key'] = $token;
    $this->userLVL = $data["userLVL"];

    //update ip
    $stmt = null;
    $stmt = $this->conn->prepare("UPDATE users SET lastLoginTime = current_timestamp, lastLoginIP = :ip WHERE GUID = :GUID");
    $stmt->execute(
      ["ip" => $_SERVER['REMOTE_ADDR'],
      "GUID" => $_SESSION["GUID"]]
    );
    return true;
  }

  public function check() {
  if ($this->checkHeader() || $this->checkSession() || $this->checkBearerToken()) {
      return true;
    }
    return false;
  }
}
