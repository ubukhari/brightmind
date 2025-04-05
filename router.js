const gratitude = require('./prompts/gratitude')
const reframe = require('./prompts/reframe')
const fallingUp = require('./prompts/falling_up')
const zorro = require('./prompts/zorrocircle')
const happiness = require('./prompts/happiness_log')
const friction = require('./prompts/friction')
const social = require('./prompts/social')

const modules = {
  gratitude,
  reframe,
  falling_up: fallingUp,
  zorrocircle: zorro,
  happiness_log: happiness,
  friction,
  social
}

const aliases = {
  '/gratitude': 'gratitude',
  '/reframe': 'reframe',
  '/fallingup': 'falling_up',
  '/goal': 'zorrocircle',
  '/happiness': 'happiness_log',
  '/friction': 'friction',
  '/social': 'social'
}

async function routeToModule({ message, user }) {
  const cmd = message.trim().toLowerCase()
  console.log(`🧭 Routing message: "${cmd}"`)

  // Command match
  if (aliases[cmd]) {
    const moduleKey = aliases[cmd]
    console.log(`🔁 Matched command alias: ${cmd} → ${moduleKey}`)
    return modules[moduleKey].handle(user)
  }

  // Pattern match (basic fallback)
  if (cmd.includes('grateful') || cmd.includes('thank')) {
    console.log(`🧠 Inferred module: gratitude`)
    return modules.gratitude.handle(user, message)
  }

  if (cmd.includes('goal') || cmd.includes('do today')) {
    console.log(`🧠 Inferred module: zorrocircle`)
    return modules.zorrocircle.handle(user, message)
  }

  console.log(`🧐 No module matched. Sending default help reply.`)
  return `🧘 I'm here for your reflections. Try sending '/gratitude' or '/goal' to get started.`
}

module.exports = {
  routeToModule
}
