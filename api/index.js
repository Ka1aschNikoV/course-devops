const express = require('express');
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec

const app = express();
const PORT = 8196;
app.use(express.text());  // Express text parser
// http://localhost:8196/run-log
// File path for the state transition log
const LOG_FILE_PATH = path.join(__dirname, 'run-log.log');

let currentState = 'INIT'; // Default state on startup
let isPaused = false;      // Indicates if the system is in a paused state
let isShutdown = false;

async function sh(cmd) {
    return new Promise(function (resolve, reject) {
      exec(cmd, (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve(stdout);
        }
      });
    });
}

function initializeLogFile() {
    try {
        // Ensure the log file exists and is empty
        fs.writeFileSync(LOG_FILE_PATH, '', { flag: 'w' });
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp}: ${currentState}`;
        fs.appendFileSync(LOG_FILE_PATH, logEntry, 'utf8');
        console.log(`Log file initialized: ${LOG_FILE_PATH}`);
    } catch (error) {
        console.error(`Failed to initialize log file: ${error.message}`);
    }
}


function logStateChange(oldState, newState) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp}: ${oldState}->${newState}\n`;

    // Append the log entry to the file
    try {
        fs.appendFileSync(LOG_FILE_PATH, logEntry, 'utf8');
        console.log(`Logged state change: ${logEntry.trim()}`);
    } catch (error) {
        console.error(`Failed to log state change: ${error.message}`);
    }
}

// Endpoint to update the state
app.put('/state', async (req, res)  => {
    const state = req.body;
    console.log(state)


    // Validate the incoming state
    if (!['INIT', 'RUNNING', 'PAUSED', 'SHUTDOWN'].includes(state)) {
        return res.status(400).send('Invalid state. Allowed states: INIT, RUNNING, PAUSED, SHUTDOWN.');
    }

    // Check if the state is actually changing
    if (state === currentState) {
        return res.status(200).send(`State is already ${state}. No changes made.`);
    }

    // Log the state change and update the current state
    const oldState = currentState;
    currentState = state;
    if(currentState === 'PAUSED') {
        isPaused = true;
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/service2/pause')
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend1-1/pause')
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend2-1/pause')
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend3-1/pause')
        //sh('docker pause nginx_frontend')
    }
    else {
        isPaused = false;
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/service2/pause')
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend1-1/pause')
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend2-1/pause')
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend3-1/pause')
        //sh('docker unpause nginx_frontend')
    }
    if(currentState === 'SHUTDOWN') {
        isShutdown = true;
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/service2/stop')
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend1-1/stop')
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend2-1/stop')
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend3-1/stop')
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/nginx_frontend/stop')
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/api_gateway/stop')
    }
    logStateChange(oldState, state);

    // Handle system behavior based on the new state

    res.status(200).send(`State updated to ${state}.`);
});

// Middleware to block operations if the system is paused
app.use((req, res, next) => {
    
    if (isPaused && !(req.path === '/state' && req.method === 'PUT')) {
        return res.status(503).send('System is currently paused. Please try again later.');
    }
    if (isShutdown && !(req.path === '/state' && req.method === 'PUT')) {
        return res.status(503).send('System is currently shutdown. Turn it on to continue use.');
    }
    next();
});

app.get('/state', (req, res) => {
    if(currentState === 'INIT') {
        currentState = 'RUNNING'
    }
    res.setHeader('Content-Type', 'text/plain'); // Respond as plain text
    res.status(200).send(currentState);
});

// API to fetch the run log
app.get('/run-log', (req, res)  => {
    if(currentState === 'INIT') {
        currentState = 'RUNNING'
    }
    
    fs.readFile(LOG_FILE_PATH, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading log file:', err);
            return res.status(500).send('Error reading log file');
        }

        res.setHeader('Content-Type', 'text/plain'); // Respond as plain text
        res.status(200).send(data);
    });
});

/*app.get('/request', async (req,res)  => {
    try {
        const responseJson =  await axios.get('http://backend1:8199/api/');
        console.log(responseJson)
        
    }
    catch (e) {
        console.error('Error requesting service1')
    }

   
})*/

// Start the server
app.listen(PORT, () => {
    initializeLogFile();
    console.log(`Listening on port ${PORT}!`);
});

/*
    map $arg_pause $is_paused {
        default 0;
        "1" 1; # Pause the system when ?pause=1 is provided in the query
    }

    log_format state_transition '$time_iso8601: $http_previous_state->$http_new_state';

    access_log /var/log/nginx/state-transitions.log state_transition;

    server {
        listen 8197;
    
        location /state {
            if ($http_cookie !~* "auth=") {
                add_header Content-Type text/plain;
                return 200 'INIT';  # Return INIT state if not authenticated
            }

            if ($is_paused = 1) {
                add_header Content-Type text/plain;
                return 200 'PAUSED';  # Return PAUSED state if the system is paused
            }

            # Default state: Running
            add_header Content-Type text/plain;
            return 200 'RUNNING';  # Return RUNNING state by default
        }

        location = /request/ {
            proxy_pass http://backend_servers/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Transform JSON response to text/plain
            proxy_set_header Accept text/plain;  # Optional: Forward a hint to backend
        }
    }
*/