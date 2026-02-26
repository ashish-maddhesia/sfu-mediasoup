const { getRouter } = require("./router")

async function createTransport() {

  const router = getRouter()

  const transport = await router.createWebRtcTransport({

    listenIps: [
      {
        ip: "0.0.0.0",
        announcedIp: null
      }
    ],

    enableUdp: true,
    enableTcp: true,
    preferUdp: true

  })

  console.log("Transport created:", transport.id)

  return transport

}

module.exports = {
  createTransport
}