const express = require('express');
const request = require('request');
const path = require('path');

const app = express();

// set static path
app.use(express.static(path.join(__dirname, 'public')));

// Render index.html on /
app.get('/', function (req, res) {
  res.render('index.html');
});

// Assign a port to listen on
app.listen(3000, function() {
	console.log("Server started on port 3000...");
});
