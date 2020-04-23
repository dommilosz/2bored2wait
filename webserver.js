//this module exposes functions and variables to control the HTTP server.
const http = require("http"); //to serve the pages
const fs = require("fs"); //to read the webpages from disk

module.exports = {
	createServer: (port) => {
		http.createServer((req, res) => {
			hash = "";
			url = req.url;
			if (req.url.includes("?hash=")) {
				hash = req.url.slice(req.url.indexOf("?hash=") + 6);
				url = req.url.slice(0, req.url.indexOf("?hash="));
			}
			if (req.url.includes("/auth?password=")) {
				//main page of the web app
				pass = req.url.replace("/auth?password=", "");
				if (pass == module.exports.password) {
					r1 = Math.random().toString(36).substring(7);
					r2 = Math.random().toString(36).substring(7);
					r3 = Math.random().toString(36).substring(7);
					r4 = Math.random().toString(36).substring(7);
					r = r1 + r2 + r3 + r4;
					console.log("hash : ", r);

					module.exports.validhashes.push(r);
					res.writeHead(200, { "Content-type": "text/html" });
					res.write(r);
				} else {
					res.writeHead(403, { "Content-type": "text/html" });
					res.write("WRONG PASSWORD");
				}
				res.end();
			} else if (url === "/index.css") {
				//css file to make it not look like too much shit
				res.writeHead(200, { "Content-type": "text/css" });
				res.write(fs.readFileSync("index.css"));
				res.end();
			} else if (
				(req.url.includes("?hash=") &&
					hash != "" &&
					module.exports.validhashes.includes(hash)) ||
				module.exports.validhashes.includes(req.headers.xpassword)
			) {
				if (url === "/") {
					res.writeHead(200, { "Content-type": "text/html" });
					res.write(fs.readFileSync("index.html"));
					res.end();
					//main page of the web app
				} else if (url === "/update") {
					//API endpoint to get position, ETA, and status in JSON format
					res.writeHead(200, { "Content-type": "text/json" });
					var ts = Math.round(new Date().getTime() / 100);
					res.write(
						'{"username": "' +
							module.exports.username +
							'","place": "' +
							module.exports.queuePlace +
							'","ETA": "' +
							module.exports.ETA +
							'", "inQueue": ' +
							module.exports.isInQueue +
							', "restartQueue":' +
							module.exports.restartQueue +
							', "clientConnected":' +
							module.exports.clientConnected +
							', "lastpacket":' +
							(ts - module.exports.lastpacket) +
							', "position":' +
							"{" +
							'"x":"' +
							Math.round(module.exports.position.x * 10) / 10 +
							'",' +
							'"y":"' +
							Math.round(module.exports.position.y * 10) / 10 +
							'",' +
							'"z":"' +
							Math.round(module.exports.position.z * 10) / 10 +
							'"' +
							"}" +
							"}"
					);
					res.end();
				} else if (url === "/start") {
					//API endpoint to start queuing
					res.writeHead(200);
					res.end();
					module.exports.onstartcallback();
				} else if (url === "/stop") {
					//API endpoint to stop queuing
					res.writeHead(200);
					res.end();
					module.exports.onstopcallback();
				} else if (req.url === "/togglerestart") {
					module.exports.restartQueue = !module.exports.restartQueue;
				} else {
					res.writeHead(404);
					res.end();
				}
			} else {
				res.writeHead(200, { "Content-type": "text/html" });
				res.write(fs.readFileSync("login.html"));
				res.end();
			}
		}).listen(port);
	},
	onstart: (callback) => {
		//function to set the action to do when starting
		module.exports.onstartcallback = callback;
	},
	onstop: (callback) => {
		//same but to stop
		module.exports.onstopcallback = callback;
	},
	queuePlace: "None", //our place in queue
	ETA: "None", //ETA
	isInQueue: false, //are we in queue?
	onstartcallback: null, //a save of the action to start
	onstopcallback: null, //same but to stop
	restartQueue: false, //when at the end of the queue, restart if no client is connected?
	password: "", //the password to use for the webapp
	clientConnected: false,
	lastpacket: Math.round(new Date().getTime() / 100),
	username: "",
	position: {
		x: 0,
		y: 0,
		z: 0,
	},
	validhashes: [],
};
