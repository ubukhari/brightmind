const { createEntry, updateLastPromptSent } = require('../db')
const { getReflection } = require('../gpt')
const { getModuleCost } = require('../balance')

const MODULE = 'friction'
const DEFAULT_PROMPT = "What slowed you down or made a good habit harder today?"
const TEMPLATE = "The user described a friction point: {input}. Suggest one small tweak to reduce that friction, like changing environment, timing, or setup. Keep it simple and specific."

async function handle(user, message = null) {
  if (!message || message.trim().toLowerCase() === '/friction') {
    return DEFAULT_PROMPT
  }

  const response = message.trim().slice(0, 1000)
  const prompt = DEFAULT_PROMPT
  let aiResponse = null

  const reflection = await getReflection({
    user,
    module: MODULE,
    input: response,
    promptTemplate: TEMPLATE
  })

  if (reflection.error === 'insufficient_balance') {
    aiResponse = null
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
    ? `⚙️ Friction fix idea:\n\n${aiResponse}`
    : `🔍 Noted. Zap ⚡ to get simple ways to make good habits easier.`
}

module.exports = { handle }



