document.addEventListener("DOMContentLoaded", function() {
  d3.json('../data/pixel2station.json', function(err, res) {
    if (err) {
      console.log(err);
    }
    var grid = transformGrid(res);
    console.log(grid);
  });
});

// input: pixel2station.json Object
// output: 2D matrix
function transformGrid(grid) {
	var result = new Array();
	var columnKeysAsInt = new Array();
	var columnKeysAsInt2 = new Array();
	var keys = Object.keys(grid);

	keys.forEach(function(key) {
    Object.keys(grid[key]).forEach(function(k) {
      columnKeysAsInt.push(parseInt(k));
    });
	});
	var rowCount = d3.max(columnKeysAsInt);
  var colCount = keys.length;

  var width = window.innerWidth - 20, height = window.innerHeight - 20;
  var colWidth = width/colCount;
  var rowHeight = height/rowCount;
  var squareSize = Math.floor(Math.min(colWidth, rowHeight));

  var svgGrid = d3.select(".grid")
    .attr("width", width)
    .attr("height", height);

	for (var x = 0; x < colCount; x++) {
		var column = new Array();

		for (var y = 0; y < rowCount; y++) {
			var colKey = String(x); // TODO: should be same as grid[keys[x]];
			var rowKey = String(y);
			var station = grid[colKey][rowKey];
			if (station) {
        var xpos = x * squareSize;
        var ypos = y * squareSize;
        var g = svgGrid.append("g")
          .attr("class", "square")
          .attr("x", x)
          .attr("y", y)
          .attr("transform", "translate(" + xpos + ", " + ypos + ")")
          .on('mouseover', function() {
            this.parentElement.appendChild(this);
            this.classList.add("hovered");
          })
          .on('mouseout', function() {
            this.classList.remove("hovered");
          });
        g.append("rect")
          .attr("width", squareSize)
			    .attr("height", squareSize);
        g.append("text")
          .attr("text-anchor", "middle")
          .attr("y", "-" + squareSize/2)
          .text(station);

				column.push(station);
			} else {
				column.push("");
			}
		}
		result.push(column);
	}
	return result;
}
