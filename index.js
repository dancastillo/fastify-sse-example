const fastify = require('fastify')({ logger: true })

fastify.get('/events', async (request, reply) => {
  // Set necessary headers for SSE
  reply.raw.setHeader('Content-Type', 'text/event-stream')
  reply.raw.setHeader('Cache-Control', 'no-cache')
  reply.raw.setHeader('Connection', 'keep-alive')

  // Function to send SSE data
  const sendEvent = (data) => {
    reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // Initialize the async generator
  const generator = asyncGenerator()

  // Recursive function to handle each item from the generator
  const handleNext = async () => {
    try {
      const { value, done } = await generator.next()
      console.log(`Generated item: ${value}, Done: ${done}`) // Log current state

      if (done) {
        // If no more data, log the completion and close the connection
        console.log('No more items to send, ending response.')
        reply.raw.end()
        return
      }

      // Send the item as an event
      sendEvent({ item: value })

      // Use setImmediate to prevent blocking the event loop and handle the next item
      setImmediate(handleNext)
    } catch (error) {
      console.error('Error in generator handling:', error)
      reply.raw.end()
    }
  }

  // Start handling the generated items
  handleNext()

  // Clean up on client disconnect
  request.raw.on('close', () => {
    console.log('Client has disconnected.')
    reply.raw.end()
  })
})

fastify.listen(3000, err => {
  if (err) {
    fastify.log.error(err)
    return
  }
  console.log('Server running on http://localhost:3000')
})

async function * asyncGenerator () {
  const items = ['item1', 'item2', 'item3']
  for (const item of items) {
    // Simulate an asynchronous operation
    await new Promise(resolve => setTimeout(resolve, 1000))
    yield item
  }
}
