import { db, save } from './db.js'

async function send(chatId, text, extra = {}) {
  await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, ...extra }),
  })
}

async function handle(update) {
  const message = update.message
  if (!message) return

  if (message.contact) {
    const telegramId = message.contact.user_id || message.from?.id
    const user = db.users.find((item) => String(item.telegramId) === String(telegramId))
    if (user) {
      user.phone = message.contact.phone_number
      save()
    }
    await send(message.chat.id, 'Рақами телефон сабт шуд. Ба Дукон бармегардед.', {
      reply_markup: { remove_keyboard: true },
    })
    return
  }

  if (message.text === '/start') {
    const url = process.env.WEBAPP_URL
    const extra = url
      ? {
          reply_markup: {
            inline_keyboard: [[{ text: 'Кушодани Дукон', web_app: { url } }]],
          },
        }
      : {}
    await send(message.chat.id, 'Хуш омадед ба Дукон — бозори дохили Telegram.', extra)
  }
}

export function startBot() {
  if (!process.env.BOT_TOKEN) {
    console.log('BOT_TOKEN нест — огоҳиномаҳо дар дохили барнома мемонанд')
    return
  }
  console.log('Боти Telegram фаъол аст')
  void poll()
}

async function poll() {
  let offset = 0
  for (;;) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getUpdates?timeout=25&offset=${offset}`)
      const data = await response.json()
      if (!data.ok) throw new Error(data.description || 'bot error')
      for (const update of data.result || []) {
        offset = update.update_id + 1
        await handle(update)
      }
    } catch (error) {
      console.log('Bot poll:', error.message)
      await new Promise((resolve) => setTimeout(resolve, 4000))
    }
  }
}

export async function requestPhone(user) {
  if (!process.env.BOT_TOKEN) {
    const error = new Error('Бот танзим нашудааст. Рақамро дастӣ ворид кунед.')
    error.status = 400
    throw error
  }
  if (!user.telegramId) {
    const error = new Error('Ин ҳисоб ба Telegram пайваст нест.')
    error.status = 400
    throw error
  }
  const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: user.telegramId,
      text: 'Барои расонидани фармоиш рақами телефонро фиристед.',
      reply_markup: {
        keyboard: [[{ text: 'Фиристодани рақам', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    }),
  })
  const data = await response.json()
  if (!data.ok) {
    const error = new Error(data.description || 'Фиристодани дархост муяссар нашуд')
    error.status = 502
    throw error
  }
}
