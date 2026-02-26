

async function createProducer(transport, kind, rtpParameters) {

  if (!transport) {
    throw new Error("Transport not found")
  }

  const producer = await transport.produce({
    kind,
    rtpParameters
  })

  console.log("Producer created:", producer.id)

  // ✅ Correct place for event listener
  producer.on("transportclose", () => {
    console.log(`Producer ${producer.id} transport closed`)
  })

  producer.on("close", () => {
    console.log(`Producer ${producer.id} closed`)
  })

  return producer

}

module.exports = {
  createProducer
}

