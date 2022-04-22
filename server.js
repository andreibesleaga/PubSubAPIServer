const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');
const redis = require("redis");

const REST_API_PORT = 3030;
const REST_API_URL = '/messages';
const MSGS_CHANNEL = 'msgs';
const REDIS_PORT = 6379;
const REDIS_HOST = 'localhost';

// Redis publisher
const redisPub = redis.createClient({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: ''
});


// A messages service that allows to create new and return all existing messages
class MessageService {

  constructor() {        
    this.messages = [];
  }

  async find () {
    // return all our messages
    return this.messages;
  }

  async create (data) {
    // The new message is the data merged with a unique identifier
    // using the messages length since it changes when we add one
    const message = {
      id: this.messages.length,
      text: data.text
    }
    // Add new message to the list
    this.messages.push(message);
    // publish to Redis also
    this.pubRedis(message);

    return message;
  }

  async pubRedis (message) {
    redisPub.publish(MSGS_CHANNEL, JSON.stringify(message));
  }

}


// Creates an ExpressJS compatible Feathers application
const app = express(feathers());
// Parse HTTP JSON bodies
app.use(express.json());
// Parse URL-encoded params
app.use(express.urlencoded({ extended: true }));
// Host static files from the current folder
app.use(express.static(__dirname));
// Add REST API support
app.configure(express.rest());

// Configure Socket.io real-time APIs
app.configure(socketio());

// Register an in-memory messages service
app.use(REST_API_URL, new MessageService());

// Register a nicer error handler than the default Express one
app.use(express.errorHandler());

// Add any new real-time connection to the `msgs-channel` channel
app.on('connection', connection =>
  app.channel(MSGS_CHANNEL).join(connection)
);

// Publish all events to the `msgs-channel` channel
app.publish(data => app.channel(MSGS_CHANNEL));


// Start the server
app.listen(REST_API_PORT).on('listening', () =>
  console.log('PubSub REST API server listening on localhost:3030')
);

