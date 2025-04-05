const { updateUserBalance, markUserWarned } = require('./db')

const MINIMUM_BALANCE_SATS = 60 // Alert when below this
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
  const cost = MODULE_COSTS[module] || 0
  console.log(`💵 Module cost for "${module}": ${cost} sats`)
  return cost
}

async function hasEnoughSats(user, module) {
  const cost = await getModuleCost(module)
  const hasEnough = user.balance_sats >= cost
  console.log(`💳 Balance check for user ${user.id} on "${module}":`, {
    balance: user.balance_sats,
    required: cost,
    result: hasEnough
  })
  return hasEnough
}

async function deductSats(user, module) {
  const cost = await getModuleCost(module)
  const newBalance = Math.max(user.balance_sats - cost, 0)
  console.log(`📉 Deducting ${cost} sats from user ${user.id}. New balance: ${newBalance}`)
  await updateUserBalance(user.id, newBalance)
  return newBalance
}

async function checkBalanceAndMaybeWarn(user) {

  const warnedRecently =  user.warned_at && new Date() - new Date(user.warned_at) < 1000 * 60 * 60 * 24 // warned in last 24h
  if (user.balance_sats < MINIMUM_BALANCE_SATS && !warnedRecently) {
    await markUserWarned(user.id)
    return `⚠️ Just a heads-up: we're running low on sats to power your reflections. Zap if you'd like to keep AI insights going ⚡`
  }
  
  if (user.balance_sats < MINIMUM_BALANCE_SATS && !user.warned_recently) {
    console.log(`⚠️ Warning user ${user.id} - low balance: ${user.balance_sats}`)
    await markUserWarned(user.id)
    return `⚠️ Just a heads-up: we're running low on sats to power your reflections. Zap if you'd like to keep AI insights going ⚡`
  }
  console.log(`✅ Balance OK for user ${user.id}: ${user.balance_sats} sats`)
  return null
}

module.exports = {
  hasEnoughSats,
  deductSats,
  getModuleCost,
  checkBalanceAndMaybeWarn
}
