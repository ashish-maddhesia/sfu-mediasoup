const express = require("express")
const http = require("http")

const { createWorker } = require("./mediasoup/worker")
const { createRouter } = require("./mediasoup/router")

const initWebSocket = require("./signaling/websocket")
const { lstat } = require("fs")

const app = express()
const server = http.createServer(app)

async function start() {

  await createWorker()

  await createRouter()

  initWebSocket(server)

  server.listen(3000, () => {
    console.log("Server running on port 3000")
  })

}

start()