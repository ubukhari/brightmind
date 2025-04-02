const { createEntry, updateLastPromptSent } = require('../db')
const { getReflection } = require('../gpt')
const { getModuleCost } = require('../balance')

const MODULE = 'falling_up'
const DEFAULT_PROMPT = "Think about a recent mistake, setback, or challenge. What happened, and what did you learn from it?"
const TEMPLATE = "The user described a recent challenge: {input}. Identify a strength they showed, a lesson they might take from it, and one small growth step they can try next time. Keep it supportive and motivational."

async function handle(user, message = null) {
  if (!message || message.trim().toLowerCase() === '/fallingup') {
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
    ? `🌱 Growth from adversity:\n\n${aiResponse}`
    : `📝 Noted. Reflecting is powerful. Zap ⚡ to get your personal growth plan next time.`
}

module.exports = { handle }



