'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');

module.exports = function makeRouterWithSockets (io, client) {

  // a reusable function
  function respondWithAllTweets (req, res, next){

    client.query('SELECT users.pictureurl, tweets.id, users.name, tweets.content  FROM tweets INNER JOIN users ON users.id=tweets.userid', function (err, results) {

      if (err) return next(err);

      var tweets = results.rows;

      res.render('index', {

      title: 'Twitter.js',

      tweets: tweets,

      showForm: true

      });

    });

  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){

    client.query('SELECT users.pictureurl, tweets.id, users.name, tweets.content FROM tweets JOIN users ON users.id = userid WHERE name=$1', [req.params.username], function(err, results){

      if (err) return next(err);

      var tweets = results.rows;

      res.render('index', {

      username: req.params.username,

      title: 'Twitter.js',

      tweets: tweets,

      showForm: true

      });

    });

  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    client.query('SELECT tweets.id, users.name, tweets.content FROM tweets  JOIN users ON users.id = userid WHERE tweets.id=$1', [req.params.id], function(err, results){

      if (err) return next(err);

      var tweets = results.rows;

      res.render('index', {

      title: 'Twitter.js',

      tweets: tweets,

      showForm: true

      });

    });

  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){

    if(err) return next(err);

    req.body.name = req.body.name.trim();
    //var newTweet = tweetBank.add(req.body.name, req.body.content);
    client.query('SELECT users.id FROM users WHERE users.name = $1', [req.body.name], function(err, data) {
      console.log('name', req.body.name);
      console.log(data.rows[0]);
      if(err) return next(err);

      else if(data.rows[0] === undefined){

        console.log('rows',data.rows);
        client.query('INSERT INTO users (name) VALUES ($1) RETURNING id', [req.body.name], function(err, content){

            if(err) return next(err);

            client.query('INSERT INTO tweets (userId, content) VALUES ($1, $2)', [content.rows[0].id, req.body.content], function(err, data) {

              if(err) return next(err);

              io.sockets.emit('new_tweet', {name: req.body.name, content: req.body.content});

              res.redirect('/');
            });
        });

      // client.query('INSERT INTO tweets (userId, content, id) VALUES ($1, $2, DEFAULT)', [data.rows[0].id, req.body.content], function(err, data) {

      //     io.sockets.emit('new_tweet', {name: req.body.name, content: req.body.content});

      //     res.redirect('/');
      // });
      }

      else {
        client.query('INSERT INTO tweets (userId, content) VALUES ($1, $2)', [data.rows[0].id, req.body.content], function(err, data) {

          if (err) return next(err);

          io.sockets.emit('new_tweet', {name: req.body.name, content: req.body.content});

          res.redirect('/');
        });
      }
  });});

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
