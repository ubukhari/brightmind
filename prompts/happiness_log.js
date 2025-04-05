const { createEntry, updateLastPromptSent } = require('../db')
const { getReflection } = require('../gpt')
const { getModuleCost } = require('../balance')

const MODULE = 'happiness_log'
const DEFAULT_PROMPT = "When did you feel your best today? Describe the moment or what led up to it."
const TEMPLATE = "The user described a happy or positive moment: {input}. Identify what likely caused this happiness (e.g., connection, achievement, creativity) and suggest one way to repeat or extend that feeling."

async function handle(user, message = null) {
  if (!message || message.trim().toLowerCase() === '/happiness') {
    console.log(`📨 Sending default happiness_log prompt to user ${user.id}`)
    return DEFAULT_PROMPT
  }

  const response = message.trim()
  const prompt = DEFAULT_PROMPT
  let aiResponse = null

  console.log(`😊 Happiness Log input from user ${user.id}:`, response)

  const reflection = await getReflection({
    user,
    module: MODULE,
    input: response,
    promptTemplate: TEMPLATE
  })

  if (reflection.error === 'insufficient_balance') {
    console.warn(`⚠️ Not enough sats for user ${user.id} on happiness_log module.`)
    aiResponse = null
  } else {
    aiResponse = reflection.aiText
    console.log(`🤖 Happiness Log GPT response:`, aiResponse)
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
    ? `😊 Here's what might be fueling your happiness:\n${aiResponse}`
    : `💡 Great moment. Zap ⚡ next time for an insight on how to build more like it.`
}

module.exports = { handle }
