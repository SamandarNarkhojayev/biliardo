import { Telegraf } from 'telegraf'
import { env } from './config.js'
import { consumeLinkToken } from './auth-client.js'

/**
 * Создаёт инстанс Telegraf, навешивает handler'ы и возвращает.
 * Сам запуск (polling) делается отдельно — см. start().
 */
export function createBot(): Telegraf {
  const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN)

  bot.start(async (ctx) => {
    const startArg = (ctx.message?.text ?? '').split(' ').slice(1).join(' ').trim()
    if (!startArg) {
      await ctx.replyWithHTML(
        [
          '👋 Привет! Это бот <b>Biliardo</b>.',
          '',
          'Чтобы получать уведомления о турнирах, привяжите аккаунт:',
          '1. Откройте сайт biliardo.kz и войдите.',
          '2. В кабинете → «Уведомления» → «Подключить Telegram».',
          '3. Перейдите по кнопке-ссылке оттуда — он сам запустит этого бота.',
        ].join('\n'),
      )
      return
    }
    const chatId = ctx.chat.id
    const username = ctx.from?.username ?? null
    const result = await consumeLinkToken({ token: startArg, chatId, username })
    if (result.ok) {
      await ctx.replyWithHTML(
        [
          '✅ <b>Готово!</b> Аккаунт привязан.',
          '',
          'Теперь сюда будут приходить уведомления:',
          '— подтверждение регистрации на турнир,',
          '— напоминание за 2 часа до старта,',
          '— о старте турнира,',
          '— о готовом матче с указанием соперника и стола,',
          '— о завершённых матчах и итогах.',
          '',
          'А если вы организатор — ещё и о каждой новой регистрации на ваш турнир. 🎱',
        ].join('\n'),
      )
      return
    }
    const msg: Record<typeof result.code, string> = {
      TOKEN_NOT_FOUND: 'Ссылка не найдена. Запросите новую в кабинете.',
      TOKEN_USED:      'Эта ссылка уже использована.',
      TOKEN_EXPIRED:   'Ссылка просрочена (10 минут). Запросите новую.',
      CHAT_ALREADY_LINKED: 'Этот Telegram уже привязан к другому аккаунту.',
      OTHER:           'Не удалось привязать. Попробуйте ещё раз.',
    }
    await ctx.reply(`❌ ${msg[result.code]}`)
  })

  bot.command('status', async (ctx) => {
    await ctx.reply(
      'Подключение к аккаунту проверяется через /start <код>. Управление подпиской — в личном кабинете biliardo.kz.',
    )
  })

  bot.command('help', async (ctx) => {
    await ctx.replyWithHTML(
      [
        '<b>Biliardo bot</b>',
        '',
        '/start &lt;код&gt; — привязать аккаунт по коду из кабинета',
        '/status — статус привязки',
      ].join('\n'),
    )
  })

  bot.catch((err, ctx) => {
    ctx.telegram && console.error('bot handler error:', err, 'update:', ctx.updateType)
  })

  return bot
}
