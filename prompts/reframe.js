const { createEntry, updateLastPromptSent } = require('../db')
const { getReflection } = require('../gpt')
const { getModuleCost } = require('../balance')

const MODULE = 'reframe'
const DEFAULT_PROMPT = "Let’s reframe something stressful. What frustrated or challenged you today?"
const TEMPLATE = "The user described this frustration: {input}. Offer 2–3 new ways to view this situation more positively, constructively, or with a growth mindset."

async function handle(user, message = null) {
  if (!message || message.trim().toLowerCase() === '/reframe') {
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
    ? `🧠 Here are some new ways to look at it:\n\n${aiResponse}`
    : `✅ Noted. Zap ⚡ to unlock reframing insights and patterns.`
}

module.exports = { handle }



