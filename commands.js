const { pool } = require('./db')

async function handleCommand(pubkey, command) {
  const cmd = command.trim().toLowerCase()
  console.log(`⚙️ Handling command: "${cmd}" for pubkey: ${pubkey}`)

  if (cmd === '/start') {
    await pool.query(
      `UPDATE brightmind_users SET is_paused = FALSE, paused_until = NULL WHERE pubkey = $1`,
      [pubkey]
    )
    console.log('✅ User resumed check-ins.')
    return "✅ You’re all set! I’ll send you daily gratitude and growth check-ins."
  }

  if (cmd === '/stop') {
    await pool.query(
      `UPDATE brightmind_users SET is_paused = TRUE, paused_until = NULL WHERE pubkey = $1`,
      [pubkey]
    )
    console.log('🛑 User check-ins paused indefinitely.')
    return "🛑 Daily check-ins paused. Send `/start` anytime to begin again."
  }

  if (cmd.startsWith('/pause')) {
    const match = cmd.match(/\/pause\s+(\d+)/)
    if (!match) {
      console.log('⏸️ Pause command received with no days — defaulting to indefinite.')
      await pool.query(
        `UPDATE brightmind_users SET is_paused = TRUE, paused_until = NULL WHERE pubkey = $1`,
        [pubkey]
      )
      return "⏸️ Paused indefinitely. Send `/start` when you're ready to resume."
    }

    const days = parseInt(match[1])
    const pauseUntil = new Date()
    pauseUntil.setDate(pauseUntil.getDate() + days)

    await pool.query(
      `UPDATE brightmind_users SET is_paused = TRUE, paused_until = $1 WHERE pubkey = $2`,
      [pauseUntil.toISOString().split('T')[0], pubkey]
    )

    console.log(`⏸️ User paused for ${days} day(s), until ${pauseUntil.toISOString().split('T')[0]}`)
    return `⏸️ Paused for ${days} day(s). I’ll check back in after that.`
  }

  console.log('❓ Command not recognized.')
  return null // not a special command
}

module.exports = {
  handleCommand
}
