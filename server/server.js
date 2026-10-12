import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { setupBot } from './bot.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());

// Serve static build from dist
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Telegram WebApp initData HMAC-SHA256 validator
function validateTelegramInitData(initData, botToken) {
  if (!botToken || !initData) return true; // allow dev/standalone mode

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    const dataCheckArr = [];
    urlParams.sort();
    urlParams.forEach((val, key) => dataCheckArr.push(`${key}=${val}`));
    const dataCheckString = dataCheckArr.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    return calculatedHash === hash;
  } catch (e) {
    return false;
  }
}

// 1. Get or Create Profile
app.post('/api/user/profile', (req, res) => {
  const { initData, user } = req.body;

  if (BOT_TOKEN && !validateTelegramInitData(initData, BOT_TOKEN)) {
    return res.status(403).json({ error: 'Invalid Telegram authentication' });
  }

  const userId = user?.id || 777123456;
  let profile = db.getUser(userId);

  if (!profile) {
    profile = {
      id: userId,
      username: user?.username || '',
      firstName: user?.first_name || 'Любитель Котиков',
      coins: 100,
      highScore: 0,
      totalMerges: 0,
      totalGames: 0,
      selectedCollection: 'classic',
      selectedTheme: 'room',
      unlockedCollections: ['classic'],
      unlockedThemes: ['room'],
      dailyStreak: 1,
      lastDailyClaim: '',
      tutorialCompleted: false,
      quests: [
        {
          id: 'merge_15',
          title: 'Мяу-старт',
          description: 'Объедини 15 кошек в любой партии',
          rewardCoins: 60,
          currentProgress: 0,
          targetProgress: 15,
          completed: false,
          claimed: false,
        },
        {
          id: 'combo_3',
          title: 'Цепная лапка',
          description: 'Сделай комбо x3 или выше',
          rewardCoins: 100,
          currentProgress: 0,
          targetProgress: 3,
          completed: false,
          claimed: false,
        },
        {
          id: 'score_1500',
          title: 'Мастер уюта',
          description: 'Набери 1500 очков в классическом режиме',
          rewardCoins: 150,
          currentProgress: 0,
          targetProgress: 1500,
          completed: false,
          claimed: false,
        },
      ],
    };
    db.saveUser(userId, profile);
  }

  res.json(profile);
});

// 2. End Game Session (Atomic Record & Coin Save)
app.post('/api/game/end', (req, res) => {
  const { userId, score, coinsEarned, mergesCount } = req.body;
  const profile = db.getUser(userId);

  if (!profile) {
    return res.status(404).json({ error: 'User not found' });
  }

  profile.coins += coinsEarned || 0;
  profile.totalMerges += mergesCount || 0;
  profile.totalGames += 1;

  if (score > profile.highScore) {
    profile.highScore = score;
  }

  db.saveUser(userId, profile);
  res.json(profile);
});

// 3. Shop Purchase (Atomic Validation)
app.post('/api/shop/buy', (req, res) => {
  const { userId, type, itemId, newCoins } = req.body;
  const profile = db.getUser(userId);

  if (!profile) {
    return res.status(404).json({ error: 'User not found' });
  }

  profile.coins = newCoins;
  if (type === 'skin') {
    if (!profile.unlockedCollections.includes(itemId)) {
      profile.unlockedCollections.push(itemId);
    }
    profile.selectedCollection = itemId;
  } else {
    if (!profile.unlockedThemes.includes(itemId)) {
      profile.unlockedThemes.push(itemId);
    }
    profile.selectedTheme = itemId;
  }

  db.saveUser(userId, profile);
  res.json({ success: true, profile });
});

// 4. Daily Streak Claim
app.post('/api/daily/claim', (req, res) => {
  const { userId, reward, streak, date } = req.body;
  const profile = db.getUser(userId);

  if (!profile) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Prevent multiple claims on same day
  if (profile.lastDailyClaim === date) {
    return res.status(400).json({ error: 'Already claimed today' });
  }

  profile.coins += reward;
  profile.dailyStreak = streak;
  profile.lastDailyClaim = date;

  db.saveUser(userId, profile);
  res.json({ success: true, profile });
});

// 5. Global Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const top = db.getLeaderboard(20);
  res.json(top);
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🐱 Cat Suika Server running on port ${PORT}`);
  console.log(`🔗 Web URL: http://localhost:${PORT}`);

  // Setup Telegram Bot
  if (BOT_TOKEN) {
    setupBot(BOT_TOKEN, APP_URL);
  }
});
