const { getPublicKey, nip04, relayInit, getEventHash, getSignature } = require('nostr-tools')

const RELAY_URLS = [
  'wss://relay.nostr.wine',
  'wss://relay.snort.social',
  'wss://relay.nostr.band'
]

const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY
const BOT_PUBKEY = getPublicKey(BOT_PRIVATE_KEY)
console.log('🤖 Nostr bot public key:', BOT_PUBKEY)

async function sendDM(toPubkey, message) {
  console.log(`✉️ Preparing to send DM to ${toPubkey}...`)
  try {
    const encrypted = await nip04.encrypt(BOT_PRIVATE_KEY, toPubkey, message)
    console.log('🔐 Message encrypted.')

    const event = {
      kind: 4, // Kind 4 = Encrypted DM
      pubkey: BOT_PUBKEY,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', toPubkey]],
      content: encrypted
    }

    event.id = getEventHash(event)
    event.sig = getSignature(event, BOT_PRIVATE_KEY)
    console.log('✍️ Event signed:', { id: event.id })

    for (const url of RELAY_URLS) {
      try {
        console.log(`📡 Connecting to relay: ${url}`)
        const relay = relayInit(url)
        await relay.connect()

        relay.on('error', () => console.warn(`⚠️ Relay error: ${url}`))
        relay.on('notice', msg => console.log(`📢 Relay notice from ${url}:`, msg))

        await new Promise((resolve, reject) => {
          const pub = relay.publish(event)
          pub.on('ok', () => {
            console.log(`✅ Message published to ${url}`)
            resolve()
          })
          pub.on('failed', reason => {
            console.error(`❌ Failed to publish to ${url}:`, reason)
            reject(reason)
          })
        })

        relay.close()
      } catch (err) {
        console.error(`❌ Error publishing to relay ${url}:`, err.message)
      }
    }
  } catch (err) {
    console.error('🚨 Failed to send DM:', err.message)
    throw err
  }
}

module.exports = { sendDM }
