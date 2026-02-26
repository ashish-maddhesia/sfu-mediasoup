const { getWorker } = require("./worker")

let router

async function createRouter() {

  const worker = getWorker()

  router = await worker.createRouter({

    mediaCodecs: [

      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2
      },

      {
        kind: "video",
        mimeType: "video/VP8",
        clockRate: 90000
      }

    ]

  })

  console.log("Router created")

  return router

}

function getRouter() {
  return router
}

module.exports = {
  createRouter,
  getRouter
}