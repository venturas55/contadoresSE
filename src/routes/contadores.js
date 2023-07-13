const express = require('express');
const router = express.Router();
const path = require('path');
const db = require("../database"); //db hace referencia a la BBDD
const funciones = require("../lib/funciones.js");
const fs = require('fs').promises;
const queryContadores = "SELECT * from contadores";
const queryLecturas = "SELECT * from lecturas";
//Consulta que devuelve num_serie, mes, año y consumo
const queryConsumos = "SELECT c.num_serie, MONTH(l.fecha) AS mes, YEAR(l.fecha) AS año,  (l.lectura - (SELECT lectura FROM Lecturas   WHERE num_serie = l.num_serie  AND MONTH(fecha) = MONTH(l.fecha) - 1  AND YEAR(fecha) = YEAR(l.fecha)    ORDER BY fecha DESC LIMIT 1)) AS consumo FROM Lecturas l JOIN Contadores c ON l.num_serie = c.num_serie ORDER BY c.num_serie;"

var moment = require('moment'); // require
moment().format();
//MOSTRAR PAGINA PRUEBA
router.get('/prueba', (req, res) => {
    res.render('prueba');
});

//CRUD ATON create
router.get("/add", funciones.isAuthenticated, funciones.hasSanPrivileges, (req, res) => {
    res.render("contadores/add");
});
router.post("/add", funciones.isAuthenticated, funciones.hasSanPrivileges, async (req, res) => {
    const {
        num_serie,
        observaciones,
        ct,
        ubicacion,
        nombre

    } = req.body;
    const newContador = {
        num_serie,
        observaciones,
        ct,
        ubicacion,
        nombre

    };

    try {
        let existe = await db.query("SELECT * from contadores where num_serie= ?", [newContador.num_serie]);

        if (existe.length == 0) {
            await db.query("INSERT INTO contadores set ?", [newContador]);
            const msg = funciones.insertarLog(req.user.usuario, "INSERT contador", newContador.num_serie);
            if (msg == 'error')
                throw (msg)
            req.flash("success", "Contador insertado correctamente");
            res.redirect("/contadores/list");
        } else {
            req.flash("error", "Ya existe un contador con el numero de serie " + newContador.num_serie);
            res.redirect("/contadores/add");
        }
        //console.log(newBalizamiento);
    } catch (error) {
        console.error(error.code);
        switch (error.code) {
            case "ER_DATA_TOO_LONG":
                req.flash("error", "El num_serie " + newContador.num_serie + " es demasiado largo.");
                break;
            case "ER_BAD_NULL_ERROR":
                req.flash("error", "num_serie es obligatorio");
                break;
            case "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD":
                req.flash("error", "Hay un campo con valor incorrecto");
                break;

            default:
                req.flash("error", "Hubo algun error al intentar añadir el nuevo Contador con num_serie  " + newContador.num_serie);
        }
        res.redirect("/contadores/add");
    }
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
router.get("/plantilla/:num_serie", async (req, res) => {
    const { num_serie } = req.params;
    //const contador = await db.query('SELECT * FROM balizamiento b  LEFT JOIN localizacion lo ON lo.nif=b.nif  LEFT JOIN lampara la ON la.nif=b.nif where b.nif=?', [nif]);  CON ESTA CONSULTA EL LEFT JOIN NO FUNCIONA BIEN PARA EL HIPOTETICO CASO EN EL QUE EXISTE UN ATON QUE NO ESTA EN ALGUNA DE LAS TRES TABLAS
    let contador = await db.query(queryContadores + ' where num_serie=?', [num_serie]);
    let lecturas = await db.query(queryLecturas + ' where num_serie=?', [num_serie]);
    contador = contador[0];
    //const tickets = await db.query(queryListadoTicketsUsers + 'where c.num_serie=? and solved_at is null', [num_serie]);
    //console.log(lecturas);
    var fotos = funciones.listadoFotos(num_serie);
    res.render("contadores/plantilla", { layout: 'layoutPlantilla', contador, lecturas, fotos });
});

//CRUD CONTADOR update
router.get("/editCaracteristicas/:nif", funciones.isAuthenticated, funciones.hasSanPrivileges, async (req, res) => {
    const { nif } = req.params;
    var contador = await db.query("SELECT * FROM contadores WHERE num_serie=?", [nif]);

    if (contador[0] == null || contador[0] == undefined) {
        res.render("estaticas/error");
    } else {
        contador = contador[0];
        res.render("contadores/editCaracteristicas", { contador });
    }

});
router.post("/editCaracteristicas/:nif", funciones.isAuthenticated, funciones.hasSanPrivileges, async (req, res) => {
    const nifviejo = req.params.nif;
    try {
        var {
            ref,
            num_serie,
            zona,
            ct,
            nombre,
            ubicacion,
            id_abonado,
        } = req.body;
        const newBaliza = {
            ref,
            num_serie,
            zona,
            ct,
            nombre,
            ubicacion,
        };
        console.log(newBaliza);
        await db.query("UPDATE contadores set ? WHERE num_serie = ?", [newBaliza, nifviejo]);
        funciones.insertarLog(req.user.usuario, "UPDATE contadores", newBaliza.nif + " " + newBaliza.num_internacional + " " + newBaliza.tipo + " " + newBaliza.telecontrol + newBaliza.apariencia + " " + newBaliza.periodo + " " + newBaliza.caracteristica);
        req.flash("success", "Contador modificado correctamente");
        res.redirect("/contadores/plantilla/" + num_serie);

    } catch (error) {
        console.error(error);
        req.flash("error", "Hubo algun error al modificar el contador " + nifviejo);
        res.redirect("/contadores/plantilla/" + nifviejo);
    }


});

//CRUD CONTADOR delete
router.get("/delete/:nif", funciones.isAuthenticated, funciones.isAdmin, async (req, res) => {
    console.log("Borrando contador " + req.params.nif + "...");
    const { nif } = req.params;
    try {
        /*         await db.query("DELETE FROM mantenimiento WHERE num_serie=?", [nif]);
                await db.query("DELETE FROM observaciones WHERE num_serie=?", [nif]); */
        await db.query("DELETE FROM contadores WHERE num_serie=?", [nif]);
        console.log(req.user);
        funciones.insertarLog(req.user.usuario, "DELETE contador ", req.params.nif);
        req.flash("success", "Contador borrado correctamente");
        res.redirect("/contadores/list");
    } catch (error) {
        req.flash("error", "Hubo algun error al borrar el contadores con NIF: " + nif);
        res.redirect("/contadores/plantilla/" + nif);
    }
});



router.get("/pintura/:nif", funciones.isAuthenticated, funciones.hasSanPrivileges, async (req, res) => {
    try {
        const { nif } = req.params;
        const baliza = (await db.query('Select * from balizamiento where nif=?', [nif]))[0];
        baliza.necesita_pintado = !baliza.necesita_pintado;
        await db.query("UPDATE balizamiento set ? WHERE nif = ?", [baliza, nif]);
        res.redirect("/aton/plantilla/" + nif);
    } catch (error) {
        console.error(error);
        req.flash("error", "Hubo algun error al anotar pintado");
        res.redirect("/aton/plantilla/" + nif);
    }
});
router.get("/pintado/:nif", funciones.isAuthenticated, funciones.hasSanPrivileges, async (req, res) => {
    try {
        const { nif } = req.params;
        const baliza = (await db.query('Select * from balizamiento where nif=?', [nif]))[0];
        console.log(baliza);
        baliza.necesita_pintado = false;
        await db.query("UPDATE balizamiento set ? WHERE nif = ?", [baliza, nif]);
        const mant = {
            nif,
            'fecha': moment(new Date()).format("YYYY-MM-DD"),
            'mantenimiento': 'Se repita el aton',
        };
        await db.query("INSERT INTO mantenimiento set ?", [mant]);
        funciones.insertarLog(req.user.usuario, "INSERT mantenimiento", mant.nif + " " + mant.fecha + " " + mant.mantenimiento);
        req.flash("success", "Pintado en AtoN anotado correctamente");
        res.redirect("/aton/plantilla/" + nif);

    } catch (error) {
        console.error(error);
        req.flash("error", "Hubo algun error al añadir mantenimiento al NIF: " + nif);
        res.redirect("/aton/plantilla/" + nif);
    }
});
module.exports = router;