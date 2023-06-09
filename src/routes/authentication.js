const express = require('express');
const router = express.Router();
const passport = require('passport');
const helpers = require('../lib/funciones');

//GESTION SIGNIN registrarse C---
router.get('/signup', helpers.isNotAuthenticated, (req, res) => {
    res.render('auth/signup')
});
router.post('/signup', passport.authenticate('local.signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    //passReqToCallback: true,
    failureFlash: true
}));

//GESTION LOGIN login
router.get('/signin', helpers.isNotAuthenticated, (req, res) => {
    res.render('auth/signin');
});
router.post('/signin', (req, res, next) => {
    const p = passport.authenticate('local.signin', {
        successRedirect: '/profile',
        failureRedirect: '/signin',
        failureFlash: true
    })(req, res, next);
});

//GESTION logout
router.get('/logout', (req, res) => {
    //helpers.insertarLog(req.user.usuario, "LOGOUT usuario", req.user.id + " " + req.user.usuario);
    req.logout(function(err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
})

module.exports = router;