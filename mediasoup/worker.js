const mediasoup = require("mediasoup")

let worker

async function createWorker() {

  worker = await mediasoup.createWorker({

    rtcMinPort: 2000,
    rtcMaxPort: 2020

  })

  console.log("Worker created:", worker.pid)

  worker.on("died", () => {

    console.error("Worker died")

    process.exit(1)

  })

  return worker

}

function getWorker() {
  return worker
}

module.exports = {
  createWorker,
  getWorker
}