import express from "express"
const app = express();
const port = 8192;

// Server to keep testing live, could be killed in production but isn't currently
app.listen(8192, async () => {
    console.log(`Listening on port ${port}!`);
  
});