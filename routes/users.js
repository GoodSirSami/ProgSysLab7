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
    let querystring = 'SELECT * FROM Users WHERE BINARY login = "'+ log +'" AND BINARY password = "'+ pass +'";';

    // Exécution de la requête
    connection.query(querystring, function (err, rows, fields) {
      if (err) throw err;
      // Si on a des résultats, on envoie les données de l'utilisateur
      if (rows.length > 0) {
        switch (rows[0].level) {
          case 3:
            querystring = 'SELECT * FROM Users;';
            connection.query(querystring, function (err, adminrows, fields) {
              if (err) throw err;
              res.render('pages/level3', { title: 'Level 3', texte: rows[0].texte, login: rows[0].login, rows: adminrows });
            });
            break;
          case 2:
            res.render('pages/level2', { title: 'Level 2', texte: rows[0].texte, login: rows[0].login });
            break;
          case 1:
            res.render('pages/level1', { title: 'Level 1', texte: rows[0].texte, login: rows[0].login });
            break;
          default:
            res.render('pages/level0', { title: 'Level 0', texte: rows[0].texte, login: rows[0].login });
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
    let texte = '';
    if(data.texte)
    {
      texte = data.texte.replace(/"/g, '').replace(/'/g, '').replace(/;/g, '').replace(/`/g, '').replace(/%/g, '');
      texte = texte.slice(0, 250);
    }
    let querystring = 'UPDATE Users SET texte = "'+ texte +'" WHERE login = "'+ data.login +'";';
    connection.query(querystring, function (err, rows, fields) {
      if (err) throw err;
      querystring = 'SELECT texte FROM Users WHERE login = "'+ data.login +'";';
      connection.query(querystring, function (err, rows, fields) {
        if (err) throw err;
        if(rows.length > 0)
        {
          socket.emit('textSuccess', { texte: rows[0].texte, login: data.login });
          socket.broadcast.emit('textSuccess', { texte: rows[0].texte, login: data.login });
        }
      });
    });
  });
  socket.on('changePassword', function(data){
    let password = '';
    if(data.password)
    {
      password = data.password.replace(/"/g, '').replace(/'/g, '').replace(/;/g, '').replace(/`/g, '').replace(/%/g, '');
      password = password.slice(0, 250);
    }
    let querystring = 'UPDATE Users SET password = "'+ password +'" WHERE login = "'+ data.login +'";';
    connection.query(querystring, function (err, rows, fields) {
      if (err) throw err;
      socket.emit('passwordSuccess', { login: data.login });
      socket.broadcast.emit('passwordSuccess', { login: data.login });
    });
  });
});

module.exports = router;
