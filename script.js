// ===== FLAG DATA BY DIFFICULTY =====
const FLAGS = {
  easy: [
    { code: "us", name: "United States" },
    { code: "gb", name: "United Kingdom" },
    { code: "fr", name: "France" },
    { code: "de", name: "Germany" },
    { code: "it", name: "Italy" },
    { code: "es", name: "Spain" },
    { code: "jp", name: "Japan" },
    { code: "cn", name: "China" },
    { code: "br", name: "Brazil" },
    { code: "ca", name: "Canada" },
    { code: "au", name: "Australia" },
    { code: "in", name: "India" },
    { code: "mx", name: "Mexico" },
    { code: "ru", name: "Russia" },
    { code: "za", name: "South Africa" },
    { code: "ng", name: "Nigeria" },
    { code: "ar", name: "Argentina" },
    { code: "pt", name: "Portugal" },
    { code: "nl", name: "Netherlands" },
    { code: "tr", name: "Turkey" },
  ],
  medium: [
    { code: "se", name: "Sweden" },
    { code: "no", name: "Norway" },
    { code: "fi", name: "Finland" },
    { code: "dk", name: "Denmark" },
    { code: "ch", name: "Switzerland" },
    { code: "at", name: "Austria" },
    { code: "be", name: "Belgium" },
    { code: "pl", name: "Poland" },
    { code: "cz", name: "Czech Republic" },
    { code: "gr", name: "Greece" },
    { code: "eg", name: "Egypt" },
    { code: "sa", name: "Saudi Arabia" },
    { code: "th", name: "Thailand" },
    { code: "id", name: "Indonesia" },
    { code: "pk", name: "Pakistan" },
    { code: "ph", name: "Philippines" },
    { code: "vn", name: "Vietnam" },
    { code: "my", name: "Malaysia" },
    { code: "ke", name: "Kenya" },
    { code: "ma", name: "Morocco" },
    { code: "co", name: "Colombia" },
    { code: "cl", name: "Chile" },
    { code: "pe", name: "Peru" },
    { code: "nz", name: "New Zealand" },
    { code: "ua", name: "Ukraine" },
    { code: "ro", name: "Romania" },
    { code: "hu", name: "Hungary" },
    { code: "il", name: "Israel" },
    { code: "kr", name: "South Korea" },
    { code: "ae", name: "UAE" },
  ],
  hard: [
    { code: "kz", name: "Kazakhstan" },
    { code: "uz", name: "Uzbekistan" },
    { code: "by", name: "Belarus" },
    { code: "ge", name: "Georgia" },
    { code: "am", name: "Armenia" },
    { code: "az", name: "Azerbaijan" },
    { code: "md", name: "Moldova" },
    { code: "al", name: "Albania" },
    { code: "mk", name: "North Macedonia" },
    { code: "me", name: "Montenegro" },
    { code: "ba", name: "Bosnia & Herzegovina" },
    { code: "si", name: "Slovenia" },
    { code: "sk", name: "Slovakia" },
    { code: "lv", name: "Latvia" },
    { code: "lt", name: "Lithuania" },
    { code: "ee", name: "Estonia" },
    { code: "gh", name: "Ghana" },
    { code: "tz", name: "Tanzania" },
    { code: "et", name: "Ethiopia" },
    { code: "ug", name: "Uganda" },
    { code: "zm", name: "Zambia" },
    { code: "mz", name: "Mozambique" },
    { code: "sd", name: "Sudan" },
    { code: "lr", name: "Liberia" },
    { code: "sl", name: "Sierra Leone" },
    { code: "gn", name: "Guinea" },
    { code: "bf", name: "Burkina Faso" },
    { code: "ne", name: "Niger" },
    { code: "td", name: "Chad" },
    { code: "bi", name: "Burundi" },
    { code: "kg", name: "Kyrgyzstan" },
    { code: "tj", name: "Tajikistan" },
    { code: "tm", name: "Turkmenistan" },
    { code: "mn", name: "Mongolia" },
    { code: "kh", name: "Cambodia" },
    { code: "la", name: "Laos" },
    { code: "mm", name: "Myanmar" },
    { code: "bn", name: "Brunei" },
    { code: "tl", name: "Timor-Leste" },
    { code: "pg", name: "Papua New Guinea" },
  ],
};

// All names pool for wrong answers
const ALL_NAMES = [...new Set([
  ...FLAGS.easy.map(f => f.name),
  ...FLAGS.medium.map(f => f.name),
  ...FLAGS.hard.map(f => f.name),
])];

// ===== SOUND EFFECTS (Web Audio API) =====
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playCorrect() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch(e) {}
}

function playWrong() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch(e) {}
}

function playTick() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch(e) {}
}

// ===== STATE =====
let difficulty = "easy";
let questions = [];
let currentQ = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let answered = false;
let timerInterval = null;
let timeLeft = 10;
const TOTAL_QUESTIONS = 10;
const TIMER_DURATION = 10;
const RING_CIRCUMFERENCE = 213.6;

// ===== DOM =====
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const startBtn = document.getElementById("start-btn");
const diffBtns = document.querySelectorAll(".diff-btn");
const flagImg = document.getElementById("flag-img");
const flagCard = document.getElementById("flag-card");
const answersGrid = document.getElementById("answers-grid");
const scoreDisplay = document.getElementById("score-display");
const streakDisplay = document.getElementById("streak-display");
const progressText = document.getElementById("progress-text");
const progressBar = document.getElementById("progress-bar");
const timerText = document.getElementById("timer-text");
const timerRing = document.getElementById("timer-ring");
const resultEmoji = document.getElementById("result-emoji");
const resultTitle = document.getElementById("result-title");
const resultScore = document.getElementById("result-score");
const resultMsg = document.getElementById("result-msg");
const bestStreakDisplay = document.getElementById("best-streak-display");
const diffDisplay = document.getElementById("diff-display");
const shareBtn = document.getElementById("share-btn");
const playAgainBtn = document.getElementById("play-again-btn");
const toast = document.getElementById("toast");

// ===== DIFFICULTY SELECT =====
diffBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    diffBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    difficulty = btn.dataset.diff;
  });
});

// ===== START =====
startBtn.addEventListener("click", startQuiz);

function startQuiz() {
  score = 0;
  streak = 0;
  bestStreak = 0;
  currentQ = 0;
  questions = buildQuestions();
  showScreen(quizScreen);
  loadQuestion();
}

function showScreen(screen) {
  [startScreen, quizScreen, resultScreen].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

// ===== BUILD QUESTIONS =====
function buildQuestions() {
  const pool = shuffle([...FLAGS[difficulty]]);
  const selected = pool.slice(0, TOTAL_QUESTIONS);
  return selected.map(flag => {
    const wrong = getWrongOptions(flag.name, 3);
    const options = shuffle([flag.name, ...wrong]);
    return { flag, options };
  });
}

function getWrongOptions(correct, count) {
  const pool = ALL_NAMES.filter(n => n !== correct);
  return shuffle(pool).slice(0, count);
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
  const q = questions[currentQ];

  // Progress
  progressText.textContent = `${currentQ + 1} / ${TOTAL_QUESTIONS}`;
  progressBar.style.width = `${((currentQ + 1) / TOTAL_QUESTIONS) * 100}%`;

  // Flag image with transition
  flagCard.classList.remove("enter");
  flagCard.classList.add("exit");
  setTimeout(() => {
    flagImg.src = `https://flagcdn.com/w320/${q.flag.code}.png`;
    flagImg.alt = `Flag of ${q.flag.name}`;
    flagCard.classList.remove("exit");
    flagCard.classList.add("enter");
  }, 280);

  // Answers
  answersGrid.innerHTML = "";
  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => handleAnswer(btn, opt, q.flag.name));
    answersGrid.appendChild(btn);
  });

  // Timer
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

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      if (!answered) timeUp();
    }
  }, 1000);
}

function updateTimerUI() {
  timerText.textContent = timeLeft;
  const offset = RING_CIRCUMFERENCE * (1 - timeLeft / TIMER_DURATION);
  timerRing.style.strokeDashoffset = offset;

  timerRing.classList.remove("warning", "danger");
  if (timeLeft <= 3) timerRing.classList.add("danger");
  else if (timeLeft <= 6) timerRing.classList.add("warning");
}

function timeUp() {
  answered = true;
  streak = 0;
  streakDisplay.textContent = `🔥 0`;
  markCorrect();
  // Disable all buttons
  document.querySelectorAll(".answer-btn").forEach(b => b.classList.add("disabled"));
  setTimeout(nextQuestion, 1500);
}

function markCorrect() {
  const correct = questions[currentQ].flag.name;
  document.querySelectorAll(".answer-btn").forEach(btn => {
    if (btn.textContent === correct) btn.classList.add("correct");
  });
}

// ===== HANDLE ANSWER =====
function handleAnswer(btn, chosen, correct) {
  if (answered) return;
  answered = true;
  clearInterval(timerInterval);

  document.querySelectorAll(".answer-btn").forEach(b => b.classList.add("disabled"));

  if (chosen === correct) {
    btn.classList.add("correct");
    score++;
    streak++;
    if (streak > bestStreak) bestStreak = streak;
    scoreDisplay.textContent = score;
    streakDisplay.textContent = `🔥 ${streak}`;
    playCorrect();
  } else {
    btn.classList.add("wrong");
    streak = 0;
    streakDisplay.textContent = `🔥 0`;
    markCorrect();
    playWrong();
  }

  setTimeout(nextQuestion, 1400);
}

// ===== NEXT QUESTION =====
function nextQuestion() {
  currentQ++;
  if (currentQ >= TOTAL_QUESTIONS) {
    showResult();
  } else {
    loadQuestion();
  }
}

// ===== RESULT =====
const RESULT_TIERS = [
  { min: 9, emoji: "🏆", title: "Flag Expert!", msg: "You're a geography legend. Seriously impressive!" },
  { min: 7, emoji: "🌟", title: "Flag Master", msg: "You really know your flags. Almost perfect!" },
  { min: 5, emoji: "🌍", title: "Intermediate", msg: "Not bad! A bit more travel and you'll be a pro." },
  { min: 3, emoji: "🗺️", title: "Getting There", msg: "Keep exploring — the world has a lot to offer!" },
  { min: 0, emoji: "🐣", title: "Beginner", msg: "Everyone starts somewhere. Try again!" },
];

function showResult() {
  const tier = RESULT_TIERS.find(t => score >= t.min);
  resultEmoji.textContent = tier.emoji;
  resultTitle.textContent = tier.title;
  resultScore.textContent = score;
  resultMsg.textContent = tier.msg;
  bestStreakDisplay.textContent = `${bestStreak} 🔥`;
  diffDisplay.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  showScreen(resultScreen);
}

// ===== SHARE =====
shareBtn.addEventListener("click", () => {
  const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  const text = `🌍 I scored ${score}/10 on Flag Quiz! (${diffLabel} mode)\nCan you beat me? Play at: ${location.href}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast("📋 Score copied! Paste & share it."));
  } else {
    showToast("Score: " + text);
  }
});

// ===== PLAY AGAIN =====
playAgainBtn.addEventListener("click", () => {
  showScreen(startScreen);
});

// ===== TOAST =====
function showToast(msg, duration = 2500) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}
