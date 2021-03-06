CREATE DATABASE `planner_settings`;
CREATE TABLE `plannerclients` (
	`name` varchar(128) NOT NULL,
	`domain` varchar(128) NOT NULL,
	`db` varchar(128) NOT NULL,
	`db_user` VARCHAR(128),
	`db_password` VARCHAR(128),
	`db_host` VARCHAR(128),
	`lastChanged` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
	`active` TINYINT NOT NULL DEFAULT 0,
	`IP` varchar(64) NOT NULL COMMENT 'ip from where entry was added',
	`GUID` VARCHAR(36) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = latin1;
ALTER TABLE
  `plannerClients`
ADD
  PRIMARY KEY (`GUID`);
