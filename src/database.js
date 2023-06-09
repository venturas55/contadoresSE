const mysql = require('mysql');
const { promisify } = require('util');
const { database } = require('./config'); //traigo el database desde el archivo
const { stringify } = require('querystring');
const pool = mysql.createPool(database);

pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('La conexion con la Database fue cerrada');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('La Database tiene demasiadas conexiones');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('database conexion fue rechazada');
        }
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('ACCESO denegado\n'+ stringify( database));
        }
    } else if (connection) {
        connection.release(); //con esto empieza la conexion
        console.log('DB is Connected');
    }
    return;
});

pool.config.connectionConfig.masterpass='$2a$10$Hfn1D1/vy2h6jLAvgVbZHuAbdUHWzSKr.Kb08mTB8a8wSRbZ9jHQ.';

//promisify pool queries. Convierte codigo de callbacks a codigo de promesas
pool.query = promisify(pool.query); //cada vez que haga una consulta, se podrán usar promesas.

module.exports = pool;

