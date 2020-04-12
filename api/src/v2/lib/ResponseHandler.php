<?php
namespace joeri_g\palweekplanner\v2\lib;
/*
 * object that handles all responses
 */
class ResponseHandler {
  //variable that holds all errors
  private $error;
  //default response
  private $response;
  function __construct() {
    $this->loadErrors();
    $this->response = [
      "succesfull" => false,
      "error" =>  $this->error[0]["msg"],
      "code" => 0
    ];
  }

  public function loadErrors(string $path = null) {
    if ($path === null || !file_exists($path)) $path = __DIR__."/error.json";
    $errorfile = json_decode(file_get_contents($path));
    $this->error = [];

    foreach ($errorfile as $n => $err) {
      $index = (isset($err->id)) ? $err->id : $n;
      $this->error[$index] = [
        "http" => $err->http,
        "msg" => $err->msg
      ];
    }
  }

  public function sendError(int $err = 0) {
    if (!isset($this->error[$err])) $err = 0;
    $this->response = [
      "succesfull" => false,
      "error" => $this->error[$err]["msg"],
      "code" => $err
    ];
    http_response_code($this->error[$err]["http"]);
    return $this->sendResponse();
  }

  public function sendSuccess($resp) {
    http_response_code(200);
    $this->response = [
      "succesfull" => true,
      "response" => $resp
    ];
    return $this->sendResponse();
  }

  public function setError(int $id, string $msg, int $http) {
    $this->error[$id] = [
      "id" => $id,
      "msg" => $msg,
      "http" => $http
    ];
  }

  private function sendResponse() {
    //set headers
    header('Content-Type: application/json');
    try {
      echo json_encode($this->response);
    }
    catch (\Exception $e) {
      echo json_encode(["succesfull" => false, "error" => "Could not parse response\n$e", "code" => 1]);
      return false;
    }
    return true;
  }

}
