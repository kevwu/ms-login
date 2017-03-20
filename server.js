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
			let escaped = escapeCSVEntry(data);

			if (data.name === NOT_AVAILABLE) {
				res.send(JSON.stringify({"error": "user does not exist"}));
			}
    		else if (write(escaped)) {
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

/**
 * Writes an entry to the CSV file.
 * Creates the CSV file and writes headers if necessary.
 */
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