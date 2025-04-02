const { createEntry, updateLastPromptSent } = require('../db')
const { getReflection } = require('../gpt')
const { getModuleCost } = require('../balance')

const MODULE = 'gratitude'
const DEFAULT_PROMPT = "Here’s today’s reflection: What are 3 good things that happened recently? Reply with your thoughts."
const TEMPLATE = "The user listed these gratitude items: {input}. Offer a gentle insight or theme you notice in their reflections."

async function handle(user, message = null) {
  // If no message content, send default prompt
  if (!message || message.trim().toLowerCase() === '/gratitude') {
    return DEFAULT_PROMPT
  }

  const response = message.trim().slice(0, 1000) // prevent runaway token use
  const prompt = DEFAULT_PROMPT
  let aiResponse = null

  const reflection = await getReflection({
    user,
    module: MODULE,
    input: response,
    promptTemplate: TEMPLATE
  })

  if (reflection.error === 'insufficient_balance') {
    aiResponse = null // allow entry, no GPT
  } else {
    aiResponse = reflection.aiText
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
    ? `🧠 Here's something I noticed:\n\n${aiResponse}`
    : `🙏 Got it. You're always welcome to reflect here. (Zap ⚡ to unlock deeper insights)`
}

module.exports = { handle }



