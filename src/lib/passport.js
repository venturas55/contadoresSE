const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const pool = require("../database");
const funciones = require("../lib/funciones");

passport.use(
    "local.signin",
    new LocalStrategy(
        {
            //name del formulario
            usernameField: "usuario",
            passwordField: "password",
            passReqToCallback: true,
        },
        async (req, username, password, done) => {
            const rows = await pool.query("SELECT * FROM usuarios WHERE usuario= ?", [username]);
           
            if (rows.length > 0) {
                const user = rows[0];
                console.log(user);
                const validPassword = await funciones.verifyPassword(password,user.contrasena);
                if (validPassword){
                    done(null, user);
                }
                else
                    done(null, false);
            } else {
                return done(null, false);
            }
        }
    )
);

passport.use(
    "local.signup",
    new LocalStrategy(
        {
            usernameField: "usuario",
            passwordField: "password",
            passReqToCallback: true,
        },
        async (req, username, password, done) => {


            //const { cuerpo } = req.body;
            const newUser = {
                usuario:    username,
                contrasena: password,
                email:      req.body.email,
                full_name:  req.body.fullname,
                privilegio: "",
            };
            newUser.contrasena = await funciones.encryptPass(password);
            const result = await pool.query("INSERT INTO usuarios SET ?", [newUser]);
            newUser.id = result.insertId;
            return done(null, newUser); //Es el que se almacena en sesion
           }
    )
);

//comprobar esto
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    console.log([id]);
    const rows = await pool.query("SELECT * FROM usuarios WHERE id= ?", [id]);
    done(null, rows[0]);
});
