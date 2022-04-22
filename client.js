const express = require("express");
const redis = require("redis");
const app = express();

// subscribe to Redis
const subscriber = redis.createClient();
subscriber.subscribe("msgs");

// messages received on msgs channel broadcasted on Redis
subscriber.on("message", (channel, message) => {
  console.log("Received data :" + message)
});

app.get("/", (req, res) => {
  res.send("NodeJs Redis Pub/Sub Subscriber")
});

app.listen(3006, () => {
  console.log("client server is listening to port 3006")
});