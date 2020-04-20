<?php
namespace joeri_g\palweekplanner\v2\lib;
/**
 * Handle an options request
 */
class sendAllowedMethods {
  function __construct(array $allowedMethods = ['GET', 'POST'], string $allowedOrigin = '*') {
    // Allow from any origin
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        // should do a check here to match $_SERVER['HTTP_ORIGIN'] to a
        // whitelist of safe domains
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');    // cache for 1 day
    }
    // Access-Control headers are received during OPTIONS requests
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
      // generate list of accepted methods
      $possiblemethods = ["GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH"];
      $allowed = "";
      foreach ($allowedMethods as $method) {
        // if the method is not in the spec skip it
        if (!in_array($method, $possiblemethods)) continue;
        // this means there is already a value in there and we should put a comma
        if (strlen($allowed) > 0) $allowed .= ", ";
        $allowed .= $method;
      }

        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
            header("Access-Control-Allow-Methods: $allowed");

        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
            header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

    }
  }
}
