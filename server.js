"use strict";
const express = require("express");
const expressBasicAuth = require("basic-auth-connect");
const http = require("http");
const fs = require("fs");
const request = require("request");
const validate = require("validate.js");

const PORT = 1763;
const FILENAME = "signin.csv";
const USE_AUTH = true;
const URL = "https://directory.utexas.edu/index.php?q={EID}&scope=all&submit=Search";
const PATTERN = ":[\\s\\S]*?<td>[\\s]+(.+)<";
const MIN_LENGTH = 42;
const NOT_AVAILABLE = "n/a";

let app = express();

//basic authentication
if (USE_AUTH) {
	let PASS;
	try {
		PASS = fs.readFileSync("password.txt").toString().replace(/[\n\r]*/g,"");
	}
	catch (e) {
		PASS = "password";
		fs.writeFileSync("password.txt", PASS);
		console.log("No password.txt found, created one with default password: %s", PASS);
		console.log("To change password, stop server and modify password.txt.\n");
	}

	app.use(expressBasicAuth(function(user, pass) {
		return pass === PASS;
	}));
}

//load field information
let fields = JSON.parse(fs.readFileSync("fields.json"));
fields.list = Object.keys(fields.constraints);
Object.keys(fields.defaults).forEach(validator => {
	validate.validators[validator].options = fields.defaults[validator];
})

//serve static login page
app.use(express.static("public"));

//automatic signin via EID/card
app.get("/store", function (req, res) {
	let cardData = atob(req.query.cardData);
	let equipment = atob(req.query.equipment);
	let purpose = atob(req.query.purpose);

	//very lazy solution to support card or EID input
	let eid;
	if (cardData.length < MIN_LENGTH) {
		eid = cardData;
	}
	else {
		eid = cardData.match(/%A(.+) /)[1].toLowerCase();
	}

	//do directory lookup
	request({
		url: URL.replace("{EID}", eid)
	}, function (error, response, html) {
		if (!error && response.statusCode === 200) {
			let data = parseDirectoryData(html, {
				eid: eid,
				equipment: equipment,
				purpose: purpose
			});

			//generate a response
			if (data.name === NOT_AVAILABLE) {
				res.send(JSON.stringify({"error": "user does not exist"}));
			}
			else {
				//try to write data to the file
				res.send(write(data));
			}
	    }
	});
});

//manual signin via data entry
app.get("/store-manual", function(req, res) {
	res.send(JSON.stringify({"error": "not yet supported."}));
});

app.listen(PORT);

//print address to console
require("dns").lookup(require("os").hostname(), function (err, add, fam) {
	console.log("Running at: \nhttp://"+add+":"+PORT);
});

/**
 * Handles response from directory request.
 * Parses necessary information and combines it with any existing data.
 * @param html {String} the directory page as a string
 * @param data {Object} 
 * @return augmented data
 */
function parseDirectoryData(html, data) {
	data = Object.assign({
		name: getInfo(html, "Name"),
		major: getInfo(html, "Major"),
		classification: getInfo(html, "Classification"),
		email: getInfo(html, "Email", true),
	}, data);
	
	return data;
}

/**
 * Writes an entry to the CSV file.
 * Creates the CSV file and writes headers if necessary.
 */
function write(data) {
	//record timestamp
	data.timestamp = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();
	
	//validate and sanitize
	let result = validate(data, fields.constraints);
	if (result)
		return {"error": "data invalid."};
	let sanitized = escapeCSVEntry(data);
	
	let contents = fields.list.map(field => sanitized[field]).join(",");
	
	//create new file if one does not yet exist
	try {
		fs.statSync(FILENAME);
	} catch (e) {
		try {fs.writeFileSync(FILENAME, fields.list.join(",")+"\n");}
		catch (e2) {
			return {"error": "could not write file."};
		}
	}
	
	//write file
	try {
		fs.appendFileSync(FILENAME, contents+"\n");
	}
	catch (e) {
		return {"error": "could not write file."};
	}
	return data;
}

/**
 * Given an entire HTML string from the directory, extracts the value of one field.
 * Enable cleanup to extract text from an inner tag, e.g. email address in <a> tag.
 * @param html {String}
 * @param field {String}
 * @param cleanup {Boolean}
 */
function getInfo(html, field, cleanup) {
	let match = html.match(new RegExp(field+PATTERN));
	if (!match || match.length < 2)
		return NOT_AVAILABLE;
	let out = match[1].trim();
	if (cleanup) {
		let m = out.match(/>(.*?)</);
		if (m.length > 1)
			out = m[1];
	}
	return out;
}

/**
 * Escapes a single field for CSV format.
 * Surrounds the field in quotes and escapes quotes. (" -> "" in CSV)
 */
function escapeCSVString(str) {
	return `"${str.replace(/"/g,"\"\"")}"`;
}

/**
 * Escapes each field of a CSV entry.
 * @param obj {Object}
 */
function escapeCSVEntry(obj) {
	let out = {};
	Object.keys(obj).forEach(key => {
		out[key] = escapeCSVString(obj[key]);
	});
	return out;
}

/**
 * Converts string to base64 encoding.
 */
function btoa(str) {
	if (typeof str !== "string" || str.length === 0) return "";
	return new Buffer(str).toString("base64");
}

/**
 * Converts base64-encoded string to ASCII encoding.
 */
function atob(str) {
	if (typeof str !== "string" || str.length === 0) return "";
	return new Buffer(str, "base64").toString("ascii");
}