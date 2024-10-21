var express = require('express');
var router = express.Router();
var session = require('cookie-session');
let mySql = require('mysql');
var session = require('cookie-session');
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

router.use(session({
  secret: 'todotopsecret'
})).use(function(req, res, next){
  if (typeof(req.session.user) == 'undefined') {
    console.log('Création de la session');
    req.session.user = {
      id: 0,
      login: '',
      level: 0
    };
  }
  next();
}).get('/', function(req, res, next) {
  if (req.session.user.id == 0 && req.session.user.login == '') {
    res.render('pages/index', { title: 'Login', error: req.query.error });
  }
  else {
    let querystring = 'SELECT texte FROM Users WHERE BINARY login = "'+ req.session.user.login +'";';
    connection.query(querystring, function (err, rows, fields) {
      if (err) throw err;
      if(rows.length > 0)
      {
        switch (req.session.user.level) {
          case 3:
            querystring = 'SELECT * FROM Users;';
            connection.query(querystring, function (err, adminrows, fields) {
              if (err) throw err;
              res.render('pages/level3', { title: 'Level 3', texte: rows[0].texte, login: req.session.user.login, rows: adminrows });
            });
            break;
          case 2:
            res.render('pages/level2', { title: 'Level 2', texte: rows[0].texte, login: req.session.user.login });
            break;
          case 1:
            res.render('pages/level1', { title: 'Level 1', texte: rows[0].texte, login: req.session.user.login });
            break;
          default:
            res.render('pages/level0', { title: 'Level 0', texte: rows[0].texte, login: req.session.user.login });
            break;
        }
      }
    })
  }
}).post('/', function(req, res, next) {
  if (req.session.user.id == 0 && req.session.user.login == '') {
    // Nettoyage des données
  let log = req.body.login.replace(/"/g, '').replace(/'/g, '').replace(/;/g, '').replace(/`/g, '').replace(/%/g, '');
  let pass = req.body.password.replace(/"/g, '').replace(/'/g, '').replace(/;/g, '').replace(/`/g, '').replace(/%/g, '');

  // Création de la requête SQL
  let querystring = 'SELECT * FROM Users WHERE BINARY login = "'+ log +'" AND BINARY password = "'+ pass +'";';

  // Exécution de la requête
  connection.query(querystring, function (err, rows, fields) {
    if (err) throw err;
    // Si on a des résultats, on envoie les données de l'utilisateur
    if (rows.length > 0) {
      req.session.user.id = rows[0].id;
      req.session.user.login = rows[0].login;
      req.session.user.level = rows[0].level;
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
      console.log('redirection');
      res.redirect('/?error=1');
    }
  });
  }
}).post('/logout', function(req, res, next) {
  console.log('Déconnexion');
  req.session.user.id = 0;
  req.session.user.login = '';
  req.session.user.level = 0;
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