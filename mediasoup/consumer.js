


async function createConsumer(transport, producer, router, rtpCapabilities) {

  try {

    // Check if router can consume this producer
    if (!router.canConsume({
      producerId: producer.id,
      rtpCapabilities
    })) {

      console.error("Router cannot consume this producer")
      return null

    }

    // Create consumer
    const consumer = await transport.consume({

      producerId: producer.id,
      rtpCapabilities,
      paused: true // start paused, client resumes later

    })

    console.log("Consumer created:", consumer.id)

    // Debug events
    consumer.on("transportclose", () => {

      console.log("Consumer transport closed:", consumer.id)

    })

    consumer.on("producerclose", () => {

      console.log("Producer closed, closing consumer:", consumer.id)

      consumer.close()

    })

    return consumer

  } catch (error) {

    console.error("Error creating consumer:", error)

    return null

  }

}

module.exports = {
  createConsumer
}

