const express = require('express');
const router = express.Router();
const path = require('path');
const db = require("../database"); //db hace referencia a la BBDD
const funciones = require("../lib/funciones.js");
const fs = require('fs').promises;
const queryContadores = "SELECT c.num_serie,c.observaciones,c.ct,c.ubicacion from contadores c";
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

       
    } = req.body;
    const newContador = {
        num_serie,
        observaciones,
        ct,
        ubicacion,
    
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

//CRUD ATON read
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
/* router.get("/list/:filtro/:valor", async (req, res) => {
    var obj = req.params;
    var balizas;
    //Añadimos porcentajes para busqueda SQL que contenga 'busqueda' y lo que sea por delante y por detras
    obj.valor = "%" + obj.valor + "%";

    if (obj.filtro == "tipo" || obj.filtro == "apariencia")
        obj.filtro = "b." + obj.filtro;
    else
        obj.filtro = "lo." + obj.filtro;

    var sqlQuery = queryListadoAton + " where b.nif=lo.nif AND " + obj.filtro + " like ? order by lo.nif";
    balizas = await db.query(sqlQuery, obj.valor);
    //console.log(balizas);
    //like is case insensitive por defecto. En caso de quererlo sensitivo hay que añadir solo "like binary"
    res.render("aton/list", { layout: 'layoutList', balizas });
    // NO FUNCIONA CON LA BARRA DELANTE res.render('/links/list');
}); */
router.get("/plantilla/:nif", async (req, res) => {
    const { nif } = req.params;
    //const baliza = await db.query('SELECT * FROM balizamiento b  LEFT JOIN localizacion lo ON lo.nif=b.nif  LEFT JOIN lampara la ON la.nif=b.nif where b.nif=?', [nif]);  CON ESTA CONSULTA EL LEFT JOIN NO FUNCIONA BIEN PARA EL HIPOTETICO CASO EN EL QUE EXISTE UN ATON QUE NO ESTA EN ALGUNA DE LAS TRES TABLAS
    const baliza = await db.query(queryListadoAton + ' where b.nif=?', [nif]);
    //console.log(baliza[0]);
    const observaciones = await db.query('SELECT * FROM observaciones where nif=?', [nif]);
    const mantenimiento = await db.query('SELECT * FROM mantenimiento where nif=? order by fecha DESC', [nif]);
    const tickets = await db.query(queryListadoTicketsUsers + 'where t.nif=? and solved_at is null', [nif]);
    //console.log(tickets);
    var fotos = funciones.listadoFotos(nif);
    res.render("aton/plantilla", { layout: 'layoutPlantilla', baliza: baliza[0], obs: observaciones, mant: mantenimiento, fotos, tickets });
    // NO FUNCIONA CON LA BARRA DELANTE res.render('/links/list');
});

//CRUD ATON update
router.get("/editCaracteristicas/:nif", funciones.isAuthenticated, funciones.hasSanPrivileges, async (req, res) => {
    const { nif } = req.params;
    var baliza = await db.query("SELECT * FROM balizamiento WHERE nif=?", [nif]);

    if (baliza[0] == null || baliza[0] == undefined) {
        baliza = { nif };
    } else {
        baliza = baliza[0];
    }
    res.render("aton/editCaracteristicas", { baliza });
});
router.get("/editLocalizacion/:nif", funciones.isAuthenticated, funciones.hasSanPrivileges, async (req, res) => {
    const { nif } = req.params;
    var baliza = await db.query("SELECT * FROM localizacion WHERE nif=?", [nif]);
    if (baliza[0] == null || baliza[0] == undefined) {
        baliza = { nif };
    } else {
        baliza = baliza[0];
    }
    console.log(baliza);
    res.render("aton/editLocalizacion", { baliza });
});
router.get("/editLampara/:nif", funciones.isAuthenticated, funciones.hasSanPrivileges, async (req, res) => {
    const { nif } = req.params;
    var baliza = await db.query("SELECT * FROM lampara WHERE nif=?", [nif]);
    if (baliza[0] == null || baliza[0] == undefined) {
        baliza = { nif };
    } else {
        baliza = baliza[0];
    }
    res.render("aton/editLampara", { baliza });
});
router.post("/editCaracteristicas/:nif", funciones.isAuthenticated, funciones.hasSanPrivileges, async (req, res) => {
    const nifviejo = req.params.nif;
    var {
        nif,
        num_internacional,
        tipo,
        telecontrol,
        apariencia,
        periodo,
        caracteristica,
    } = req.body;
    periodo = parseInt(periodo);
    const newBaliza = {
        nif: nifviejo,
        num_internacional,
        tipo,
        telecontrol,
        apariencia,
        periodo,
        caracteristica,
    };

    try {
        await db.query("UPDATE balizamiento set ? WHERE nif = ?", [
            newBaliza,
            nifviejo,
        ]);
        funciones.insertarLog(req.user.usuario, "UPDATE balizamiento", newBaliza.nif + " " + newBaliza.num_internacional + " " + newBaliza.tipo + " " + newBaliza.telecontrol + newBaliza.apariencia + " " + newBaliza.periodo + " " + newBaliza.caracteristica);
        req.flash("success", "Baliza modificada correctamente");
        res.redirect("/aton/plantilla/" + nifviejo);

    } catch (error) {
        console.error(error);
        req.flash("error", "Hubo algun error al modificar el aton " + newBaliza.nif);
        res.redirect("/aton/plantilla/" + nifviejo);
    }


});
router.post("/editLocalizacion/:nif", funciones.isAuthenticated, funciones.hasSanPrivileges, async (req, res) => {
    const nifviejo = req.params.nif;
    var {
        puerto,
        num_local,
        localizacion,
        latitud,
        longitud,
    } = req.body;
    const newBaliza = {
        nif: nifviejo,
        puerto,
        num_local,
        localizacion,
        latitud,
        longitud,
    };
    try {

        var baliza = await db.query("SELECT * FROM localizacion WHERE nif=?", [nifviejo]);
        if (baliza[0] == null || baliza[0] == undefined) {
            await db.query("INSERT into localizacion set ? ", [newBaliza]);
        } else {
            await db.query("UPDATE localizacion set ? WHERE nif = ?", [newBaliza, nifviejo]);
        }
        funciones.insertarLog(req.user.usuario, "UPDATE localizacion", newBaliza.nif + " " + newBaliza.puerto + " " + newBaliza.num_local + " " + newBaliza.localizacion + " " + newBaliza.latitud + " " + newBaliza.longitud);
        req.flash("success", "Localizacion de baliza modificada correctamente");
        res.redirect("/aton/plantilla/" + nifviejo);

    } catch (error) {
        console.error(error);
        req.flash("error", "Hubo algun error al modificar la localización del aton con NIF " + nifviejo);
        res.redirect("/aton/plantilla/" + nifviejo);
    }

});
router.post("/editLampara/:nif", funciones.isAuthenticated, funciones.hasSanPrivileges, async (req, res) => {
    const nifviejo = req.params.nif;
    var {
        altura,
        elevacion,
        alcanceNom,
        linterna,
        candelasCalc,
        alcanceLum,
        candelasInst,
    } = req.body;
    const newBaliza = {
        nif: nifviejo,
        altura,
        elevacion,
        alcanceNom,
        linterna,
        candelasCalc,
        alcanceLum,
        candelasInst,
    };
    try {
        var baliza = await db.query("SELECT * FROM lampara WHERE nif=?", [nifviejo]);
        if (baliza[0] == null || baliza[0] == undefined) {
            await db.query("INSERT into lampara set ? ", [newBaliza]);
        } else {
            await db.query("UPDATE lampara set ? WHERE nif = ?", [newBaliza, nifviejo]);
        }
        funciones.insertarLog(req.user.usuario, "UPDATE lampara", newBaliza.nif + " " + newBaliza.altura + " " + newBaliza.elevacion + " " + newBaliza.alcanceNom + " " + newBaliza.linterna + " " + newBaliza.candelasCalc + " " + newBaliza.alcanceLum + " " + newBaliza.candelasInst);
        req.flash("success", "Lampara del aton modificada correctamente");
        res.redirect("/aton/plantilla/" + nifviejo);

    } catch (error) {
        console.error(error);
        req.flash("error", "Hubo algun error al modificar la lampara del aton con NIF: " + nifviejo);
        res.redirect("/aton/plantilla/" + nifviejo);
    }


});

//CRUD ATON delete
router.get("/delete/:nif", funciones.isAuthenticated, funciones.isAdmin, async (req, res) => {
    console.log("Borrando aton " + req.params.nif + "...");
    const { nif } = req.params;
    try {
        await db.query("DELETE FROM mantenimiento WHERE nif=?", [nif]);
        await db.query("DELETE FROM observaciones WHERE nif=?", [nif]);
        await db.query("DELETE FROM localizacion WHERE nif=?", [nif]);
        await db.query("DELETE FROM lampara WHERE nif=?", [nif]);
        await db.query("DELETE FROM balizamiento WHERE nif=?", [nif]);
        console.log(req.user);
        funciones.insertarLog(req.user.usuario, "DELETE aton ", req.params.nif);
        req.flash("success", "Baliza borrada correctamente");
        res.redirect("/aton/list");
    } catch (error) {
        req.flash("error", "Hubo algun error al borrar el AtoN con NIF: " + nif);
        res.redirect("/aton/plantilla/" + nif);
    }
});


//GESTION CRUD lecturas
router.post("/lecturas/add", funciones.isAuthenticated, funciones.hasSanPrivileges, async (req, res) => {
    const {
        nif,
        fecha,
        mantenimiento,
    } = req.body;
    const mant = {
        nif,
        fecha,
        mantenimiento,
    };
    try {
        await db.query("INSERT INTO mantenimiento set ?", [mant]);
        funciones.insertarLog(req.user.usuario, "INSERT mantenimiento", mant.nif + " " + mant.fecha + " " + mant.mantenimiento);
        req.flash("success", "Mantenimiento en baliza insertado correctamente");
        res.redirect("/aton/plantilla/" + nif);

    } catch (error) {
        console.error(error);
        req.flash("error", "Hubo algun error al añadir mantenimiento al NIF: " + nif);
        res.redirect("/aton/plantilla/" + nif);
    }
});
router.get("/lecturas/delete/:idMan", funciones.isAuthenticated, funciones.isAdmin, async (req, res) => {
    //console.log(req.params.idMan);
    const { idMan } = req.params;
    const resp = await db.query("select nif from mantenimiento where id_mantenimiento=?", [idMan]);
    const nif = resp[0].nif;
    await db.query("delete from mantenimiento where id_mantenimiento=?", [idMan]);
    funciones.insertarLog(req.user.usuario, "DELETE mantenimientos del aton", nif);
    req.flash("success", "mantenimiento de baliza " + nif + " borrado correctamente ");
    res.redirect("/aton/plantilla/" + nif);
});
router.get("/lecturas/edit/:idMan", funciones.isAuthenticated, funciones.hasSanPrivileges, async (req, res) => {
    const { idMan } = req.params;
    //console.log("Que id es: "+idMan);
    const mantenimient = await db.query("SELECT * FROM mantenimiento WHERE id_mantenimiento=?", [idMan,]);
    //console.log(mantenimient[0]);
    res.render("aton/editMantenimiento", { mant: mantenimient[0] });

});
router.post("/lecturas/edit/:idMan", funciones.isAuthenticated, funciones.hasSanPrivileges, async (req, res) => {
    var {
        id_mantenimiento,
        nif,
        fechaNueva,
        mantenimientoNuevo
    } = req.body;
    const newObservacion = {
        id_mantenimiento,
        nif,
        fecha: fechaNueva,
        mantenimiento: mantenimientoNuevo,
    };
    try {
        await db.query("UPDATE mantenimiento set ? WHERE id_mantenimiento = ?", [newObservacion, id_mantenimiento]);
        funciones.insertarLog(req.user.usuario, "UPDATE mantenimiento", newObservacion.nif + " " + newObservacion.fecha + " " + newObservacion.mantenimiento);
        req.flash("success", "Mantenimiento modificado correctamente en la baliza " + nif);
        res.redirect("/aton/plantilla/" + nif);
    } catch (error) {
        console.error(error);
        req.flash("error", "Hubo algun error al modificar el mantenimiento al NIF: " + nif);
        res.redirect("/aton/plantilla/" + nif);
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