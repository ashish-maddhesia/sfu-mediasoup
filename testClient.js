const WebSocket = require("ws")

const ws = new WebSocket("ws://localhost:3000")

ws.on("open", () => {

  console.log("Connected to mediasoup backend")

  ws.send(JSON.stringify({
    action: "createTransport"
  }))

})

ws.on("message", message => {

  console.log("Received:", JSON.parse(message))

})


