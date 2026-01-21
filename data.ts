import { Quote, Achievement, MeditationTrack } from './types';

// Simulating ~1000 quotes by generating a mix of specific leadership quotes and general positive sayings
const leadershipQuotes = [
  { content: "人民对美好生活的向往，就是我们的奋斗目标。", author: "习近平" },
  { content: "绿水青山就是金山银山。", author: "习近平" },
  { content: "撸起袖子加油干。", author: "习近平" },
  { content: "不忘初心，牢记使命。", author: "习近平" },
  { content: "实干兴邦，空谈误国。", author: "习近平" },
  { content: "为人民服务。", author: "毛泽东" },
  { content: "好好学习，天天向上。", author: "毛泽东" },
  { content: "星星之火，可以燎原。", author: "毛泽东" },
  { content: "世上无难事，只要肯登攀。", author: "毛泽东" },
  { content: "发展才是硬道理。", author: "邓小平" },
  { content: "不管白猫黑猫，捉到老鼠就是好猫。", author: "邓小平" },
  { content: "科学技术是第一生产力。", author: "邓小平" },
  { content: "苟利国家生死以，岂因祸福避趋之。", author: "林则徐" },
  { content: "先天下之忧而忧，后天下之乐而乐。", author: "范仲淹" },
  { content: "天行健，君子以自强不息。", author: "周易" },
];

const generalPositiveQuotes = [
  "今天也是元气满满的一天！",
  "相信自己，你比想象中更强大。",
  "每一个不曾起舞的日子，都是对生命的辜负。",
  "生活原本沉闷，但跑起来就有风。",
  "坚持就是胜利。",
  "种一棵树最好的时间是十年前，其次是现在。",
  "不仅要仰望星空，更要脚踏实地。",
  "你的努力，终将获得回报。",
  "保持热爱，奔赴山海。",
  "即使在缝隙中，也要开出最美的花。",
  "愿你遍历山河，觉得人间值得。",
  "不论结局，感激相遇。",
  "在这个世界上，你就是独一无二的。",
  "心中有光，脚下有路。",
  "每一次失败都是成功的伏笔。"
];

export const generateQuotes = (): Quote[] => {
  const allQuotes: Quote[] = [];
  let idCounter = 1;

  // Add specific quotes
  leadershipQuotes.forEach(q => {
    allQuotes.push({ id: idCounter++, ...q, category: 'leadership' });
  });

  // Generate variation to simulate "1000" entries for the demo
  for (let i = 0; i < 50; i++) {
    generalPositiveQuotes.forEach(q => {
      allQuotes.push({ 
        id: idCounter++, 
        content: q, 
        author: "正能量语录",
        category: 'daily' 
      });
    });
  }
  
  return allQuotes;
};

export const INITIAL_QUOTES = generateQuotes();

export const THEME_COLORS = [
  { name: 'Red', hex: '#ef4444', tailwind: 'red-500' }, // China Red
  { name: 'Blue', hex: '#3b82f6', tailwind: 'blue-500' },
  { name: 'Green', hex: '#22c55e', tailwind: 'green-500' },
  { name: 'Purple', hex: '#a855f7', tailwind: 'purple-500' },
  { name: 'Orange', hex: '#f97316', tailwind: 'orange-500' },
];

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'streak_3', title: '坚持不懈', description: '连续登录3天', icon: '🔥', type: 'streak', threshold: 3, xpReward: 50 },
  { id: 'streak_7', title: '习惯成自然', description: '连续登录7天', icon: '🗓️', type: 'streak', threshold: 7, xpReward: 150 },
  { id: 'journal_1', title: '初试笔墨', description: '写下第1篇日记', icon: '✏️', type: 'journal', threshold: 1, xpReward: 20 },
  { id: 'journal_5', title: '记录生活', description: '累计写5篇日记', icon: '📔', type: 'journal', threshold: 5, xpReward: 100 },
  { id: 'quote_5', title: '正能量收集者', description: '收藏5条语录', icon: '❤️', type: 'quote', threshold: 5, xpReward: 30 },
  { id: 'game_3', title: '游戏玩家', description: '玩游戏3次', icon: '🎮', type: 'game', threshold: 3, xpReward: 40 },
  { id: 'meditation_10', title: '静心学徒', description: '累计冥想10分钟', icon: '🧘', type: 'meditation', threshold: 10, xpReward: 60 },
  { id: 'meditation_60', title: '心灵大师', description: '累计冥想60分钟', icon: '🕉️', type: 'meditation', threshold: 60, xpReward: 200 },
];

export const MEDITATION_TRACKS: MeditationTrack[] = [
  { id: 'm1', title: '晨间唤醒', duration: 300, category: 'focus', color: 'bg-orange-100 text-orange-600' },
  { id: 'm2', title: '深度睡眠引导', duration: 900, category: 'sleep', color: 'bg-indigo-100 text-indigo-600' },
  { id: 'm3', title: '快速减压', duration: 180, category: 'relax', color: 'bg-green-100 text-green-600' },
  { id: 'm4', title: '专注力训练', duration: 600, category: 'focus', color: 'bg-blue-100 text-blue-600' },
];