const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 8197;

// File path for the state transition log
const LOG_FILE_PATH = path.join(__dirname, 'run-log.log');

let currentState = 'INIT'; // Default state on startup
let isPaused = false;      // Indicates if the system is in a paused state

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
app.put('/state', (req, res) => {
    const { state } = req.body;

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
    logStateChange(oldState, state);

    // Handle system behavior based on the new state
    handleStateChange(state);

    res.status(200).send(`State updated to ${state}.`);
});

// Middleware to block operations if the system is paused
app.use((req, res, next) => {
    if (isPaused && !(req.path === '/state' && req.method === 'PUT')) {
        return res.status(503).send('System is currently paused. Please try again later.');
    }
    next();
});

app.get('/state', (req, res) => {
    res.setHeader('Content-Type', 'text/plain'); // Respond as plain text
    res.status(200).send(currentState);
});

// API to fetch the run log
app.get('/run-log', (req, res)  => {
    fs.readFile(LOG_FILE_PATH, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading log file:', err);
            return res.status(500).send('Error reading log file');
        }

        res.setHeader('Content-Type', 'text/plain'); // Respond as plain text
        res.status(200).send(data);
    });
});

app.get('/request', async (req,res)  => {
    try {
        const responseJson =  await axios.get('http://service1:8199/api/');
        console.log(responseJson)
        let plainTextResponse = '';
        for (const [key, value] of Object.entries(responseJson)) {
            plainTextResponse += `${key}: ${JSON.stringify(value)}\n`;
            //console.log(plainTextResponse)
        }
        res.setHeader('Content-Type', 'text/plain');
        res.send(plainTextResponse);
    }
    catch (e) {
        console.error('Error requesting service1')
    }

   
})

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