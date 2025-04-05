const { getPublicKey, nip04, relayInit, getEventHash, nip19 } = require('nostr-tools')

// Dynamic ESM import workaround
let schnorr
;(async () => {
  const noble = await import('@noble/secp256k1')
  schnorr = noble.schnorr
})()

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

    // Wait until schnorr is loaded
    while (!schnorr) await new Promise(r => setTimeout(r, 10))
    event.sig = await schnorr.sign(event.id, BOT_PRIVATE_KEY)

    console.log('✍️ Event signed. ID:', event.id)

    const publishToRelay = async (url) => {
      try {
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
            reject(new Error(`Relay failed: ${reason}`))
          })
        })

        relay.close()
      } catch (err) {
        console.error(`❌ Error publishing to relay ${url}:`, err.message)
        throw err
      }
    }

    const results = await Promise.allSettled(RELAY_URLS.map(publishToRelay))

    const successCount = results.filter(r => r.status === 'fulfilled').length
    if (successCount === 0) {
      throw new Error('❌ Failed to publish message to all relays.')
    } else {
      console.log(`🎉 Message sent successfully to ${successCount} relay(s).`)
    }
  } catch (err) {
    console.error('🚨 Failed to send DM:', err.message)
    throw err
  }
}

module.exports = { sendDM }
