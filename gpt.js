// gpt.js (with Assistants API)
const { OpenAI } = require('openai')
const { logGPTUsage, updateUserBalance, updateUserThread } = require('./db')
const { getModuleCost } = require('./balance')
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const DEFAULT_ASSISTANT_ID = process.env.DEFAULT_ASSISTANT_ID

async function ensureThread(user) {
  if (!user.thread_id) {
    const thread = await openai.beta.threads.create()
    await updateUserThread(user.id, thread.id)
    return thread.id
  }
  return user.thread_id
}

async function getReflection({ user, module, input, promptTemplate }) {
  const cost = await getModuleCost(module)
  if (user.balance_sats < cost) return { error: 'insufficient_balance' }

  const assistantId = user.assistant_id || DEFAULT_ASSISTANT_ID
  const threadId = await ensureThread(user)

  const context = []
  if (user.age) context.push(`The user is ${user.age} years old.`)
  if (user.gender) context.push(`The user identifies as ${user.gender}.`)
  if (user.faith) context.push(`The user prefers responses rooted in ${user.faith} values.`)

  const prompt = promptTemplate.includes('{input}')
    ? promptTemplate.replace('{input}', input)
    : `${promptTemplate}\n${input}`

  const fullPrompt = context.length ? `${context.join(' ')}\n\n${prompt}` : prompt

  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: fullPrompt
  })

  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId
  })

  // Wait for run to complete (simple polling)
  let runStatus = run.status
  let result = null

  while (runStatus === 'queued' || runStatus === 'in_progress') {
    await new Promise(res => setTimeout(res, 1000))
    const check = await openai.beta.threads.runs.retrieve(threadId, run.id)
    runStatus = check.status
    if (runStatus === 'completed') result = check
  }

  if (runStatus !== 'completed') {
    return { error: 'run_failed' }
  }

  const messages = await openai.beta.threads.messages.list(threadId)
  const lastMessage = messages.data.find(m => m.role === 'assistant')
  const aiText = lastMessage?.content?.[0]?.text?.value || ''

  await updateUserBalance(user.id, user.balance_sats - cost)
  await logGPTUsage({
    userId: user.id,
    module,
    satsSpent: cost,
    tokensUsed: null // Assistants doesn't always return token count yet
  })

  return { aiText }
}

module.exports = {
  getReflection
}



