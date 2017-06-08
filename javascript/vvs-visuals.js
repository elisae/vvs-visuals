document.addEventListener("DOMContentLoaded", function() {
  update();
});

function updateSVG(startTime, endTime) {
  d3.queue()
    .defer(d3.json, "https://vvs-delay-api.eu-de.mybluemix.net/db/entries?startTime=" + startTime + "&endTime=" + endTime + "&transform=true")
    .defer(d3.json, "data/stationlabels.json")
    .defer(d3.json, "data/pixel2station.json")
    .defer(d3.json, "data/coordinates.json")
    .defer(d3.json, "data/lines.json")
    .await(render);
}

function render(error, apidata, stationlabels, pixel2station, coordinates, lines) {
  if (error) {
    console.log(error);
  } else {
    var delayArrays = getDelayArrays(apidata.docs, stationlabels);
    var data = mergeData(pixel2station, coordinates.relative, lines, delayArrays);
    draw(window.innerWidth - 20, window.innerHeight - 20, data);
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

function mergeData(pixel2station, coordinates, lines, delayArrays) {
  console.log(delayArrays);
  var result = new Array();
  Object.keys(pixel2station).forEach(function(k1) {
    var entry = pixel2station[k1];
    Object.keys(entry).forEach(function(k2) {
      var stationName = entry[k2];
      if (lines[stationName]) {
        var stationLines = lines[stationName].lines;
        var delays = new Array();
        stationLines.forEach(function(line) {
          // TODO: retrieve from matrix
          if (delayArrays[stationName] && delayArrays[stationName][line]) {
            var avgDelay = getAverage(delayArrays[stationName][line]);
            delays.push({line: line, delay: avgDelay});
          } else {
          //  console.log("No data for line " + line + " at '" + stationName + "'");
          }
        })
        result.push({
          "label": stationName,
          "matrix_x": parseInt(k1), // 0-15
          "matrix_y": parseInt(k2), // 0-86
          "rel_x": Math.round(coordinates[stationName]["x"] * 100) / 100, // 0-1
          "rel_y": Math.round(coordinates[stationName]["y"] * 100) / 100, // 0-1
          "delays": delays
        });
      }
    });
  });
  return result;
}

function draw(width, height, data) {
  console.log("Drawing");
  var colors = {
    "S1": "#60a92c",
    "S2": "#e3051b",
    "S3": "#ef7d00",
    "S4": "#005da9",
    "S5": "#009ed4",
    "S6": "#875300",
    "S60": "#969200"
  }
  var squareSize = 10;
  var overlap = 3/4;
  var maxBarHeight = 25;
  var sWidth = function(barCount) {
    return barCount * overlap * squareSize;
  }
  var heightScale = d3.scaleLinear()
    .domain([0, 10])
    .range([2, maxBarHeight]);

  var canvas = d3.select(".canvas")
    .attr("width", width)
    .attr("height", height);

  canvas.selectAll("g").remove(); // clear old. no way around this^^

  var station = canvas.selectAll("g")
    .data(data)
    .enter()
      .append("g")
        .attr("class", "station")
        .attr("x", function(d) { return d.matrix_x; })
        .attr("y", function(d) { return d.matrix_y; })
        .attr("transform", function(d) {
          var xpos = d.rel_x * width - 10;
          var ypos = d.rel_y * height - 10;
          return "translate(" + xpos + ", " + ypos + ")";
        })
        .on('mouseover', function() {
          this.parentElement.appendChild(this);
          this.classList.add("hovered");
        })
        .on('mouseout', function() {
          this.classList.remove("hovered");
        });

  station.each(function(d) {
    var group = d3.select(this);

    var text = group.append("g")
      .attr("name", "texts")
      .selectAll("text")
      .data(d.delays);
    text.exit()
      .remove();
    text.enter()
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", function() {
        return sWidth(d3.select(this.parentNode).datum().delays.length)/2;
      })
      .attr("y", maxBarHeight + 10)
      .attr("class", function(d) { return "hidden line-info " + d.line; })
      .text(function(d) {
        return d.line + ": ø " + d.delay + "min delay";
      });

    var rect = group.append("g")
      .attr("name", "rects")
      .selectAll("rect")
      .data(d.delays);
    rect.exit()
      .remove();
    rect.enter()
      .insert("rect", ":first-child")
      .attr("class", "bar")
      .attr("line", function(d) { return d.line; })
      .on('mouseover', function(d) {
        this.parentElement.appendChild(this);
        d3.select(this.parentElement.parentElement)
          .selectAll(".line-info." + d.line)
          .style("display", "block");
      })
      .on('mouseout', function(d) {
        d3.select(this.parentElement.parentElement)
          .selectAll(".line-info." + d.line)
          .style("display", "none");
      })
      .attr("width", squareSize)
      .attr("height", function(d) { return heightScale(d.delay); })
      .attr("fill", function(d) { return colors[d.line]; })
      .attr("transform", function(d, i) {
        return "translate(" + (i * overlap * squareSize) + ", 0)";
      });

    group.append("line")
      .attr("x1", -3)
      .attr("y1", 0)
      .attr("x2", function(d) { return sWidth(d.delays.length) + 6; })
      .attr("y2", 0);

    group.append("text")
      .attr("class", "station-name")
      .attr("text-anchor", "middle")
      .attr("x", function(d) { return sWidth(d.delays.length)/2; })
      .attr("y", "-" + squareSize)
      .text(function(d) { return d.label; });
  })
}
