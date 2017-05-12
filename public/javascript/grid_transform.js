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

  var width = 350, height = 610;
  var colWidth = width/colCount;
  var rowHeight = height/rowCount;
  var squareSize = Math.min(Math.floor(colWidth), Math.floor(rowHeight));

  var svgGrid = d3.select(".grid")
    .attr("width", width)
    .attr("height", height);

	for (var x = 0; x < colCount; x++) {
		var column = new Array();
    var svgColumn = svgGrid.append("g").attr("class", "col");

		for (var y = 0; y < rowCount; y++) {
			var colKey = String(x); // TODO: should be same as grid[keys[x]];
			var rowKey = String(y);
			var station = grid[colKey][rowKey];
			if (station) {
        var xpos = x * squareSize;
        var ypos = y * squareSize;
        svgColumn.append("rect")
          .attr("class", "square")
          .attr("width", squareSize)
			    .attr("height", squareSize)
					.attr("fill", "steelblue")
          .attr("transform", "translate(" + xpos + ", " + ypos + ")");

				column.push(station);
			} else {
				column.push("");
			}
		}
		result.push(column);
	}
	return result;
}
