import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

interface DailySummary {
  total_warung: number
  top_pain_points: Record<string, number>
  top_features: Record<string, number>
  willing_percentage: number
  insights: string
}

async function getDailySummary(date: Date): Promise<DailySummary> {
  const dateStr = date.toISOString().split('T')[0]

  const { data, error } = await supabaseAdmin.rpc('get_daily_summary', {
    target_date: dateStr
  })

  if (error) {
    console.error('Error fetching daily summary:', error)
    throw error
  }

  const row = data?.[0]
  return {
    total_warung: row?.total_warung || 0,
    top_pain_points: row?.top_pain_points || {},
    top_features: row?.top_features || {},
    willing_percentage: row?.willing_percentage || 0,
    insights: row?.insights || 'Belum ada data observasi hari ini.'
  }
}

function formatSummaryMessage(summary: DailySummary, date: Date): string {
  const dateStr = date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  let message = `📊 *Ringkasan Harian FieldObserver*\n`
  message += `📅 ${dateStr}\n\n`
  message += `🏪 Total Warung: ${summary.total_warung}\n`
  message += `✅ Mau Coba: ${summary.willing_percentage}%\n\n`

  if (Object.keys(summary.top_pain_points).length > 0) {
    message += `😣 *Pain Point Teratas:*\n`
    Object.entries(summary.top_pain_points).slice(0, 3).forEach(([point, count], i) => {
      message += `  ${i + 1}. ${point} (${count})\n`
    })
    message += `\n`
  }

  if (Object.keys(summary.top_features).length > 0) {
    message += `✨ *Fitur Paling Diminati:*\n`
    Object.entries(summary.top_features).slice(0, 3).forEach(([feature, count], i) => {
      message += `  ${i + 1}. ${feature} (${count})\n`
    })
    message += `\n`
  }

  message += `💡 *Insight:*\n${summary.insights}`

  return message
}

async function sendToTelegram(message: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.warn('Telegram credentials not configured, skipping notification')
    return
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    })

    const result = await response.json()
    if (!result.ok) {
      console.error('Telegram API error:', result)
    } else {
      console.log('Telegram notification sent successfully')
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error)
  }
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const today = new Date()
    const summary = await getDailySummary(today)
    const message = formatSummaryMessage(summary, today)
    await sendToTelegram(message)

    return Response.json({ success: true, summary })
  } catch (error) {
    console.error('Cron job error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}