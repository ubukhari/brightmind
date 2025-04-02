const { createEntry, updateLastPromptSent } = require('../db')
const { getReflection } = require('../gpt')
const { getModuleCost } = require('../balance')

const MODULE = 'happiness_log'
const DEFAULT_PROMPT = "When did you feel your best today? Describe the moment or what led up to it."
const TEMPLATE = "The user described a happy or positive moment: {input}. Identify what likely caused this happiness (e.g., connection, achievement, creativity) and suggest one way to repeat or extend that feeling."

async function handle(user, message = null) {
  if (!message || message.trim().toLowerCase() === '/happiness') {
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
    ? `😊 Here's what might be fueling your happiness:\n\n${aiResponse}`
    : `💡 Great moment. Zap ⚡ next time for an insight on how to build more like it.`
}

module.exports = { handle }



