const express = require('express')
const exec = require('child_process').exec
const fs = require('fs');
const path = require('path');
const app = express()
const port = 8199
const Redis = require('ioredis');



// Flag to track downtime
let downtimeFlag = false;  
app.use(express.text());  // Express text parser

const LOG_FILE_PATH = path.join(__dirname, 'run-log.log');


const redis = new Redis({
  host: process.env.REDIS_HOST || "redis", // This points to the Redis container
  port: 6379,
});

async function setSystemState(state) {
  if (["RUNNING", "INIT", "SHUTDOWN", "PAUSED"].includes(state)) {
    try {
      await redis.set('system_state', state);
      console.log(`System state updated to: ${state}`);

      const currState = await redis.get('system_state');
      console.log('Current system state:', currState);
    } catch (err) {
      console.error('Error setting or getting system state:', err);
    }
  } else {
    console.log('Invalid state value');
  }
}

async function getSystemState() {
  try {
    const state = await redis.get('system_state');
    console.log('Current system state:', state); // Logs the current state from Redis
    return state;  // Returns the state retrieved from Redis
  } catch (err) {
    console.error('Error getting system state:', err);
    return null; // In case of an error, return null or handle it as needed
  }
}
// Runs linux command given a parameter
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
app.post('/shutdown', (req, res) => {
  console.log('Shutdown request received. Sending command to host machine.');
  res.status(200).send("All containers shutdown")
  sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/service2/stop')
  sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/nginx_frontend/stop')
  sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend1-1/stop')
  sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend2-1/stop')
  sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend3-1/stop')
  
});

async function initializeLogFile() {
  try {
      // Ensure the log file exists and is empty
      const currState = await getSystemState()
      fs.writeFileSync(LOG_FILE_PATH, '', { flag: 'w' });
      const timestamp = new Date().toISOString();
      const logEntry = `${timestamp}: ${currState}`;
      fs.appendFileSync(LOG_FILE_PATH, logEntry, 'utf8');
      console.log(`Log file initialized: ${LOG_FILE_PATH}`);
      console.log(logEntry)
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
  console.log("bruh")
  const currState = await getSystemState()
  console.log(currState)
  console.log(req.headers)
  if (currState === "INIT" && !req.headers['x-authenticated-user']) {
    res.status(403).send("Please login before use!");
  }
  else {
    const state = req.body;
    console.log(state)
  
  
    // Validate the incoming state
    if (!['INIT', 'RUNNING', 'PAUSED', 'SHUTDOWN'].includes(state)) {
        return res.status(400).send('Invalid state. Allowed states: INIT, RUNNING, PAUSED, SHUTDOWN.');
    }
  
    // Check if the state is actually changing
    if (state === currState) {
        return res.status(200).send(`State is already ${state}. No changes made.`);
    }
  
    // Log the state change and update the current state
    const oldState = currState;
    
    
    setSystemState(state);
    logStateChange(oldState, state);
    
  
    // Handle system behavior based on the new state
  
    res.status(200).send(`State updated to ${state}.`);
    if(state === 'SHUTDOWN') {
      sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/service2/stop')
      sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend1-1/stop')
      sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend2-1/stop')
      sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend3-1/stop')
      sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/nginx_frontend/stop')
      sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/api_gateway/stop')
      sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/redis/stop')
    } 
  }
  
});

// Middleware to block operations if the system is paused
app.use(async (req, res, next) => {
  
  const currState = await getSystemState()
  if (currState === "PAUSED" && !(req.path === '/state' && req.method === 'PUT')) {
    res.status(503).send('System is currently paused. Please try again later.');
  }
  else if (currState === "SHUTDOWN" && !(req.path === '/state' && req.method === 'PUT')) {
    res.status(503).send('System is currently shutdown. Turn it on to continue use.');
  }
  else {
    next();
  }
});

app.get('/state', async (req, res) => {
  const currState = await getSystemState()
  res.setHeader('Content-Type', 'text/plain'); // Respond as plain text
  res.status(200).send(currState);
});

// API to fetch the run log
app.get('/run-log', async (req, res)  => {
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
app.get('/api', async (req,res) => {
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

app.listen(port, async () => {
  
  await setSystemState("INIT")
  await initializeLogFile()
  console.log(`Listening on port ${port}!`);
})