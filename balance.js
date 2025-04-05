const { updateUserBalance, markUserWarned } = require('./db')

const MINIMUM_BALANCE_SATS = 60 //
const MODULE_COSTS = {
  gratitude: 10,
  reframe: 20,
  falling_up: 20,
  zorrocircle: 15,
  happiness_log: 15,
  friction: 15,
  social: 20,
  weekly_summary: 50,
}

async function getModuleCost(module) {
  return MODULE_COSTS[module] || 0
}

async function hasEnoughSats(user, module) {
  const cost = await getModuleCost(module)
  return user.balance_sats >= cost
}

async function deductSats(user, module) {
  const cost = await getModuleCost(module)
  const newBalance = Math.max(user.balance_sats - cost, 0)
  await updateUserBalance(user.id, newBalance)
  return newBalance
}

async function checkBalanceAndMaybeWarn(user) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const lastWarned = user.warned_at ? new Date(user.warned_at) : null

  const shouldWarn = user.balance_sats < MINIMUM_BALANCE_SATS &&
    (!lastWarned || lastWarned < oneWeekAgo)

  if (shouldWarn) {
    await markUserWarned(user.id)
    return `⚠️ Just a heads-up: we're running low on sats to power your reflections. Zap if you'd like to keep AI insights going ⚡`
  }

  return null
}

module.exports = {
  hasEnoughSats,
  deductSats,
  getModuleCost,
  checkBalanceAndMaybeWarn
}



