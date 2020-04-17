# 2bored2wait
A proxy to wait out 2b2t.org's way too long queue.


# How to install - old tutorial
1. Download node.js and install it. On non-windows platforms, you also need npm.
2. Download this repository with the green button (top right of this page). If you downloaded it as zip, unzip it.
3. Open a terminal and navigate to the folder you downloaded it
4. Run `npm install`
5. Copy secrets.json.example and name it secrets.json. Fill out your minecraft information in the file. Note that you must use your email adress and not your minecraft username.
6. If you so wish, edit the configuration in config.json. (On Linux ports below 1024, including port 80, require you to run the program with administrator rights.)
7. For trust reasons, this tool does not update automatically. Check back here once in a while to see if there are any updates.

# How to install - better way (`linux`/`debian`)
0. Use a (preferably) 24/7 server enviroment. `ssh` into it.
1. Install dependencies using your package manager (`apt` on `debian`): `npm`, `nodejs`, `git` and `screen` with `sudo apt install npm nodejs git screen -y`
2. `git clone https://github.com/sijanec/2bored2wait && cd 2bored2wait` or even better, download the latest release from <a href="https://github.com/sijanec/2bored2wait/releases">releases</a>.
3. `npm install`
4. `cp secrets.json.example secrets.json`
5. edit file with your Minecraft credentials with your chosen editor. I use `nano secrets.json`. Input your Minecraft username and password. Use your email instead of your username if you have created your account after 2012 or have migrated it.
6. `chmod 700 secrets.json` to prevent other users on the system from viewing your Minecraft password.
7. edit file with configuration with your chosen editor. I use `nano config.json`. Change the password (for the web interface) and ports if you want to.

# How to use
1. Read the code to ensure i'm not stealing your credentials. i'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
2. Run `screen` to create a new persistent terminal. That way the proxy server won't die when you close the `ssh` session with your computer. To exit the virtual screen, hit Ctrl-a, Ctrl-d, to rejoin to the screen, execute `screen -r`
3. In your `screen` session, while in the `2bored2wait` directory, run `npm start`. The program does not output any text to the terminal.
4. Leave your `screen` session with Ctrl-a Ctrl-d. Execute `ip a` to show your IP address. You may want to set up port forwarding to access your host from the Internet.
5. Open a browser on a device that can reach your host and type &lt;your-IP&gt;:8080 in the address bar, to show the web interface.
6. Enter your password and press the "Start queing" button. The queue position indicator auto-updates, but sometimes it takes a while to start counting (like 1 min).

# Known issues
- starting the queue will revoke your minecraft token. this means that you will not be able to join normal minecraft servers until you restart the game
- 2b2t sometimes bugs out and removes you from the queue without telling you. In this case, your queue position will no longer move. Reconnect to fix this.

# Features added by `sijanec`'s fork
- antiafk: every 50 seconds, if `proxyClient` is not connected and `finishedQueue` is `true`, `a message` will be sent as a `chat` to 2b2t to prevent getting AfkKicked. That way you can stay online forever. (Not tested by Hazzal)
- Caching chunks
# Features added by `Hazzal`'s fork
- Removing chunks from the cache as we unload them.
- Sends saved chunks to client on connecting
- Saves session betweens reconnects to avoid spamming the auth servers (Before it could lead to IP block by Cloudflare for example)
- Sends last known position to client on connect so we don't end up floating at 0,0 away from our loaded chunks.
- Possible to ride entities.
# Features added by `dommilosz`'s fork
- auto respawn with antiafk: every 50 secounds it also sends respawn packet to ensure that when you join proxy you are alive and server won't kick you
- Web UI changed: added "Last packet label", "Is client connected", reorganised existing elements and confirm box when you click stop queuing
- New command /2b2w antiafk: sends antiafk packet on demand (with respawn packet)
