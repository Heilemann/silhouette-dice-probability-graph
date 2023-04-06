function prepare() {
	// Global vars
	maxskill = 5;
	dietype = parseInt($('#dietype').val());

	if ($('#rdl').val() == 'gritty') {
		bonusthreshold = dietype + 1;

  } else if ($('#rdl').val() == 'adventurous') {
		bonusthreshold = dietype;

  } else if ($('#rdl').val() == 'cinematic') {
		bonusthreshold = dietype - 1;
  }

	silhouette();
}

// The Magic
function silhouette() {
  // Don't include bonus rows unless needed
	if (bonusthreshold > dietype) {
		rows = dietype; // Gritty RDL
  } else {
		rows = dietype + (maxskill - 1); // Non-Gritty RDL
  }

	cols = maxskill + 1; // Skill levels to calculate


	// Iterate through skill levels
	var skillmatrix = new Array(maxskill);

	for (skilllevel = 0; skilllevel <= maxskill; skilllevel++) {
		if (skilllevel == 0) {
			var dice = 2;
    } else {
			var dice = skilllevel;
    }

		// Create 'skillmatrix', cols = level of skill, rows = potential results
		var combinations = Math.pow(dietype, dice);
		skillmatrix[skilllevel] = new Array(combinations);

		for (combination = 0, pass = 1; combination < combinations; combination++) {
			// For each combination in each skill level, each dice
			skillmatrix[skilllevel][combination] = new Array(dice);

			// Fill in the rows of the result matrix
			for (die = 0; die < dice; die++) {
				var result = Math.ceil( (combination + 1) / Math.pow( dietype, die ) ) - (Math.floor( (combination ) / Math.pow(dietype, (die +1) ) ) * dietype);

				// Increment times we've passed the dietype threshold
				if (result > (dietype * pass)) {
          pass = pass + 1;
        }

				skillmatrix[skilllevel][combination][die] = result;
			}
		}
	}

	// Create Difficulty Threshold Label Array
	difficulty = ['Moronic', 'Routine', 'Easy', 'Moderate', 'Challenging', 'Difficult', 'Very Difficult', 'Extremely Difficult', 'Near Impossible', 'Divine Intervention'];

	// Create 2D array w. die poolsize (columns) and highest achievable result (rows), the crosssection of which is the possibility between the two
	probabilities = new Array(rows);
	for (h = 0; h < rows; h++) probabilities[h] = new Array(cols);
	for (row = 0; row <= rows; row++)
		for (col = 0; col < cols; col++)
			probabilities[col][row] = 0;

	// Now start comparing the values and look for highest values and increment the probabilities matrix
	for (i = 0; i < skillmatrix.length; i++) {

		for (j = 0; j < skillmatrix[i].length; j++) {
			var highest = '';
			var bonuses = -1;

			for (k = 0; k < skillmatrix[i][j].length; k++) {
				if (highest == '') {
					highest = skillmatrix[i][j][k];
        }

				if (i == 0) {
					highest = Math.min(highest, skillmatrix[i][j][k]);
        } else {
					highest = Math.max(highest, skillmatrix[i][j][k]);

					if (skillmatrix[i][j][k] >= bonusthreshold) {
            bonuses++;
          }
				}

			}

			var finalresult = highest + Math.max(bonuses, 0);
			probabilities[i][finalresult] = probabilities[i][finalresult] + 1;
		}
	}

	// Calculate commulative probabilities.
	for (col = 0; col < cols; col++) {
		var combinations = skillmatrix[col].length;

		for (row = 1; row <= rows; row++) {
			var count = 0;

			for (nextrow = row; nextrow <= rows; nextrow++)
				count = count + probabilities[col][nextrow];

			// Convert counted combinations to percentages, round to two digits
			probabilities[col][row] = Math.ceil((count / combinations) * 10000) / 100;
		}

	}

	// Output the results table
	buildTable()
}

function buildTable() {
	// Insert new tableasd
	$('#results').html('').append('<table style="width: 100%;"></table>')

	// Calculate average column width
	var columnwidth = 'width: '+ parseInt(100 / (maxskill + 2)) +'%';

	// Create table header
	var header ='<td class="header resultcolumn" style="'+columnwidth+'"></td>';
	for (col=0; col < cols; col++) {
		if (col == 0)
			var description = 'Untrained';
		else
			var description = 'Level&nbsp;'+col;

		header = header + '<td class="header header'+col+'" style="'+columnwidth+'">'+description+'</td>';
	}

	// Wipe slate clean
	$('#results table').append('<tr class="header">'+header+'</tr>')


	// Insert Fumble Chance row at top to fill out after rest of percentages are done
	$('#results table').append('<tr class="fumble"><td class="result">Fumble Chance</td></tr>')

	// Insert result rows
	for (row = 1; row <= rows; row++) {
		var adjustedthreshold = Math.ceil(( 6 / dietype ) * row ); // Adjust threshold to dietype in use

		if (!difficulty[adjustedthreshold] || description == difficulty[adjustedthreshold])
			var description = '';
		else
			var description = difficulty[adjustedthreshold];

		$('#results table').append('<tr id="row'+ row +'"><td class="result"><span class="description">'+ description +'</span>&nbsp;<span class="threshold">'+ row +'</span></td></tr>')

		// Insert skill level columns
		for (col = 0; col < cols; col++) {
			if (row > (dietype + Math.max(0, col -1)))
				$('#results table tr#row'+row).append('<td class="data column'+col+' na"></td>')
			else
				$('#results table tr#row'+row).append('<td class="data column'+col+'">'+ probabilities[col][row] +'</td>')
		}
	}


	// Output array to table
	for (col = 0; col < cols; col++)
		for (row = 1; row <= rows; row++) {
			if (isNaN($('#row'+row+' .column'+col).text())) continue;
			$('#row'+row+' .column'+col).text( probabilities[col][row] + '%')
		}


	// Fill in fumble percentages
	for (col = 0; col < cols; col++) {
		fumble = (parseFloat($('tr#row1 td.column'+ col).text()) - parseFloat($('tr#row2 td.column'+col).text()));

		fumble = roundNumber(fumble, 2);

		$('#results table tr.fumble').append('<td class="fumble data">'+ fumble +'%</td>')
	}


	// Insert Averages row at bottom...
	$('#results table').append('<tr class="average"><td class="result">Average Threshold</td></tr>')

	// ...and add Average results to said row
	for (col = 0; col < cols; col++) {
		var average = 0;

		for (row = 1; row <= rows; row++) {
			if (row == rows)
				average += $('tr#row'+ row +' td.result .threshold').text() * parseFloat($('tr#row'+ row +' td.column'+ col).text());
			else {
				var nextrow = row + 1;
				average += $('tr#row'+ row +' td.result .threshold').text() * (parseFloat($('tr#row'+ row +' td.column'+ col).text()) - parseFloat($('tr#row'+ nextrow +' td.column'+col).text()));
			}

		}

		average = Math.round(average) / 100;

		$('#results table tr.average').append('<td class="average data column'+ col +'">'+ average +'</td>')
	}


	// Insert Cost for Skill Level at bottom...
	$('#results table').append('<tr class="cost"><td class="result">Skill Point Cost</td></tr>')

	// ...now do the math and insert the numbers in that row
	for (col = 0; col < cols; col++) {
		if (col == 0)
			var cost = 0;
		else
			var cost = Math.pow(col, 2); // Simple skill cost. Complex is double, but nevermind that.

		$('#results table tr.cost').append('<td class="cost data column'+ col +'">'+ cost +'</td>')
	}


	// Insert Cost Per Average Point row at bottom...
	$('#results table').append('<tr class="cpap"><td class="result">Cost Per Average Point Increase</td></tr>')

	// ...now do the math and insert the numbers in that row
	for (col = 0; col < cols; col++) {
		if (col == 0)
			var cpap = 0;
		else {
			var cost = Math.pow(col, 2); // Simple skill cost. Complex is double, but nevermind that.
			var lastcol = col-1;
			var difference = parseFloat($('td.average.column'+ col).text()) - parseFloat($('td.average.column'+ lastcol).text());

			var cpap = roundNumber(cpap = 1 / difference * cost, 2); // Cost per average point
		}

		$('#results table tr.cpap').append('<td class="cpap data column'+ col +'">'+ cpap +'</td>')
	}


	drawGraph();
}

function drawGraph() {
	var skills = new Array(cols);

	// Fill each skill level's data into the 'skills' array: skills[skill level][probability]
	// col = skill level, row = result
	for (col=0; col < cols; col++) {
		skills[col] = new Array();

		for (row=1; row <= rows; row++) {
			if (parseFloat(probabilities[col][row]) == 0) {
				skills[col][row] = [row, null];
      } else {
				skills[col][row] = [row, parseFloat(probabilities[col][row])];
      }
		}
	}

	dataset = [];

	for (col=0; col < cols; col++)
		dataset[col] = {
			label: "Level "+col,
			data: skills[col],
			shadowSize: 1,
			lines: {
        show: true,
        lineWidth: 2
      },
			points: {
        show: true,
        fill: true
      }
		};

	// Draw that motherfucker!: ^ percentage > result
	$.plot($('#graph'), dataset, { xaxis: { max: dietype + maxskill -1 } });

	$('#graph, #results').show()
}

function roundNumber(num, dec) {
	return Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
}

function init() {
	$('select').change(prepare);

	$('#graph, #results').hide()

	prepare();
}

$(document).ready(init);