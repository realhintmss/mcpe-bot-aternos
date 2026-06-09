import { createClient, ping } from 'bedrock-protocol';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var config = null;
var client = null;
var botStatus = 'disconnected';
var botConnectedTime = null; // Time will be an integer representing the time in milliseconds since the epoch

// Set a example time to check the code
// botConnectedTime = Date.now() - 1000 * 60 * 5; // 5 minutes ago

// Variables
function loadConfig(){
    return JSON.parse(fs.readFileSync('config.json'));
}
config = loadConfig();

// Express App
const app = express();

// Log Requests
app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});
app.get('/static/:file', (req, res) => {
    res.sendFile(__dirname + '/static/' + req.params.file);
});

// Api
app.get('/api/ping', (req, res) => {
    ping({host: config.server_ip, port: config.server_port})
        .then(response => {
            res.json({status: 'success', data: response});
        })
        .catch(error => {
            res.json({status: 'error', message: error.message});
        });
});
app.get('/api/connect', (req, res) => {
    try {
        if (client !== null) {
            res.json({status: 'error', message: 'Bot is already connected'});
            return;
        }
        connectBot();
        res.json({status: 'success', message: 'Bot Connection Requested'});
    } catch (error) {
        res.json({status: 'error', message: error.message});
    }
});
app.get('/api/disconnect', (req, res) => {
    try {
        if (client === null) {
            res.json({status: 'error', message: 'Bot is not connected'});
            return;
        }
        disconnectBot();
        res.json({status: 'success', message: 'Bot disconnected'});
    } catch (error) {
        res.json({status: 'error', message: error.message});
    }
});
app.get('/api/status', (req, res) => {
    try {
        res.json({status: botStatus, connectedTime: botConnectedTime});
    } catch (error) {
        res.json({status: 'error', message: error.message});
    }
});

// Bot Functions
function connectBot(forceAutoVersion = false) {
    if (client !== null){
        disconnectBot();
    }
    const clientOptions = {
        host: config.server_ip,
        port: config.server_port,
        username: config.player_name,
        offline: true
    };
    if (!forceAutoVersion && config.server_version && config.server_version !== 'auto') {
        clientOptions.version = config.server_version;
    }
    client = createClient(clientOptions);
    client.on('error', (error) => {
        if (!forceAutoVersion && clientOptions.version && error?.message?.includes('Unsupported version')) {
            console.warn(`Configured version ${clientOptions.version} is not supported by bedrock-protocol. Retrying with auto version detection.`);
            disconnectBot();
            connectBot(true);
            return;
        }
        console.error('Error:', error);
        disconnectBot();
    });
    client.on('disconnect', (reason) => {
        console.log('Bot disconnected:', reason);
        disconnectBot();
    });
    client.on('end', () => {
        console.log('Bot connection ended');
        disconnectBot();
    });
    client.on('spawn', () => {
        botStatus = 'connected';
        botConnectedTime = Date.now(); // Set the connected time to now
        console.log('Bot connected to the server');
    });
}
function disconnectBot() {
    if (client !== null) {
        client.disconnect();
        client = null;
        botConnectedTime = null; // Reset the connected time
        botStatus = 'disconnected';
    }
}

// Periodically Check Ping Status & Try to connect
setInterval(() => {
    ping({host: config.server_ip, port: config.server_port})
        .then(response => {
            if (client === null) {
                console.log('Ping successful:', response);
                try {
                    if (botStatus === 'disconnected') {
                        connectBot();
                    }
                } catch (error) {
                    console.error('Error occurred while trying to connect:', error);
                }
            }
        })
        .catch(error => {
            if (client !== null) {
                console.error('Ping failed but bot is connected, Assuming server is down:');
                disconnectBot();
            }
        });
}, 1000*50);
setInterval(() => {
    // Keep render alive
    var url = 'https://hdvej-bot.onrender.com/api/status'
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Render status:', data);
        })
        .catch(error => {
            console.error('Error fetching render status:', error);
        });
}, 1000*30) // Run every 30 seconds to keep the process alive
setInterval(() => {
    // Keep render alive
    var url = 'https://hdvej-bot.onrender.com/'
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Render status:', data);
        })
        .catch(error => {
            console.error('Error fetching render status:', error);
        });
}, 1000*180) // Run every 30 seconds to keep the process alive
// Run
app.listen(config.web_port, () => {
    console.log(`Web server is running on port ${config.web_port}`);
});
