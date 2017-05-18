var express = require('express');
var app = express();
var cfenv = require('cfenv');

app.use(express.static(__dirname + '/public'));

var appEnv = cfenv.getAppEnv();

app.listen(appEnv.port, '0.0.0.0', function() {
  console.log("Server listening on " + appEnv.url);
});
