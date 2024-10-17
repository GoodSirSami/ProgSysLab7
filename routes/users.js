var express = require('express');
var router = express.Router();
let mySql = require('mysql');
let connection = mySql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database : 'LABO7'
});
let { io } = require('../socketApi.js');

connection.connect(function (err) {
  if (err) throw err;
  console.log('Vous êtes connecté à votre BDD...');
});

/* GET users listing. */
router.post('/', function(req, res, next) {
    let log = req.body.login.replace(/"/g, '').replace(/'/g, '').replace(/;/g, '').replace(/`/g, '').replace(/%/g, '');
    let pass = req.body.password.replace(/"/g, '').replace(/'/g, '').replace(/;/g, '').replace(/`/g, '').replace(/%/g, '');

    // Création de la requête SQL
    let querystring = 'SELECT * FROM Users WHERE login = "'+ log +'" AND password = "'+ pass +'";';

    // Exécution de la requête
    connection.query(querystring, function (err, rows, fields) {
      if (err) {
        //socket.emit('loginFailed', { message: 'Erreur de connexion à la base de données' });
        return;
      }

      // Si on a des résultats, on envoie les données de l'utilisateur
      if (rows.length > 0) {
        switch (rows[0].level) {
          case 3:
            //socket.emit('loginSuccess', {login: rows[0].login, password: rows[0].password, level: rows[0].level.toString(), texte: rows[0].texte});
            break;
          case 2:
            res.render('pages/level2', { title: 'Bonjour Wobert', texte: rows[0].texte, login: rows[0].login });
            break;
          case 1:
            //socket.emit('loginSuccess', {login: rows[0].login, password: "~", level: "~", texte: rows[0].texte});
            break;
          default:
            res.render('pages/level0', { title: 'Bonjour Emryc', texte: rows[0].texte });
            break;
        }
      } else {
        res.redirect('/?error=1');
      }
    });
})
.get('/', function(req, res, next) {
  res.redirect('/');
});

io.on('connection', function(socket){
  socket.on('changeTexte', function(data){
    let texte = data.texte.replace(/"/g, '').replace(/'/g, '').replace(/;/g, '').replace(/`/g, '').replace(/%/g, '');
    let querystring = 'UPDATE Users SET texte = "'+ texte +'" WHERE login = "'+ data.login +'";';
    connection.query(querystring, function (err, rows, fields) {
      if (err) throw err;
      querystring = 'SELECT texte FROM Users WHERE login = "'+ data.login +'";';
        connection.query(querystring, function (err, rows, fields) {
          if (err) throw err;
          if(rows.length > 0)
          {
            socket.emit('textSuccess', { texte: rows[0].texte });
            socket.broadcast.emit('textSuccess', { texte: rows[0].texte });
          }
        });
    });
  });
});



module.exports = router;
