# 📊 BrawlStats — Competitive Analytics for Brawlhalla Players

> **Advanced analytics platform for serious Brawlhalla competitors.**

BrawlStats is a full-stack web application that provides real-time **player statistics**, **rank tracking**, **leaderboards**, and **competitive insights** for Brawlhalla players. Built with **React + Express + PostgreSQL + Prisma**, it supports Steam OAuth login, watchlists, player notes, and performance breakdowns to help you understand the meta and improve faster.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![Steam](https://img.shields.io/badge/Steam-OAuth-000000?logo=steam&logoColor=white)

**Tech Stack:** React, Tailwind CSS, Node.js, Express, PostgreSQL, Prisma, Steam OAuth, Brawlhalla API



## 🔗 Live Demo
- **BrawlStats:** https://brawlhalla-stats-frontend.vercel.app

---

## 🎥 Demo Video
[Watch Demo Video](https://youtu.be/MkcNQVl8ZZM)

---

## 📸 Screenshots
> Put your screenshots in `assets/`

![Search](/assets/search.png)
![Player Stats](/assets/player-stats.png)
![Leaderboards](/assets/leaderboards.png)
![Comparison](/assets/comparison.png)

---

## ✅ Key Features

### 🔍 Player Search & Analytics
- Search any player by **Brawlhalla ID**
- Full stats breakdown with ranked performance insights
- Legend and weapon-based performance analysis

### 📈 Rank Tracking & Progress
- Track player rank changes over time
- Performance trend visualization (historical progression)
- Quick access to tracked players

### 🏆 Real-time Leaderboards
- Browse global & regional ranked leaderboards
- Support for different brackets and regions

### 👥 Competitive Tools
- **Player comparison** (side-by-side)
- Watchlist system for quick tracking
- Notes system to record rivals/strategies/observations

### 🔐 Steam Authentication
- Secure Steam OAuth using Passport.js
- Session-based auth with PostgreSQL session storage
- Protected routes across the app

### ⚡ Performance & UX
- Smart caching (reduces API calls + improves load time)
- Mobile responsive UI with TailwindCSS
- Search history stored locally for fast access

