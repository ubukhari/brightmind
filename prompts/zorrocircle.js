const { createEntry, updateLastPromptSent } = require('../db')
const { getReflection } = require('../gpt')
const { getModuleCost } = require('../balance')

const MODULE = 'zorrocircle'
const DEFAULT_PROMPT = "What's one small, manageable goal you want to accomplish today?"
const TEMPLATE = "The user wrote this goal: {input}. Help them refine it into a very small, specific, achievable micro-goal. Offer brief encouragement too."

async function handle(user, message = null) {
  const trimmed = message?.trim().toLowerCase()
  if (!message || trimmed === '/goal' || trimmed === '/zorrocircle') {
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
    ? `🎯 Here’s your micro-goal refinement:\n\n${aiResponse}`
    : `✅ Got it. Keep it small and doable. Zap ⚡ for coaching next time.`
}

module.exports = { handle }



