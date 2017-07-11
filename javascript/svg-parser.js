function parseNetSVG(netSVG) {
  var width = 1108.02;
  var height = 601.22;
  var paths = netSVG.getElementsByTagName("svg")[0].getElementById("layer2").getElementsByTagName("path");
  var result = new Array();
  var keys = ["S4", "S5", "S6", "S1", "S3", "S2"];
  for (var i = 0; i < paths.length; i++) {
    var d = paths[i].getAttribute("d");
    var points = d.split(" ");
    points.shift();
    var xys = new Array();
    for (var j = 0; j < points.length; j++) {
      var xy = points[j].split(",");
      xys.push({
        x: xy[0]/width,
        y: xy[1]/height
      });
    }
    result.push({
      line: keys[i],
      points: xys
    });
  }
  return result;
}
