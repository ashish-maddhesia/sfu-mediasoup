const WebSocket = require("ws")

const ws = new WebSocket("ws://localhost:3000")

let transportParams = null

ws.on("open", () => {
  console.log("Receiver connected")

  ws.send(JSON.stringify({
    action: "createTransport"
  }))
})

ws.on("message", (message) => {

  const data = JSON.parse(message)
  console.log("Receiver received:", data)

  if (data.action === "transportCreated") {

    transportParams = data.params

    ws.send(JSON.stringify({
      action: "connectTransport",
      dtlsParameters: transportParams.dtlsParameters
    }))
  }

  if (data.action === "transportConnected") {

    ws.send(JSON.stringify({
      action: "consume",
      rtpCapabilities: {}
    }))
  }

  if (data.action === "consumed") {
    console.log("Receiver Consumer Created ✅")
  }

})