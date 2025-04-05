const { createEntry, updateLastPromptSent } = require('../db')
const { getReflection } = require('../gpt')
const { getModuleCost } = require('../balance')

const MODULE = 'falling_up'
const DEFAULT_PROMPT = "Think about a recent mistake, setback, or challenge. What happened, and what did you learn from it?"
const TEMPLATE = "The user described a recent challenge: {input}. Identify a strength they showed, a lesson they might take from it, and one small growth step they can try next time. Keep it supportive and motivational."

async function handle(user, message = null) {
  if (!message || message.trim().toLowerCase() === '/fallingup') {
    console.log(`📨 Sending default falling_up prompt to user ${user.id}`)
    return DEFAULT_PROMPT
  }

  const response = message.trim()
  const prompt = DEFAULT_PROMPT
  let aiResponse = null

  console.log(`📉 Falling Up input from user ${user.id}:`, response)

  const reflection = await getReflection({
    user,
    module: MODULE,
    input: response,
    promptTemplate: TEMPLATE
  })

  if (reflection.error === 'insufficient_balance') {
    console.warn(`⚠️ Not enough sats for user ${user.id} on falling_up module.`)
    aiResponse = null
  } else {
    aiResponse = reflection.aiText
    console.log(`🤖 GPT response for Falling Up:`, aiResponse)
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
    ? `🌱 Growth from adversity:\n${aiResponse}`
    : `📝 Noted. Reflecting is powerful. Zap ⚡ to get your personal growth plan next time.`
}

module.exports = { handle }
