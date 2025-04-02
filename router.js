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

  // Direct command
  if (aliases[cmd]) {
    const moduleKey = aliases[cmd]
    return modules[moduleKey].handle(user)
  }

  // Fuzzy matching
  if (cmd.includes('grateful') || cmd.includes('thank')) return modules.gratitude.handle(user, message)
  if (cmd.includes('goal') || cmd.includes('do today')) return modules.zorrocircle.handle(user, message)
  if (cmd.includes('stress') || cmd.includes('reframe')) return modules.reframe.handle(user, message)
  if (cmd.includes('challenge') || cmd.includes('failure')) return modules.falling_up.handle(user, message)
  if (cmd.includes('happy') || cmd.includes('log')) return modules.happiness_log.handle(user, message)
  if (cmd.includes('friction') || cmd.includes('blocker')) return modules.friction.handle(user, message)
  if (cmd.includes('connect') || cmd.includes('people')) return modules.social.handle(user, message)

  return `🧘 I'm here for your reflections. Try sending '/gratitude' or '/goal' to get started.`
}

module.exports = {
  routeToModule
}



