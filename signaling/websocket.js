const WebSocket = require("ws")

const { createTransport } = require("../mediasoup/transport")
const { createProducer } = require("../mediasoup/producer")
const { createConsumer } = require("../mediasoup/consumer")
const { getRouter } = require("../mediasoup/router")

const clients = new Map()

function initWebSocket(server) {

  const wss = new WebSocket.Server({ server })

  wss.on("connection", ws => {

    console.log("Client connected")

    clients.set(ws, {
      transport: null,
      producer: null,
      consumers: []
    })

    ws.on("message", async message => {

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

          await handleConsume(ws)
          break

      }

    })

  })

}

module.exports = initWebSocket
async function handleCreateTransport(ws) {

  const transport = await createTransport()

  clients.get(ws).transport = transport

  ws.send(JSON.stringify({

    action: "transportCreated",

    params: {

      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters

    }

  }))

}

async function handleConnectTransport(ws, data) {

  const transport = clients.get(ws).transport

  await transport.connect({

    dtlsParameters: data.dtlsParameters

  })

  console.log("Transport connected")

}


async function handleProduce(ws, data) {

  const transport = clients.get(ws).transport

  const producer = await createProducer(

    transport,
    data.kind,
    data.rtpParameters

  )

  clients.get(ws).producer = producer

  ws.send(JSON.stringify({

    action: "produced",
    producerId: producer.id

  }))

}
async function handleConsume(ws) {

  const router = getRouter()

  const client = clients.get(ws)

  const producer = [...clients.values()]
    .find(c => c.producer)?.producer

  if (!producer) {

    console.log("No producer found")
    return

  }

  const consumer = await createConsumer(

    client.transport,
    producer,
    router

  )

  client.consumers.push(consumer)

  ws.send(JSON.stringify({

    action: "consumed",

    params: {

      id: consumer.id,
      producerId: producer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters

    }

  }))

}