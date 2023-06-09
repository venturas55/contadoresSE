drop database if exists contadoresSE;

create database contadoresSE;

use contadoresSE;

SET
  SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

START TRANSACTION;

SET
  time_zone = "+00:00";

/*INICIO informacion ATON*/
CREATE TABLE `contadores` (
  `num_serie` varchar(20) PRIMARY KEY ,
  `observaciones` varchar(250) DEFAULT NULL,
  `ct` varchar(50) DEFAULT NULL,
  `ubicacion` varchar(20) DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = 'tabla de contadores';

CREATE TABLE `clientes` (
  `nif` varchar(10) PRIMARY KEY ,
  `nombre` varchar(100) DEFAULT NULL,
  `observaciones` varchar(250) DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = 'tabla de clientes';



CREATE TABLE `lecturas` (
  `id_lectura` int(10) UNSIGNED PRIMARY KEY,
  `num_serie` varchar(20) NOT NULL,
  `fecha` date NOT NULL,
  `observaciones` varchar(250) NOT NULL,
    FOREIGN KEY (num_serie) REFERENCES contadores(num_serie)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = 'tabla de lecturas de contadores';



/* DESCRIPCION DOCUMENTOS */
CREATE TABLE `documentos` (
  `id_archivo` varchar(100) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `descripcion` varchar(250) DEFAULT NULL,
  `created_at` date NOT NULL DEFAULT current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = 'tabla de documentos';

/* USUARIOS y LOGS */
CREATE TABLE `usuarios` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `usuario` varchar(50) NOT NULL,
  `contrasena` varchar(250) NOT NULL,
  `email` varchar(200) DEFAULT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `privilegio` varchar(20) DEFAULT NULL,
  `pictureURL` varchar(100) CHARACTER SET utf16 COLLATE utf16_spanish2_ci DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = 'tabla de usuarios';

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