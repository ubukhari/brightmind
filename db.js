const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// ✅ Users
async function getOrCreateUser(pubkey) {
  const { rows } = await pool.query(
    'SELECT * FROM brightmind_users WHERE pubkey = $1', [pubkey]
  )
  if (rows.length > 0) return rows[0]

  const insert = await pool.query(
    `INSERT INTO brightmind_users (pubkey, balance_sats)
     VALUES ($1, $2)
     RETURNING *`,
    [pubkey, 300] // start with 300 sats
  )
  return insert.rows[0]
}

async function updateUserBalance(userId, newBalance) {
  await pool.query(
    'UPDATE brightmind_users SET balance_sats = $1 WHERE id = $2',
    [newBalance, userId]
  )
}

async function updateLastPromptSent(userId) {
  await pool.query(
    'UPDATE brightmind_users SET last_prompt_sent = CURRENT_DATE WHERE id = $1',
    [userId]
  )
}

async function markUserWarned(userId) {
  await pool.query(
    'UPDATE brightmind_users SET warned_recently = TRUE, warned_at = CURRENT_TIMESTAMP WHERE id = $1',
    [userId]
  )
}

// ✅ Entries
async function createEntry({ userId, module, prompt, response, aiResponse = null, costSats = 0 }) {
  await pool.query(
    `INSERT INTO brightmind_entries (user_id, module, prompt, response, ai_response, cost_sats)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, module, prompt, response, aiResponse, costSats]
  )
}

// ✅ Usage Logs
async function logGPTUsage({ userId, module, satsSpent, tokensUsed }) {
  await pool.query(
    `INSERT INTO brightmind_usage_logs (user_id, module, sats_spent, tokens_used)
     VALUES ($1, $2, $3, $4)`,
    [userId, module, satsSpent, tokensUsed || null]
  )
}

// ✅ Zaps
async function recordZap({ userId, amountSats, txId, zapNote }) {
  await pool.query(
    `INSERT INTO brightmind_zaps (user_id, amount_sats, tx_id, zap_note)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (tx_id) DO NOTHING`,
    [userId, amountSats, txId, zapNote || null]
  )
  await pool.query(
    `UPDATE brightmind_users SET balance_sats = balance_sats + $1 WHERE id = $2`,
    [amountSats, userId]
  )
}

// ✅ Insights
async function storeWeeklyInsight({ userId, summary, weekStart, weekEnd }) {
  await pool.query(
    `INSERT INTO brightmind_insights (user_id, summary, week_start, week_end)
     VALUES ($1, $2, $3, $4)`,
    [userId, summary, weekStart, weekEnd]
  )
}

module.exports = {
  getOrCreateUser,
  updateUserBalance,
  updateLastPromptSent,
  markUserWarned,
  createEntry,
  logGPTUsage,
  recordZap,
  storeWeeklyInsight,
  pool // export raw pool for custom queries elsewhere
}



