const socket = new WebSocket("ws://localhost:3000")

let device
let transport
let producer
let consumer

let localStream

socket.onmessage = async (message) => {

  const data = JSON.parse(message.data)

  switch(data.action) {

    case "transportCreated":

      await createDevice()

      transport = device.createSendTransport(data.params)

      transport.on("connect", ({ dtlsParameters }, callback) => {

        socket.send(JSON.stringify({
          action: "connectTransport",
          dtlsParameters
        }))

        callback()

      })

      transport.on("produce", ({ kind, rtpParameters }, callback) => {

        socket.send(JSON.stringify({
          action: "produce",
          kind,
          rtpParameters
        }))

        callback()

      })

      await startProducing()

      break

  }

}

async function createDevice() {

  device = new mediasoupClient.Device()

  await device.load({
    routerRtpCapabilities: {
      codecs: [],
      headerExtensions: []
    }
  })

}

async function start() {

  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  })

  document.getElementById("localVideo").srcObject = localStream

  socket.send(JSON.stringify({
    action: "createTransport"
  }))

}

async function startProducing() {

  const track = localStream.getVideoTracks()[0]

  producer = await transport.produce({
    track
  })

}