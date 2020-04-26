<?php
require_once __DIR__ . '/vendor/autoload.php';  //load all scripts in src/
use joeri_g\palweekplanner\v2 as v2;

//set constants
define("allowedMethods", ["GET", "POST", "PUT", "DELETE", "OPTIONS"]); //all the accepted HTTP Request Methods
define("versions", ["v2"]); //all supported api versions
define("allowedCollections", ["classes", "classrooms", "teachers", "projects", "laptops", "admin", "users", "config", "appointments"]); //allowed collections
define("tables", ["classes", "classrooms", "users", "deleted", "appointments", "projects", "teachers", "users"]);
define("collectionException", ["conf", "login", "userdata"]);
//start response handler
$response = new v2\lib\ResponseHandler();
//load error messages
$response->setErrorFile(__DIR__."/error-en.json");
//test request on validity
$request = new v2\lib\RequestActions();
$request->allowedVersionPrefixes = versions;
$request->allowedMethods = allowedMethods;
$request->allowedCollections = allowedCollections;
$request->collectionException = collectionException;

$request->init();

if (!$request->verifyRequest()) {
  $response->sendError(14);
  die();
}
// send headers
new v2\lib\sendAllowedMethods(allowedMethods);

$db = new v2\lib\Database($response);
$db->tables = tables;

if (!$db->connect($errmode = 2)) {
  die();
}

$auth = new v2\lib\authCheck($response, $db);
if (!$auth->check()) {
  if ($request->method === "OPTIONS") die();
  if ($request->collection === "conf" && $request->selector === 'clients') {
    new v2\collections\Conf($response, $db, $request);
    die();
  }
  header("WWW-Authenticate: Basic ream=\"Authentication is required to use this API\"");
  $response->sendError(10);
  die();
}

switch ($request->collection) {
  case 'classes':
    new v2\collections\Classes($response, $db, $request);
    break;
  case 'classrooms':
    new v2\collections\Classrooms($response, $db, $request);
    break;
  case 'users':
    new v2\collections\Users($response, $db, $request);
    break;
  case 'teachers':
    new v2\collections\Teachers($response, $db, $request);
    break;
  case 'projects':
    new v2\collections\Projects($response, $db, $request);
    break;
  case 'appointments':
    new v2\collections\Appointments($response, $db, $request);
    break;
  case 'login':
    new v2\collections\Userdata($response, $db, $request);
    break;
  case 'userdata':
    new v2\collections\Userdata($response, $db, $request);
    break;
  case 'conf':
    new v2\collections\Conf($response, $db, $request);
    break;
  default:
    $response->sendError(16);
    die();
    break;
}
