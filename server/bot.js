// Telegram Bot Integration for Cat Suika Mini App

export const BOT_TEXTS = {
  START_MESSAGE: `🐱 *Добро пожаловать в Cat Suika!* 🍉

Сбрасывай милых котиков в коробку, объединяй одинаковых и вырасти легендарного *Короля Котов*!

✨ *В игре тебя ждёт:*
• Залипательная физика и милые мурлыкающие котики
• 11 уровней эволюции пород
• Коллекции и уютные темы оформления
• Ежедневные награды и задания с монетами
• Соревнования за лучший счёт в таблице лидеров

Нажми кнопку *«Играть в Cat Suika»* ниже, чтобы запустить игру! 👇`,

  HELP_MESSAGE: `📖 *Как играть в Cat Suika:*

1. Перемещай облачко с котиком пальцем или мышью.
2. Отпусти, чтобы сбросить котика в коробку.
3. Одинаковые котики сливаются в одного более крупного!
4. Не давай котикам пересечь верхнюю пунктирную линию.
5. Зарабатывай монеты и открывай новые породы в магазине!`,
};

export function setupBot(botToken, appUrl) {
  if (!botToken) {
    console.log('BOT_TOKEN not provided, running in standalone/web mode.');
    return;
  }

  const TELEGRAM_API = `https://api.telegram.org/bot${botToken}`;

  // Register bot commands with Telegram
  fetch(`${TELEGRAM_API}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commands: [
        { command: 'start', description: 'Запустить Cat Suika и открыть игру' },
        { command: 'play', description: 'Быстрый запуск Mini App' },
        { command: 'help', description: 'Правила и обучение' },
        { command: 'top', description: 'Таблица рекордов' },
      ],
    }),
  }).catch((err) => console.error('Error setting bot commands:', err));

  // Basic polling loop for handling /start and commands
  let offset = 0;
  async function pollUpdates() {
    try {
      const res = await fetch(`${TELEGRAM_API}/getUpdates?offset=${offset}&timeout=30`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            offset = update.update_id + 1;
            if (update.message && update.message.text) {
              await handleMessage(update.message, TELEGRAM_API, appUrl);
            }
          }
        }
      }
    } catch (e) {
      // Polling network safety
    }
    setTimeout(pollUpdates, 1500);
  }

  pollUpdates();
  console.log('🤖 Cat Suika Telegram Bot polling started!');
}

async function handleMessage(msg, apiUrl, appUrl) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  if (text.startsWith('/start') || text.startsWith('/play')) {
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🎮 Играть в Cat Suika',
            web_app: { url: appUrl },
          },
        ],
        [
          {
            text: '🏆 Таблица лидеров',
            callback_data: 'leaderboard',
          },
          {
            text: '📖 Как играть',
            callback_data: 'help',
          },
        ],
      ],
    };

    await fetch(`${apiUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: BOT_TEXTS.START_MESSAGE,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      }),
    });
  } else if (text.startsWith('/help')) {
    await fetch(`${apiUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: BOT_TEXTS.HELP_MESSAGE,
        parse_mode: 'Markdown',
      }),
    });
  }
}
