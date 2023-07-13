const express = require('express');
const router = express.Router();
const db = require("../database"); //db hace referencia a la BBDD
const funciones = require("../lib/funciones.js");
const queryListadoTickets = "SELECT * FROM tickets ";
const queryListadoTicketsUsers = "SELECT t.ticket_id,t.nif,t.created_by_id,t.assigned_to_id,t.resolved_by_id,t.titulo,t.descripcion,t.solved_at,t.created_at,u1.usuario as created_by,u2.usuario as assigned_to,u3.usuario as resolved_by FROM tickets t LEFT JOIN usuarios u1 ON t.created_by_id=u1.id  LEFT JOIN usuarios u2 ON t.assigned_to_id=u2.id LEFT JOIN usuarios u3 ON t.resolved_by_id=u3.id";
var moment = require('moment'); // require
moment().format();


//tickets
// Ruta vista principal
router.get('/list', async(req, res) => {
    //const tickets = await db.query("select * from tickets order by created_at");
    try {
        const tickets = await db.query(queryListadoTicketsUsers + " order by t.solved_at asc,t.created_at desc");
        res.render('tickets/view', {
            tickets
        });
    } catch (error) {
        console.error(error);
        req.flash("error", "Hubo algun error al intentar mostrar los tickets: " + error);
        res.redirect("/");
    }
});
//ruta para obtener tickets asignados al usuario con ID
router.get('/list/:accion/:id', async(req, res) => {
    //const tickets = await db.query("select * from tickets order by created_at");
    const {
        accion,
        id
    } = req.params;
    let tickets;
    let ticketsAbiertos = false;
    let ticketsCerrados = false;
    try {
        if (accion == 'activos') {
            ticketsAbiertos = true;
            tickets = await db.query(queryListadoTicketsUsers + " where t.assigned_to_id =? AND solved_at is null order by t.solved_at asc,t.created_at desc", [id]);
        } else if (accion == 'cerrados') {
            ticketsCerrados = true;
            tickets = await db.query(queryListadoTicketsUsers + " where t.assigned_to_id =? AND solved_at is not null order by t.solved_at asc,t.created_at desc", [id]);
        }
        res.render('tickets/view', {
            tickets,
            accion,
            ticketsAbiertos,
            ticketsCerrados
        });
    } catch (error) {
        console.error(error);
        req.flash("error", "Hubo algun error al intentar mostrar los tickets: " + error);
        res.redirect("/tickets/list");
    }
});
// Ruta para crear un nuevo ticket (formulario)
router.get('/add', funciones.isAuthenticated, async(req, res) => {
    try {
        const usuarios = await db.query("select * from usuarios");
        res.render('tickets/add', {
            usuarios
        });
    } catch (error) {
        console.error(error);
        req.flash("error", "Hubo algun error al intentar añadir el ticket" + error);
        res.redirect("/tickets/list");
    }
});
// Ruta para crear un nuevo ticket (formulario) desde la plantilla, rellenando el id de la señal
router.get('/add/:id', funciones.isAuthenticated, async(req, res) => {
    const {
        id
    } = req.params;
    try {
        //console.log(id);
        const usuarios = await db.query(" select * from usuarios");
        res.render('tickets/add', {
            'nif': id,
            usuarios
        });
    } catch (error) {
        console.error(error);
        req.flash("error", "Hubo algun error al intentar añadir el ticket" + error);
        res.redirect("/tickets/list");
    }
});
// Ruta para crear un nuevo ticket (envío del formulario)
router.post('/add', funciones.isAuthenticated, async(req, res) => {
    try {
        const {
            nif,
            titulo,
            descripcion,
            assigned_to_id
        } = req.body;
        const nuevoTicket = {
            nif,
            titulo,
            descripcion,
            assigned_to_id,
            'created_by_id': req.user.id
        };
        //console.log(req.user);
        const awns = await db.query("insert into tickets set ? ", [nuevoTicket]);
        console.log(awns);
        console.log(awns.insertId);
        funciones.insertarLog(req.user.usuario, "INSERT ticket", nuevoTicket.titulo + " para " + nuevoTicket.assigned_to_id);
        req.flash("success", "Ticket añadido al inventario correctamente");
        //let ticket = await db.query("select * from tickets where ticket_id=?", req.params.id);
        res.redirect('/tickets/edit/' + awns.insertId);

    } catch (error) {
        //console.error(error);
        req.flash("error", "Hubo algun error al insertar el ticket: " + error);
        res.redirect("/tickets/list");
    }
});
// Ruta para editar un ticket
router.get('/edit/:id', funciones.isAuthenticated, funciones.hasSanPrivileges, async(req, res) => {
    const {
        id
    } = req.params;
    //console.log(id);
    try {
        const ticket = await db.query(queryListadoTickets + " where ticket_id=?", id);
        const ticketsUsers = await db.query(queryListadoTicketsUsers + " where t.ticket_id=?", id);
        const usuarios = await db.query(" select * from usuarios");
        //console.log(ticketsUsers[0]);
        //console.log(ticket[0]);
        res.render('tickets/edit', {
            ticket: ticket[0],
            users: ticketsUsers[0],
            usuarios: usuarios
        });
    } catch (error) {
        console.error(error);
        req.flash("error", "Hubo algun error al intentar mostrar el ticket" + error);
        res.redirect("/tickets/list");
    }
});
// Ruta POST para editar un ticket
router.post('/edit/:id', funciones.isAuthenticated, funciones.hasSanPrivileges, async(req, res) => {

    var {
        ticket_id,
        titulo,
        descripcion,
        nif,
        assigned_to_id,
        resolved_by_id,
    } = req.body;

    const editedItem = {
        ticket_id,
        titulo,
        descripcion,
        nif,
        assigned_to_id,
        resolved_by_id,
    };
    //console.log(editedItem);
    //reemplazo vacios por null
    for (let key in editedItem) {
        if (editedItem.hasOwnProperty(key) && editedItem[key] === '') {
            editedItem[key] = null;
        }
    }
    //console.log(editedItem);

    try {
        await db.query("update tickets set ? where ticket_id=?", [editedItem, ticket_id]);
        funciones.insertarLog(req.user.usuario, "UPDATE ticket", "Info actualizada " + editedItem.titulo + " " + editedItem.descripcion);
        req.flash("success", "Ticket actualizado correctamente");
        res.redirect("/tickets/edit/" + ticket_id);

    } catch (error) {
        console.error(error);
        req.flash("error", "Hubo algun error al intentar modificar el ticket" + error);
        res.redirect("/tickets/list");
    }

});
//Ruta para cerrar un ticket
router.post('/cerrar/:id', funciones.isAuthenticated, funciones.hasSanPrivileges, async(req, res) => {
    try {
        let ticket = await db.query("select * from tickets where ticket_id=?", req.params.id);
        ticket = ticket[0];
        ticket.solved_at = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
        console.log(ticket);
        console.log(ticket.solved_at);
        await db.query("update tickets set ? where ticket_id=?", [ticket, req.params.id]);
        funciones.insertarLog(req.user.usuario, "ticket cerrado", ticket.titulo + " el " + ticket.solved_at);
        //Insertarlo en la tabla mantenimiento
        const mant = {
            'nif': ticket.nif,
            'fecha': ticket.solved_at,
            'mantenimiento': ticket.titulo + " " + ticket.descripcion,
        };
        console.log(mant);
        await db.query("INSERT INTO mantenimiento set ?", [mant]);
        funciones.insertarLog(req.user.usuario, "INSERT mantenimiento", mant.nif + " " + mant.fecha + " " + mant.mantenimiento);
        //fin insertar en tabla mantenimiento
        req.flash("success", "Ticket cerrado correctamente");
        res.redirect("/tickets/cerrado/" + ticket.ticket_id);
    } catch (error) {
        //console.error(error);
        req.flash("error", "Hubo algun error al intentar modificar el ticket" + error);
        res.redirect("/tickets/list");
    }
});
// Ruta para mostrar un ticket cerrado
router.get('/cerrado/:id', funciones.isAuthenticated, funciones.hasSanPrivileges, async(req, res) => {
    const {
        id
    } = req.params;
    //console.log(id);
    try {
        const ticket = await db.query(queryListadoTickets + " where ticket_id=?", id);
        const ticketsUsers = await db.query(queryListadoTicketsUsers + " where t.ticket_id=?", id);
        const usuarios = await db.query(" select * from usuarios");
        res.render('tickets/cerrado', {
            ticket: ticket[0],
            users: ticketsUsers[0],
            usuarios: usuarios
        });
    } catch (error) {
        console.error(error);
        req.flash("error", "Hubo algun error al intentar mostrar el ticket" + error);
        res.redirect("/");
    }
});
//Ruta para borrar un ticket.
router.get("/delete/:id", funciones.isAuthenticated, funciones.isAdmin, async(req, res) => {
    //console.log(req.params.idObs);
    const {
        id
    } = req.params;
    try {
        await db.query("delete from tickets where ticket_id=?", [id]);
        req.flash("success", "Ticket eliminado correctamente.");
        res.redirect("/tickets/list");
    } catch (error) {
        console.error(error);
        req.flash("error", "Hubo algun error al intentar borrar el ticket" + error);
        res.redirect("/tickets/list");
    }
});


module.exports = router;