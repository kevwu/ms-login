$("#cardData").focus();

function handleLoad(data) {
	vm.manualEntryOpen = false;
	if (data.error) {
		if (data.error.includes("user does not exist")) {
			showMessage("Error: "+data.error, true, "Manual Entry", function(){
				vm.manualEntryOpen = true;
				vm.modalAltBtn = "Submit";
				vm.modalAltFunc = function(){vm.submit(true)};
			});
		}
		else {
			showMessage("Error: "+data.error, true);
		}
	}
	else {
		showMessage("Welcome, "+data.name);
		setTimeout(function(){
			window.location.reload();
		}, 1000);
	}
}

function showMessage(text, closeButton=false, altBtn=false, altFunc=()=>{}) {
	vm.modalText = text;
	vm.modalCloseBtn = closeButton;
	vm.modalOpen = true;
	vm.modalAltBtn = altBtn;
	vm.modalAltFunc = altFunc;
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