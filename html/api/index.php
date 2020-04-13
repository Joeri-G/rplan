<?php
require_once __DIR__ . '/vendor/autoload.php';  //load all scripts in src/
use joeri_g\palweekplanner\v2 as v2;

//set constants
define("acceptedMethods", ["GET", "POST", "PUT", "DELETE"]); //all the accepted HTTP Request Methods
define("versions", ["v2"]); //all supported api versions
define("allowedCollections", ["classes", "classrooms", "teachers", "projects", "laptops", "admin", "users", "config", "appointments"]); //allowed collections
define("tables", ["classes", "classrooms", "users", "deleted", "appointments", "projects", "teachers", "users"]);
define("collectionException", ["admin", "conf"]);
//start response handler
$response = new v2\lib\ResponseHandler();
//load error messages
$response->loadErrors(__DIR__."/error-en.json");
//test request on validity
$request = new v2\lib\RequestActions();
$request->allowedVersionPrefixes = versions;
$request->acceptedMethods = acceptedMethods;
$request->allowedCollections = allowedCollections;
$request->collectionException = collectionException;

$request->init();

if (!$request->verifyRequest()) {
  $response->sendError(14);
  die();
}

$db = new v2\lib\Database($response);
$db->tables = tables;

if (!$db->connect($errmode = 2)) {
  die();
}

$auth = new v2\lib\authCheck($response, $db);
if (!$auth->check(3)) {
  header("WWW-Authenticate: Basic ream=\"Authentication is required to use this API\"");
  $response->sendError(10);
  die();
}

switch ($request->collection) {
  case 'classes':
    $collection = new v2\collections\Classes($response, $db, $request);
    break;
  case 'classrooms':
    $collection = new v2\collections\Classrooms($response, $db, $request);
    break;
  case 'users':
    $collection = new v2\collections\Users($response, $db, $request);
    break;
  case 'teachers':
    $collection = new v2\collections\Teachers($response, $db, $request);
    break;
  case 'projects':
    $collection = new v2\collections\Projects($response, $db, $request);
    break;
  case 'appointments':
    $collection = new v2\collections\Appointments($response, $db, $request);
    break;


  default:
    $response->sendError(16);
    die();
    break;
}
