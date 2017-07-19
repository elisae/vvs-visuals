// *** DATA STUFF ***
// --- Constants ---
var relativeCoordinates;
var linepoints;
var linesPerStation;
var idToStation;

// --- Helpers ---
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

// --- Action ---
document.addEventListener("DOMContentLoaded", function() {
  loadJSONData();
  updateSVG(getTimeframe());
});

function loadJSONData() {
  console.log("Loading JSON data");
  d3.queue()
    .defer(d3.json, "data/linepoints.json")
    .defer(d3.json, "data/idToStation.json")
    .defer(d3.json, "data/relativeCoordinates.json")
    .defer(d3.json, "data/linesPerStation.json")
    .await(function(error, lpts, id2s, relCoor, lps) {
      linepoints = lpts;
      idToStation = id2s;
      relativeCoordinates = relCoor;
      linesPerStation = lps;
      drawMap();
    });
}

function updateSVG(timeframe) {
  var startTime = timeframe.startTime;
  var endTime = timeframe.endTime;
  console.log("Requesting API data from " + startTime + " until " + endTime);
  d3.json(
    "https://vvs-delay-api.eu-de.mybluemix.net/db/entries?startTime=" + startTime + "&endTime=" + endTime + "&transform=true",
    function(error, apiData) {
      if (error) {
        console.log(error);
        alert("Something went wrong while loading API data. Please try again later.");
        return;
      } else {
        // wait for JSON data to be loaded
        var retries = 0;
        while (retries < 10) {
          if (!(idToStation && linepoints
            && linesPerStation && relativeCoordinates)) {
              setTimeout(function() {
                retries++;
              }, 100);
          } else {
            var drawingData = transform(apiData);
            draw(drawingData);
            return;
          }
        }
        alert("Something went wrong while loading JSON data. Please contact developer.");
      }
    });
}

function transform(apidata) {
  var delayArrays = getDelayArrays(apidata.docs, idToStation);
  var data = mergeData(linesPerStation, delayArrays);
  return data;
}

function getDelayArrays(data, idToStation) {
  var result = {};
  data.forEach(function(doc) {
    doc.data.forEach(function(d) {
      var label = idToStation[d.station];
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


// *** SVG STUFF ***
// --- Constants ---
var width = window.innerWidth - 20;
var height = window.innerHeight - 100;
var roundBy = 2;
// adjust coordinates so as to fit perfectly on screen
var relativeOffsets = {
  x: -0.027,
  y: -0.0
}

function color(line) {
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

// --- Helpers ---
function x(stationLabel) {
  return calcAbsCoord(stationLabel, "x", width);
}
function y(stationLabel) {
  return calcAbsCoord(stationLabel, "y", height);
}
function calcAbsCoord(label, x_or_y, totalSize) {
  var relPos = relativeCoordinates[label];
  if (!relPos) {
    // console.log("No coordinates found for " + label);
    return -100;
  }
  var coord = relPos[x_or_y] + relativeOffsets[x_or_y];
  var absCoord = Math.round(coord * totalSize * roundBy) / roundBy; // 0-1
  return absCoord;
}

// --- Action ---
function draw(data) {
  console.log("Drawing delays");
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
          this.parentElement.appendChild(this);
          this.classList.add("hovered");
        })
        .on('mouseout', function() {
          this.classList.remove("hovered");
        });

  var station = d3.selectAll(".station");

  station.append("circle")
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
    });

  station.append("rect")
    .attr("class", function(d) { return "delay-rect"; });

  station.append("text")
    .attr("class", function(d) { return "delay-info"; })
    .attr("y", -15)
    .text(function(d) {
      if (d.average_delay) {
        return "ø " + d.average_delay + "min";
      } else {
        return "no data";
      }
    });

  d3.selectAll(".delay-rect")
    .attr("x", function(d) { return this.parentNode.getBBox().x - 5; })
    .attr("y", function(d) { return this.parentNode.getBBox().y - 5; })
    .attr("width", function(d) { return this.parentNode.getBBox().width + 10; })
    .attr("height", function(d) { return (this.parentNode.getBBox().height / 2) + 10; });
}

function drawMap() {
  console.log("Drawing Map");

  d3.select(".canvas")
    .attr("width", width)
    .attr("height", height);

  var canvas = d3.select(".map")

  var line = d3.line()
    .x(function(d) { return x(d); })
    .y(function(d) { return y(d); });

  canvas.selectAll("path")
    .data(linepoints)
    .enter()
      .append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.points); })
      .attr("fill", "none")
      .attr("stroke", function(d) { return color(d.line); });

  // at these stations default offset looks crooked
  var offsets_S1 = [
    "Herrenberg_S1", "Nufringen_S1", "Gärtringen_S1", "Ehningen_S1", "Hulb_S1", "Böblingen_S1", "Goldberg_S1", "Rohr_S1", "Vaihingen_S1", "Österfeld_S1", "Universität_S1", "Schwabstraße_S1", "Feuersee_S1", "Stadtmitte_S1", "Hauptbahnhof_S1", "Bad Cannstatt_S1"
  ]
  var offsets_S6 = [
    "Weil der Stadt_S6", "Malmsheim_S6", "Renningen_S6", "Rutesheim_S6", "Leonberg_S6", "Höfingen_S6", "Ditzingen_S6", "Weilimdorf_S6", "Korntal_S6"
  ]
  var offsets_S2 = [
    "Waiblingen_S2", "Fellbach_S2", "Sommerrain_S2", "Nürnberger Straße_S2"
  ]

  canvas.selectAll("text.station-name")
    .data(Object.keys(linesPerStation))
    .enter()
      .append("text")
      .text(function(d) { return d; })
      .attr("class", "station-name")
      .attr("transform", function(d) {
        var line = linesPerStation[d].lines[0]; // pick any line point to label

        // except for these stations (optical reasons)
        if (d == "Böblingen") {
          line = "S1";
        }
        if (d == "Backnang") {
          line = "S3";
        }

        var coordKey = d + "_" + line;
        var x_offset = 0;
        var y_offset = 0;

        // fix crooked label for these stations
        if (offsets_S1.includes(coordKey)) {
          y_offset = 10;
        }
        if (offsets_S6.includes(coordKey)) {
          y_offset = 10;
        }
        if (offsets_S2.includes(coordKey)) {
          y_offset = 10;
        }
        if (coordKey == "Neuwirtshaus_S6") {
          x_offset = -90;
        }

        var xPos = x(coordKey) + x_offset;
        var yPos = y(coordKey) + y_offset;
        return "translate(" + (xPos + 8) + ", " + (yPos) + ")";
      });

  function endstationCoord(label) {
    var groupAbove = [
      "Marbach (N)_S4", "Bietigheim-Bissingen_S5", "Weil der Stadt_S6", "Herrenberg_S1", "Backnang_S3"
    ]
    var xPos = x(label);
    var yPos = y(label);
    if (groupAbove.includes(label)) {
      xPos -= 10;
      yPos -= 10;
    } else {
      xPos -= 20;
      yPos += 10;
    }
    return {
      x: xPos,
      y: yPos
    }
  }
  var endstationData = new Array();

  for (var i = 0; i < linepoints.length; i++) {
    var first = linepoints[i].points[0];
    var last = linepoints[i].points[linepoints[i].points.length - 1];
    var line = linepoints[i].line;
    endstationData.push({
      label: line,
      coord: endstationCoord(first)
    });
    endstationData.push({
      label: line,
      coord: endstationCoord(last)
    });
  }

  canvas.selectAll("text.endstation")
    .data(endstationData).enter()
    .append("text")
      .text(function(d) { return d.label; })
      .attr("class", "endstation")
      .attr("fill", function(d) { return color(d.label); })
      .attr("transform", function(d) {
        return "translate(" + d.coord.x + ", " + d.coord.y + ")"; }
      );
}
