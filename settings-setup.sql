CREATE DATABASE `planner_settings`;
CREATE TABLE `plannerclients` (
	`domain` varchar(128) NOT NULL,
	`databaseName` varchar(128) NOT NULL,
	`lastChanged` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
	`active` TINYINT NOT NULL DEFAULT 0,
	`IP` varchar(64) NOT NULL COMMENT 'ip from where entry was added',
	`GUID` VARCHAR(36) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = latin1;
ALTER TABLE
  `plannerClients`
ADD
  PRIMARY KEY (`GUID`);
