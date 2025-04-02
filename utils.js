// utils.js

function parseEvent(event) {
    // Support raw event body from Lambda proxy or test environment
    let body = event
    if (event.body) {
      try {
        body = JSON.parse(event.body)
      } catch (err) {
        console.error('Invalid JSON in event.body')
        throw err
      }
    }
  
    const pubkey = body.pubkey || body.sender || body.author
    const message = (body.message || body.content || '').trim()
  
    if (!pubkey || !message) {
      throw new Error('Missing pubkey or message in event')
    }
  
    return { pubkey, message }
  }
  
  module.exports = {
    parseEvent
  }
  
  
  