const express = require('express')
const exec = require('child_process').exec
const app = express()
const port = 8199

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
 

app.get('/', async (req,res) => {

    //Call service2
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
    res.end()
        
})

app.listen(port, () => console.log(`Listening on port ${port}!`))