// handler.js

const { getOrCreateUser } = require('./db')
const { checkBalanceAndMaybeWarn } = require('./balance')
const { sendDM } = require('./nostr')
const { routeToModule } = require('./router') // handles /gratitude, etc.
const { parseEvent } = require('./utils')
const { handleCommand } = require('./commands')

exports.handler = async (event) => {
  console.log('🔔 Lambda triggered with event:', JSON.stringify(event))

  try {
    const { pubkey, message } = parseEvent(event)
    console.log(`📩 Parsed event - pubkey: ${pubkey}, message: "${message}"`)

    const user = await getOrCreateUser(pubkey)
    console.log(`👤 Fetched user:`, user)

    if (user.is_paused) {
      console.log('⏸️ User is paused. Skipping processing.')
      return { statusCode: 200, body: 'User is paused.' }
    }

    const commandReply = await handleCommand(pubkey, message)
    if (commandReply) {
      console.log('💬 Responding to command with:', commandReply)
      await sendDM(pubkey, commandReply)
      return { statusCode: 200, body: 'Command processed' }
    }

    const reply = await routeToModule({ message, user })
    console.log('🧠 Module reply generated:', reply)

    await sendDM(pubkey, reply)
    console.log('📤 Reply sent to user.')

    const warnMessage = await checkBalanceAndMaybeWarn(user)
    if (warnMessage) {
      console.log('⚠️ Sending balance warning:', warnMessage)
      await sendDM(pubkey, warnMessage)
    }

    console.log('✅ Lambda completed successfully.')
    return { statusCode: 200, body: 'Message processed' }

  } catch (err) {
    console.error('❌ Uncaught error in handler:', err)
    return { statusCode: 500, body: 'Error handling message' }
  }
}
