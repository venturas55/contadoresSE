const express = require('express');
const router = express.Router();
const path = require('path');
const db = require("../database"); //db hace referencia a la BBDD
const funciones = require("../lib/funciones.js");
const fs = require('fs').promises;
const queryContadores = "SELECT * from contadores c";
const queryLecturas = "SELECT * from lecturas l";
var moment = require('moment'); // require
moment().format();
//MOSTRAR PAGINA PRUEBA
router.get('/prueba', (req, res) => {
    res.render('prueba');
});


//CRUD CONTADOR read
router.get("/list", async (req, res) => {
    const contadores = await db.query(queryContadores);

    const tickets = await db.query("select * from tickets where solved_at IS NULL");
    //console.log(tickets);
    contadores.forEach((element) => {
        const hasItem = tickets.some(obj => obj.nif === element.nif);
        if (hasItem)
            element.hasTicket = true;
    });
    res.render("contadores/list", { contadores });

});
router.get("/list/:busqueda", async (req, res) => {
    var { busqueda } = req.params;
    var contadores;
    if (busqueda === 'Ext') {
        //console.log("Externas");
        balizas = await db.query(queryListadoAton + " where b.nif=lo.nif AND lo.puerto not like '%valencia%' and lo.puerto not like '%sagunto%' and lo.puerto not like '%gandia%' order by lo.nif");
    } else {
        busqueda = "%" + busqueda + "%";
        balizas = await db.query(queryListadoAton + " where b.nif=lo.nif AND lo.puerto like ? order by lo.nif", busqueda);
        //like is case insensitive por defecto. En caso de quererlo sensitivo hay que añadir solo "like binary"
    }

    //Añado la info de los tickets
    const tickets = await db.query("select * from tickets where solved_at IS NULL");
    //console.log(tickets);
    balizas.forEach((element) => {
        const hasItem = tickets.some(obj => obj.nif === element.nif);
        if (hasItem)
            element.hasTicket = true;
    });

    res.render("aton/list", { balizas });
    // NO FUNCIONA CON LA BARRA DELANTE res.render('/links/list');
});


//GESTION CRUD lecturas
router.post("/add", funciones.isAuthenticated, funciones.hasSanPrivileges, async (req, res) => {
    const {
        num_serie,
        fecha,
        lectura,
    } = req.body;
    const mant = {
        num_serie,
        fecha,
        lectura,
    };
    try {
        var ultLectura = await db.query("select * from lecturas WHERE num_serie = ? order by fecha desc", [num_serie]);
        console.log(ultLectura[0]);
        if (ultLectura[0].lectura > lectura) {
            console.log("Es inferior");
            req.flash("error", "La lectura es inferior a la ultima disponible");
            res.redirect("/contadores/plantilla/" + num_serie);
            throw new Error('La lectura es inferior a la anterior ya existente', { code:"LECTURA_INCORRECTA"});

        }
        await db.query("INSERT INTO lecturas set ?", [mant]);
        funciones.insertarLog(req.user.usuario, "INSERT lectura", mant.num_serie + " " + mant.fecha + " " + mant.lectura);
        req.flash("success", "Lectura insertada correctamente");
        res.redirect("/contadores/plantilla/" + num_serie);

    } catch (error) {
        console.log(error);
        if (error.code = 'ER_DUP_ENTRY')
            req.flash("error", "Ya hay una lectura para esa fecha");
  
        else
            req.flash("error", "Hubo algun error al añadir lectura al contador: " + num_serie);
        res.redirect("/contadores/plantilla/" + num_serie);
    }
});
router.get("/delete/:id_lectura", funciones.isAuthenticated, funciones.isAdmin, async (req, res) => {
    console.log("delete lectura");
    const { id_lectura } = req.params;
    const resp = await db.query("select num_serie from lecturas where id_lectura=?", [id_lectura]);
    const num_serie = resp[0].num_serie;
    await db.query("delete from lecturas where id_lectura=?", [id_lectura]);
    funciones.insertarLog(req.user.usuario, "DELETE lectura del contador", num_serie);
    req.flash("success", "Lectura del contador " + num_serie + " borrada correctamente ");
    res.redirect("/contadores/plantilla/" + num_serie);
});
router.get("/edit/:id_lectura", funciones.isAuthenticated, funciones.hasSanPrivileges, async (req, res) => {
    const { id_lectura } = req.params;
    //console.log("Que id es: "+id_lectura);
    const lectura = await db.query("SELECT * FROM lecturas WHERE id_lectura=?", [id_lectura]);
    console.log(lectura[0]);
    res.render("lecturas/editLectura", { lectura: lectura[0] });

});
router.post("/edit/:id_lectura", funciones.isAuthenticated, funciones.hasSanPrivileges, async (req, res) => {
    var { id_lectura } = req.params;
    var {
        id_lectura,
        num_serie,
        fechaNueva,
        lectura } = req.body;
    const newLectura = {
        id_lectura,
        num_serie,
        fecha: fechaNueva,
        lectura
    };

    try {
        //Comprobamos que no sea inferior a la anterior
        var ultLectura = await db.query("select * from lecturas WHERE num_serie = ? and fecha < ? order by fecha desc", [num_serie,fechaNueva]);
        console.log(ultLectura[0]);
        if (ultLectura[0].lectura > lectura) {
            console.log("Es inferior");
            req.flash("error", "La lectura es inferior a la anterior disponible");
            res.redirect("/contadores/plantilla/" + num_serie);
            return;
            //throw new Error('La lectura es inferior a la anterior ya existente');

        }
        //Y que no sea superior a la siguiente
        var sigLectura = await db.query("select * from lecturas WHERE num_serie = ? and fecha > ? order by fecha asc", [num_serie,fechaNueva]);
        console.log(sigLectura[0]);
        if (sigLectura[0].lectura < lectura) {
            console.log("Es superior");
            req.flash("error", "La lectura es superior a la siguiente disponible");
            res.redirect("/contadores/plantilla/" + num_serie);
            return;
            //throw new Error('La lectura es inferior a la anterior ya existente');

        }
        //Entonces Modificamos
        await db.query("UPDATE lecturas set ? WHERE id_lectura = ?", [newLectura, id_lectura]);
        funciones.insertarLog(req.user.usuario, "UPDATE lectura", newLectura.num_serie + " " + newLectura.fecha + " " + newLectura.lectura);
        req.flash("success", "Lectura modificado correctamente en el contador " + num_serie);
        res.redirect("/contadores/plantilla/" + num_serie);
    } catch (error) {
        console.error(error);
        req.flash("error", "Hubo algun error al modificar la lectura del contador: " + num_serie);
        res.redirect("/contadores/plantilla/" + num_serie);
    }
});


module.exports = router;