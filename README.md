# World Cup Fantasy League

A lightweight, static web application for running a World Cup group-stage fantasy competition.

This project allows users to predict group winners and automatically calculates standings using custom scoring and tie-breaker logic — all powered by simple JSON files (no backend required).

---

## 🚀 Features

### 🏆 Leaderboard
- Ranks players by:
  1. **Total Points**
  2. **Correct Picks**
  3. **Lowest Fair Play Points**


### 📖 Rules Tab
- Explains scoring system and tie-breakers.
- Includes full fair play deduction system.

---

## ⚽ Scoring System

- Players select one winner per group.
- If correct, they earn points equal to that team’s **seed**.
  - Example: Seed 3 winner = 3 points.

### Tie-Breakers
1. Most Correct Picks
2. Lowest Fair Play Points

### Fair Play Deductions (Group Stage)
Only one deduction applied per player per match:

- Yellow card: 1 point
- Indirect red (second yellow): 3 points
- Direct red: 4 points
- Yellow + direct red: 5 points

A player's fair play total is the sum of all teams they selected, regardless of whether their picks were correct.

---

