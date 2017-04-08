$("#submitButton").on("click", function(event) {
	let data = {};
	let fail = false;
	Object.keys(formData).forEach(field => {
		data[field] = vm[field];
		if (typeof data[field] === "array")
			data[field] = data[field].join("|");

		if (/^\s*$/.test(data[field])) {
			fail = true;
			showMessage("Please complete all fields.", true);
		}
	});
	if (fail) {
		return;
	}
	showMessage("Please wait...");
	post("/store", data, function(data) {
		let obj = JSON.parse(data);
		handleLoad(obj);
	}, true);
});

$("#cardData").focus();

$("#dialogBtn").on("click", function(event){
	$("#modal").hide();
	$("#dialogBtn").hide();
});

function handleLoad(data) {
	if (data.error) {
		showMessage("Error: "+data.error, true);
	}
	else {
		showMessage("Welcome, "+data.name);
		setTimeout(function(){
			window.location.reload();
		}, 1000);
	}
}

function showMessage(text, closeButton=false) {
	$("#dialogText").text(text);
	if(closeButton)
		$("#dialogBtn").show();
	else
		$("#dialogBtn").hide();
	$("#modal").show();
}

function post(url, data, callback, b64) {
	var http = new XMLHttpRequest();
	var params = Object.keys(data).map(key => key + "=" + (b64 ? btoa(data[key]) : data[key])).join("&");
	http.open("GET", url+"?"+params, true);

	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	http.onreadystatechange = function() {//Call a function when the state changes.
	    if(http.readyState === 4 && http.status === 200) {
	        callback(http.responseText);
	    }
	}
	http.send(params);
}