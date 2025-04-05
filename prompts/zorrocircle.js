const { createEntry, updateLastPromptSent } = require('../db')
const { getReflection } = require('../gpt')
const { getModuleCost } = require('../balance')

const MODULE = 'zorrocircle'
const DEFAULT_PROMPT = "What's one small, manageable goal you want to accomplish today?"
const TEMPLATE = "The user wrote this goal: {input}. Help them refine it into a very small, specific, achievable micro-goal. Offer brief encouragement too."

async function handle(user, message = null) {
  const cleaned = message ? message.trim().toLowerCase() : ''
  if (!message || cleaned === '/goal' || cleaned === '/zorrocircle') {
    console.log(`📨 Sending default Zorro Circle prompt to user ${user.id}`)
    return DEFAULT_PROMPT
  }

  const response = message.trim()
  const prompt = DEFAULT_PROMPT
  let aiResponse = null

  console.log(`🎯 Zorro goal input from user ${user.id}:`, response)

  const reflection = await getReflection({
    user,
    module: MODULE,
    input: response,
    promptTemplate: TEMPLATE
  })

  if (reflection.error === 'insufficient_balance') {
    console.warn(`⚠️ Not enough sats for user ${user.id} on zorrocircle module.`)
    aiResponse = null
  } else {
    aiResponse = reflection.aiText
    console.log(`🤖 Zorro Circle AI output:`, aiResponse)
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
    ? `🎯 Here’s your micro-goal refinement:\n${aiResponse}`
    : `✅ Got it. Keep it small and doable. Zap ⚡ for coaching next time.`
}

module.exports = { handle }
