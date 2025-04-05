const { createEntry, updateLastPromptSent } = require('../db')
const { getReflection } = require('../gpt')
const { getModuleCost } = require('../balance')

const MODULE = 'gratitude'
const DEFAULT_PROMPT = "Here’s today’s reflection: What are 3 good things that happened recently? Reply with your thoughts."
const TEMPLATE = "The user listed these gratitude items: {input}. Offer a gentle insight or theme you notice in their reflections."

async function handle(user, message = null) {
  if (!message || message.trim().toLowerCase() === '/gratitude') {
    console.log(`📨 Sending default gratitude prompt to user ${user.id}`)
    return DEFAULT_PROMPT
  }

  const response = message.trim()
  const prompt = DEFAULT_PROMPT
  let aiResponse = null

  console.log(`📝 Logging gratitude reflection from user ${user.id}:`, response)

  const reflection = await getReflection({
    user,
    module: MODULE,
    input: response,
    promptTemplate: TEMPLATE
  })

  if (reflection.error === 'insufficient_balance') {
    console.warn(`⚠️ Not enough sats for user ${user.id} on gratitude module.`)
    aiResponse = null
  } else {
    aiResponse = reflection.aiText
    console.log(`🤖 GPT responded with:`, aiResponse)
  }

  await createEntry({
    userId: user.id,
    module: MODULE,
    prompt,
    response,
    aiResponse,
    costSats: aiResponse ? await getModuleCost(MODULE) : 0
  })

  await updateLastPromptSent(user.id)

  return aiResponse
    ? `🧠 Here's something I noticed:\n${aiResponse}`
    : `🙏 Got it. You're always welcome to reflect here. (Zap ⚡ to unlock deeper insights)`
}

module.exports = { handle }
