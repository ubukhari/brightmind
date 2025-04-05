const { getPublicKey, nip04, relayInit, getEventHash, getSignature } = require('nostr-tools')

const RELAY_URLS = [
  'wss://relay.nostr.wine',
  'wss://relay.snort.social',
  'wss://relay.nostr.band'
]

const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY
const BOT_PUBKEY = getPublicKey(BOT_PRIVATE_KEY)

async function sendDM(toPubkey, message) {
  const encrypted = await nip04.encrypt(BOT_PRIVATE_KEY, toPubkey, message)

  const event = {
    kind: 4, // encrypted DM
    pubkey: BOT_PUBKEY,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['p', toPubkey]],
    content: encrypted
  }

  // Sign the event using modern nostr-tools
  event.id = getEventHash(event)
  event.sig = getSignature(event, BOT_PRIVATE_KEY)

  for (const url of RELAY_URLS) {
    try {
      const relay = relayInit(url)
      await relay.connect()

      relay.on('error', () => console.warn(`Relay error: ${url}`))
      relay.on('notice', msg => console.log(`Relay notice from ${url}:`, msg))

      await new Promise((resolve, reject) => {
        const pub = relay.publish(event)
        pub.on('ok', resolve)
        pub.on('failed', reason => {
          console.error(`Relay ${url} failed to publish:`, reason)
          reject(reason)
        })
      })

      relay.close()
    } catch (err) {
      console.error(`Failed to publish to ${url}:`, err.message)
    }
  }
}

module.exports = { sendDM }
