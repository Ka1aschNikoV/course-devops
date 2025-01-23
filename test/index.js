import express from "express"
const app = express();
const port = 8194;

app.listen(8194, async () => {
    console.log(`Listening on port ${port}!`);
  
});