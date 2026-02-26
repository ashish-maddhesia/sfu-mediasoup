
const { getRouter } = require("./router")

async function createTransport() {

  const router = getRouter()

  if (!router) {
    throw new Error("Router not initialized")
  }

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

  // ✅ Correct place to add event listeners
  transport.on("dtlsstatechange", state => {
    console.log(`Transport ${transport.id} DTLS state:`, state)
  })

  transport.on("close", () => {
    console.log(`Transport ${transport.id} closed`)
  })

  return transport

}

module.exports = {
  createTransport
}

