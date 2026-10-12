import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dbData = {
  users: {},
  leaderboard: [
    { id: 101, name: 'Кот Борис', score: 2139 },
    { id: 102, name: 'Мурка Снайпер', score: 1963 },
    { id: 103, name: 'Барсик Великий', score: 1884 },
    { id: 104, name: 'Пушок', score: 1420 },
    { id: 105, name: 'Снежок', score: 1100 },
  ],
};

// Load database from file
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    dbData = JSON.parse(raw);
  } catch (e) {
    console.error('Error loading db.json, using defaults', e);
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving db.json', e);
  }
}

export const db = {
  getUser(userId) {
    return dbData.users[String(userId)] || null;
  },

  saveUser(userId, profile) {
    dbData.users[String(userId)] = profile;
    this.updateLeaderboard(profile);
    saveDb();
    return profile;
  },

  updateLeaderboard(profile) {
    if (!profile || !profile.highScore) return;

    const existingIdx = dbData.leaderboard.findIndex((e) => e.id === profile.id);
    if (existingIdx !== -1) {
      if (profile.highScore > dbData.leaderboard[existingIdx].score) {
        dbData.leaderboard[existingIdx].score = profile.highScore;
        dbData.leaderboard[existingIdx].name = profile.firstName || profile.username || 'Игрок';
      }
    } else {
      dbData.leaderboard.push({
        id: profile.id,
        name: profile.firstName || profile.username || 'Игрок',
        username: profile.username,
        score: profile.highScore,
      });
    }

    // Sort descending
    dbData.leaderboard.sort((a, b) => b.score - a.score);
    // Keep top 50
    dbData.leaderboard = dbData.leaderboard.slice(0, 50);
  },

  getLeaderboard(limit = 20) {
    return dbData.leaderboard.slice(0, limit).map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));
  },
};
