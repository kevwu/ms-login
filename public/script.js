const FIELDS = ["cardData", "equipment", "purpose"];
document.getElementById("submitButton").addEventListener("click", clickHandler, false);
document.getElementById("cardData").addEventListener("keypress", function(event){
	if (event.keyCode === 13)
		clickHandler(event);
}, false);

document.getElementById("cardData").focus();
document.getElementById("cardData").addEventListener("blur", function(event){
	if (this.value === "")
		this.focus();
}, false);

document.getElementById("dialogBtn").addEventListener("click", function(event){
	hideMessage();
}, false);

function clickHandler(event) {
	let data = {};
	let fail = false;
	FIELDS.forEach(f => {
		let e = document.getElementById(f);
		if (e.hasAttribute("has-multiple")) {
			let values = [];
			e.childNodes.forEach(child => {
				if (child.tagName !== "LABEL")
					return;
				let checkbox = child.childNodes[0];
				if (checkbox.checked)
					values.push(checkbox.value);
			});
			data[e.id] = values.join("|");
		}
		else {
			data[e.id] = e.value;
		}
		if (/^\s*$/.test(data[e.id])) {
			fail = true;
			showMessage("Please complete all fields.", true);
		}
	});
	if (fail)
		return;
	showMessage("Please wait...");
	post("/store", data, function(data) {
		let obj = JSON.parse(data);
		handleLoad(obj);
	}, true);
}

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

function showMessage(text, closeButton) {
	let modal = document.getElementById("modal");
	let txt = document.getElementById("dialogText");
	let btn = document.getElementById("dialogBtn");
	modal.style.visibility = "visible";
	btn.style.visibility = closeButton ? "visible" : "hidden";
	txt.innerText = text;
}

function hideMessage() {
	let modal = document.getElementById("modal");
	let btn = document.getElementById("dialogBtn");
	modal.style.visibility = "hidden";
	btn.style.visibility = "hidden";
}

function post(url, data, callback, b64) {
	var http = new XMLHttpRequest();
	var params = Object.keys(data).map(key => key + "=" + (b64 ? btoa(data[key]) : data[key])).join("&");
	http.open("GET", url+"?"+params, true);

	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	http.onreadystatechange = function() {//Call a function when the state changes.
	    if(http.readyState == 4 && http.status == 200) {
	        callback(http.responseText);
	    }
	}
	http.send(params);
}