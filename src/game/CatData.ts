import { CatTier, SkinCollection, GameTheme, DailyQuest } from './Types';

export const BASE_CAT_TIERS: CatTier[] = [
  {
    tier: 1,
    name: 'Крошка Мяу',
    breed: 'Новорождённый котёнок',
    radius: 19,
    points: 1,
    coins: 1,
    color: '#FFF8E7', // Cream white
    earColor: '#F5DEB3',
    eyeColor: '#2B2B2B',
    innerEarColor: '#FFB6C1',
    spotColor: '#FFE4B5',
  },
  {
    tier: 2,
    name: 'Рыжик',
    breed: 'Домашний рыжий кот',
    radius: 27,
    points: 3,
    coins: 2,
    color: '#FF9E43', // Vibrant orange
    earColor: '#E67E22',
    eyeColor: '#2C3E50',
    innerEarColor: '#FFA07A',
    spotColor: '#D35400',
  },
  {
    tier: 3,
    name: 'Серый Шарик',
    breed: 'Круглый британец',
    radius: 36,
    points: 6,
    coins: 4,
    color: '#95A5A6', // Soft slate
    earColor: '#7F8C8D',
    eyeColor: '#F39C12',
    innerEarColor: '#FFB6C1',
    spotColor: '#BDC3C7',
  },
  {
    tier: 4,
    name: 'Зефирка',
    breed: 'Трёхцветная калико',
    radius: 46,
    points: 10,
    coins: 8,
    color: '#FDFEFE', // White calico base
    earColor: '#E67E22',
    eyeColor: '#27AE60',
    innerEarColor: '#FFB6C1',
    spotColor: '#34495E',
  },
  {
    tier: 5,
    name: 'Персик',
    breed: 'Пушистый персидский кот',
    radius: 58,
    points: 15,
    coins: 12,
    color: '#FFB6A3', // Soft peach
    earColor: '#FA8072',
    eyeColor: '#2C3E50',
    innerEarColor: '#FFC0CB',
    spotColor: '#E9967A',
  },
  {
    tier: 6,
    name: 'Сиамец',
    breed: 'Королевский сиамец',
    radius: 70,
    points: 21,
    coins: 18,
    color: '#F4ECE1', // Warm ivory
    earColor: '#5D4037', // Dark point ears
    eyeColor: '#2980B9', // Deep sapphire blue eyes
    innerEarColor: '#D7CCC8',
    spotColor: '#4E342E',
  },
  {
    tier: 7,
    name: 'Шотландец',
    breed: 'Вислоухий шотландец',
    radius: 82,
    points: 28,
    coins: 25,
    color: '#85929E', // Steel gray
    earColor: '#566573',
    eyeColor: '#F1C40F', // Golden amber
    innerEarColor: '#FFC0CB',
    spotColor: '#34495E',
  },
  {
    tier: 8,
    name: 'Мейн-кун',
    breed: 'Пушистый лесной гигант',
    radius: 96,
    points: 36,
    coins: 35,
    color: '#B9770E', // Golden brown
    earColor: '#7E5109',
    eyeColor: '#27AE60',
    innerEarColor: '#F5CBA7',
    spotColor: '#6E2C00',
  },
  {
    tier: 9,
    name: 'Снежный Барсик',
    breed: 'Снежный барс',
    radius: 110,
    points: 45,
    coins: 50,
    color: '#D5F5E3', // Minty frosted white
    earColor: '#A3E4D7',
    eyeColor: '#1ABC9C',
    innerEarColor: '#FADBD8',
    spotColor: '#73C6B6',
  },
  {
    tier: 10,
    name: 'Мега Кот',
    breed: 'Огромный пухлый мега-кот',
    radius: 124,
    points: 55,
    coins: 75,
    color: '#FAD7A0', // Warm buttery golden
    earColor: '#F39C12',
    eyeColor: '#8E44AD',
    innerEarColor: '#F5B7B1',
    spotColor: '#E67E22',
  },
  {
    tier: 11,
    name: 'Король Котов',
    breed: 'Легендарный Владыка Котиков',
    radius: 140,
    points: 100,
    coins: 150,
    color: '#F9E79F', // Majestic radiant golden
    earColor: '#D4AC0D',
    eyeColor: '#884EA0',
    innerEarColor: '#FADBD8',
    spotColor: '#F39C12',
    isCrown: true, // Golden sparkle crown on head!
  },
];

export const SKIN_COLLECTIONS: SkinCollection[] = [
  {
    id: 'classic',
    name: 'Домашние кошки',
    description: 'Уютные и любимые домашние породы: рыжие, пухлые серые и белые котята.',
    price: 0,
    unlocked: true,
    tierOverrides: {},
  },
  {
    id: 'fluffy',
    name: 'Пушистые породы',
    description: 'Длинношёрстные мягкие облака: персидские, сибирские и ангорские красавцы.',
    price: 300,
    unlocked: false,
    tierOverrides: {
      1: { color: '#FFF5EE', name: 'Ангорский пушок' },
      2: { color: '#FF7F50', name: 'Рыжий перс' },
      5: { color: '#E6E6FA', name: 'Лавандовый пуф' },
      11: { color: '#FFE4E1', name: 'Император Пуха' },
    },
  },
  {
    id: 'rare',
    name: 'Редкие кошки',
    description: 'Необычные породы: бенгальские узоры, сфинксы и таинственные чёрные коты.',
    price: 750,
    unlocked: false,
    tierOverrides: {
      2: { color: '#D2B48C', spotColor: '#8B4513', name: 'Мини Бенгал' },
      3: { color: '#2C3E50', eyeColor: '#2ECC71', name: 'Лунная Пантера' },
      7: { color: '#4A235A', eyeColor: '#F4D03F', name: 'Тайный Сфинкс' },
      11: { color: '#17202A', eyeColor: '#F1C40F', name: 'Тёмный Лорд' },
    },
  },
  {
    id: 'fantasy',
    name: 'Магические котики',
    description: 'Космические и звёздные коты с сияющими глазами и магической аурой.',
    price: 1500,
    unlocked: false,
    tierOverrides: {
      1: { color: '#E8DAEF', eyeColor: '#9B59B6', name: 'Звёздная Искорка' },
      4: { color: '#A9DFBF', eyeColor: '#16A085', name: 'Изумрудный Дух' },
      6: { color: '#AED6F1', eyeColor: '#2980B9', name: 'Астральный Сиамец' },
      11: { color: '#FADBD8', spotColor: '#D2B4DE', name: 'Космический Создатель' },
    },
  },
];

export const GAME_THEMES: GameTheme[] = [
  {
    id: 'room',
    name: 'Уютная комната',
    description: 'Тёплые пастельные тона, натуральное дерево и домашний комфорт.',
    price: 0,
    unlocked: true,
    backgroundGradient: ['#F9EBE0', '#EFE0D0'],
    boxBorderColor: '#D8B182',
    boxBgColor: 'rgba(255, 252, 248, 0.45)',
    bubbleBgColor: 'rgba(255, 255, 255, 0.65)',
    accentColor: '#E08E45',
    decorIcon: '🏠',
  },
  {
    id: 'cafe',
    name: 'Кошачье кафе',
    description: 'Аромат матча-латте, мятно-кремовые оттенки и мурлыканье бариста.',
    price: 200,
    unlocked: false,
    backgroundGradient: ['#E8F8F5', '#D1F2EB'],
    boxBorderColor: '#76D7C4',
    boxBgColor: 'rgba(240, 253, 250, 0.45)',
    bubbleBgColor: 'rgba(255, 255, 255, 0.7)',
    accentColor: '#1ABC9C',
    decorIcon: '☕',
  },
  {
    id: 'garden',
    name: 'Цветущий сад',
    description: 'Розовые лепестки сакуры, весенняя свежесть и зелёная травка.',
    price: 400,
    unlocked: false,
    backgroundGradient: ['#FDEDEC', '#FADBD8'],
    boxBorderColor: '#F5B7B1',
    boxBgColor: 'rgba(254, 249, 249, 0.45)',
    bubbleBgColor: 'rgba(255, 255, 255, 0.7)',
    accentColor: '#E74C3C',
    decorIcon: '🌸',
  },
  {
    id: 'space',
    name: 'Космический сон',
    description: 'Глубокий ночной индиго, далёкие звёзды и волшебное кошачье созвездие.',
    price: 800,
    unlocked: false,
    backgroundGradient: ['#2C3E50', '#1A252F'],
    boxBorderColor: '#5DADE2',
    boxBgColor: 'rgba(21, 32, 43, 0.55)',
    bubbleBgColor: 'rgba(44, 62, 80, 0.75)',
    accentColor: '#3498DB',
    decorIcon: '✨',
  },
];

export const DAILY_STREAK_REWARDS = [50, 100, 150, 250, 400, 600, 1000];

export const DEFAULT_QUESTS: DailyQuest[] = [
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
];

export function getCatTier(tierNumber: number, collectionId: string = 'classic'): CatTier {
  const base = BASE_CAT_TIERS.find((t) => t.tier === tierNumber) || BASE_CAT_TIERS[0];
  const collection = SKIN_COLLECTIONS.find((c) => c.id === collectionId);
  if (collection && collection.tierOverrides[tierNumber]) {
    return { ...base, ...collection.tierOverrides[tierNumber] };
  }
  return { ...base };
}
