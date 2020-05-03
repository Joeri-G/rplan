-- BY JOERI GEUZINGE (https://www.joerigeuzinge.nl)
/*
maak database
*/
CREATE DATABASE planner_v2;

CREATE TABLE `appointments` (
  `start` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6) NOT NULL COMMENT 'start timestamp',
  `endstamp` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6) NOT NULL COMMENT 'end timestamp',
  `teacher1` varchar(36),
  `teacher2` varchar(36),
  `class` varchar(36),
  `classroom1` varchar(36),
  `classroom2` varchar(36),
  `laptops` int(4) COMMENT 'laptops',
  `project` varchar(36) COMMENT 'projectCode',
  `notes` varchar(256) COMMENT 'notes',
  `USER` varchar(36) COMMENT 'user who added entry',
  `lastChanged` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  `IP` varchar(64) COMMENT 'ip from where entry was added',
  `GUID` varchar(36)
) ENGINE = InnoDB DEFAULT CHARSET = latin1;
ALTER TABLE
  `appointments`
ADD
  PRIMARY KEY (`GUID`);

CREATE TABLE `users` (
  `username` varchar(64) NOT NULL,
  `password` varchar(256) NOT NULL,
  `userLVL` int(1) NOT NULL,
  `api_key` varchar(64) NOT NULL,
  `lastLoginIP` varchar(64) NOT NULL,
  `lastLoginTime` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `lastChanged` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `GUID` varchar(36) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = latin1;
ALTER TABLE
  `users`
ADD
  PRIMARY KEY (`GUID`);

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


CREATE TABLE `settings` (
  `key` varchar(32) NOT NULL,
  `value` varchar(32) NOT NULL,
  `active` TINYINT DEFAULT 1,
  `user` varchar(64) NOT NULL,
  `lastChanged` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `IP` varchar(64) NOT NULL,
  `GUID` varchar(36) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = latin1;
ALTER TABLE
  `settings`
ADD
  PRIMARY KEY (`GUID`);
