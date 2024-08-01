var Calendar = function(o) {
	//Store div id
	this.iso = o.iso;

	this.target = o.target;

	this.selector = o.selector;
	// Days of week, starting on Sunday
	this.DaysOfWeek = o.DaysOfWeek;

	// Months, stating on January
	this.Months = o.Months;
	
	// Set the current month, year
	var d = new Date();
	
	this.CurrentMonth = d.getMonth();
	
	this.CurrentYear = d.getFullYear();
	
	var f = o.Format;
	
	
	//this.f = typeof(f) == 'string' ? f.charAt(0).toUpperCase() : 'M';
	if (typeof(f) == 'string') {
		this.f = f.charAt(0).toUpperCase();
	} else {
		this.f = 'M';
	}
	
};

// Goes to next month
Calendar.prototype.nextMonth = function() {
	if (this.CurrentMonth == 11) {
		
		this.CurrentMonth = 0;
		
		
		this.CurrentYear = this.CurrentYear + 1;
		
	} else {
		
		this.CurrentMonth = this.CurrentMonth + 1;
		
	}
	this.showCurrent();
};

// Goes to previous month
Calendar.prototype.previousMonth = function() {
	if (this.CurrentMonth == 0) {
		
		this.CurrentMonth = 11;
		
		
		this.CurrentYear = this.CurrentYear - 1;
		
	} else {
		
		this.CurrentMonth = this.CurrentMonth - 1;
		
	}
	this.showCurrent();
};
// 
Calendar.prototype.previousYear = function() {
	this.CurrentYear = this.CurrentYear - 1;
	
	this.showCurrent();
}
// 
Calendar.prototype.nextYear = function() {
	this.CurrentYear = this.CurrentYear + 1;
	
	this.showCurrent();
}


// Show current month
Calendar.prototype.showCurrent = function() {
	this.Calendar(this.CurrentYear, this.CurrentMonth);
};

// Show month (year, month)
Calendar.prototype.Calendar = function(y, m) {
	typeof(y) == 'number' ? this.CurrentYear = y: null;
	
	typeof(y) == 'number' ? this.CurrentMonth = m: null;
	
	// 1st day of the selected month
	var firstDayOfCurrentMonth = new Date(y, m, 1).getDay();
	
	// Last date of the selected month
	var lastDateOfCurrentMonth = new Date(y, m + 1, 0).getDate();
	
	var lastDateOfLastMonth = m == 0 ? new Date(y - 1, 11, 0).getDate() : new Date(y, m, 0).getDate();
	
	var monthandyearhtml = '<span><em class="year">' + y + '</em> <em class="month">' + this.Months[m] + '</em></span>';
	
	var html = '<table>';

	html += '<thead>\
		<tr>';

	for (var i = 0; i < 7; i++) {
		var className = "";

		if(this.iso && i == 0){
			className += " sunday"
		}else if(!this.iso && i == 6){
			className += " sunday"
		}
		
		html += '<th class="'+className+'">' + this.DaysOfWeek[i] + '</th>';
	}
	html += '</tr>\
	</thead>';
	
	//this.f = 'X';
	var week = this.iso ? -6 : -5;
	var weekend = this.iso ? 1 : 2;

	var p = dm = this.f == 'M' ? 1 : firstDayOfCurrentMonth == 0 ? week : weekend;

	var regionDate = new Date() - new Date().getTimezoneOffset() * 60 * 1000;
	var current = new Date(regionDate).toISOString().split("T")[0];


	// var currentDate = new Date().toISOString().split("T")[0].split("-");
	// 	currentDate = currentDate[0]+"-"+currentDate[1];
	
	var pathname = window.location.pathname;
	
	var cellvalue;
	for (var d, i = 0, z0 = 0; z0 < 6; z0++) {
		html += '<tr data-index="'+z0+'">';
		
		for (var z0a = 0; z0a < 7; z0a++) {
			d = i + dm - firstDayOfCurrentMonth;
			
			// Dates from prev month
			if (d < 1) {
				cellvalue = lastDateOfLastMonth - firstDayOfCurrentMonth + p++;
				
				html += '<td class="prevmonthdates">' + '<span>' + (cellvalue) + '</span>' + '</td>';
				// Dates from next month
			} else if (d > lastDateOfCurrentMonth) {
				var className = "calendarDay";
				var date = p+"";
				if(date.length != 2){
					day = y + "-" + this.Months[m] + "-0" + date;
				}else{
					date = y + "-" + this.Months[m] + "-" + date;
				}

				if(current == date){
					className += " current on";

					html = html.replace('<tr data-index="'+z0+'">', '<tr class="current" data-index="'+z0+'">');
				}

				if(window.location.search.indexOf(date) > -1){
					className += " on";
				}
				
				// html += '<td class="nextmonthdates" class="'+className+'"><a href="'+pathname+'?id='+date+'">' + (p++) + '</a></td>';
				html += '<td class="nextmonthdates" class="'+className+'"><span class="day">' + (p++) + '</span><ul></ul></td>';
				
				// Current month dates
			} else {
				var className = "calendarDay";
				var date = d+"";
				if(date.length != 2){
					date = y + "-" + this.Months[m] + "-0" + date;
				}else{
					date = y + "-" + this.Months[m] + "-" + date;
				}

				if(z0a == 0){
					className += " sunday";
				}

				if(current == date){
					className += " current on ";

					html = html.replace('<tr data-index="'+z0+'">', '<tr class="current" data-index="'+z0+'">');
				}

				

				if(window.location.search.indexOf(date) > -1){
					className += " on";
				}

				// html += '<td data-date="'+date+'" class="'+className+'"><a href="'+pathname+'?id='+date+'">' + (d) + '</a></td>';
				html += '<td data-date="'+date+'" class="'+className+'"><span class="day">' + (d) + '</span><ul></ul></td>';
				
				p = 1;
				
			}
			if (i % 7 == 6 && d >= lastDateOfCurrentMonth) {
				z0 = 10; // no more rows
			}
			
			i++;
		}
		html += '</tr>';
	}
	// Closes table
	html += '</table>';

	// Write HTML to the div

	if(this.target){
		var $target = $(this.target).find(this.selector);
			$target.html(html);
	}else{
		var $target = $(this.selector);
			$target.html(html);
	}

	$($target).closest("calendar").find(".currentDate").html(monthandyearhtml);
};