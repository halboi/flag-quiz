# 🌍 Flag Quiz — with Weekly Challenge

A fast, fun, mobile-friendly flag trivia game. No login, no backend, no paid services.

## Features

### Regular Quiz
- 3 difficulty levels (Easy / Medium / Hard)
- 10-second countdown timer per question
- Score + streak tracking
- Sound effects (Web Audio API)
- Progress bar + smooth animations
- Share your score

### 🏆 Weekly Challenge (new!)
- **Unlocked** after completing any regular quiz
- **Same 10 flags for everyone** that week — seeded by ISO week number so it's fair and consistent globally
- **Points system**: 100 pts base per correct answer + up to 50 speed bonus (faster = more points)
- **Per-question breakdown** showing what you scored and how fast on each flag
- **Local leaderboard** — enter your name and compete with anyone who plays on the same device/browser
- Resets every Monday automatically
- One attempt per week (tracked in localStorage)

## Scoring Formula
```
Correct answer = 100 base pts + round(50 × time_remaining / 10) speed bonus
Wrong / timed out = 0 pts
Max per question = 150 pts
Max total = 1500 pts
```

## Files
```
flag-quiz/
├── index.html   ← App structure (5 screens)
├── style.css    ← All styling
├── script.js    ← Game logic + weekly system
└── README.md
```

## Run Locally
Open `index.html` in any modern browser. No build step needed.

---

## Deploy Free on GitHub Pages

### Step 1 — Create a GitHub repo
1. Go to https://github.com/new
2. Name it `flag-quiz`, set to **Public**, click **Create**

### Step 2 — Upload files
**Via GitHub UI:**
1. Click "uploading an existing file"
2. Drag `index.html`, `style.css`, `script.js`
3. Commit changes

**Via Git:**
```bash
git init
git add .
git commit -m "Flag Quiz with Weekly Challenge"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/flag-quiz.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages
Settings → Pages → Source: **Deploy from branch** → main / root → Save

### Step 4 — Live at:
```
https://YOUR_USERNAME.github.io/flag-quiz/
```

---

## Notes
- Flag images: [flagcdn.com](https://flagcdn.com) — free, no API key
- Leaderboard uses `localStorage` — scores are stored per-browser (perfect for shared devices / friend groups)
- Weekly seed is deterministic: same week number + year = same 10 flags for every player worldwide
