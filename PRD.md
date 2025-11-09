## 🧾 Product Requirements Document (PRD)

### Project Title: **Emoji Escape**

### Version: 1.0

### Date: November 2025

---

## 1. 🎯 Overview

**Emoji Escape** is a fast-paced browser mini-game built with **HTML, CSS, and JavaScript** where the player controls a single emoji character and must **dodge falling emojis** for as long as possible.

The game increases in difficulty over time, rewards high survival times, and works smoothly on both **desktop and mobile** (with touch/swipe controls).

Deployed on **GitHub Pages**, it showcases creative gameplay using only front-end web technologies.

---

## 2. 🧩 Goals and Objectives

| Goal                    | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| **Fun, quick gameplay** | A light, casual game playable in under a minute per session. |
| **Responsive design**   | Fully functional on mobile and desktop browsers.             |
| **Simple controls**     | Swipe or arrow keys to move left/right.                      |
| **Replayability**       | High-score tracking with localStorage.                       |
| **Portfolio-ready**     | Deployed, visually clean, easy to share.                     |

---

## 3. 👾 Core Gameplay

### 3.1 Game Loop

1. **Start Screen**

   * Displays game title and “Start” button.
   * Shows last high score.

2. **Gameplay**

   * Player emoji starts at bottom of the play area.
   * Objects (random emojis) fall from the top at random x-positions.
   * Player moves horizontally to dodge them.
   * Game speed increases every 10 seconds.

3. **Game Over**

   * Triggered when any falling emoji collides with the player emoji.
   * Display score and “Play Again” button.
   * Save and display best score.

---

## 4. 🧱 Functional Requirements

### 4.1 Player Controls

* **Desktop:** Left/Right arrow keys move the emoji horizontally.
* **Mobile:** Swipe left/right (touch events).
* Movement bounded within screen edges.

### 4.2 Falling Objects

* Random emoji selection (e.g. 💣, 🧊, 🍕, 🪨).
* Spawn from top at random positions every 0.5–1.5 seconds.
* Increase fall speed as time progresses.

### 4.3 Scoring

* +1 point per second survived (timer-based).
* High score saved to localStorage.
* Display live score during play and final score at game over.

### 4.4 Collision Detection

* Simple bounding-box (rectangle overlap) logic.
* On collision → trigger game over state.

### 4.5 Responsive Design

* Game container scales using viewport units (`vh`, `vw`).
* Works seamlessly on 16:9 desktop and vertical mobile screens.

---

## 5. 🎨 Non-Functional Requirements

| Category            | Requirement                                                       |
| ------------------- | ----------------------------------------------------------------- |
| **Performance**     | Runs at ≥ 60 FPS on modern browsers.                              |
| **Compatibility**   | Chrome, Safari, Firefox, Edge, Mobile Safari, Chrome for Android. |
| **Accessibility**   | Minimal color contrast issues, readable text, large buttons.      |
| **Maintainability** | Clean, modular JS structure; commented code.                      |

---

## 6. 📁 Technical Implementation

**Tech Stack:**

* **Frontend:** HTML5, CSS3, Vanilla JS
* **Hosting:** GitHub Pages
* **Assets:** Unicode emojis (no image files)
* **Storage:** localStorage for scores

**Folder Structure:**

```
emoji-escape/
│
├── index.html       # Main game file
├── style.css        # Styling and animations
└── script.js        # Game logic
```

**Key Components:**

* `Player` class (position, movement)
* `FallingObject` class (emoji, position, speed)
* `GameManager` (spawning, collision, scoring, game states)

---

## 7. 🧠 User Experience (UX)

| Screen               | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| **Start Screen**     | Game title, emoji illustration, “Start Game” button.         |
| **Gameplay Screen**  | Play area, score counter, emoji movement.                    |
| **Game Over Screen** | “Game Over” text, current & best score, “Play Again” button. |

**Visual Style:**

* Flat, colorful background gradient.
* Large emojis as sprites.
* Minimal UI text for mobile readability.

---

## 8. 🧭 Milestones (Weekend Plan)

| Day             | Tasks                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------- |
| **Day 1 (Sat)** | Setup repo + HTML/CSS layout. Implement player movement and falling objects.                  |
| **Day 2 (Sun)** | Add collision detection, scoring, UI screens, responsiveness, polish, deploy to GitHub Pages. |

---

## 9. 🚀 Deployment

* Push to GitHub repo: `emoji-escape`
* Configure **GitHub Pages** → main branch → root.
* Verify responsiveness and performance.
* Share live link.

---

## 10. 📊 Success Metrics

* **Playable on mobile and desktop** with smooth animations.
* **Average session time:** 30–90 seconds.
* **No console errors or layout issues.**
* **Positive user feedback:** “fun”, “simple”, “addictive”.



New version will be developer next sprint.