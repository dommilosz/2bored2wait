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
var f5 = "package.json";
var f6 = "login.html";
var url = "https://raw.githubusercontent.com/dommilosz/2bored2wait/master/";

DownloadFile(f1);
DownloadFile(f2);
DownloadFile(f3);
DownloadFile(f4);
DownloadFile(f5);
DownloadFile(f6);

console.log("Downloaded");

function DownloadFile(file){
  options.filename = file;
  download(url + file, options);
  console.log("Downloading : "+file);
}

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
setTimeout(function(){
  try{
    console.log("Trying to run app");
    loadScript();
    console.log("Succes");
    console.log("");
  }catch{}
},1000)


