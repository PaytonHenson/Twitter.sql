'use strict';
var express = require('express');
var router = express.Router();
//var tweetBank = require('../tweetBank');

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
  //Helper function posts a new tweet and redirectes to homepage
  function postTweet(userid, username, content, res){

    client.query('INSERT INTO tweets (userId, content) VALUES ($1, $2)', [userid, content], function(err, data) {

          if (err) return next(err);

          io.sockets.emit('new_tweet', {name: username, content: content});

          res.redirect('/');

    });
  }

  function queryTweet(username, tweetid, res, next){

    var queryString = 'SELECT users.pictureurl, tweets.id, users.name, tweets.content FROM tweets JOIN users ON users.id = userid WHERE ';

    if(tweetid === null) {

      queryString += 'name=$1';

      var tweetval = username;
    }

    else {

      queryString +='tweets.id=$1';

      var tweetval = tweetid;
    }

    client.query(queryString, [tweetval], function(err, results){

        if (err) return next(err);

        var tweets = results.rows;

        res.render('index', {

        username: username,

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
    queryTweet(req.params.username, null, res, next);
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    queryTweet(null, req.params.id, res, next);
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){

    req.body.name = req.body.name.trim();

    client.query('SELECT users.id FROM users WHERE users.name = $1', [req.body.name], function(err, data) {

      if(err) return next(err);

      else if(data.rows[0] === undefined){

        client.query('INSERT INTO users (name) VALUES ($1) RETURNING id', [req.body.name], function(err, content){

            if(err) return next(err);

            postTweet(content.rows[0].id, req.body.name, req.body.content, res);
        });

      }

      else {
        postTweet(data.rows[0].id, req.body.name, req.body.content, res);
      }

    });

  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
