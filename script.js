// ===================================================
//  FLAG QUIZ — script.js
//  Includes: regular quiz + weekly challenge mode
//  Weekly: seeded by ISO week number so everyone
//          gets the same 10 flags that week.
//  Scoring: base 100 pts per correct answer +
//           up to 50 speed bonus (proportional to
//           time remaining). Wrong = 0 pts.
//  Leaderboard: stored in localStorage, keyed by week.
// ===================================================

// ===== FLAG DATA =====
const FLAGS = {
  easy: [
    { code:"us",name:"United States" },{ code:"gb",name:"United Kingdom" },
    { code:"fr",name:"France" },{ code:"de",name:"Germany" },
    { code:"it",name:"Italy" },{ code:"es",name:"Spain" },
    { code:"jp",name:"Japan" },{ code:"cn",name:"China" },
    { code:"br",name:"Brazil" },{ code:"ca",name:"Canada" },
    { code:"au",name:"Australia" },{ code:"in",name:"India" },
    { code:"mx",name:"Mexico" },{ code:"ru",name:"Russia" },
    { code:"za",name:"South Africa" },{ code:"ng",name:"Nigeria" },
    { code:"ar",name:"Argentina" },{ code:"pt",name:"Portugal" },
    { code:"nl",name:"Netherlands" },{ code:"tr",name:"Turkey" },
  ],
  medium: [
    { code:"se",name:"Sweden" },{ code:"no",name:"Norway" },
    { code:"fi",name:"Finland" },{ code:"dk",name:"Denmark" },
    { code:"ch",name:"Switzerland" },{ code:"at",name:"Austria" },
    { code:"be",name:"Belgium" },{ code:"pl",name:"Poland" },
    { code:"cz",name:"Czech Republic" },{ code:"gr",name:"Greece" },
    { code:"eg",name:"Egypt" },{ code:"sa",name:"Saudi Arabia" },
    { code:"th",name:"Thailand" },{ code:"id",name:"Indonesia" },
    { code:"pk",name:"Pakistan" },{ code:"ph",name:"Philippines" },
    { code:"vn",name:"Vietnam" },{ code:"my",name:"Malaysia" },
    { code:"ke",name:"Kenya" },{ code:"ma",name:"Morocco" },
    { code:"co",name:"Colombia" },{ code:"cl",name:"Chile" },
    { code:"pe",name:"Peru" },{ code:"nz",name:"New Zealand" },
    { code:"ua",name:"Ukraine" },{ code:"ro",name:"Romania" },
    { code:"hu",name:"Hungary" },{ code:"il",name:"Israel" },
    { code:"kr",name:"South Korea" },{ code:"ae",name:"UAE" },
  ],
  hard: [
    { code:"kz",name:"Kazakhstan" },{ code:"uz",name:"Uzbekistan" },
    { code:"by",name:"Belarus" },{ code:"ge",name:"Georgia" },
    { code:"am",name:"Armenia" },{ code:"az",name:"Azerbaijan" },
    { code:"md",name:"Moldova" },{ code:"al",name:"Albania" },
    { code:"mk",name:"North Macedonia" },{ code:"me",name:"Montenegro" },
    { code:"ba",name:"Bosnia & Herzegovina" },{ code:"si",name:"Slovenia" },
    { code:"sk",name:"Slovakia" },{ code:"lv",name:"Latvia" },
    { code:"lt",name:"Lithuania" },{ code:"ee",name:"Estonia" },
    { code:"gh",name:"Ghana" },{ code:"tz",name:"Tanzania" },
    { code:"et",name:"Ethiopia" },{ code:"ug",name:"Uganda" },
    { code:"zm",name:"Zambia" },{ code:"mz",name:"Mozambique" },
    { code:"sd",name:"Sudan" },{ code:"lr",name:"Liberia" },
    { code:"sl",name:"Sierra Leone" },{ code:"gn",name:"Guinea" },
    { code:"bf",name:"Burkina Faso" },{ code:"ne",name:"Niger" },
    { code:"td",name:"Chad" },{ code:"bi",name:"Burundi" },
    { code:"kg",name:"Kyrgyzstan" },{ code:"tj",name:"Tajikistan" },
    { code:"tm",name:"Turkmenistan" },{ code:"mn",name:"Mongolia" },
    { code:"kh",name:"Cambodia" },{ code:"la",name:"Laos" },
    { code:"mm",name:"Myanmar" },{ code:"bn",name:"Brunei" },
    { code:"tl",name:"Timor-Leste" },{ code:"pg",name:"Papua New Guinea" },
  ],
};

// Flat pool of all country names (for wrong answer distractors)
const ALL_NAMES = [...new Set([
  ...FLAGS.easy.map(f=>f.name),
  ...FLAGS.medium.map(f=>f.name),
  ...FLAGS.hard.map(f=>f.name),
])];

// Weekly challenge uses a mix of all difficulties
const WEEKLY_POOL = [...FLAGS.easy, ...FLAGS.medium, ...FLAGS.hard];

// ===== SCORING CONSTANTS =====
const BASE_PTS = 100;        // pts for a correct answer
const SPEED_BONUS_MAX = 50;  // extra pts for answering instantly
const TIMER_DURATION = 10;
const TOTAL_QUESTIONS = 10;
const RING_CIRCUMFERENCE = 213.6;

// ===== SOUND =====
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function getAudioCtx() { if (!audioCtx) audioCtx = new AudioCtx(); return audioCtx; }
function playCorrect() {
  try {
    const ctx = getAudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
  } catch(e) {}
}
function playWrong() {
  try {
    const ctx = getAudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.35);
  } catch(e) {}
}
function playTick() {
  try {
    const ctx = getAudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.08);
  } catch(e) {}
}

// ===== WEEK UTILITIES =====
function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
function getWeekKey() {
  const now = new Date();
  return `${now.getFullYear()}-W${String(getISOWeekNumber(now)).padStart(2,'0')}`;
}
function getDaysUntilMonday() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  return day === 1 ? 7 : (8 - day) % 7;
}

// Seeded RNG (mulberry32) — same seed = same flags every time
function seededRNG(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function weekSeed(weekKey) {
  let h = 0;
  for (let i = 0; i < weekKey.length; i++) {
    h = (Math.imul(31, h) + weekKey.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function buildWeeklyQuestions(weekKey) {
  const rng = seededRNG(weekSeed(weekKey));
  const shuffled = seededShuffle(WEEKLY_POOL, rng);
  const selected = shuffled.slice(0, TOTAL_QUESTIONS);
  return selected.map(flag => {
    const wrongPool = ALL_NAMES.filter(n => n !== flag.name);
    const wrong = seededShuffle(wrongPool, rng).slice(0, 3);
    // answer order is random per session (not seeded) so it stays fair but not predictable
    const options = shuffle([flag.name, ...wrong]);
    return { flag, options };
  });
}

// ===== LEADERBOARD (localStorage) =====
const LB_KEY_PREFIX = 'flagquiz_lb_';
const PLAYED_KEY_PREFIX = 'flagquiz_played_';

function getLBKey(weekKey) { return LB_KEY_PREFIX + weekKey; }
function getPlayedKey(weekKey) { return PLAYED_KEY_PREFIX + weekKey; }

function getLeaderboard(weekKey) {
  try {
    const raw = localStorage.getItem(getLBKey(weekKey));
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

function saveToLeaderboard(weekKey, name, totalPts, correctCount, avgSpeed) {
  const lb = getLeaderboard(weekKey);
  // Replace existing entry for same name, or add new
  const existing = lb.findIndex(e => e.name === name);
  const entry = { name, pts: totalPts, correct: correctCount, avgSpeed: Math.round(avgSpeed), ts: Date.now() };
  if (existing >= 0) {
    if (totalPts > lb[existing].pts) lb[existing] = entry; // keep best score
  } else {
    lb.push(entry);
  }
  lb.sort((a,b) => b.pts - a.pts || b.correct - a.correct || b.avgSpeed - a.avgSpeed);
  try { localStorage.setItem(getLBKey(weekKey), JSON.stringify(lb.slice(0,20))); } catch(e) {}
  return lb;
}

function hasPlayedThisWeek(weekKey) {
  return !!localStorage.getItem(getPlayedKey(weekKey));
}
function markPlayedThisWeek(weekKey) {
  try { localStorage.setItem(getPlayedKey(weekKey), '1'); } catch(e) {}
}

// ===== APP STATE =====
let mode = 'regular';   // 'regular' | 'weekly'
let difficulty = 'easy';
let questions = [];
let currentQ = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let answered = false;
let timerInterval = null;
let timeLeft = TIMER_DURATION;
let questionStartTime = 0;

// Weekly-specific state
let weeklyTotalPts = 0;
let weeklyPerQuestion = []; // { name, correct, ptsEarned, timeUsed }
let weeklyKey = '';

// ===== DOM =====
const startScreen         = document.getElementById('start-screen');
const quizScreen          = document.getElementById('quiz-screen');
const resultScreen        = document.getElementById('result-screen');
const weeklyResultScreen  = document.getElementById('weekly-result-screen');
const nameModal           = document.getElementById('name-modal');

const startBtn            = document.getElementById('start-btn');
const diffBtns            = document.querySelectorAll('.diff-btn');
const weeklyTeaserBtn     = document.getElementById('weekly-teaser-btn');
const weeklyTeaserSub     = document.getElementById('weekly-teaser-sub');

const flagImg             = document.getElementById('flag-img');
const flagCard            = document.getElementById('flag-card');
const answersGrid         = document.getElementById('answers-grid');
const scoreDisplay        = document.getElementById('score-display');
const streakDisplay       = document.getElementById('streak-display');
const progressText        = document.getElementById('progress-text');
const progressBar         = document.getElementById('progress-bar');
const timerText           = document.getElementById('timer-text');
const timerRing           = document.getElementById('timer-ring');
const weeklyModeBadge     = document.getElementById('weekly-mode-badge');
const weeklyPointsHud     = document.getElementById('weekly-points-hud');
const weeklyPointsLive    = document.getElementById('weekly-points-live');
const pointsBubble        = document.getElementById('points-bubble');

const resultEmoji         = document.getElementById('result-emoji');
const resultTitle         = document.getElementById('result-title');
const resultScore         = document.getElementById('result-score');
const resultMsg           = document.getElementById('result-msg');
const bestStreakDisplay   = document.getElementById('best-streak-display');
const diffDisplay         = document.getElementById('diff-display');
const weeklyUnlockBanner  = document.getElementById('weekly-unlock-banner');
const weeklyPlayBtn       = document.getElementById('weekly-play-btn');
const shareBtn            = document.getElementById('share-btn');
const playAgainBtn        = document.getElementById('play-again-btn');

const wResultEmoji        = document.getElementById('w-result-emoji');
const wResultTitle        = document.getElementById('w-result-title');
const weeklyWeekBadge     = document.getElementById('weekly-week-badge');
const weeklyScoreBreakdown= document.getElementById('weekly-score-breakdown');
const leaderboardList     = document.getElementById('leaderboard-list');
const lbResetNote         = document.getElementById('lb-reset-note');
const weeklyAlreadyPlayed = document.getElementById('weekly-already-played');
const wShareBtn           = document.getElementById('w-share-btn');
const wPlayAgainBtn       = document.getElementById('w-play-again-btn');

const playerNameInput     = document.getElementById('player-name-input');
const modalSubmitBtn      = document.getElementById('modal-submit-btn');
const modalSkipBtn        = document.getElementById('modal-skip-btn');

const toast               = document.getElementById('toast');

// ===== INIT =====
(function init() {
  weeklyKey = getWeekKey();
  updateWeeklyTeaser();
})();

function updateWeeklyTeaser() {
  const weekNum = parseInt(weeklyKey.split('W')[1], 10);
  if (hasPlayedThisWeek(weeklyKey)) {
    weeklyTeaserSub.textContent = `Week #${weekNum} · View leaderboard`;
    weeklyTeaserBtn.style.opacity = '1';
  } else {
    weeklyTeaserSub.textContent = `Week #${weekNum} · Complete a quiz to unlock!`;
  }
}

// ===== DIFFICULTY SELECT =====
diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    difficulty = btn.dataset.diff;
  });
});

// ===== START REGULAR QUIZ =====
startBtn.addEventListener('click', () => startQuiz('regular'));

function startQuiz(quizMode) {
  mode = quizMode;
  score = 0; streak = 0; bestStreak = 0; currentQ = 0;
  weeklyTotalPts = 0; weeklyPerQuestion = [];

  if (mode === 'weekly') {
    questions = buildWeeklyQuestions(weeklyKey);
    weeklyModeBadge.style.display = 'block';
    weeklyPointsHud.style.display = 'block';
    weeklyPointsLive.textContent = '0';
  } else {
    questions = buildRegularQuestions();
    weeklyModeBadge.style.display = 'none';
    weeklyPointsHud.style.display = 'none';
  }

  showScreen(quizScreen);
  loadQuestion();
}

// ===== WEEKLY TEASER =====
weeklyTeaserBtn.addEventListener('click', () => {
  if (hasPlayedThisWeek(weeklyKey)) {
    // Show leaderboard directly
    showWeeklyResult(null);
  } else {
    showToast('🏆 Complete a quiz first to unlock the Weekly Challenge!');
  }
});

// ===== WEEKLY PLAY BUTTON (on result screen) =====
weeklyPlayBtn.addEventListener('click', () => {
  if (hasPlayedThisWeek(weeklyKey)) {
    showWeeklyResult(null);
  } else {
    startQuiz('weekly');
  }
});

// ===== SCREEN MANAGEMENT =====
function showScreen(screen) {
  [startScreen, quizScreen, resultScreen, weeklyResultScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// ===== BUILD REGULAR QUESTIONS =====
function buildRegularQuestions() {
  const pool = shuffle([...FLAGS[difficulty]]);
  return pool.slice(0, TOTAL_QUESTIONS).map(flag => {
    const wrong = getWrongOptions(flag.name, 3);
    return { flag, options: shuffle([flag.name, ...wrong]) };
  });
}

function getWrongOptions(correct, count) {
  return shuffle(ALL_NAMES.filter(n => n !== correct)).slice(0, count);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== LOAD QUESTION =====
function loadQuestion() {
  answered = false;
  questionStartTime = Date.now();
  const q = questions[currentQ];

  progressText.textContent = `${currentQ + 1} / ${TOTAL_QUESTIONS}`;
  progressBar.style.width = `${((currentQ + 1) / TOTAL_QUESTIONS) * 100}%`;

  // Flag animation
  flagCard.classList.remove('enter');
  flagCard.classList.add('exit');
  setTimeout(() => {
    flagImg.src = `https://flagcdn.com/w320/${q.flag.code}.png`;
    flagImg.alt = `Flag of ${q.flag.name}`;
    flagCard.classList.remove('exit');
    flagCard.classList.add('enter');
  }, 280);

  // Render answer buttons
  answersGrid.innerHTML = '';
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleAnswer(btn, opt, q.flag.name));
    answersGrid.appendChild(btn);
  });

  // Reset points bubble
  pointsBubble.className = 'points-bubble';
  pointsBubble.textContent = '';

  startTimer();
}

// ===== TIMER =====
function startTimer() {
  clearInterval(timerInterval);
  timeLeft = TIMER_DURATION;
  updateTimerUI();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI();
    if (timeLeft <= 3) playTick();
    if (timeLeft <= 0) { clearInterval(timerInterval); if (!answered) timeUp(); }
  }, 1000);
}

function updateTimerUI() {
  timerText.textContent = timeLeft;
  const offset = RING_CIRCUMFERENCE * (1 - timeLeft / TIMER_DURATION);
  timerRing.style.strokeDashoffset = offset;
  timerRing.classList.remove('warning', 'danger');
  if (timeLeft <= 3) timerRing.classList.add('danger');
  else if (timeLeft <= 6) timerRing.classList.add('warning');
}

function timeUp() {
  answered = true;
  streak = 0;
  streakDisplay.textContent = '🔥 0';
  markCorrect();
  document.querySelectorAll('.answer-btn').forEach(b => b.classList.add('disabled'));

  if (mode === 'weekly') {
    weeklyPerQuestion.push({ name: questions[currentQ].flag.name, correct: false, ptsEarned: 0, timeUsed: TIMER_DURATION });
    showPointsBubble(0, false);
  }

  setTimeout(nextQuestion, 1500);
}

function markCorrect() {
  const correct = questions[currentQ].flag.name;
  document.querySelectorAll('.answer-btn').forEach(btn => {
    if (btn.textContent === correct) btn.classList.add('correct');
  });
}

// ===== HANDLE ANSWER =====
function handleAnswer(btn, chosen, correct) {
  if (answered) return;
  answered = true;
  clearInterval(timerInterval);
  document.querySelectorAll('.answer-btn').forEach(b => b.classList.add('disabled'));

  const elapsed = (Date.now() - questionStartTime) / 1000; // seconds taken
  const timeRemaining = Math.max(0, TIMER_DURATION - elapsed);

  if (chosen === correct) {
    btn.classList.add('correct');
    score++;
    streak++;
    if (streak > bestStreak) bestStreak = streak;
    scoreDisplay.textContent = score;
    streakDisplay.textContent = `🔥 ${streak}`;
    playCorrect();

    if (mode === 'weekly') {
      const speedBonus = Math.round(SPEED_BONUS_MAX * (timeRemaining / TIMER_DURATION));
      const pts = BASE_PTS + speedBonus;
      weeklyTotalPts += pts;
      weeklyPointsLive.textContent = weeklyTotalPts;
      weeklyPerQuestion.push({ name: correct, correct: true, ptsEarned: pts, timeUsed: Math.round(elapsed * 10) / 10 });
      showPointsBubble(pts, true);
    }
  } else {
    btn.classList.add('wrong');
    streak = 0;
    streakDisplay.textContent = '🔥 0';
    markCorrect();
    playWrong();

    if (mode === 'weekly') {
      weeklyPerQuestion.push({ name: correct, correct: false, ptsEarned: 0, timeUsed: Math.round(elapsed * 10) / 10 });
      showPointsBubble(0, false);
    }
  }

  setTimeout(nextQuestion, 1400);
}

// ===== POINTS BUBBLE =====
function showPointsBubble(pts, correct) {
  if (mode !== 'weekly') return;
  pointsBubble.className = 'points-bubble';
  pointsBubble.textContent = correct ? `+${pts} pts` : '✗ 0 pts';
  // force reflow
  void pointsBubble.offsetWidth;
  pointsBubble.classList.add('show', correct ? 'correct-pts' : 'wrong-pts');
}

// ===== NEXT QUESTION =====
function nextQuestion() {
  currentQ++;
  if (currentQ >= TOTAL_QUESTIONS) {
    if (mode === 'weekly') showWeeklyResult(weeklyTotalPts);
    else showResult();
  } else {
    loadQuestion();
  }
}

// ===== REGULAR RESULT =====
const RESULT_TIERS = [
  { min:9, emoji:'🏆', title:'Flag Expert!',   msg:"You're a geography legend. Seriously impressive!" },
  { min:7, emoji:'🌟', title:'Flag Master',    msg:"You really know your flags. Almost perfect!" },
  { min:5, emoji:'🌍', title:'Intermediate',  msg:"Not bad! A bit more travel and you'll be a pro." },
  { min:3, emoji:'🗺️', title:'Getting There', msg:"Keep exploring — the world has a lot to offer!" },
  { min:0, emoji:'🐣', title:'Beginner',       msg:"Everyone starts somewhere. Try again!" },
];

function showResult() {
  const tier = RESULT_TIERS.find(t => score >= t.min);
  resultEmoji.textContent = tier.emoji;
  resultTitle.textContent = tier.title;
  resultScore.textContent = score;
  resultMsg.textContent = tier.msg;
  bestStreakDisplay.textContent = `${bestStreak} 🔥`;
  diffDisplay.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  // Show / update weekly unlock banner
  const weekNum = parseInt(weeklyKey.split('W')[1], 10);
  if (hasPlayedThisWeek(weeklyKey)) {
    weeklyPlayBtn.textContent = '🏆 View Weekly Leaderboard';
  } else {
    weeklyPlayBtn.textContent = '⚡ Play Weekly Challenge';
  }
  weeklyUnlockBanner.style.display = 'flex';

  showScreen(resultScreen);
}

// ===== WEEKLY RESULT =====
function showWeeklyResult(totalPts) {
  const weekNum = parseInt(weeklyKey.split('W')[1], 10);
  weeklyWeekBadge.textContent = `Week #${weekNum}`;
  lbResetNote.textContent = `Resets in ${getDaysUntilMonday()}d`;

  const alreadyPlayed = hasPlayedThisWeek(weeklyKey) && totalPts === null;

  // Score breakdown (only if we just played)
  if (totalPts !== null) {
    renderScoreBreakdown(totalPts);
    weeklyAlreadyPlayed.style.display = 'none';

    // Result tier for weekly
    const pct = score / TOTAL_QUESTIONS;
    let wEmoji = '🐣', wTitle = 'Keep trying!';
    if (pct === 1)       { wEmoji = '🏆'; wTitle = 'Perfect Score!'; }
    else if (pct >= 0.8) { wEmoji = '🌟'; wTitle = 'Fantastic!'; }
    else if (pct >= 0.6) { wEmoji = '🌍'; wTitle = 'Well done!'; }
    else if (pct >= 0.4) { wEmoji = '🗺️'; wTitle = 'Getting there!'; }
    wResultEmoji.textContent = wEmoji;
    wResultTitle.textContent = wTitle;

    // Show name modal to save score
    openNameModal(totalPts);
  } else {
    weeklyScoreBreakdown.innerHTML = '';
    weeklyAlreadyPlayed.style.display = 'block';
    wResultEmoji.textContent = '🏅';
    wResultTitle.textContent = `Week #${weekNum} Leaderboard`;
  }

  renderLeaderboard(null);
  showScreen(weeklyResultScreen);
  updateWeeklyTeaser();
}

function renderScoreBreakdown(totalPts) {
  const avgSpeed = weeklyPerQuestion.length
    ? weeklyPerQuestion.reduce((s,q) => s + q.timeUsed, 0) / weeklyPerQuestion.length
    : 0;

  let html = `
    <div class="breakdown-item">
      <span class="breakdown-label">Correct</span>
      <span class="breakdown-value">${score}/10</span>
    </div>
    <div class="breakdown-item">
      <span class="breakdown-label">Total Points</span>
      <span class="breakdown-value highlight">${totalPts}</span>
    </div>
    <div class="breakdown-item">
      <span class="breakdown-label">Avg Speed</span>
      <span class="breakdown-value">${avgSpeed.toFixed(1)}s</span>
    </div>
    <div class="breakdown-item">
      <span class="breakdown-label">Best Streak</span>
      <span class="breakdown-value">${bestStreak} 🔥</span>
    </div>
    <div class="per-q-table">
  `;

  weeklyPerQuestion.forEach((q, i) => {
    const icon = q.correct ? '✅' : '❌';
    const ptsClass = q.ptsEarned === 0 ? 'per-q-pts zero' : 'per-q-pts';
    html += `
      <div class="per-q-row">
        <span class="per-q-flag">${i+1}. ${q.name}</span>
        <span class="per-q-result">${icon}</span>
        <span class="${ptsClass}">${q.ptsEarned > 0 ? '+'+q.ptsEarned : '0'}</span>
      </div>`;
  });

  html += `</div>`;
  weeklyScoreBreakdown.innerHTML = html;
}

function renderLeaderboard(highlightName) {
  const lb = getLeaderboard(weeklyKey);
  if (!lb.length) {
    leaderboardList.innerHTML = `<div class="lb-empty">No scores yet this week. Be the first!</div>`;
    return;
  }
  const rankEmojis = ['🥇','🥈','🥉'];
  const rankClasses = ['gold','silver','bronze'];
  leaderboardList.innerHTML = lb.map((entry, i) => {
    const isYou = entry.name === highlightName;
    const rankDisplay = i < 3
      ? `<span class="lb-rank ${rankClasses[i]}">${rankEmojis[i]}</span>`
      : `<span class="lb-rank">${i+1}</span>`;
    const youTag = isYou ? `<span class="you-tag">YOU</span>` : '';
    return `
      <div class="lb-row ${isYou ? 'is-you' : ''}">
        ${rankDisplay}
        <span class="lb-name">${escapeHTML(entry.name)}${youTag}</span>
        <span class="lb-pts">${entry.pts}</span>
      </div>`;
  }).join('');
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ===== NAME MODAL =====
let pendingPts = 0;
let pendingAvgSpeed = 0;

function openNameModal(totalPts) {
  pendingPts = totalPts;
  pendingAvgSpeed = weeklyPerQuestion.length
    ? weeklyPerQuestion.reduce((s,q) => s + q.timeUsed, 0) / weeklyPerQuestion.length
    : 0;

  const savedName = localStorage.getItem('flagquiz_playername') || '';
  playerNameInput.value = savedName;
  nameModal.classList.add('show');
  setTimeout(() => playerNameInput.focus(), 100);
}

function submitName() {
  const name = playerNameInput.value.trim() || 'Anonymous';
  localStorage.setItem('flagquiz_playername', name);
  nameModal.classList.remove('show');
  markPlayedThisWeek(weeklyKey);
  saveToLeaderboard(weeklyKey, name, pendingPts, score, pendingAvgSpeed);
  renderLeaderboard(name);
  showToast(`🏅 Score saved as "${name}"!`);
}

modalSubmitBtn.addEventListener('click', submitName);
playerNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitName(); });

modalSkipBtn.addEventListener('click', () => {
  nameModal.classList.remove('show');
  markPlayedThisWeek(weeklyKey);
  renderLeaderboard(null);
});

// ===== SHARE BUTTONS =====
shareBtn.addEventListener('click', () => {
  const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  const text = `🌍 I scored ${score}/10 on Flag Quiz! (${diffLabel} mode)\nCan you beat me? ${location.href}`;
  copyToClipboard(text, '📋 Score copied! Paste & share it.');
});

wShareBtn.addEventListener('click', () => {
  const weekNum = parseInt(weeklyKey.split('W')[1], 10);
  const text = `🏆 Flag Quiz Weekly Challenge — Week #${weekNum}\nI scored ${weeklyTotalPts} points (${score}/10 correct)!\nCan you beat me? ${location.href}`;
  copyToClipboard(text, '📋 Weekly score copied!');
});

function copyToClipboard(text, successMsg) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast(successMsg));
  } else {
    showToast(text);
  }
}

// ===== PLAY AGAIN / BACK =====
playAgainBtn.addEventListener('click', () => showScreen(startScreen));
wPlayAgainBtn.addEventListener('click', () => { showScreen(startScreen); updateWeeklyTeaser(); });

// ===== TOAST =====
function showToast(msg, duration = 2800) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}
