<?php
namespace joeri_g\palweekplanner\v2\lib;

/**
 * Object with all request related actions
 */
class RequestActions {
  public $method;
  public $version;
  public $collection;
  public $selector = "*";
  public $allowedVersionPrefixes = ["v1", "v2"];
  public $allowedMethods = ["GET", "POST", "PUT", "DELETE"];
  public $allowedCollections = ["users", "admin"];
  public $collectionException = [];
  public $selector2 = null;

  private $parts = [];

  function __construct() {
    $this->init();
  }

  //function to initiate all variables after constants have been set
  public function init() {
    $this->method = strtoupper($_SERVER["REQUEST_METHOD"]); //request method, POST, GET, PUT, etc.
    $this->action = ($this->checkMethod()) ? $this->method : null;
    $this->parts = $this->rExplode();
    //place URL parts in variables
    if (count($this->parts) > 0) {
      $this->version = $this->parts[0];
    }
    if (count($this->parts) > 1) {
      $this->collection = $this->parts[1];
    }
    if (count($this->parts) > 2) {
      $this->selector = $this->parts[2];
    }
    if (count($this->parts) > 3) {
      $this->selector2 = $this->parts[3];
    }
  }

  public function checkMethod() {
    if (!in_array($this->method, $this->allowedMethods)) {
      return false;
    }
    return true;
  }

  public function POSTisset($keys = []) {
    //quick and fast function to check if a bunch of POST keys have been set
    foreach ($keys as $key) {
      if (!isset($_POST[$key])) {
        return false;
      }
    }
    return true;
  }

  public function PUTisset($keys = []) {
    parse_str(file_get_contents("php://input"), $_PUT);
    //quick and fast function to check if a bunch of PUT variables have been set
    foreach ($keys as $key) {
      if (!isset($_PUT[$key])) {
        return false;
      }
    }
    return true;
  }

  public function rExplode() {
    //funtion used to split the request URL in an array that can be used by the api to determine the execution steps
    $req = $_SERVER["REQUEST_URI"]; //path sent in the request
    $path = $_SERVER["PHP_SELF"];   //actual script path relative to web root

    $reqSplit = explode("/", $req);
    //make sure the last variable is not an empty string
    while (empty(end($reqSplit))) {
      $reqSplit = array_splice($reqSplit, 0, -1);
    }
    $pathSplit = explode("/", $path);
    $reqOffset = count($pathSplit) - 1;
    //return the parts of the request after the api root in an array
    //example.com/public/scripts/api/foo/bar -> ["foo", "bar"]
    return array_splice($reqSplit, $reqOffset);
  }

  public function verifyStructure() {
    foreach ($this->parts as $i=>$part) {
      if (strlen($part) < 1) {
        return false;
      }
    }
    return (
              (in_array($this->collection, $this->allowedCollections) && count($this->parts) >= 2) ||
              in_array($this->collection, $this->collectionException)
            ) ? true : false;
  }

  public function checkVersion() {
    //check if the specifier api version is in the list of allowed version prefixes. This lsit can be changed throught the public variable $allowedVersionPrefixes
    return (in_array($this->version, $this->allowedVersionPrefixes)) ? true : false;
  }

  public function verifyRequest() {
    //if the method is correct, the version is correct and the url is structured correctly, go ahead
    return ($this->checkMethod() && $this->checkVersion() && $this->verifyStructure()) ? true : false;
  }

  public function checkSelector() {
    if (!preg_match("^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}^", $this->selector) && $this->selector !== "*") {
      return false;
    }
    return true;
  }
}
