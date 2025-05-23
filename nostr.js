const { getPublicKey, nip04, relayInit, getEventHash, nip19 } = require('nostr-tools')

// Dynamic ESM import workaround for schnorr signing
let schnorr
;(async () => {
  const noble = await import('@noble/secp256k1')
  schnorr = noble.schnorr
})()

const RELAY_URLS = [
  'wss://relay.damus.io',
  'wss://relay.primal.net',
  'wss://relay.snort.social',
  'wss://relay.iris.to',
  'wss://nos.lol',
  'wss://relay.nostr.band'
]

const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY
const BOT_PUBKEY = getPublicKey(BOT_PRIVATE_KEY)
console.log('🤖 Nostr bot public key:', BOT_PUBKEY)

async function sendDM(toPubkey, message) {
  console.log(`✉️ Preparing to send DM to ${toPubkey}...`)

  try {
    const decoded = nip19.decode(toPubkey)
    const hexPubkey = decoded.data
    console.log('🔓 Decoded pubkey to hex:', hexPubkey)

    const encrypted = await nip04.encrypt(BOT_PRIVATE_KEY, hexPubkey, message)
    console.log('🔐 Message encrypted.')

    const event = {
      kind: 4,
      pubkey: BOT_PUBKEY,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', hexPubkey]],
      content: encrypted
    }

    event.id = getEventHash(event)

    while (!schnorr) await new Promise(r => setTimeout(r, 10))
    event.sig = await schnorr.sign(event.id, BOT_PRIVATE_KEY)
    console.log('✍️ Event signed. ID:', event.id)

    console.log('🚀 Broadcasting to all relays...')

    const publishPromises = RELAY_URLS.map(async (url) => {
      try {
        console.log(`📡 Connecting to relay: ${url}`)
        const relay = relayInit(url)
        await relay.connect()

        relay.on('error', () => console.warn(`⚠️ Relay error: ${url}`))
        relay.on('notice', msg => console.log(`📢 Relay notice from ${url}:`, msg))

        await Promise.race([
          new Promise((resolve, reject) => {
            const pub = relay.publish(event)
            pub.on('ok', () => {
              console.log(`✅ Message published to ${url}`)
              resolve()
            })
            pub.on('failed', reason => {
              console.error(`❌ Failed to publish to ${url}:`, reason)
              reject(new Error(`Relay failed: ${reason}`))
            })
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`⏱️ Timeout publishing to ${url}`)), 2500)
          )
        ])

        relay.close()
      } catch (err) {
        console.error(`❌ Error with relay ${url}:`, err.message)
      }
    })

    await Promise.allSettled(publishPromises)

    console.log('📬 DM broadcast complete.')

  } catch (err) {
    console.error('🚨 Failed to send DM:', err.message)
    throw err
  }
}

module.exports = { sendDM }
