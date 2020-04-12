-- BY JOERI GEUZINGE (https://www.joerigeuzinge.nl)
/*
maak database
*/
CREATE DATABASE planner_v2;
/*
planner -> week
  - daypart

  - docent1
  - docent2 | NONE

  - klas1jaar
  - klas1niveau
  - klas1nummer

  - klas2jaar
  - klas2niveau
  - klas2nummer

  - lokaal1
  - lokaal2 | NONE

  - laptops | NONE

  - notes | NONE


  - USER
  - TIME
  - IP


SQL:
*/
CREATE TABLE `appointments` (
  `starttime` timestamp(6) NOT NULL COMMENT 'start timestamp',
  `duration` int(11) NOT NULL COMMENT 'duration in minures',
  `docent1` varchar(16) NOT NULL,
  `docent2` varchar(16) NOT NULL,
  `class` varchar(16) NOT NULL,
  `lokaal1` varchar(16) NOT NULL,
  `lokaal2` varchar(16) NOT NULL,
  `laptops` int(4) NOT NULL COMMENT 'laptops',
  `projectCode` varchar(128) NOT NULL COMMENT 'projectCode',
  `notes` varchar(128) NOT NULL COMMENT 'notes',
  `USER` varchar(16) NOT NULL COMMENT 'user who added entry',
  `lastChanged` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `IP` varchar(64) NOT NULL COMMENT 'ip from where entry was added',
  `GUID` varchar(36) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = latin1;
ALTER TABLE
  `appointments`
ADD
  PRIMARY KEY (`GUID`);
/*
planner -> users
  - username
  - password
  - role
  - userLVL
  - lastLoginTime
  - lastLoginIP
  - GUID

SQL:
*/
CREATE TABLE `users` (
  `username` varchar(64) NOT NULL,
  `password` varchar(256) NOT NULL,
  /*`role` varchar(16) NOT NULL,*/
  `userLVL` int(1) NOT NULL,
  /*`userAvailability` varchar(64) NOT NULL,*/
  `lastLoginIP` varchar(64) NOT NULL,
  `lastLoginTime` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `lastChanged` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `GUID` varchar(36) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = latin1;
ALTER TABLE
  `users`
ADD
  PRIMARY KEY (`GUID`);

/*
planner -> docenten
*/
CREATE TABLE `teachers` (
  `name` varchar(16) NOT NULL,
  `teacherAvailability` varchar(64) NOT NULL,
  `lastChanged` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `GUID` varchar(36) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = latin1;
ALTER TABLE
  `teachers`
ADD
  PRIMARY KEY (`GUID`);

  /*
  planner -> klassen
    - jaar
    - niveau
    - klasnummer
    - created
    - GUID

  SQL:
  */
CREATE TABLE `classes` (
  `year` varchar(16) NOT NULL,
  `name` varchar(16) NOT NULL,
  `userCreate` varchar(36) NOT NULL COMMENT 'GUID of user that added the class',
  `lastChanged` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `GUID` varchar(36) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = latin1;
ALTER TABLE
  `classes`
ADD
  PRIMARY KEY (`GUID`);

/*
planner -> lokalen
  - lokaal
  - created
  - GUID
*/
CREATE TABLE `classrooms` (
  `classroom` varchar(16) NOT NULL,
  `userCreate` varchar(36) NOT NULL COMMENT 'GUID of user that added the class',
  `lastChanged` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `GUID` varchar(36) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = latin1;
ALTER TABLE
  `classrooms`
ADD
  PRIMARY KEY (`GUID`);
/*
planner -> deleted
Hier komen alle entries die verwijderd worden uit de table week
*/
CREATE TABLE `deleted` (
  `starttime` timestamp(6) NOT NULL COMMENT 'start timestamp',
  `duration` int(11) NOT NULL COMMENT 'duration in minures',
  `docent2` varchar(16) NOT NULL,
  `klas` varchar(16) NOT NULL,
  `lokaal1` varchar(16) NOT NULL,
  `lokaal2` varchar(16) NOT NULL,
  `laptops` varchar(32) NOT NULL,
  `projectCode` varchar(128) NOT NULL COMMENT 'projectCode',
  `notes` varchar(128) NOT NULL,
  `userCreate` varchar(36) NOT NULL COMMENT 'user who added original entry',
  `userDelete` varchar(36) NOT NULL COMMENT 'user who deleted original entry',
  `lastChanged` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `IP` varchar(64) NOT NULL COMMENT 'ip from where entry was deleted',
  `GUID` varchar(36) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = latin1;
ALTER TABLE
  `deleted`
ADD
  PRIMARY KEY (`GUID`);
/*
planner -> projectCodes
  - afkorting
  - beschrijving
  - USER
  - TIME
  - IP
  - GUID
*/
CREATE TABLE `projects` (
  `projectTitle` varchar(64) NOT NULL,
  `projectCode` varchar(6) NOT NULL,
  `projectDescription` TEXT NOT NULL,
  `projectInstruction` TEXT NOT NULL,
  `responsibleTeacher` varchar(64) NOT NULL,
  `user` varchar(64) NOT NULL,
  `lastChanged` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `IP` varchar(64) NOT NULL,
  `GUID` varchar(36) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = latin1;
ALTER TABLE
  `projects`
ADD
  PRIMARY KEY (`GUID`);
