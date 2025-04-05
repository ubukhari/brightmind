const { createEntry, updateLastPromptSent } = require('../db')
const { getReflection } = require('../gpt')
const { getModuleCost } = require('../balance')

const MODULE = 'social'
const DEFAULT_PROMPT = "Who did you connect with today, and how did it feel?"
const TEMPLATE = "The user described a social interaction: {input}. Summarize what it meant to them and suggest someone they might reach out to again soon. Offer an optional short appreciation message they could send."

async function handle(user, message = null) {
  if (!message || message.trim().toLowerCase() === '/social') {
    console.log(`📨 Sending default social prompt to user ${user.id}`)
    return DEFAULT_PROMPT
  }

  const response = message.trim()
  const prompt = DEFAULT_PROMPT
  let aiResponse = null

  console.log(`👥 Social interaction input from user ${user.id}:`, response)

  const reflection = await getReflection({
    user,
    module: MODULE,
    input: response,
    promptTemplate: TEMPLATE
  })

  if (reflection.error === 'insufficient_balance') {
    console.warn(`⚠️ Not enough sats for user ${user.id} on social module.`)
    aiResponse = null
  } else {
    aiResponse = reflection.aiText
    console.log(`🤖 GPT response for social insight:`, aiResponse)
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
    ? `👥 Connection insight:\n${aiResponse}`
    : `🤝 Got it. Reflecting helps. Zap ⚡ to get ideas on nurturing your relationships.`
}

module.exports = { handle }
