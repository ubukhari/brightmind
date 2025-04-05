function parseEvent(event) {
    console.log('🧾 Raw event received:', JSON.stringify(event))
  
    // Support raw event body from Lambda proxy or test environment
    let body = event
    if (event.body) {
      try {
        body = JSON.parse(event.body)
      } catch (err) {
        console.error('❌ Invalid JSON in event.body')
        throw err
      }
    }
  
    const pubkey = body.pubkey || body.sender || body.author
    const message = (body.message || body.content || '').trim()
  
    if (!pubkey || !message) {
      console.error('❗ Missing pubkey or message in event:', body)
      throw new Error('Missing pubkey or message in event')
    }
  
    console.log(`✅ Event parsed — pubkey: ${pubkey}, message: "${message}"`)
    return { pubkey, message }
  }
  
  module.exports = {
    parseEvent
  }
  