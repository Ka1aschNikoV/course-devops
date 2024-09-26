const express = require('express')
const app = express()
const port = 8199

app.get('/', (req, res) => res.send('Hello Multiverse!'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))