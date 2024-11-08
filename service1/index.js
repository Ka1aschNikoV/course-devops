const express = require('express')
const exec = require('child_process').exec
const app = express()
const port = 8199

// Flag to track downtime
let downtimeFlag = false;  

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
app.post('/shutdown/', (req, res) => {
  console.log('Shutdown request received. Sending command to host machine.');
  res.status(200).send("All containers shutdown")
  sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/service2/stop')
  sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/nginx_frontend/stop')
  sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend1/stop')
  sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend2/stop')
  sh('curl --unix-socket /var/run/docker.sock -X POST -d "{}" http://localhost/containers/backend3/stop')
  
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
    res.json({"service1": service1, "server2": service2})
    if (!downtimeFlag) {
      downtimeFlag = true;
      console.log('Server is going down for 2 seconds after the response.');

      // Introduce a 2-second delay before the next request can be processed
      setTimeout(() => {
          downtimeFlag = false;  // Allow the server to handle requests again
          console.log('Server is back online.');
      }, 2000);  // Delay of 2 seconds
    }
    res.end()
    
  }
  catch (e){
    console.log('Not so fast :)')
  }
      
})

app.listen(port, () => console.log(`Listening on port ${port}!`))