"use strict";
let express = require("express");
let http = require("http");
let fs = require("fs");
let request = require("request");
let app = express();
const FILENAME = "signin.csv";
const URL = "https://directory.utexas.edu/index.php?q={EID}&scope=all&submit=Search";
const PATTERN = ":[\\s\\S]*?<td>[\\s]+(.+)<";
const MIN_LENGTH = 42;
const FIELDS = ["timestamp", "name", "eid", "major", "classification", "email", "equipment", "purpose"];
const PORT = 1763;
const NOT_AVAILABLE = "n/a";

// respond with "hello world" when a GET request is made to the homepage
app.get("/store", function (req, res) {
	let cardData = atob(req.query.cardData);
	let equipment = atob(req.query.equipment);
	let purpose = atob(req.query.purpose);

	let eid;
	if (cardData.length < MIN_LENGTH) {
		eid = cardData;
	}
	else {
		eid = cardData.match(/%A(.+) /)[1].toLowerCase();
	}

	request({
		url: URL.replace("{EID}", eid)
	}, function (error, response, html) {
		if (!error && response.statusCode === 200) {
			let data = {
				name: getInfo(html, "Name"),
				eid: eid,
				major: getInfo(html, "Major"),
				classification: getInfo(html, "Classification"),
				email: getInfo(html, "Email", true),
				equipment: equipment,
				purpose: purpose
			};
			if (data.name === NOT_AVAILABLE) {
				res.send(JSON.stringify({"error": "user does not exist"}));
			}
    		else if (write(data)) {
    			res.send(JSON.stringify(data));
    		} else {
    			res.send(JSON.stringify({"error": "could not write file"}));
    		}
	    }
	});
});
app.use(express.static("public"));
app.listen(PORT);
require("dns").lookup(require("os").hostname(), function (err, add, fam) {
	console.log("Running at: \nhttp://"+add+":"+PORT);
});

function write(data) {
	data.timestamp = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();
	let contents = FIELDS.map(field => data[field]).join(",");
	try {
		fs.statSync(FILENAME);
	} catch (e) {
		try {fs.writeFileSync(FILENAME, FIELDS.join(",")+"\n");}
		catch (e2) {return false;}
	}
	try {
		fs.appendFileSync(FILENAME, contents+"\n");
	}
	catch (e) {
		return false;
	}
	return true;
}

function getInfo(html, field, cleanup) {
	let match = html.match(new RegExp(field+PATTERN));
	if (!match || match.length < 2)
		return NOT_AVAILABLE;
	let out = match[1];
	if (cleanup) {
		let m = out.match(/>(.*?)</);
		if (m.length > 1)
			out = m[1];
	}
	return out;
}
function btoa(str) {
	if (typeof str !== "string" || str.length === 0) return "";
	return new Buffer(str).toString("base64");
}
function atob(str) {
	if (typeof str !== "string" || str.length === 0) return "";
	return new Buffer(str, "base64").toString("ascii");
}