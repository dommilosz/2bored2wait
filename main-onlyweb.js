
// imports
const mc = require('minecraft-protocol'); // to handle minecraft login session
const webserver = require('./webserver.js'); // to serve the webserver
const opn = require('opn'); //to open a browser window
const secrets = require('./secrets.json'); // read the creds
const config = require('./config.json'); // read the config

console.log("XD");
webserver.createServer(config.ports.web); // create the webserver
webserver.password = config.password
webserver.onstart(() => { // set up actions for the webserver
	startQueuing();
});
webserver.onstop(() => {
	stop();
});

if (config.openBrowserOnStart) {
    opn('http://localhost:' + config.ports.web); //open a browser window
}
