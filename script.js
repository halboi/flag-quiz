// ===================================================
//  FLAG QUIZ — script.js
//  Answer modes: Multiple Choice  |  Type It
//  Weekly challenge with seeded flags + leaderboard
// ===================================================

// ===== FLAG DATA =====
const FLAGS = {
  easy: [
    {code:"us",name:"United States"},{code:"gb",name:"United Kingdom"},
    {code:"fr",name:"France"},{code:"de",name:"Germany"},
    {code:"it",name:"Italy"},{code:"es",name:"Spain"},
    {code:"jp",name:"Japan"},{code:"cn",name:"China"},
    {code:"br",name:"Brazil"},{code:"ca",name:"Canada"},
    {code:"au",name:"Australia"},{code:"in",name:"India"},
    {code:"mx",name:"Mexico"},{code:"ru",name:"Russia"},
    {code:"za",name:"South Africa"},{code:"ng",name:"Nigeria"},
    {code:"ar",name:"Argentina"},{code:"pt",name:"Portugal"},
    {code:"nl",name:"Netherlands"},{code:"tr",name:"Turkey"},
  ],
  medium: [
    {code:"se",name:"Sweden"},{code:"no",name:"Norway"},
    {code:"fi",name:"Finland"},{code:"dk",name:"Denmark"},
    {code:"ch",name:"Switzerland"},{code:"at",name:"Austria"},
    {code:"be",name:"Belgium"},{code:"pl",name:"Poland"},
    {code:"cz",name:"Czech Republic"},{code:"gr",name:"Greece"},
    {code:"eg",name:"Egypt"},{code:"sa",name:"Saudi Arabia"},
    {code:"th",name:"Thailand"},{code:"id",name:"Indonesia"},
    {code:"pk",name:"Pakistan"},{code:"ph",name:"Philippines"},
    {code:"vn",name:"Vietnam"},{code:"my",name:"Malaysia"},
    {code:"ke",name:"Kenya"},{code:"ma",name:"Morocco"},
    {code:"co",name:"Colombia"},{code:"cl",name:"Chile"},
    {code:"pe",name:"Peru"},{code:"nz",name:"New Zealand"},
    {code:"ua",name:"Ukraine"},{code:"ro",name:"Romania"},
    {code:"hu",name:"Hungary"},{code:"il",name:"Israel"},
    {code:"kr",name:"South Korea"},{code:"ae",name:"UAE"},
  ],
  hard: [
    {code:"kz",name:"Kazakhstan"},{code:"uz",name:"Uzbekistan"},
    {code:"by",name:"Belarus"},{code:"ge",name:"Georgia"},
    {code:"am",name:"Armenia"},{code:"az",name:"Azerbaijan"},
    {code:"md",name:"Moldova"},{code:"al",name:"Albania"},
    {code:"mk",name:"North Macedonia"},{code:"me",name:"Montenegro"},
    {code:"ba",name:"Bosnia & Herzegovina"},{code:"si",name:"Slovenia"},
    {code:"sk",name:"Slovakia"},{code:"lv",name:"Latvia"},
    {code:"lt",name:"Lithuania"},{code:"ee",name:"Estonia"},
    {code:"gh",name:"Ghana"},{code:"tz",name:"Tanzania"},
    {code:"et",name:"Ethiopia"},{code:"ug",name:"Uganda"},
    {code:"zm",name:"Zambia"},{code:"mz",name:"Mozambique"},
    {code:"sd",name:"Sudan"},{code:"lr",name:"Liberia"},
    {code:"sl",name:"Sierra Leone"},{code:"gn",name:"Guinea"},
    {code:"bf",name:"Burkina Faso"},{code:"ne",name:"Niger"},
    {code:"td",name:"Chad"},{code:"bi",name:"Burundi"},
    {code:"kg",name:"Kyrgyzstan"},{code:"tj",name:"Tajikistan"},
    {code:"tm",name:"Turkmenistan"},{code:"mn",name:"Mongolia"},
    {code:"kh",name:"Cambodia"},{code:"la",name:"Laos"},
    {code:"mm",name:"Myanmar"},{code:"bn",name:"Brunei"},
    {code:"tl",name:"Timor-Leste"},{code:"pg",name:"Papua New Guinea"},
  ],
};

const ALL_NAMES = [...new Set([
  ...FLAGS.easy.map(f=>f.name),
  ...FLAGS.medium.map(f=>f.name),
  ...FLAGS.hard.map(f=>f.name),
])];

const WEEKLY_POOL = [...FLAGS.easy, ...FLAGS.medium, ...FLAGS.hard];

// ===== SCORING =====
const BASE_PTS          = 100;
const SPEED_BONUS_MAX   = 50;
// Type mode: bonuses per attempt (3 max attempts)
const TYPE_PTS_ATTEMPT  = [120, 70, 30]; // pts for correct on attempt 1/2/3
const TYPE_SPEED_MAX    = 60;            // extra speed bonus for type mode
const TIMER_DURATION    = 15;            // slightly more time for typing
const MC_TIMER_DURATION = 10;
const TOTAL_QUESTIONS   = 10;
const RING_CIRCUMFERENCE= 213.6;
const MAX_ATTEMPTS      = 3;

// ===== SOUND =====
const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
const getAudioCtx = () => { if (!audioCtx) audioCtx = new AudioCtxClass(); return audioCtx; };

function playTone(freq1, freq2, freq3, type = 'sine', vol = 0.25) {
  try {
    const ctx = getAudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq1, ctx.currentTime);
    if (freq2) osc.frequency.setValueAtTime(freq2, ctx.currentTime + 0.1);
    if (freq3) osc.frequency.setValueAtTime(freq3, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
  } catch(e) {}
}
const playCorrect  = () => playTone(523, 659, 784, 'sine', 0.25);
const playWrong    = () => playTone(220, 180, null, 'sawtooth', 0.15);
const playTick     = () => playTone(880, null, null, 'sine', 0.05);
const playAlmost   = () => playTone(440, 370, null, 'sine', 0.15); // wrong attempt but still going

// ===== WEEK UTILITIES =====
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
function getWeekKey() {
  const now = new Date();
  return `${now.getFullYear()}-W${String(getISOWeek(now)).padStart(2,'0')}`;
}
function getDaysUntilMonday() {
  const day = new Date().getDay();
  return day === 1 ? 7 : (8 - day) % 7;
}

// Seeded RNG
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
  for (let i = 0; i < weekKey.length; i++) h = (Math.imul(31, h) + weekKey.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ===== SUPABASE SETUP =====
// Loaded from supabase-config.js
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// Current logged-in user (null = guest)
let currentUser = null;
let currentUsername = localStorage.getItem('flagquiz_playername') || null;

// Check session on load
(async function loadUser() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    currentUser     = session.user;
    currentUsername = session.user.user_metadata?.username || session.user.email.split('@')[0];
    localStorage.setItem('flagquiz_playername', currentUsername);
  }
  updateUserHUD();
})();

function updateUserHUD() {
  const hud = document.getElementById('user-hud');
  if (!hud) return;
  if (currentUser) {
    hud.innerHTML = `
      <span class="user-hud-name">👤 ${escapeHTML(currentUsername)}</span>
      <button class="user-hud-link" onclick="window.location.href='login.html'">Account</button>`;
  } else {
    hud.innerHTML = `<button class="user-hud-link" onclick="window.location.href='login.html'">Sign in for leaderboard →</button>`;
  }
}

// ===== LEADERBOARD =====
const PLAYED_PREFIX = 'flagquiz_played_';

async function fetchLeaderboard(weekKey) {
  try {
    const { data, error } = await sb
      .from('weekly_scores')
      .select('username, pts, correct_count, avg_speed')
      .eq('week_key', weekKey)
      .order('pts', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data || [];
  } catch(e) {
    console.warn('Leaderboard fetch failed, using local fallback', e);
    // Fallback: read local scores
    try { return JSON.parse(localStorage.getItem('flagquiz_lb_' + weekKey)) || []; } catch(_) { return []; }
  }
}

async function saveToLeaderboard(weekKey, name, totalPts, correctCount, avgSpeed) {
  const userId = currentUser ? currentUser.id : null;
  const entry = {
    week_key:      weekKey,
    username:      name,
    pts:           totalPts,
    correct_count: correctCount,
    avg_speed:     Math.round(avgSpeed * 10) / 10,
    user_id:       userId,
  };

  if (userId) {
    // Upsert: replace existing score for this user+week if new score is higher
    const { data: existing } = await sb
      .from('weekly_scores')
      .select('pts')
      .eq('week_key', weekKey)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existing || totalPts > existing.pts) {
      await sb.from('weekly_scores').upsert(entry, { onConflict: 'week_key,user_id' });
    }
  } else {
    // Guest: just insert (no upsert — no user_id to dedupe on)
    await sb.from('weekly_scores').insert(entry);
  }

  // Also save locally as fallback
  const local = JSON.parse(localStorage.getItem('flagquiz_lb_' + weekKey) || '[]');
  const idx = local.findIndex(e => e.username === name);
  const localEntry = { username: name, pts: totalPts, correct_count: correctCount, avg_speed: avgSpeed };
  if (idx >= 0) { if (totalPts > local[idx].pts) local[idx] = localEntry; }
  else local.push(localEntry);
  local.sort((a,b) => b.pts - a.pts);
  try { localStorage.setItem('flagquiz_lb_' + weekKey, JSON.stringify(local.slice(0,20))); } catch(_) {}
}

function hasPlayedThisWeek(weekKey) { return !!localStorage.getItem(PLAYED_PREFIX + weekKey); }
function markPlayedThisWeek(weekKey) { try { localStorage.setItem(PLAYED_PREFIX + weekKey, '1'); } catch(e) {} }

// ===== FUZZY MATCHING =====
// Normalise a string: lowercase, strip accents, trim extra spaces
function normalise(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // strip diacritics
    .replace(/[^a-z0-9\s]/g, ' ')                      // punct → space
    .replace(/\s+/g, ' ').trim();
}

// Accepts answer if it matches or is "close enough"
// Returns: 'exact' | 'close' | 'wrong'
function checkTypedAnswer(typed, correct) {
  const t = normalise(typed);
  const c = normalise(correct);
  if (t === c) return 'exact';

  // Also accept if the typed answer CONTAINS the correct answer (ignoring articles)
  // e.g. "the united states" for "United States"
  if (t.includes(c) || c.includes(t)) return 'exact';

  // Levenshtein distance — allow 1 typo for short names, 2 for longer
  const maxDist = c.length <= 6 ? 1 : 2;
  if (levenshtein(t, c) <= maxDist) return 'close';

  // Partial: typed all words present in correct (handles "South Korea" if typed "korea")
  const correctWords = c.split(' ');
  const typedWords = t.split(' ');
  if (correctWords.length > 1) {
    const matchedWords = typedWords.filter(w => correctWords.some(cw => cw.startsWith(w) || w.startsWith(cw)));
    if (matchedWords.length >= Math.ceil(correctWords.length * 0.7)) return 'close';
  }

  return 'wrong';
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m+1}, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

// Build hint: "U _ _ t _ d   S _ _ t _ _"
function buildHint(name, revealCount) {
  return name.split('').map((ch, i) => {
    if (ch === ' ') return '  ';
    const letterIndex = name.slice(0, i).replace(/ /g,'').length;
    return letterIndex < revealCount ? ch : '_';
  }).join(' ');
}

// ===== APP STATE =====
let mode          = 'regular'; // 'regular' | 'weekly'
let answerMode    = 'multiple'; // 'multiple' | 'type'
let difficulty    = 'easy';
let questions     = [];
let currentQ      = 0;
let score         = 0;
let streak        = 0;
let bestStreak    = 0;
let answered      = false;
let timerInterval = null;
let timeLeft      = MC_TIMER_DURATION;
let timerDuration = MC_TIMER_DURATION;
let questionStartTime = 0;
let typeAttempts  = 0;      // wrong attempts on current type question
let weeklyTotalPts   = 0;
let weeklyPerQuestion = [];
let weeklyKey        = '';

// ===== DOM REFS =====
const $ = id => document.getElementById(id);
const startScreen        = $('start-screen');
const quizScreen         = $('quiz-screen');
const resultScreen       = $('result-screen');
const weeklyResultScreen = $('weekly-result-screen');
const nameModal          = $('name-modal');

const startBtn           = $('start-btn');
const diffBtns           = document.querySelectorAll('.diff-btn');
const modeBtns           = document.querySelectorAll('.mode-btn');
const weeklyTeaserBtn    = $('weekly-teaser-btn');
const weeklyTeaserSub    = $('weekly-teaser-sub');

const flagImg            = $('flag-img');
const flagCard           = $('flag-card');
const answersGrid        = $('answers-grid');
const typeAnswerWrap     = $('type-answer-wrap');
const typeInput          = $('type-input');
const typeSubmitBtn      = $('type-submit-btn');
const typeHint           = $('type-hint');
const typeFeedback       = $('type-feedback');
const scoreDisplay       = $('score-display');
const streakDisplay      = $('streak-display');
const progressText       = $('progress-text');
const progressBar        = $('progress-bar');
const timerText          = $('timer-text');
const timerRing          = $('timer-ring');
const weeklyModeBadge    = $('weekly-mode-badge');
const weeklyPointsHud    = $('weekly-points-hud');
const weeklyPointsLive   = $('weekly-points-live');
const pointsBubble       = $('points-bubble');

const resultEmoji        = $('result-emoji');
const resultTitle        = $('result-title');
const resultScore        = $('result-score');
const resultMsg          = $('result-msg');
const bestStreakDisplay  = $('best-streak-display');
const diffDisplay        = $('diff-display');
const modeDisplay        = $('mode-display');
const weeklyUnlockBanner = $('weekly-unlock-banner');
const weeklyPlayBtn      = $('weekly-play-btn');
const shareBtn           = $('share-btn');
const playAgainBtn       = $('play-again-btn');

const wResultEmoji       = $('w-result-emoji');
const wResultTitle       = $('w-result-title');
const weeklyWeekBadge    = $('weekly-week-badge');
const weeklyScoreBreakdown= $('weekly-score-breakdown');
const leaderboardList    = $('leaderboard-list');
const lbResetNote        = $('lb-reset-note');
const weeklyAlreadyPlayed= $('weekly-already-played');
const wShareBtn          = $('w-share-btn');
const wPlayAgainBtn      = $('w-play-again-btn');

const playerNameInput    = $('player-name-input');
const modalSubmitBtn     = $('modal-submit-btn');
const modalSkipBtn       = $('modal-skip-btn');
const toast              = $('toast');

// ===== INIT =====
(function init() {
  weeklyKey = getWeekKey();
  updateWeeklyTeaser();
})();

function updateWeeklyTeaser() {
  const weekNum = parseInt(weeklyKey.split('W')[1], 10);
  if (hasPlayedThisWeek(weeklyKey)) {
    weeklyTeaserSub.textContent = `Week #${weekNum} · View leaderboard`;
  } else {
    weeklyTeaserSub.textContent = `Week #${weekNum} · Complete a quiz to unlock!`;
  }
}

// ===== DIFFICULTY SELECT =====
diffBtns.forEach(btn => btn.addEventListener('click', () => {
  diffBtns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  difficulty = btn.dataset.diff;
}));

// ===== ANSWER MODE SELECT =====
modeBtns.forEach(btn => btn.addEventListener('click', () => {
  modeBtns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  answerMode = btn.dataset.mode;
}));

// ===== START =====
startBtn.addEventListener('click', () => startQuiz('regular'));

function startQuiz(quizMode) {
  mode = quizMode;
  score = 0; streak = 0; bestStreak = 0; currentQ = 0;
  weeklyTotalPts = 0; weeklyPerQuestion = [];
  timerDuration = answerMode === 'type' ? TIMER_DURATION : MC_TIMER_DURATION;

  questions = mode === 'weekly'
    ? buildWeeklyQuestions(weeklyKey)
    : buildRegularQuestions();

  weeklyModeBadge.style.display  = mode === 'weekly' ? 'block' : 'none';
  weeklyPointsHud.style.display  = mode === 'weekly' ? 'block' : 'none';
  weeklyPointsLive.textContent   = '0';

  showScreen(quizScreen);
  loadQuestion();
}

// ===== WEEKLY TEASER =====
weeklyTeaserBtn.addEventListener('click', () => {
  if (hasPlayedThisWeek(weeklyKey)) {
    showWeeklyResult(null);
  } else {
    showToast('🏆 Complete a quiz first to unlock the Weekly Challenge!');
  }
});

weeklyPlayBtn.addEventListener('click', () => {
  if (hasPlayedThisWeek(weeklyKey)) {
    showWeeklyResult(null);
  } else {
    // Weekly always uses type mode? No — respect the user's chosen mode
    startQuiz('weekly');
  }
});

// ===== SCREEN MANAGEMENT =====
function showScreen(screen) {
  [startScreen, quizScreen, resultScreen, weeklyResultScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
  // Auto-focus type input when quiz starts in type mode
  if (screen === quizScreen && answerMode === 'type') {
    setTimeout(() => typeInput.focus(), 400);
  }
}

// ===== BUILD QUESTIONS =====
function buildRegularQuestions() {
  const pool = shuffle([...FLAGS[difficulty]]);
  return pool.slice(0, TOTAL_QUESTIONS).map(flag => ({
    flag,
    options: shuffle([flag.name, ...getWrongOptions(flag.name, 3)])
  }));
}

function buildWeeklyQuestions(weekKey) {
  const rng = seededRNG(weekSeed(weekKey));
  const shuffled = seededShuffle(WEEKLY_POOL, rng);
  return shuffled.slice(0, TOTAL_QUESTIONS).map(flag => {
    const wrongPool = ALL_NAMES.filter(n => n !== flag.name);
    const wrong = seededShuffle(wrongPool, rng).slice(0, 3);
    return { flag, options: shuffle([flag.name, ...wrong]) };
  });
}

function getWrongOptions(correct, count) {
  return shuffle(ALL_NAMES.filter(n => n !== correct)).slice(0, count);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== LOAD QUESTION =====
function loadQuestion() {
  answered   = false;
  typeAttempts = 0;
  questionStartTime = Date.now();
  const q = questions[currentQ];

  progressText.textContent = `${currentQ+1} / ${TOTAL_QUESTIONS}`;
  progressBar.style.width  = `${((currentQ+1) / TOTAL_QUESTIONS) * 100}%`;

  // Flag card animation
  flagCard.classList.remove('enter');
  flagCard.classList.add('exit');
  setTimeout(() => {
    flagImg.src = `https://flagcdn.com/w320/${q.flag.code}.png`;
    flagImg.alt = `Flag of ${q.flag.name}`;
    flagCard.classList.remove('exit');
    flagCard.classList.add('enter');
  }, 280);

  // Show/hide appropriate answer panel
  if (answerMode === 'multiple') {
    answersGrid.style.display    = 'grid';
    typeAnswerWrap.style.display = 'none';
    renderMultipleChoice(q);
  } else {
    answersGrid.style.display    = 'none';
    typeAnswerWrap.style.display = 'flex';
    renderTypeMode();
  }

  // Reset points bubble
  pointsBubble.className    = 'points-bubble';
  pointsBubble.textContent  = '';

  timerDuration = answerMode === 'type' ? TIMER_DURATION : MC_TIMER_DURATION;
  startTimer();
}

// ===== MULTIPLE CHOICE =====
function renderMultipleChoice(q) {
  answersGrid.innerHTML = '';
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className   = 'answer-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleMCAnswer(btn, opt, q.flag.name));
    answersGrid.appendChild(btn);
  });
}

function handleMCAnswer(btn, chosen, correct) {
  if (answered) return;
  answered = true;
  clearInterval(timerInterval);
  document.querySelectorAll('.answer-btn').forEach(b => b.classList.add('disabled'));

  const elapsed       = (Date.now() - questionStartTime) / 1000;
  const timeRemaining = Math.max(0, timerDuration - elapsed);

  if (chosen === correct) {
    btn.classList.add('correct');
    score++; streak++;
    if (streak > bestStreak) bestStreak = streak;
    scoreDisplay.textContent  = score;
    streakDisplay.textContent = `🔥 ${streak}`;
    playCorrect();

    if (mode === 'weekly') {
      const speedBonus = Math.round(SPEED_BONUS_MAX * (timeRemaining / timerDuration));
      const pts = BASE_PTS + speedBonus;
      weeklyTotalPts += pts;
      weeklyPointsLive.textContent = weeklyTotalPts;
      weeklyPerQuestion.push({ name: correct, correct: true, ptsEarned: pts, timeUsed: Math.round(elapsed * 10)/10 });
      showPointsBubble(pts, true);
    }
  } else {
    btn.classList.add('wrong');
    streak = 0;
    streakDisplay.textContent = '🔥 0';
    markMCCorrect(correct);
    playWrong();

    if (mode === 'weekly') {
      weeklyPerQuestion.push({ name: correct, correct: false, ptsEarned: 0, timeUsed: Math.round(elapsed*10)/10 });
      showPointsBubble(0, false);
    }
  }

  setTimeout(nextQuestion, 1400);
}

function markMCCorrect(correct) {
  document.querySelectorAll('.answer-btn').forEach(btn => {
    if (btn.textContent === correct) btn.classList.add('correct');
  });
}

// ===== TYPE MODE =====
function renderTypeMode() {
  typeInput.value       = '';
  typeInput.className   = 'type-input';
  typeInput.disabled    = false;
  typeHint.textContent  = '';
  typeFeedback.innerHTML = '';
  typeSubmitBtn.disabled = false;

  // Render attempt dots
  renderAttemptDots();

  // Focus input after flag animation settles
  setTimeout(() => typeInput.focus(), 350);
}

function renderAttemptDots() {
  typeHint.innerHTML = `<div class="type-attempts">${
    Array.from({length: MAX_ATTEMPTS}, (_, i) => `<div class="attempt-dot" id="dot-${i}"></div>`).join('')
  }</div>`;
}

function updateAttemptDot(index, state) {
  const dot = document.getElementById(`dot-${index}`);
  if (dot) dot.classList.add(state); // 'used' or 'correct'
}

// Submit on Enter key
typeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') submitTypedAnswer();
});
typeSubmitBtn.addEventListener('click', submitTypedAnswer);

function submitTypedAnswer() {
  if (answered) return;
  const typed = typeInput.value.trim();
  if (!typed) { typeInput.focus(); return; }

  const correct = questions[currentQ].flag.name;
  const result  = checkTypedAnswer(typed, correct);

  if (result === 'exact' || result === 'close') {
    // ✅ Correct (or close enough)
    clearInterval(timerInterval);
    answered = true;

    typeInput.className   = 'type-input correct-input';
    typeInput.disabled    = true;
    typeSubmitBtn.disabled = true;
    updateAttemptDot(typeAttempts, 'correct');

    // If 'close', show what the actual answer was
    const feedbackExtra = result === 'close'
      ? `<span class="fb-answer">Accepted! The answer is: <strong>${correct}</strong></span>`
      : '';

    typeFeedback.innerHTML = `<span class="fb-correct">✓ Correct!</span>${feedbackExtra}`;

    score++; streak++;
    if (streak > bestStreak) bestStreak = streak;
    scoreDisplay.textContent  = score;
    streakDisplay.textContent = `🔥 ${streak}`;
    playCorrect();

    if (mode === 'weekly') {
      const elapsed       = (Date.now() - questionStartTime) / 1000;
      const timeRemaining = Math.max(0, timerDuration - elapsed);
      const basePts    = TYPE_PTS_ATTEMPT[Math.min(typeAttempts, TYPE_PTS_ATTEMPT.length-1)];
      const speedBonus = Math.round(TYPE_SPEED_MAX * (timeRemaining / timerDuration));
      const pts = basePts + speedBonus;
      weeklyTotalPts += pts;
      weeklyPointsLive.textContent = weeklyTotalPts;
      weeklyPerQuestion.push({ name: correct, correct: true, ptsEarned: pts, timeUsed: Math.round(elapsed*10)/10 });
      showPointsBubble(pts, true);
    }

    setTimeout(nextQuestion, 1600);

  } else {
    // ❌ Wrong attempt
    updateAttemptDot(typeAttempts, 'used');
    typeAttempts++;

    if (typeAttempts >= MAX_ATTEMPTS) {
      // Out of attempts
      clearInterval(timerInterval);
      answered = true;
      typeInput.className   = 'type-input wrong-input';
      typeInput.disabled    = true;
      typeSubmitBtn.disabled = true;
      typeFeedback.innerHTML = `
        <span class="fb-wrong">✗ Out of attempts</span>
        <span class="fb-answer">The answer was: <strong>${correct}</strong></span>`;
      streak = 0;
      streakDisplay.textContent = '🔥 0';
      playWrong();

      if (mode === 'weekly') {
        const elapsed = (Date.now() - questionStartTime) / 1000;
        weeklyPerQuestion.push({ name: correct, correct: false, ptsEarned: 0, timeUsed: Math.round(elapsed*10)/10 });
        showPointsBubble(0, false);
      }

      setTimeout(nextQuestion, 2000);
    } else {
      // Still has attempts left — shake and give hint
      typeInput.className = 'type-input wrong-input';
      playAlmost();

      // Show hint after first wrong attempt
      const revealCount = typeAttempts; // reveal 1 letter per wrong attempt
      typeHint.innerHTML = `
        <div class="type-attempts">${
          Array.from({length: MAX_ATTEMPTS}, (_, i) =>
            `<div class="attempt-dot ${i < typeAttempts ? 'used' : ''}" id="dot-${i}"></div>`
          ).join('')
        }</div>
        <span style="display:block;margin-top:6px;font-family:monospace;letter-spacing:3px;color:var(--accent);font-size:14px">${buildHint(correct, revealCount)}</span>`;

      setTimeout(() => {
        typeInput.className = 'type-input';
        typeInput.value     = '';
        typeInput.focus();
      }, 500);
    }
  }
}

// ===== TIMER =====
function startTimer() {
  clearInterval(timerInterval);
  timeLeft = timerDuration;
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
  const offset = RING_CIRCUMFERENCE * (1 - timeLeft / timerDuration);
  timerRing.style.strokeDashoffset = offset;
  timerRing.classList.remove('warning','danger');
  if (timeLeft <= 3) timerRing.classList.add('danger');
  else if (timeLeft <= 6) timerRing.classList.add('warning');
}

function timeUp() {
  answered = true;
  streak = 0;
  streakDisplay.textContent = '🔥 0';

  if (answerMode === 'multiple') {
    markMCCorrect(questions[currentQ].flag.name);
    document.querySelectorAll('.answer-btn').forEach(b => b.classList.add('disabled'));
  } else {
    const correct = questions[currentQ].flag.name;
    typeInput.disabled    = true;
    typeSubmitBtn.disabled = true;
    typeFeedback.innerHTML = `
      <span class="fb-wrong">⏱ Time's up!</span>
      <span class="fb-answer">The answer was: <strong>${correct}</strong></span>`;
    typeInput.className = 'type-input wrong-input';
  }

  if (mode === 'weekly') {
    weeklyPerQuestion.push({ name: questions[currentQ].flag.name, correct: false, ptsEarned: 0, timeUsed: timerDuration });
    showPointsBubble(0, false);
  }

  setTimeout(nextQuestion, 1800);
}

// ===== POINTS BUBBLE =====
function showPointsBubble(pts, correct) {
  if (mode !== 'weekly') return;
  pointsBubble.className   = 'points-bubble';
  pointsBubble.textContent = correct ? `+${pts} pts` : '✗ 0 pts';
  void pointsBubble.offsetWidth;
  pointsBubble.classList.add('show', correct ? 'correct-pts' : 'wrong-pts');
}

// ===== NEXT QUESTION =====
function nextQuestion() {
  currentQ++;
  if (currentQ >= TOTAL_QUESTIONS) {
    mode === 'weekly' ? showWeeklyResult(weeklyTotalPts) : showResult();
  } else {
    loadQuestion();
  }
}

// ===== REGULAR RESULT =====
const RESULT_TIERS = [
  {min:9, emoji:'🏆', title:'Flag Expert!',   msg:"You're a geography legend. Seriously impressive!"},
  {min:7, emoji:'🌟', title:'Flag Master',    msg:"You really know your flags. Almost perfect!"},
  {min:5, emoji:'🌍', title:'Intermediate',  msg:"Not bad! A bit more travel and you'll be a pro."},
  {min:3, emoji:'🗺️', title:'Getting There', msg:"Keep exploring — the world has a lot to offer!"},
  {min:0, emoji:'🐣', title:'Beginner',       msg:"Everyone starts somewhere. Try again!"},
];

function showResult() {
  const tier = RESULT_TIERS.find(t => score >= t.min);
  resultEmoji.textContent = tier.emoji;
  resultTitle.textContent = tier.title;
  resultScore.textContent = score;
  resultMsg.textContent   = tier.msg;
  bestStreakDisplay.textContent = `${bestStreak} 🔥`;
  diffDisplay.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  modeDisplay.textContent = answerMode === 'type' ? '⌨️ Type' : '🔘 Choice';

  weeklyPlayBtn.textContent = hasPlayedThisWeek(weeklyKey)
    ? '🏆 View Weekly Leaderboard'
    : '⚡ Play Weekly Challenge';
  weeklyUnlockBanner.style.display = 'flex';

  showScreen(resultScreen);
}

// ===== WEEKLY RESULT =====
function showWeeklyResult(totalPts) {
  const weekNum = parseInt(weeklyKey.split('W')[1], 10);
  weeklyWeekBadge.textContent = `Week #${weekNum}`;
  lbResetNote.textContent = `Resets in ${getDaysUntilMonday()}d`;

  const justPlayed = totalPts !== null;

  if (justPlayed) {
    renderScoreBreakdown(totalPts);
    weeklyAlreadyPlayed.style.display = 'none';

    const pct = score / TOTAL_QUESTIONS;
    let wEmoji = '🐣', wTitle = 'Keep trying!';
    if (pct === 1)       { wEmoji = '🏆'; wTitle = 'Perfect Score!'; }
    else if (pct >= 0.8) { wEmoji = '🌟'; wTitle = 'Fantastic!'; }
    else if (pct >= 0.6) { wEmoji = '🌍'; wTitle = 'Well done!'; }
    else if (pct >= 0.4) { wEmoji = '🗺️'; wTitle = 'Getting there!'; }
    wResultEmoji.textContent = wEmoji;
    wResultTitle.textContent = wTitle;

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
    <div class="breakdown-item"><span class="breakdown-label">Correct</span><span class="breakdown-value">${score}/10</span></div>
    <div class="breakdown-item"><span class="breakdown-label">Total Points</span><span class="breakdown-value highlight">${totalPts}</span></div>
    <div class="breakdown-item"><span class="breakdown-label">Avg Speed</span><span class="breakdown-value">${avgSpeed.toFixed(1)}s</span></div>
    <div class="breakdown-item"><span class="breakdown-label">Best Streak</span><span class="breakdown-value">${bestStreak} 🔥</span></div>
    <div class="per-q-table">`;

  weeklyPerQuestion.forEach((q, i) => {
    const icon = q.correct ? '✅' : '❌';
    const ptsClass = q.ptsEarned === 0 ? 'per-q-pts zero' : 'per-q-pts';
    html += `<div class="per-q-row">
      <span class="per-q-flag">${i+1}. ${q.name}</span>
      <span class="per-q-result">${icon}</span>
      <span class="${ptsClass}">${q.ptsEarned > 0 ? '+'+q.ptsEarned : '0'}</span>
    </div>`;
  });

  html += `</div>`;
  weeklyScoreBreakdown.innerHTML = html;
}

async function renderLeaderboard(highlightName) {
  leaderboardList.innerHTML = `<div class="lb-empty">Loading scores…</div>`;
  const lb = await fetchLeaderboard(weeklyKey);
  if (!lb.length) {
    leaderboardList.innerHTML = `<div class="lb-empty">No scores yet this week. Be the first!</div>`;
    return;
  }
  const rankEmojis  = ['🥇','🥈','🥉'];
  const rankClasses = ['gold','silver','bronze'];
  leaderboardList.innerHTML = lb.map((entry, i) => {
    const name  = entry.username || entry.name || 'Anonymous';
    const pts   = entry.pts;
    const isYou = name === highlightName;
    const rankHtml = i < 3
      ? `<span class="lb-rank ${rankClasses[i]}">${rankEmojis[i]}</span>`
      : `<span class="lb-rank">${i+1}</span>`;
    const youTag = isYou ? `<span class="you-tag">YOU</span>` : '';
    return `<div class="lb-row ${isYou ? 'is-you' : ''}">
      ${rankHtml}
      <span class="lb-name">${escapeHTML(name)}${youTag}</span>
      <span class="lb-pts">${pts}</span>
    </div>`;
  }).join('');
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ===== NAME MODAL =====
let pendingPts = 0, pendingAvgSpeed = 0;

function openNameModal(totalPts) {
  pendingPts = totalPts;
  pendingAvgSpeed = weeklyPerQuestion.length
    ? weeklyPerQuestion.reduce((s,q) => s + q.timeUsed, 0) / weeklyPerQuestion.length
    : 0;

  if (currentUser) {
    // Logged in — save automatically, no modal needed
    saveScore(currentUsername, totalPts);
    return;
  }

  // Guest — show modal to pick a display name
  const savedName = localStorage.getItem('flagquiz_playername') || '';
  playerNameInput.value = savedName;
  nameModal.classList.add('show');
  setTimeout(() => playerNameInput.focus(), 100);
}

async function saveScore(name, pts) {
  markPlayedThisWeek(weeklyKey);
  await saveToLeaderboard(weeklyKey, name, pts, score, pendingAvgSpeed);
  renderLeaderboard(name);
  showToast(currentUser ? `🏅 Score saved to global leaderboard!` : `🏅 Score saved as "${name}"!`);
}

async function submitName() {
  const name = playerNameInput.value.trim() || 'Guest';
  localStorage.setItem('flagquiz_playername', name);
  nameModal.classList.remove('show');
  await saveScore(name, pendingPts);
}

modalSubmitBtn.addEventListener('click', submitName);
playerNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitName(); });
modalSkipBtn.addEventListener('click', () => {
  nameModal.classList.remove('show');
  markPlayedThisWeek(weeklyKey);
  renderLeaderboard(null);
});

// ===== SHARE =====
shareBtn.addEventListener('click', () => {
  const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  const modeLabel = answerMode === 'type' ? 'Type mode' : 'Multiple choice';
  copyToClipboard(
    `🌍 I scored ${score}/10 on Flag Quiz! (${diffLabel} · ${modeLabel})\nCan you beat me? ${location.href}`,
    '📋 Score copied!'
  );
});
wShareBtn.addEventListener('click', () => {
  const weekNum = parseInt(weeklyKey.split('W')[1], 10);
  copyToClipboard(
    `🏆 Flag Quiz Weekly Challenge — Week #${weekNum}\nI scored ${weeklyTotalPts} points (${score}/10 correct)!\nCan you beat me? ${location.href}`,
    '📋 Weekly score copied!'
  );
});
function copyToClipboard(text, msg) {
  if (navigator.clipboard) { navigator.clipboard.writeText(text).then(() => showToast(msg)); }
  else showToast(text);
}

// ===== PLAY AGAIN =====
playAgainBtn.addEventListener('click', () => showScreen(startScreen));
wPlayAgainBtn.addEventListener('click', () => { showScreen(startScreen); updateWeeklyTeaser(); });

// ===== TOAST =====
function showToast(msg, duration = 2800) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}
