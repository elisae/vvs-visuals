document.addEventListener("DOMContentLoaded", function(){

	d3.json("data/sample-matrix.json", function(err, matrix) {
		if (err) {
			console.log(err);
		} else {
			var width = 800, height = 350;
			var data = matrix.S2
			var squareSize = Math.min(Math.floor(width/data[0].length), // rowCount
																Math.floor(height/data.length));  // colCount
			var grid = transformMatrix(data, squareSize);

			var color_scale = d3.scaleLinear()
				.domain([0, max([matrix.S1, matrix.S2])])
				.range([d3.rgb(255, 255, 255), d3.rgb(255, 0, 0)]);

			var row = d3.select(".grid")
				.attr("width", width)
				.attr("height", height)
				.selectAll(".row")
		    .data(grid)
		    .enter().append("g")
		    	.attr("class", "row");

			var column = row.selectAll(".square")
		    .data(function(d) { return d; })
		    .enter().append("g")
					.attr("class", "square")
					.attr("transform", function(d) {
						return "translate(" + d.x + ", " + d.y + ")";
					})

			column.append("rect")
			    .attr("width", squareSize)
			    .attr("height", squareSize)
					.attr("fill", function(d) {
						return color_scale(d.value);
					})
			column.append("text")
			    .attr("x", squareSize/2)
			    .attr("y", squareSize/2)
					.attr("text-anchor", "middle")
					.attr("alignment-baseline", "central")
					.attr("fill", function(d) {
						if (d.value == 0) {
							return "lightgrey";
						} else {
							return "white";
						}
					})
					.text(function(d) { return d.value; });
		}
	});
});

function max(data) {
	// data is multidimensional
	if (Array.isArray(data[0])) {
		var maximums = []
		for (var i = 0; i < data.length; i++) {
			maximums.push(max(data[i]));
		}
		return d3.max(maximums);
	} else {
		// data is a 1D-array
		return d3.max(data);
	}
}

function type(d) {
	d.value = +d.value; // coerce to number
	return d;
}

function getSquareSize(colCount, rowCount, totalWidth, totalHeight) {
	return
}

// transform 2D numeric matrix
function transformMatrix(data, squareSize) {
	var result = new Array();
	var xpos = 1;
	var ypos = 1;

	for (var x = 0; x < data.length; x++) {
		result.push(new Array());

		for (var y = 0; y < data[x].length; y++) {
			result[x].push({
				x: xpos,
				y: ypos,
				value: data[x][y]
			})
			xpos += squareSize;
		}

		xpos = 1;
		ypos += squareSize;
	}

	return result;
}
