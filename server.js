var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var cfenv = require('cfenv');

app.use(express.static(__dirname + '/public'));

// dev use only
app.use(bodyParser.json());
app.post("/data", function(req, res) {
  var data = JSON.stringify(req.body, null, 2);
  var filename = req.query.filename;
  fs.writeFile("samples/" + filename + ".json", data, function(err) {
    if(err) {
      return console.log(err);
      res.status(500);
    }
    console.log("The file was saved!");
    res.status(200);
  });
});

var appEnv = cfenv.getAppEnv();

app.listen(appEnv.port, '0.0.0.0', function() {
  console.log("Server listening on " + appEnv.url);
});
