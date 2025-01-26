const express = require('express');
const exec = require('child_process').exec;
const fs = require('fs');
const app = express();
const port = 8199;
const Redis = require('ioredis');
const lockfile = require('lockfile');
const readline = require('readline');
app.use(express.text());  // Express text parser


// Flag to track downtime
let downtimeFlag = false;

// Lock logging to avoid race condition
let runLogLock = false;

// Activity logging
const RUN_FILE_PATH = '/shared/run-logs/run-log.log';

// User logging
const AUTH_LOG_FILE = '/shared/nginx-logs/auth.log'; // Path to shared log file

// System state tracking
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis', // This points to the Redis container
  port: 6379,
});


// Middleware to block operations if the system is paused or offline
app.use(async (req, res, next) => {
  try {
  // If service is marked as down, bounce the request
    if (downtimeFlag) {
      return res.status(503).send('Service Unavailable (Server is down for 2 seconds)');
    }
    downtimeFlag = true;
    const currState = await getSystemState();
    if (currState === 'PAUSED' && !(req.path === '/state' && req.method === 'PUT')) {
      return res.status(503).send('System is currently paused. Please try again later.');
    }
    else if (currState === 'SHUTDOWN' && !(req.path === '/state' && req.method === 'PUT')) {
      return res.status(503).send('System is currently shutdown. Turn it on to continue use.');
    }
    else {
      next();
      await incrementMonitor();
      console.log('Server is going down for 2 seconds after the response.');
      setTimeout(async () => {
      // Introduce a 2-second delay before the next request can be processed
        downtimeFlag = false;  // Allow the server to handle requests again
        console.log('Server is back online.');
      }, 2000);  // Delay of 2 seconds
    }
  }
  catch (err) {
    return res.status(503).send('Too fast requests, slow down!');
  }
});

/*
* 8199/shutdown POST
*
* Kill all containers, takes about 10 seconds for others than nginx
*/
app.post('/shutdown', async (req, res) => {
  console.log('Shutdown request received. Sending command to host machine.');
  await changeState('SHUTDOWN');
  setTimeout(() => {
    sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/service2/stop');
    sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend1-1/stop');
    sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend2-1/stop');
    sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend3-1/stop');
    sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/nginx_frontend/stop');
    sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/test_container/stop');
    sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/redis/stop');
  }, 1000);
  return res.status(200).send('All containers shutdown');


});

/*
* 8199/state PUT
*
* Endpoint to update the state
*/
app.put('/state', async (req, res)  => {

  const currState = await getSystemState();
  if (currState === 'INIT' && !req.headers['x-authenticated-user']) {
    return res.status(403).send('Please login before use!');
  }
  else {
    const state = req.body;
    // Validate the incoming state
    if (!['INIT', 'RUNNING', 'PAUSED', 'SHUTDOWN'].includes(state)) {
      return res.status(400).send('Invalid state. Allowed states: INIT, RUNNING, PAUSED, SHUTDOWN.');

    }
    // Check if the state is actually changing
    if (state === currState) {
      return res.status(200).send(`State is already ${state}. No changes made.`);
    }
    await changeState(state);
    // Handle system behavior based on the new state
    setTimeout(() => {
      if(state === 'SHUTDOWN') {
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/service2/stop');
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend1-1/stop');
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend2-1/stop');
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend3-1/stop');
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/nginx_frontend/stop');
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/test_container/stop');
        sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/redis/stop');
      }
    },1000);
    return res.status(200).send(state);
  }
});

/*
* 8199/state GET
*
* Get system state
*/
app.get('/state', async (req, res) => {
  const currState = await getSystemState();
  res.setHeader('Content-Type', 'text/plain'); // Respond as plain text
  return res.status(200).send(currState);
});

/*
* 8199/run-log GET
*
* API to fetch the run log
*/
app.get('/run-log', (req, res) => {
  const stream = fs.createReadStream(RUN_FILE_PATH, { encoding: 'utf8' });

  res.setHeader('Content-Type', 'text/plain');
  stream.pipe(res); // Stream the file content to the response

  stream.on('error', (err) => {
    console.error('Error reading log file:', err);
    return res.status(500).send('Error reading log file');
  });
});

/*
* 8199/api GET
*
* Request info from services
*/
app.get('/api', async (req,res) => {
  //Call service2
  try  {
    const response = await fetch('http://service2:8200/');
    const service2 = await response.json();
    //Execute commands
    const processes = await sh('ps -ax');
    const login = await sh('last reboot');
    const disk = await sh('df');
    const ip = await sh('hostname -I');

    //Format
    const service1 = {
      ip: ip,
      processes: processes,
      disk: disk,
      login: login,

    };

    // Response

    const responseJson = ({'service1': service1, 'service2': service2});
    let plainTextResponse = '';
    for (const [key, value] of Object.entries(responseJson)) {
      plainTextResponse += `${key}: ${JSON.stringify(value)}\n`;

    }
    res.setHeader('Content-Type', 'text/plain');
    res.send(plainTextResponse);
    res.end();



  }
  catch (err){
    console.error('Request came in too fast, slow down', err);
  }

});


/*
* 8199/debug-monitor GET
*
* Request debug monitor info for monitoring
*/
app.get('/debug-monitor', async (req,res) => {
  await redis.incr('monitor_count');
  const path = '/etc/container_creation_time.txt';
  fs.readFile(path, 'utf8' ,async  (err, data) => {
    if (err) {
      console.error('Error reading container creation time:', err);
      return;
    }
    // Get the container creation time (in seconds since Unix epoch)
    const containerCreationTime = parseInt(data.trim(), 10);
    // Get the current time in seconds since the Unix epoch
    const currentTime = Math.floor(Date.now() / 1000);
    // Calculate uptime in seconds
    const uptimeSeconds = currentTime - containerCreationTime;
    // Calculate uptime in human-readable format (days, hours, minutes, seconds)
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    const monitor = await redis.get('monitor_count');
    const request = await redis.get('request_count');

    const debugJson = {
      uptime: 'Days:' + days +
              ' Hours:' + hours +
              ' Minutes:' + minutes +
              ' Seconds:' + seconds,
      request: 'Total requests: ' + request,
      monitor: 'Monitor requests: ' + monitor,
    };
    let plainTextResponse = '';
    for (const [key, value] of Object.entries(debugJson)) {
      plainTextResponse += `${key}: ${JSON.stringify(value)}\n`;

    }
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(plainTextResponse);
  });
});

// Set new system state
async function setSystemState(state) {
  if (['RUNNING', 'INIT', 'SHUTDOWN', 'PAUSED'].includes(state)) {
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


// Get current system state
async function getSystemState() {
  try {
    const state = await redis.get('system_state');
    return state;  // Returns the state retrieved from Redis
  } catch (err) {
    console.error('Error getting system state:', err);
    return null; // In case of an error, return null or handle it as needed
  }
}

// Set seen user
async function trackSeenUser(user) {
  try {
    // Add user to Redis Set
    const isNewUser = await redis.set('seen_users', user); // sAdd returns 1 if the user is new, 0 if already exists

    if (isNewUser) {
      console.log(`New user added to seen users: ${user}`);
    } else {
      console.log(`User ${user} has already been tracked.`);
    }

  } catch (err) {
    console.error('Error tracking user:', err);
  }
}

// Get seen user
async function getSeenUsers() {
  try {
    // Retrieve all seen users
    const seenUsers = await redis.get('seen_users');
    return seenUsers;
  } catch (err) {
    console.error('Error fetching seen users:', err);
    return [];
  }
}




// Run linux command given a parameter
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


// Add new activity into log file
async function logStateChange(oldState, newState) {

  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp}: ${oldState}->${newState}\n`;

  // Append the log entry to the file
  setTimeout(() => {
    // Try to acquire a lock before writing
    try {
      const lockPath = `${RUN_FILE_PATH}.lock`;  // Lock file path
      setTimeout(() => {
        lockfile.lock(lockPath, { retries: 10, retryWait: 100 }, (err) => {
          if (err) {
            console.error('Could not acquire lock', err);
            return;
          }
          fs.appendFileSync(RUN_FILE_PATH, logEntry, 'utf8');
          console.log(`Logged state change: ${logEntry.trim()}`);
          lockfile.unlock(lockPath, (err) => {
            if (err) {
              console.error('Could not release lock', err);
            }
          });
        });
      }, Math.random());
    }
    catch (error) {
      console.error(`Failed to log state change: ${error.message}`);
    }}, 100);
}

// Monitor user logins
function monitorLogs(logFile) {
  fs.watchFile(logFile, (curr, prev) => {
    if (curr.size > prev.size) {
      // New lines have been added, read the new data
      const stream = fs.createReadStream(logFile, { encoding: 'utf-8', flags: 'r', start: prev.size });
      const rl = readline.createInterface({ input: stream });
      if (runLogLock) {
        return;  // Exit early if the function is locked
      }
      runLogLock = true;
      rl.on('line', async (line) => {
        const match = line.match(/(?<ip>[\d\.]+) - (?<user>\S+) \[(?<time>[^\]]+)\]/);
        if (match) {
          const { ip, user, time } = match.groups;
          const seenUsers = await getSeenUsers();

          if (seenUsers === null && user !== '-') {
            await changeState('RUNNING');
            await trackSeenUser(user);
          }
        }
      });

      // When done processing, release the lock
      rl.on('close', () => {
        runLogLock = false;  // Release the lock when done
      });

    }
  });
}

// Reset system to initial state
async function resetSystem() {

  try {
    const result = await redis.del('seen_users');
    if (result === 1) {
      console.log('Successfully wiped the seen users set.');
    } else {
      console.log('No seen users set found to wipe.');
    }
  } catch (err) {
    console.error('Error wiping seen users:', err);
  }
  try {
    fs.writeFileSync(AUTH_LOG_FILE, '', { flag: 'w' });
    console.log('Successfully cleared logs');
  }
  catch (err) {
    console.error('Clearing logs failed');
  }
  console.log('Successfully restored system to INIT');
}

// Change system state
async function changeState(state) {
  const currState = await getSystemState();
  await setSystemState(state);
  if(currState!==state && currState !== null) {
    await logStateChange(currState, state);
  }
  if(state==='INIT' && currState!=='INIT') {
    await resetSystem();
  }
}

// Track total requests
async function incrementMonitor() {
  try {
    await redis.incr('request_count');
  }
  catch(err) {
    console.error('Request increment failed', err);
  }
}

// Start server
app.listen(port, async () => {

  fs.writeFileSync(AUTH_LOG_FILE, '', { flag: 'w' });
  fs.writeFileSync(RUN_FILE_PATH, '', { flag: 'w' });
  monitorLogs(AUTH_LOG_FILE);
  setTimeout(async () => {
    await changeState('INIT');
  }, 1000);
  await redis.set('request_count', 0);
  await redis.set('monitor_count', 0);
  console.log(`Listening on port ${port}!`);

});

