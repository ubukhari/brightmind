// handler.js

const { getOrCreateUser } = require('./db')
const { checkBalanceAndMaybeWarn } = require('./balance')
const { sendDM } = require('./nostr')
const { routeToModule } = require('./router') // handles /gratitude, etc.
const { parseEvent } = require('./utils')
const { handleCommand } = require('./commands')

exports.handler = async (event) => {
  try {
    const { pubkey, message } = parseEvent(event)

    // Get or create user
    const user = await getOrCreateUser(pubkey)

    // Stop or pause?
    if (user.is_paused) {
      return { statusCode: 200, body: 'User is paused.' }
    }

    const commandReply = await handleCommand(pubkey, message)
    if (commandReply) {
      await sendDM(pubkey, commandReply)
      return { statusCode: 200, body: 'Command processed' }
    }

    // Route message to appropriate module
    const reply = await routeToModule({ message, user })

    // Send reply
    await sendDM(pubkey, reply)

    // Optionally warn if low balance
    await checkBalanceAndMaybeWarn(user)

    return { statusCode: 200, body: 'Message processed' }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: 'Error handling message' }
  }
}


