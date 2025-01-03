const express = require('express')
const exec = require('child_process').exec
const fs = require('fs');
const path = require('path');
const app = express()
const port = 8199
const redis = require('redis');
const client = redis.createClient();

// Flag to track downtime
let downtimeFlag = false;  
app.use(express.text());  // Express text parser

const LOG_FILE_PATH = path.join(__dirname, 'run-log.log');

let isPaused = false;      // Indicates if the system is in a paused state
let isShutdown = false;
// Runs linux command given a parameter

client.on('connect', () => {c
  console.log('Connected to Redis');
});

// Function to set system state
function setSystemState(state) {
  if (['RUNNING', 'INIT', 'SHUTDOWN', 'PAUSED'].includes(state)) {
      client.set('system_state', state, (err, reply) => {
          if (err) {
              console.error('Error setting system state:', err);
          } else {
              console.log(`System state updated to: ${state}`);
          }
      });
  } else {
      console.error('Invalid state value');
  }
}

function getSystemState() {
  client.get('system_state', (err, reply) => {
      if (err) {
          console.error('Error getting system state:', err);
      } else {
          console.log('Current system state:', reply); // Will be one of 'RUNNING', 'INIT', 'SHUTDOWN', 'PAUSED'
      }
  });
}


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

// Kill all containers, takes about 10 seconds for others than nginx
app.post('/shutdown/', (req, res) => {
  console.log('Shutdown request received. Sending command to host machine.');
  res.status(200).send("All containers shutdown")
  sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/service2/stop')
  sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/nginx_frontend/stop')
  sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend1-1/stop')
  sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend2-1/stop')
  sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend3-1/stop')
  
});

function initializeLogFile() {
  try {
      // Ensure the log file exists and is empty
      fs.writeFileSync(LOG_FILE_PATH, '', { flag: 'w' });
      const timestamp = new Date().toISOString();
      const logEntry = `${timestamp}: ${getSystemState()}`;
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
  if (state === getSystemState()) {
      return res.status(200).send(`State is already ${state}. No changes made.`);
  }

  // Log the state change and update the current state
  const oldState = getSystemState();
  if(state === 'PAUSED') {
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
  if(state === 'SHUTDOWN') {
      isShutdown = true;
      sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/service2/stop')
      sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend1-1/stop')
      sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend2-1/stop')
      sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend3-1/stop')
      sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/nginx_frontend/stop')
      sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/api_gateway/stop')
  }
  setSystemState(state);
  logStateChange(oldState, state);

  // Handle system behavior based on the new state

  res.status(200).send(`State updated to ${state}.`);
});

// Middleware to block operations if the system is paused
app.use((req, res, next) => {
  
  if (getSystemState() === "INIT" && req.headers['x-authenticated-user']) {
      return res.status(403).send("Please login before use!");
  }
  if (isPaused && !(req.path === '/state' && req.method === 'PUT')) {
      return res.status(503).send('System is currently paused. Please try again later.');
  }
  if (isShutdown && !(req.path === '/state' && req.method === 'PUT')) {
      return res.status(503).send('System is currently shutdown. Turn it on to continue use.');
  }
  next();
});

app.get('/state', (req, res) => {
  if(getSystemState() === 'INIT') {
    setSystemState("RUNNING")
  }
  res.setHeader('Content-Type', 'text/plain'); // Respond as plain text
  res.status(200).send(getSystemState());
});

// API to fetch the run log
app.get('/run-log', (req, res)  => {
  if(getSystemState() === 'INIT') {
    setSystemState("RUNNING")
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

//Request info from services
app.get('/api/', async (req,res) => {
  console.log("service1")

  // If service is marked as down, bounce the request
  if (downtimeFlag) {
    res.status(503).send('Service Unavailable (Server is down for 2 seconds)');
    res.end()
  }
  //Call service2
  try  {
    const response = await fetch("http://service2:8200/")
    const service2 = await response.json()
    //Execute commands
    let processes = await sh('ps -ax');
    let login = await sh('last reboot');
    let disk = await sh('df');
    let ip = await sh('hostname -I');

    //Format
    const service1 = {
      ip: ip,
      processes: processes,
      disk: disk,
      login: login,
      
    }

    // Response
    //res.json({"service1": service1, "service2": service2})
    const responseJson = ({"service1": service1, "service2": service2})
    let plainTextResponse = '';
        for (const [key, value] of Object.entries(responseJson)) {
            plainTextResponse += `${key}: ${JSON.stringify(value)}\n`;
            //console.log(plainTextResponse)
        }
        res.setHeader('Content-Type', 'text/plain');
        res.send(plainTextResponse);
    res.end()
    if (!downtimeFlag) {
      downtimeFlag = true;
      console.log('Server is going down for 2 seconds after the response.');

      // Introduce a 2-second delay before the next request can be processed
      setTimeout(() => {
          downtimeFlag = false;  // Allow the server to handle requests again
          console.log('Server is back online.');
      }, 2000);  // Delay of 2 seconds
    }
    
    
  }
  catch (e){
    console.log('Not so fast :)')
  }
      
})

app.listen(port, () => {
  setSystemState("INIT");
  initializeLogFile();
  console.log(`Listening on port ${port}!`);
})