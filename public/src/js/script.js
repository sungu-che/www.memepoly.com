function time_ago(time) {

	switch (typeof time) {
		case 'number':
			break;
		case 'string':
			time = +new Date(time);
			break;
		case 'object':
			if (time.constructor === Date) time = time.getTime();
			break;
		default:
			time = +new Date();
	}
	var time_formats = [
		[60, 'seconds', 1], // 60
		[120, '1 minute ago', '1 minute from now'], // 60*2
		[3600, 'minutes', 60], // 60*60, 60
		[7200, '1 hour ago', '1 hour from now'], // 60*60*2
		[86400, 'hours', 3600], // 60*60*24, 60*60
		[172800, 'Yesterday', 'Tomorrow'], // 60*60*24*2
		[604800, 'days', 86400], // 60*60*24*7, 60*60*24
		[1209600, 'Last week', 'Next week'], // 60*60*24*7*4*2
		[2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
		[4838400, 'Last month', 'Next month'], // 60*60*24*7*4*2
		[29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
		[58060800, 'Last year', 'Next year'], // 60*60*24*7*4*12*2
		[2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
		[5806080000, 'Last century', 'Next century'], // 60*60*24*7*4*12*100*2
		[58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
	];
	var seconds = (+new Date() - time) / 1000,
		token = 'ago',
		list_choice = 1;

	if (seconds == 0) {
		return 'Just now'
	}
	if (seconds < 0) {
		seconds = Math.abs(seconds);
		token = 'from now';
		list_choice = 2;
	}
	var i = 0,
		format;
	while (format = time_formats[i++])
		if (seconds < format[0]) {
			if (typeof format[2] == 'string')
				return format[list_choice];
			else
				return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
		}
	return time;
}

$(function(){
	var lang = navigator.language || navigator.userLanguage;

			
	if(Intl){
		lang = Intl.DateTimeFormat().resolvedOptions().locale;

		if(lang != "ko"){
			lang = "en";
		}
	}else{
		var timezoneOffset = new Date().toString();

		if(timezoneOffset.getTimezoneOffset() == -540){
			lang = "ko";
		}else{
			lang = "en";
		}
	}

	document.querySelector("html").setAttribute("lang",lang);
	
	
	var viewportResize = function(){
		var w = window.outerWidth;
		
		if(w < 600){
			document.getElementsByName("viewport")[0].content = "width=device-width,initial-scale=0.8,minimum-scale=0.8,maximum-scale=0.8,user-scalable=no";
		}else if(w < 880){
			document.getElementsByName("viewport")[0].content = "width=device-width,initial-scale=0.9,minimum-scale=0.9,maximum-scale=0.9,user-scalable=no";
		}else{
			document.getElementsByName("viewport")[0].content = "width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no";
		}
	}
	
	
	window.addEventListener('resize', viewportResize);
	viewportResize();


	
	$.ajax({
		type: 'GET', 
		url: '/footer.html', 
		dataType : 'html',
		success: function(data) {
			$("#footer").html(data);
		}
	});
	
	
	$.regex = {
		email : function(str){
			str = str ? str : "";
			
			return str.match( /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/ );
		},
		phone : function(str){
			str = str ? str : "";
			
			return str.match( /^[0-9]{3}[-]+[0-9]{4}[-]+[0-9]{4}$/ );
		}
	}
	
	$.oninput = function(e){
		e.target.textContent = 
			e.target.textContent
				.replace(/[^0-9]/g, '')
				.replace(/^(\d{0,3})(\d{0,4})(\d{0,4})$/g, "$1-$2-$3").replace(/(\-{1,2})$/g, "");
	}
})


Date.prototype.addDays = function(days)
{
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}

Date.prototype.toDotString = function()
{
    var dat = new Date(this.valueOf());
    return dat.getFullYear() + "." + (dat.getMonth() +1) +"." + dat.getDate();
}


function calcObsByCycle(){
    var lastp = $("#lastPeriodDate").val();

    if (!Date.parse(lastp)){
        alert('정확한 날짜를 입력해 주세요.');
        return false;
    }
    var shortest_cycle = $("#shortestCycle").val();
    var longest_cycle = $("#longestCycle").val();

    var cycle = parseInt((parseInt(shortest_cycle) + parseInt(longest_cycle)) / 2);

    var expected_period = (new Date(lastp)).addDays(cycle);
    var ob = (expected_period).addDays(-14);

    var result_div = $("#calcbyCycleResult");
    result_div.find("#expectedObs").html(ob.toDotString());
    result_div.find("#chaneToPrgn").html((ob.addDays(-3)).toDotString() + " ~ " +  (ob.addDays(3)).toDotString());
    result_div.find("#expectedPeriod").html((expected_period).toDotString());

    result_div.removeClass("hide").show();
    $("#calcbyCycle_reset").show();
    $("#calcbyCycle").hide();
    $("#calcbyCycle_calc").hide();

}

function calcObsByPeriod(){
    var lastp = $("#lastPeriodDate2").val();
    var prevp = $("#previousPeriodDate").val();

    if (!Date.parse(lastp) | !Date.parse(prevp)){
        alert('정확한 날짜를 입력해 주세요.');
        return false;
    }

    var cycle = (new Date(lastp)-new Date(prevp));
    cycle = parseInt((cycle / (1000*60*60*24)));

    var expected_period = (new Date(lastp)).addDays(cycle);
    var ob = (expected_period).addDays(-14);

    var result_div = $("#calcbyPeriodResult");
    result_div.find("#expectedObs").html(ob.toDotString());
    result_div.find("#chaneToPrgn").html((ob.addDays(-3)).toDotString() + " ~ " +  (ob.addDays(3)).toDotString());
    result_div.find("#expectedPeriod").html((expected_period).toDotString());

    result_div.removeClass("hide").show();
    $("#calcbyPeriod_reset").show();
    $("#calcbyPeriod").hide();
    $("#calcbyPeriod_calc").hide();
}

function cal_reset(calc_type){
    $("#"+calc_type).show();
    $("#"+calc_type+'Result').hide();
    $("#"+calc_type+'_reset').hide();
    $("#"+calc_type+'_calc').show();

    var ex = "예)2015-12-15";
    if(calc_type == 'calcbyCycle'){
        $("#lastPeriodDate").val(ex);
        $("#shortestCycle").val("20");
        $("#longestCycle").val("20");
    }
    if(calc_type == 'calcbyPeriod'){
        $("#lastPeriodDate2").val(ex);
        $("#previousPeriodDate").val(ex);
    }
    if(calc_type=='expectBirth'){
        $("#lastPeriodDate3").val(ex);
    }

}

function calBirth(){
    var lastp = $("#lastPeriodDate3").val();

    if (!Date.parse(lastp)){
        alert('정확한 날짜를 입력해 주세요.');
        return false;
    }


    var lastp_obj = new Date(lastp);
    var birth = lastp_obj.addDays(280);

    var today = new Date();
    var milli = Date.UTC(today.getFullYear(),(today.getMonth()+1),today.getDate()) - Date.UTC(lastp_obj.getFullYear(),(lastp_obj.getMonth()+1),lastp_obj.getDate());
    var days = parseInt((milli / (1000*60*60*24)) % 7);
    var weeks = parseInt(milli / (1000*60*60*24*7));

    var milli = Date.UTC(birth.getFullYear(),(birth.getMonth()+1),birth.getDate()) - Date.UTC(today.getFullYear(),(today.getMonth()+1),today.getDate());
    var remain_days =parseInt((milli / (1000*60*60*24)));
    var result_div = $("#expectBirthResult");
    result_div.find("#expectedBirthDate").html(birth.toDotString());
    result_div.find("#birthWeeks").html(weeks+"주"+days+"일");
    result_div.find("#remainDays").html(remain_days);
    result_div.show();
}