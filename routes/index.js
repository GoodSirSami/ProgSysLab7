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

io.on('connection', function(socket) {
  socket.on('login', function(data) {
    let querystring = 'SELECT level, texte FROM Users WHERE login = "'+ data.login +'" AND password = "'+data.password+'";';
    connection.query(querystring, function (err, rows, fields) {
      if (err) throw err;
      console.table(rows);
    });
  });
});


connection.connect(function (err) {
  if (err) throw err;
  console.log('Vous êtes connecté à votre BDD...');
  let querystring = 'SELECT * FROM Users';
  connection.query(querystring, function (err, rows, fields) {
    if (err) throw err;
    console.table(rows);
  });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  
  res.render('pages/index', { title: 'Login' });
});

module.exports = router;
