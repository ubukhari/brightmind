const { createEntry, updateLastPromptSent } = require('../db')
const { getReflection } = require('../gpt')
const { getModuleCost } = require('../balance')

const MODULE = 'reframe'
const DEFAULT_PROMPT = "Let’s reframe something stressful. What frustrated or challenged you today?"
const TEMPLATE = "The user described this frustration: {input}. Offer 2–3 new ways to view this situation more positively, constructively, or with a growth mindset."

async function handle(user, message = null) {
  if (!message || message.trim().toLowerCase() === '/reframe') {
    console.log(`📨 Sending default reframe prompt to user ${user.id}`)
    return DEFAULT_PROMPT
  }

  const response = message.trim()
  const prompt = DEFAULT_PROMPT
  let aiResponse = null

  console.log(`😤 Reframe input from user ${user.id}:`, response)

  const reflection = await getReflection({
    user,
    module: MODULE,
    input: response,
    promptTemplate: TEMPLATE
  })

  if (reflection.error === 'insufficient_balance') {
    console.warn(`⚠️ Not enough sats for user ${user.id} on reframe module.`)
    aiResponse = null
  } else {
    aiResponse = reflection.aiText
    console.log(`🤖 Reframe response from GPT:`, aiResponse)
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
    ? `🧠 Here are some new ways to look at it:\n${aiResponse}`
    : `✅ Noted. Zap ⚡ to unlock reframing insights and patterns.`
}

module.exports = { handle }
