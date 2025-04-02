const { pool } = require('./db')

async function handleCommand(pubkey, command) {
  const cmd = command.trim().toLowerCase()

  if (cmd === '/start') {
    await pool.query(
      `UPDATE brightmind_users SET is_paused = FALSE, paused_until = NULL WHERE pubkey = $1`,
      [pubkey]
    )
    return "✅ You’re all set! I’ll send you daily gratitude and growth check-ins."
  }

  if (cmd === '/stop') {
    await pool.query(
      `UPDATE brightmind_users SET is_paused = TRUE, paused_until = NULL WHERE pubkey = $1`,
      [pubkey]
    )
    return "🛑 Daily check-ins paused. Send `/start` anytime to begin again."
  }

  if (cmd.startsWith('/pause')) {
    const match = cmd.match(/\/pause\s+(\d+)/)

    if (match) {
      const days = parseInt(match[1])
      const pauseUntil = new Date()
      pauseUntil.setDate(pauseUntil.getDate() + days)

      await pool.query(
        `UPDATE brightmind_users SET is_paused = TRUE, paused_until = $1 WHERE pubkey = $2`,
        [pauseUntil.toISOString().split('T')[0], pubkey]
      )

      return `⏸️ Paused for ${days} day(s). I’ll check back in after that.`
    } else {
      // Indefinite pause
      await pool.query(
        `UPDATE brightmind_users SET is_paused = TRUE, paused_until = NULL WHERE pubkey = $1`,
        [pubkey]
      )
      return `⏸️ Paused indefinitely. Send \`/start\` anytime to resume.`
    }
  }

  return null // not a special command
}

module.exports = {
  handleCommand
}



