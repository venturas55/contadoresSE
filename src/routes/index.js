const express = require('express');
const router = express.Router();
const path = require('path');
const db = require("../database"); //db hace referencia a la BBDD
const funciones = require("../lib/funciones.js");
const { unlink } = require('fs-extra');
const { access, constants } = require('fs');
const fs = require('fs');
const queryListadoAton = "SELECT b.nif,b.num_internacional,b.tipo,b.apariencia,b.periodo,b.caracteristica,b.telecontrol,b.necesita_pintado,lo.puerto,lo.num_local,lo.localizacion,lo.latitud,lo.longitud,la.altura,la.elevacion,la.alcanceNom,la.linterna,la.candelasCalc,la.alcanceLum,la.candelasInst FROM balizamiento b  LEFT JOIN localizacion lo ON lo.nif=b.nif  LEFT JOIN lampara la ON la.nif=b.nif";

const queryListadoTicketsUsers = "SELECT t.ticket_id,t.nif,t.created_by_id,t.assigned_to_id,t.resolved_by_id,t.titulo,t.descripcion,t.solved_at,t.created_at,u1.usuario as created_by,u2.usuario as assigned_to,u3.usuario as resolved_by FROM tickets t LEFT JOIN usuarios u1 ON t.created_by_id=u1.id  LEFT JOIN usuarios u2 ON t.assigned_to_id=u2.id LEFT JOIN usuarios u3 ON t.resolved_by_id=u3.id";

//MOSTRAR PAGINA INICIAL
router.get('/', (req, res) => {
    res.render('index');
});

//MOSTRAR CALCULOS
router.get('/calculos', (req, res) => {
    res.render('estaticas/calculos', { layout: 'layoutCalculos' });
});

//MOSTRAR PLAN
router.get('/plan', (req, res) => {
    res.render('estaticas/plan', { layout: 'layoutSimple' });
});

//MOSTRAR PERFIL  -RUD  
router.get('/profile', async(req, res) => {
    console.log(req.user.id);
    const tickets = await db.query('select * from tickets where assigned_to_id=? and solved_at is null', [req.user.id]);
    console.log(tickets);
    res.render('auth/profile', { tickets });
});
router.get('/profile/edit', (req, res) => {
    let permisos = { 'tecnicosan': false, 'admin': false };
    if (req.user.privilegio == 'admin')
        permisos = { 'esTecnico': false, 'esAdmin': true };
    if (req.user.privilegio == 'san')
        permisos = { 'esTecnico': true, 'esAdmin': false };
    //console.log(permisos);
    res.render('auth/profileEdit', { permisos });
});
router.post('/profile/edit', funciones.isAuthenticated, async(req, res) => {
    const rows = await db.query("SELECT * FROM usuarios WHERE id= ?", [req.body.id]);
    var user = rows[0];

    console.log(req.body.oldcontrasena + " / " + user.contrasena);
    const validPassword = await funciones.verifyPassword(req.body.oldcontrasena, user.contrasena);
    if (validPassword) {
        user.usuario = req.body.usuario;
        user.email = req.body.email;
        user.full_name = req.body.full_name;
        user.contrasena = await funciones.encryptPass(req.body.newcontrasena);
        //console.log("guardando en la BBDD");
        //console.log(user);
        const result = await db.query("UPDATE usuarios SET ? where id= ?", [user, req.body.id]);
        req.flash("success", "Usuario editado correctamente.");
        res.redirect('/profile');
    } else {
        req.flash("warning", "No dispones de permisos!");
        res.redirect('/noperm');
    }
});
router.get("/profile/delete/:id", funciones.isAuthenticated, async(req, res) => {
    console.log(req.params);
    const { id } = req.params;
    const user = await db.query("SELECT * FROM usuarios where id=?", id);
    //borramos foto
    const filePath = path.resolve('src/public/img/profiles/' + user.pictureURL);
    access(filePath, constants.F_OK, async(err) => {
        if (err) {
            console.log("No tiene foto de perfil");
        } else {
            console.log('File exists. Deleting now ...');
            await unlink(filePath);
        }
    });
    //hacemos logout
    req.logout(async function(err) {
        if (err) {
            return next(err);
        }
        await db.query("DELETE FROM sessions ");
        await db.query("DELETE FROM usuarios WHERE id=?", [id]);
    });

    req.flash("success", "Usuario borrado correctamente");
    res.redirect('/');
});
router.post('/doAdmin', funciones.isAuthenticated, async(req, res) => {
    const { pass, privilegio } = req.body;
    console.log(pass + " / " + db.config.connectionConfig.masterpass);
    console.log(req.user);
    const validPassword = await funciones.verifyPassword(pass, db.config.connectionConfig.masterpass);

    if (validPassword) {
        req.user.privilegio = privilegio;
        console.log("guardando en la BBDD");
        const result = await db.query("UPDATE usuarios SET ? where id= ?", [req.user, req.user.id]);
        req.flash("success", "Permisos de usuario actualizados correctamente");
        funciones.insertarLog(req.user.usuario, "UPDATE usuarios", "Se le añade permisos de admin");
        res.redirect('/profile');
    } else {
        res.redirect('/noperm');
    }
});


//GESTION BACKUPS BBDD
router.get("/backups", funciones.isAuthenticated, funciones.hasSanPrivileges, async(req, res) => {
    var backups = funciones.listadoBackups();
    res.render("documentos/listadoBackups", { backups });
});
router.get("/backups/del/:nombre", funciones.isAuthenticated, funciones.isAdmin, async(req, res) => {
    var { nombre } = req.params;
    var file = path.resolve('src/public/dumpSQL', nombre);
    //console.log(file);
    await fs.unlinkSync(file);
    funciones.insertarLog(req.user.usuario, "DELETE backup", nombre);
    res.redirect('/backups');
});
router.get("/dumpSQL", funciones.isAuthenticated, funciones.hasSanPrivileges, async(req, res) => {
    funciones.dumpearSQL();
    req.flash("success", "Backup de la BBDD realizado correctamente");
    funciones.insertarLog(req.user.usuario, "DO backup", "nuevo backup");
    res.redirect("backups");
});

//GESTION LOGS
router.get("/logs", funciones.isAuthenticated, funciones.isAdmin, async(req, res) => {
    var logs = await db.query("select * from logs order by fecha desc");
    res.render("documentos/listadoLogs", { logs });
});

//GESTION INVENTARIO
router.get('/inventario', funciones.isAuthenticated, async(req, res) => {
    const inventario = await db.query("select * from inventario order by fila,columna");
    res.render('inventario/inventario', { inventario });
});
router.get('/inventario/add', funciones.isAuthenticated, funciones.hasSanPrivileges, async(req, res) => {
    res.render('inventario/addItem');
});
router.post('/inventario/add', funciones.isAuthenticated, funciones.hasSanPrivileges, async(req, res) => {
    var {
        tipo,
        item,
        descripcion,
        cantidad,
        fila,
        columna
    } = req.body;

    const nuevoItem = {
        tipo,
        item,
        descripcion,
        cantidad,
        fila,
        columna
    };

    console.log(nuevoItem);
    await db.query("insert into inventario set ? ", [nuevoItem]);
    funciones.insertarLog(req.user.usuario, "INSERT inventario", "Item " + nuevoItem.item + " añadido " + nuevoItem.cantidad + " cantidades");
    req.flash("success", "Item añadido al inventario correctamente");
    res.redirect("/inventario");
});
router.get('/inventario/edit/:id', funciones.isAuthenticated, funciones.hasSanPrivileges, async(req, res) => {
    const { id } = req.params;
    //console.log(id);
    const item = await db.query("select * from inventario where id=?", id);
    //console.log(item[0]);
    res.render('inventario/edit', { item: item[0] });
});
router.post('/inventario/edit/:id', funciones.isAuthenticated, funciones.hasSanPrivileges, async(req, res) => {
    var {
        id,
        tipo,
        item,
        descripcion,
        cantidad,
        fila,
        columna
    } = req.body;

    const nuevoItem = {
        id,
        tipo,
        item,
        descripcion,
        cantidad,
        fila,
        columna
    };
    await db.query("update inventario set ? where id=?", [nuevoItem, id]);
    funciones.insertarLog(req.user.usuario, "UPDATE inventario", "Info actualizada " + nuevoItem.item + " " + nuevoItem.cantidad);
    req.flash("success", "Inventario actualizado correctamente");
    res.redirect("/inventario");
});
router.get("/inventario/delete/:id", funciones.isAuthenticated, funciones.isAdmin, async(req, res) => {
    //console.log(req.params.idObs);
    const { id } = req.params;
    await db.query("delete from inventario where id=?", [id]);
    req.flash("success", "Item eliminado correctamente.");
    res.redirect("/inventario");
});

//MOSTRAR ERROR
router.get('/error', (req, res) => {
    res.render('error');
});
router.get('/noperm', (req, res) => {
    res.render('noPermission');
});

//GESTION MAPA
router.get("/mapa/:nif", async(req, res) => {
    const { nif } = req.params;
    const baliza = await db.query(queryListadoAton + ' where b.nif=?', [nif]);
    res.render("mapas/mapa", { layout: 'layoutMapa', baliza: baliza[0] });
});
//funcion get para mostrar los mapas dinamicos con la api de google maps
router.get("/mapaGeneral/:valor", (req, res) => {
    //const { valor } = req.params;
    res.render("mapas/mapa", { layout: 'layoutMapa' });
});
//funcion get para mostrar los mapas estaticos
router.get("/mapaGeneral2/:valor", (req, res) => {
    const { valor } = req.params;
    //console.log("Mapa " + valor);
    switch (valor) {
        case "valencia":
            res.render("mapas/mapaValencia", { layout: 'layoutMapaEstatico' });
            break;
        case 'sagunto':
            res.render("mapas/mapaSagunto", { layout: 'layoutMapaEstatico' });
            break;
        case "gandia":
            res.render("mapas/mapaGandia", { layout: 'layoutMapaEstatico' });
            break;
    }
});

//MOSTRAR PRUEBA
router.get("/prueba", (req, res) => {
    console.log("Ejecutando prueba");
    funciones.consultaPrueba();
    req.flash("success", "Prueba ejecutada correctamente en index");
    //res.render("prueba");
});
router.post("/pruebaPost", async(req, res) => {
    var password = req.masterPass;
    userpass = req.body.pass;
    //console.log("==>" + req.masterPass);
    const validPassword = await funciones.verifyPassword(userpass, password);
    if (validPassword) {
        funciones.consultaPrueba();
        req.flash("success", "Prueba ejecutada correctamente crack");
        res.redirect("/");
    } else {
        req.flash("warning", "Sucedió algun error!");
        res.redirect("/noperm");
    }

});

module.exports = router;