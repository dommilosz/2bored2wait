// imports
const mc = require("minecraft-protocol"); // to handle minecraft login session
const webserver = require("./webserver.js"); // to serve the webserver
const opn = require("opn"); //to open a browser window
const secrets = require("./secrets.json"); // read the creds
const config = require("./config.json"); // read the config

webserver.createServer(config.ports.web); // create the webserver
webserver.password = config.password;
webserver.onstart(() => {
	// set up actions for the webserver
	startQueuing();
});
webserver.onstop(() => {
	stop();
});

if (config.openBrowserOnStart) {
	opn("http://localhost:" + config.ports.web); //open a browser window
}

// lets
let proxyClient; // a reference to the client that is the actual minecraft game
let client; // the client to connect to 2b2t
let server; // the minecraft server to pass packets
let antiafkIntervalObj; // self explanatory
var currentSession; //Let's save the session to avoid re-authing every time we try to reconnect.
var chunk = [];
var lastPos;
// function to disconnect from the server
function stop() {
	webserver.isInQueue = false;
	webserver.queuePlace = "None";
	webserver.ETA = "None";
	client.end(); // disconnect
	if (proxyClient) {
		proxyClient.end("Stopped the proxy."); // boot the player from the server
	}
	server.close(); // close the server
}

function sendAntiafkMessage(client) {
	sendRespawnMsg(client);
	filterPacketAndSend(
		{ message: '{"text":">"}', position: 1 },
		{ name: "chat" },
		client
	);
	console.log("antiafk-chat");
}
function sendRespawnMsg(client) {
	filterPacketAndSend(
		{ message: "{ actionId: 0 }", position: 1 },
		{ name: "client_command" },
		client
	);
}
function reconnect() {
	console.log("Trying to reconnect");
	if (proxyClient) {
		proxyClient.end("Stopped the proxy."); // boot the player from the server
	}
	server.close(); // close the server
	startQueuing();
}

// function to start the whole thing
function startQueuing() {
	var playerId;
	webserver.isInQueue = true;
	client = mc.createClient({
		// connect to 2b2t
		host: config.debug.serverip,
		port: config.debug.serverport,
		username: secrets.username,
		password: secrets.password,
		version: config.MCversion,
		session: currentSession,
	});
	let finishedQueue = false;
	client.on("session", (ses) => {
		currentSession = ses;
		//console.log('session set',ses);
	});
	chunk = []; //let's reset the saved chunkdata when we start queuing.
	client.on("packet", (data, meta) => {
		// each time 2b2t sends a packet
		try {
			try {
				if (!finishedQueue && meta.name === "playerlist_header") {
					// if the packet contains the player list, we can use it to see our place in the queue
					let headermessage = JSON.parse(data.header);
					let positioninqueue = headermessage.text
						.split("\n")[5]
						.substring(25);
					let ETA = headermessage.text.split("\n")[6].substring(27);
					webserver.queuePlace = positioninqueue; // update info on the web page
					webserver.ETA = ETA;
					server.motd = `Place in queue: ${positioninqueue}`; // set the MOTD because why not
				}
			} catch {
				setTimeout(reconnect, 100);
			}
			if (meta.name === "map_chunk") {
				chunk.push([data, meta, data.x, data.z]);
			}
			if (meta.name === "position") {
				lastPos = data;
			}
			if (meta.name === "unload_chunk") {
				chunk = chunk.filter(function (element) {
					return !(
						element[2] === data.chunkX && element[3] === data.chunkZ
					);
				});
			}
			if (meta.name == "login") {
				playerId = data.entityId;
			}
			if (finishedQueue === false && meta.name === "chat") {
				// we can know if we're about to finish the queue by reading the chat message
				// we need to know if we finished the queue otherwise we crash when we're done, because the queue info is no longer in packets the server sends us.
				let chatMessage = JSON.parse(data.message);
				if (
					chatMessage.text &&
					chatMessage.text === "Connecting to the server..."
				) {
					if (webserver.restartQueue && proxyClient == null) {
						// ifwe should restart
						client.end();
					} else {
						finishedQueue = true;
						webserver.queuePlace = "FINISHED";
						webserver.ETA = "NOW";
					}
				}
			}

			if (!proxyClient || proxyClient.ended) {
				webserver.ClientConnected = false;
				if (antiafkIntervalObj == null) {
					antiafkIntervalObj = setInterval(
						sendAntiafkMessage,
						50000,
						client
					);
				} // else timer already exists / is running. to prevent infinite timers being started...
			} else {
				webserver.ClientConnected = true;
				// if we are connected to the proxy, forward the packet we recieved to our game.
				filterPacketAndSend(data, meta, proxyClient);
				if (antiafkIntervalObj != null) {
					clearInterval(antiafkIntervalObj);
					antiafkIntervalObj = null;
				}
			}
			var ts = Math.round(new Date().getTime() / 100);
			webserver.lastpacket = ts;
		} catch (error) {
			console.log(error);
			setTimeout(reconnect, 100);
		}
	});
	// set up actions in case we get disconnected.
	client.on("end", (err) => {
		setTimeout(reconnect, 100); // reconnect after 100 ms
		console.log("end", err);
	});

	client.on("error", (err) => {
		client.end();
	});

	server = mc.createServer({
		// create a server for us to connect to
		"online-mode": true,
		encryption: true,
		host: config.debug.bindip,
		port: config.ports.minecraft,
		version: config.MCversion,
		"max-players": (maxPlayers = 1),
	});

	server.on("login", (newProxyClient) => {
		// handle login
		newProxyClient.write("login", {
			entityId: playerId,
			levelType: "default",
			gameMode: 0,
			dimension: 0,
			difficulty: 2,
			maxPlayers: server.maxPlayers,
			reducedDebugInfo: false,
		});

		if (lastPos) {
			newProxyClient.write("position", lastPos);
			console.log("Writing lastPos to client");
		} else {
			newProxyClient.write("position", {
				x: 0,
				y: 1.62,
				z: 0,
				yaw: 0,
				pitch: 0,
				flags: 0x00,
			});
		}
		if (chunk.length >= 1) {
			chunk.forEach(function (element) {
				filterPacketAndSend(element[0], element[1], newProxyClient);
			});
			filterPacketAndSend(
				{
					message:
						'{"text":"2b2w: Sent:' +
						chunk.length +
						' chunks to the client on connect"}',
					position: 1,
				},
				{ name: "chat" },
				newProxyClient
			);
		}

		newProxyClient.on("packet", (data, meta) => {
			// redirect everything we do to 2b2t (except internal commands)
			if (meta.name === "chat") {
				let chatMessage = data.message;
				if (chatMessage.startsWith("/2b2w")) {
					if (chatMessage.startsWith("/2b2w chunks")) {
						if (chunk.length >= 1) {
							chunk.forEach(function (element) {
								filterPacketAndSend(
									element[0],
									element[1],
									newProxyClient
								);
								filterPacketAndSend(
									{
										message:
											'{"text":"2b2w: okily-dokily"}',
										position: 1,
									},
									{ name: "chat" },
									proxyClient
								);
							});
						} else {
							filterPacketAndSend(
								{
									message:
										'{"text":"2b2w: I have no chunks"}',
									position: 1,
								},
								{ name: "chat" },
								proxyClient
							);
						}
					} else if (
						chatMessage.startsWith("/2b2w forcefinishedqueue")
					) {
						finishedQueue = true;
						filterPacketAndSend(
							{ message: '{"text":"2b2w: done"}', position: 1 },
							{ name: "chat" },
							proxyClient
						);
					} else if (chatMessage.startsWith("/2b2w clearchunks")) {
						chunk = [];
						filterPacketAndSend(
							{
								message: '{"text":"2b2w: cleared chunk cache"}',
								position: 1,
							},
							{ name: "chat" },
							proxyClient
						);
					} else if (chatMessage.startsWith("/2b2w reconnect")) {
						filterPacketAndSend(
							{
								message: '{"text":"2b2w: reconnecting"}',
								position: 1,
							},
							{ name: "chat" },
							proxyClient
						);
						client.end(); // disconnect
					} else if (chatMessage.startsWith("/2b2w antiafk")) {
						filterPacketAndSend(
							{
								message:
									'{"text":"Sending antiafk packet"}',
								position: 1,
							},
							{ name: "chat" },
							proxyClient
						);
						sendAntiafkMessage(client);
					} else {
						filterPacketAndSend(
							{
								message:
									'{"text":"2b2w commands: chunks, clearchunks, forcefinishedqueue, reconnect, antiafk"}',
								position: 1,
							},
							{ name: "chat" },
							proxyClient
						);
					}
				} else {
					filterPacketAndSend(data, meta, client);
				}
			} else {
				filterPacketAndSend(data, meta, client);
			}
		});

		proxyClient = newProxyClient;
	});
}

//function to filter out some packets that would make us disconnect otherwise.
//this is where you could filter out packets with sign data to prevent chunk bans.
function filterPacketAndSend(data, meta, dest) {
	if (meta.name != "keep_alive" && meta.name != "update_time") {
		//keep alive packets are handled by the client we created, so if we were to forward them, the minecraft client would respond too and the server would kick us for responding twice.
		dest.write(meta.name, data);
	}
}
startQueuing(); //Let's start instantly
