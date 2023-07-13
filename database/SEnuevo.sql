drop database if exists contadoresSE;

create database contadoresSE;

use contadoresSE;

/ / NUM_SERIE zona CT REF ABONADO ubicacion OBS OBSFACT
SET
  SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

START TRANSACTION;

SET
  time_zone = "+00:00";

/*INICIO informacion ATON*/
drop table if exists abonado;

CREATE TABLE `abonado` (
  `id_abonado` int UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `nif` varchar(10) DEFAULT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `observacion` varchar(250) DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = 'tabla de abonado';

drop table if exists contadores;
CREATE TABLE `contadores` (
  `num_serie` varchar(25) PRIMARY KEY NOT NULL,
  `zona` varchar(50) DEFAULT NULL,
  `nombre` varchar(75) DEFAULT NULL,
  `ct` varchar(50) DEFAULT NULL,
  `ref` int(10),
  `ubicacion` varchar(100) DEFAULT NULL,
  `id_abonado` int UNSIGNED,
  CONSTRAINT `fk_cont_abon`
    FOREIGN KEY (id_abonado) REFERENCES abonado (id_abonado)
    ON DELETE CASCADE
    ON UPDATE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = 'tabla de contadores';

drop table if exists lecturas;
CREATE TABLE `lecturas` (
  `id_lectura` int UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `num_serie` varchar(25) NOT NULL,
  `fecha` date NOT NULL,
  `observaciones` varchar(250) default NULL,
  `lectura` decimal(10,2) DEFAULT NULL,
  CONSTRAINT fecha_unique UNIQUE (num_serie,fecha),
   CONSTRAINT `fk_lec_cont`
    FOREIGN KEY (num_serie) REFERENCES contadores (num_serie)
    ON DELETE CASCADE
    ON UPDATE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = 'tabla de lecturas';


drop table if exists observaciones;
CREATE TABLE `observaciones` (
  `id_observacion` int UNSIGNED NOT NULL,
  `num_serie` varchar(8) NOT NULL,
  `observaciones` varchar(250) NOT NULL,
     CONSTRAINT `fk_obs_cont`
    FOREIGN KEY (num_serie) REFERENCES contadores (num_serie)
    ON DELETE CASCADE
    ON UPDATE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = 'tabla de observaciones del balizamiento';

drop table if exists mantenimiento;

CREATE TABLE mantenimiento (
  id_mantenimiento int(10) UNSIGNED NOT NULL,
  num_serie varchar(20),
  fecha date NOT NULL,
  mantenimiento varchar(250) NOT NULL,
  FOREIGN KEY (num_serie) REFERENCES contadores(num_serie) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = 'tabla de mantenimiento de contadores';

/* DESCRIPCION DOCUMENTOS */
drop table if exists documentos;
CREATE TABLE `documentos` (
  `id_archivo` varchar(100) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `descripcion` varchar(250) DEFAULT NULL,
  `created_at` date NOT NULL DEFAULT current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = 'tabla de documentos';

/* USUARIOS y LOGS */
drop table if exists usuarios;
CREATE TABLE `usuarios` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `usuario` varchar(50) NOT NULL,
  `contrasena` varchar(250) NOT NULL,
  `email` varchar(200) DEFAULT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `privilegio` varchar(20) DEFAULT NULL,
  `pictureURL` varchar(100) CHARACTER SET utf16 COLLATE utf16_spanish2_ci DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = 'tabla de usuarios';

drop table if exists logs;
CREATE TABLE `logs` (
  `fecha` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `usuario` varchar(50) NOT NULL,
  `accion` varchar(100) DEFAULT NULL,
  `observacion` varchar(150) DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = 'tabla de logs';

drop table if exists tickets;

CREATE TABLE `tickets` (
  `ticket_id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `num_serie` varchar(20),
  `created_by_id` int(11) NOT NULL,
  `assigned_to_id` int(11) DEFAULT NULL,
  `resolved_by_id` int(11) DEFAULT NULL,
  `titulo` VARCHAR(255) NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `solved_at` TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (created_by_id) REFERENCES usuarios(id),
  FOREIGN KEY (assigned_to_id) REFERENCES usuarios(id),
  FOREIGN KEY (resolved_by_id) REFERENCES usuarios(id),
  FOREIGN KEY (num_serie) REFERENCES contadores(num_serie)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = 'tabla de tickets';

-- Inserta usuario "admin" con contraseña "admin"
INSERT INTO
  `usuarios` (
    `id`,
    `usuario`,
    `contrasena`,
    `email`,
    `full_name`,
    `privilegio`,
    `pictureURL`
  )
VALUES
  (
    1,
    'admin',
    '$2a$10$44RiEqgdwBZhtbd1rN6pfe/CLbTMpc4mGUPDiCgAlle0ISkMuJAC2',
    'admin@email.com',
    'Admin name',
    'admin',
    ''
  );

COMMIT;