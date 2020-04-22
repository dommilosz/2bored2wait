var fs = require("fs");
var file = "./main.js";
var download = require("download-file");

var options = {
	directory: process.cwd(),
	filename: "main.js",
};

var files = [
	"main.js",
	"webserver.js",
	"index.html",
	"index.css",
	"package.json",
	"login.html",
	"download-and-run.js",
];
fruits.forEach(myFunction);

var url = "https://raw.githubusercontent.com/dommilosz/2bored2wait/master/";

function DownloadFile(item, index) {
	options.filename = item;
	download(url + item, options);
}

console.log("Downloaded");

var script;
function loadScript() {
	if (script) {
		if (typeof script.teardown === "function") {
			script.teardown();
		}
		delete require.cache[file];
	}

	script = require(file);
}
setTimeout(function () {
	try {
		console.log("Trying to run app");
		loadScript();
		console.log("Succes");
		console.log("");
	} catch {}
}, 1000);
