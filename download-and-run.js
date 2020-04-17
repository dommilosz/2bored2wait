var fs = require('fs');
var file = './main.js';
var download = require("download-file");

var options = {
	directory: process.cwd(),
	filename: "main.js",
};
var f1 = "main.js";
var f2 = "webserver.js";
var f3 = "index.html";
var f4 = "index.css";
var url = "https://raw.githubusercontent.com/dommilosz/2bored2wait/master/";

options.filename = f1;
download(url + f1, options);
options.filename = f2;
download(url + f2, options);
options.filename = f3;
download(url + f3, options);
options.filename = f4;
download(url + f4, options);


var script;
function loadScript() {
  if (script) {
    if (typeof script.teardown === 'function') {
      script.teardown();
    }
    delete require.cache[file];
  }

  script = require(file);
}

loadScript();