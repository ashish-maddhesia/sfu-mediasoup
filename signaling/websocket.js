
const WebSocket = require("ws")

const { createTransport } = require("../mediasoup/transport")
const { createProducer } = require("../mediasoup/producer")
const { createConsumer } = require("../mediasoup/consumer")
const { getRouter } = require("../mediasoup/router")

/*
Client structure:

clients = {
  ws: {
    transport: WebRtcTransport,
    producer: Producer,
    consumers: [Consumer, Consumer]
  }
}
*/

const clients = new Map()

function initWebSocket(server) {

  const wss = new WebSocket.Server({ server })

  console.log("WebSocket signaling server started")

  wss.on("connection", ws => {

    console.log("Client connected")

    // Initialize client state
    clients.set(ws, {
      transport: null,
      producer: null,
      consumers: []
    })

    ws.on("message", async message => {

      try {

        const data = JSON.parse(message)

        switch (data.action) {

          case "createTransport":
            await handleCreateTransport(ws)
            break

          case "connectTransport":
            await handleConnectTransport(ws, data)
            break

          case "produce":
            await handleProduce(ws, data)
            break

          case "consume":
            await handleConsume(ws, data)
            break

          case "resumeConsumer":
            await handleResumeConsumer(ws, data)
            break

          default:
            console.log("Unknown action:", data.action)

        }

      } catch (error) {

        console.error("WebSocket message error:", error)

      }

    })

    ws.on("close", () => {

      console.log("Client disconnected")

      cleanupClient(ws)

    })

  })

}

/*
Create Transport
*/
async function handleCreateTransport(ws) {

  const transport = await createTransport()

  const client = clients.get(ws)
  client.transport = transport

  // Debug transport lifecycle
  transport.on("dtlsstatechange", state => {
    console.log("DTLS state:", state)
  })

  transport.on("close", () => {
    console.log("Transport closed:", transport.id)
  })

  ws.send(JSON.stringify({

    action: "transportCreated",

    params: {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters
    }

  }))

  console.log("Transport created:", transport.id)

}

/*
Connect Transport (DTLS handshake)
*/
async function handleConnectTransport(ws, data) {

  const client = clients.get(ws)

  if (!client.transport) {
    console.log("No transport found")
    return
  }

  await client.transport.connect({
    dtlsParameters: data.dtlsParameters
  })

  ws.send(JSON.stringify({
    action: "transportConnected"
  }))

  console.log("Transport connected:", client.transport.id)

}

/*
Create Producer (Sender)
*/
async function handleProduce(ws, data) {

  const client = clients.get(ws)

  if (!client.transport) {
    console.log("No transport found for producer")
    return
  }

  const producer = await createProducer(
    client.transport,
    data.kind,
    data.rtpParameters
  )

  client.producer = producer

  // Debug producer lifecycle
  producer.on("transportclose", () => {
    console.log("Producer transport closed:", producer.id)
  })

  producer.on("close", () => {
    console.log("Producer closed:", producer.id)
  })

  ws.send(JSON.stringify({
    action: "produced",
    producerId: producer.id
  }))

  console.log("Producer created:", producer.id)

}

/*
Create Consumer (Receiver)
*/
async function handleConsume(ws, data) {

  const router = getRouter()
  const client = clients.get(ws)

  if (!client.transport) {
    console.log("No transport found for consumer")
    return
  }

  // Find another client's producer
  let producer = null

  for (const [otherWs, otherClient] of clients) {

    if (otherWs !== ws && otherClient.producer) {

      producer = otherClient.producer
      break

    }

  }

  if (!producer) {

    console.log("No producer found")

    ws.send(JSON.stringify({
      action: "error",
      message: "No producer available"
    }))

    return

  }

  const consumer = await createConsumer(

    client.transport,
    producer,
    router,
    data.rtpCapabilities || {}

  )

  if (!consumer) {
    console.log("Consumer creation failed")
    return
  }

  client.consumers.push(consumer)

  // Debug consumer lifecycle
  consumer.on("transportclose", () => {
    console.log("Consumer transport closed:", consumer.id)
  })

  consumer.on("producerclose", () => {
    console.log("Producer closed, consumer closed:", consumer.id)
  })

  ws.send(JSON.stringify({

    action: "consumed",

    params: {
      id: consumer.id,
      producerId: producer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters
    }

  }))

  console.log("Consumer created:", consumer.id)

}

/*
Resume Consumer (start receiving media)
*/
async function handleResumeConsumer(ws, data) {

  const client = clients.get(ws)

  const consumer = client.consumers.find(
    c => c.id === data.consumerId
  )

  if (!consumer) {
    console.log("Consumer not found")
    return
  }

  await consumer.resume()

  console.log("Consumer resumed:", consumer.id)

}

/*
Cleanup client resources
*/
function cleanupClient(ws) {

  const client = clients.get(ws)

  if (!client) return

  if (client.producer) {
    client.producer.close()
  }

  client.consumers.forEach(consumer => {
    consumer.close()
  })

  if (client.transport) {
    client.transport.close()
  }

  clients.delete(ws)

}

module.exports = initWebSocket

