var width = window.innerWidth - 50;
var height =  window.innerHeight - 110;
var roundBy = 2;
var relativeCoordinates = {};

var x = function(stationLabel) {
  var data = relativeCoordinates[stationLabel]
  if (!data) {
    // console.log("No coordinates found for " + stationLabel);
    return -100;
  }
  var rel_x = Math.round(data["x"] * width * roundBy) / roundBy; // 0-1
  return rel_x;
}

var y = function(stationLabel) {
  var data = relativeCoordinates[stationLabel]
  if (!data) {
    // console.log("No coordinates found for " + stationLabel);
    return -100;
  }
  var rel_y = Math.round(data["y"] * height * roundBy) / roundBy; // 0-1
  return rel_y;
}

var color = function(line) {
  var colors = {
    "S1": "#60a92c",
    "S2": "#e3051b",
    "S3": "#ef7d00",
    "S4": "#005da9",
    "S5": "#009ed4",
    "S6": "#875300",
    "S60": "#969200"
  };
  return colors[line];
}

document.addEventListener("DOMContentLoaded", function() {
    update();
});

function updateSVG(startTime, endTime) {
  console.log("Requesting data from " + startTime + " until " + endTime);
  d3.queue()
    .defer(d3.json, "data/linecoordinates.json")
    .defer(d3.json, "https://vvs-delay-api.eu-de.mybluemix.net/db/entries?startTime=" + startTime + "&endTime=" + endTime + "&transform=true")
    .defer(d3.json, "data/stationlabels.json")
    .defer(d3.json, "data/pixel2station.json")
    .defer(d3.json, "data/new_coordinates.json")
    .defer(d3.json, "data/lines.json")
    .await(render);
}

function render(error, linecoord, apidata, stationlabels, pixel2station, coordinates, lines) {
  if (error) {
    console.log(error);
  } else {

    relativeCoordinates = coordinates;
    var keys = Object.keys(coordinates);
    var my_array = new Array();
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].endsWith("S6")) {
        my_array.push(keys[i]);
      }
    }
    console.log(my_array);
    var delayArrays = getDelayArrays(apidata.docs, stationlabels);
    var data = mergeData(lines.stationLines, delayArrays);

    d3.select(".canvas")
      .attr("width", width)
      .attr("height", height);

    drawMap(width, height, linecoord, lines.stationLines);
    draw(width, height, data);
  }
}

function getDelayArrays(data, stationlabels) {
  var result = {};
  data.forEach(function(doc) {
    doc.data.forEach(function(d) {
      var label = stationlabels[d.station];
      if (!result[label]) {
        result[label] = {};
      }
      d.departures.forEach(function(dept) {
        var delayArr = new Array();
        var line = dept.line;
        if (!result[label][line]) {
          result[label][line] = new Array();
        }
        dept.trains.forEach(function(train) {
          delayArr.push(train.delay);
        });
        result[label][line] = result[label][line].concat(delayArr);
      });
    });
  });
  return result;
}

function getAverage(array) {
  if (array.length == 0) {
    return 0;
  }
  var sum = 0;
  for (var i = 0; i < array.length; i++) {
    sum += parseInt(array[i], 10);
  }
  return Math.round((sum/array.length) * 10) / 10;
}

function mergeData(stations, delayArrays) {
  var result = new Array();
  var stationKeys = Object.keys(stations);
  stationKeys.forEach(function(station) {
    var allDelays = delayArrays[station];
    var lines = stations[station].lines;
    lines.forEach(function(line) {
      if (line != "S60") { // skip for now, as we switched to old net layout
        if (!allDelays || !allDelays[line]) {
          // console.log("No delay data for line " + line + " at " + station);
          result.push({
            "label": station + "_" + line
          });
        } else {
          result.push({
            "label": station + "_" + line,
            "average_delay": getAverage(allDelays[line])
          });
        }
      }
    });
  });
  return result;
}

function draw(width, height, data) {
  var minCircleSize = 5;
  var maxCircleSize = 50;
  var sizeScale = function(minutes) {
    if (!minutes) {
      return minCircleSize;
    }
    var scale = d3.scaleLinear()
      .domain([0, 20])
      .range([minCircleSize, maxCircleSize]);
    return scale(minutes);
  }

  var colorRange = function(d) {
    var line = d.label.split("_")[1];
    var scale = d3.scaleLinear()
      .domain([0, 20])
      .range([color(line), "black"]);
    if (!d.average_delay) {
      // no data -> white dot
      return "white";
    }
    // data -> line color, darker with increased delay
    return scale(d.average_delay);
  }

  var canvas = d3.select(".delays");
  canvas.selectAll("g").remove(); // clear old. no way around this^^
  console.log("data length");
  console.log(data.length);
  var station = canvas.selectAll("g")
    .data(data)
    .enter()
      .append("g")
        .attr("class", "station")
        .attr("label", function(d) { return d.label; })
        .attr("transform", function(d) {
          return "translate(" + x(d.label) + ", " + y(d.label) + ")";
        })
        .on('mouseover', function() {
          // this.parentElement.appendChild(this);
          this.classList.add("hovered");
        })
        .on('mouseout', function() {
          this.classList.remove("hovered");
        });
      // .append("text")
      //   .attr("class", "station-name")
      //   .attr("text-anchor", "middle")
      //   .attr("y", function(d) { return "-" + (sizeScale(d.average_delay) / 2 + 5); })
      //   .text(function(d) { return d.label; });

  d3.selectAll(".station")
    .append("circle")
    .attr("r", function(d) { return sizeScale(d.average_delay) / 2; })
    .attr("fill", colorRange)
    .attr("stroke", function(d) {
      var line = d.label.split("_")[1];
      return color(line);
    })
    .attr("stroke-width", function(d) {
      if (!d.average_delay) {
        return "1";
      } else {
        return "none";
      }
    })

  // station.each(function(d) {
  //   var group = d3.select(this);
  //
  //   var text = group.append("g")
  //     .attr("name", "texts")
  //     .selectAll("text")
  //     .data(d.delays);
  //   text.exit()
  //     .remove();
  //   text.enter()
  //     .append("text")
  //     .attr("text-anchor", "middle")
  //     .attr("x", function() {
  //       return sWidth(d3.select(this.parentNode).datum().delays.length)/2;
  //     })
  //     .attr("y", maxBarHeight + 10)
  //     .attr("class", function(d) { return "hidden line-info " + d.line; })
  //     .text(function(d) {
  //       return d.line + ": ø " + d.delay + "min delay";
  //     });
  //
  //   var rect = group.append("g")
  //     .attr("name", "rects")
  //     .selectAll("rect")
  //     .data(d.delays);
  //   rect.exit()
  //     .remove();
  //   rect.enter()
  //     .insert("rect", ":first-child")
  //     .attr("class", "bar")
  //     .attr("line", function(d) { return d.line; })
  //     .on('mouseover', function(d) {
  //       this.parentElement.appendChild(this);
  //       d3.select(this.parentElement.parentElement)
  //         .selectAll(".line-info." + d.line)
  //         .style("display", "block");
  //     })
  //     .on('mouseout', function(d) {
  //       d3.select(this.parentElement.parentElement)
  //         .selectAll(".line-info." + d.line)
  //         .style("display", "none");
  //     })
  //     .attr("width", squareSize)
  //     .attr("height", function(d) { return heightScale(d.delay); })
  //     .attr("fill", function(d) { return color(d.line); })
  //     .attr("transform", function(d, i) {
  //       return "translate(" + (i * overlap * squareSize) + ", 0)";
  //     });
  //

  // })
}

function drawMap(width, height, linecoordinates, stations) {
  var canvas = d3.select(".map")
    .attr("width", width)
    .attr("height", height);

  var line = d3.line()
    .x(function(d) { return x(d); })
    .y(function(d) { return y(d); });

  canvas.selectAll("path")
    .data(linecoordinates)
    .enter()
      .append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.points); })
      .attr("fill", "none")
      .attr("stroke", function(d) { return color(d.line); });

  console.log("drawMap");
  console.log(stations);
  var offsets_S1 = [
    "Herrenberg_S1", "Nufringen_S1", "Gärtringen_S1", "Ehningen_S1", "Hulb_S1", "Böblingen_S1", "Goldberg_S1", "Rohr_S1", "Vaihingen_S1", "Österfeld_S1", "Universität_S1", "Schwabstraße_S1", "Feuersee_S1", "Stadtmitte_S1", "Hauptbahnhof_S1", "Bad Cannstatt_S1"
  ]
  var offsets_S6 = [
    "Weil der Stadt_S6", "Malmsheim_S6", "Renningen_S6", "Rutesheim_S6", "Leonberg_S6", "Höfingen_S6", "Ditzingen_S6", "Weilimdorf_S6", "Korntal_S6"
  ]
  canvas.selectAll("text")
    .data(Object.keys(stations))
    .enter()
      .append("text")
      .text(function(d) { return d; })
      .attr("class", "station-name")
      .attr("transform", function(d) {
        var line = stations[d].lines[0];
        if (d == "Böblingen") {
          line = "S1";
        }
        if (d == "Backnang") {
          line = "S3";
        }
        var coordKey = d + "_" + line;
        var x_offset = 0;
        var y_offset = 0;
        if (offsets_S1.includes(coordKey)) {
          y_offset = 10;
        }
        if (offsets_S6.includes(coordKey)) {
          y_offset = 10;
        }
        if (coordKey == "Neuwirtshaus_S6") {
          x_offset = -100;
        }
        var xPos = x(coordKey) + x_offset;
        var yPos = y(coordKey) + y_offset;
        return "translate(" + (xPos + 10) + ", " + (yPos) + ")";
      })
}
