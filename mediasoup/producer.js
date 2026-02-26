async function createProducer(transport, kind, rtpParameters) {

  const producer = await transport.produce({

    kind,
    rtpParameters

  })

  console.log("Producer created:", producer.id)

  return producer

}

module.exports = {
  createProducer
}