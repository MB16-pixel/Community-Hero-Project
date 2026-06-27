# 🏛️ Community Hero: Hyperlocal Problem Solver

An interactive, gamified, and AI-powered civic engagement platform designed for neighbors to report local hazards, collaborate on resolutions, and forecast urban infrastructure risks.

---

## ✨ Core Features

### 1. 📋 Real-Time Civil Hazard Reporting
- **Category Preset Selector**: Report issues across standard categories (*Potholes*, *Water Leakage*, *Damaged Streetlights*, *Trash Piles*, and more).
- **Mandatory Location Validation**: Requires precise address/location routing to guarantee actionable municipal and citizen coordination.
- **Durable Persistence**: All reports are written and synchronized instantly using **Firebase Firestore** to allow cross-device and multi-user visibility.

### 2. 🧠 Gemini AI Civic Optimization Suite
- **AI Rephrasing Assistant (Rephrase with Gemini)**: Restored to full functionality! Integrates the official `@google/genai` SDK via a secure server-side Express proxy to rewrite raw, informal reports (e.g., *"huge bump in street near shop"*) into polite, highly professional, and descriptive logs suited for city hazard databases. Users can preview suggestions and instantly click to apply or dismiss them.
- **Semantic Duplicate Detector (Scan For Duplicates)**: Performs real-time semantic analysis comparing new entries against existing neighborhood reports to identify exact or highly similar duplicates in close proximity, preventing spam and keeping the database clean.
- **Automated Severity Classification**: Dynamically predicts issue severity (*Low*, *Medium*, *High*, *Critical*) based on safety hazard profiles and provides detailed reasoning to accelerate local prioritization.
- **Exponential Backoff Resilience**: Features custom server-side retries to smoothly handle transient Gemini API rate limits or surges without disrupting the user flow.

### 3. 🎮 Gamification & Citizen Leaderboard
- **Dynamic XP Engine**: Gain **+50 Experience Points (XP)** for every civic report filed.
- **Dynamic Progress Bar**: Live progress tracking indicating points remaining until advancing to the next virtual citizen badge level.
- **National Community Leaderboard**: Tracks total regional civic XP, charting engagement across several countries (*United States*, *United Kingdom*, *Canada*, *Australia*, *Japan*, etc.).

### 4. 🧭 Interactive Collaborative Feed & Resolution Pledges
- **Real-Time Synchronization**: Instantly reflects issues reported by other users in the district.
- **Smart Filtering**: Filter feed reports by *All*, *My Issues*, or *Nearby* (tailored to the logged-in user's regional profile).
- **Collaborative Support & Action Pledges**: Community members can actively back neighbor reports by pledging concrete resources. Residents can choose to pledge **Labor** (hands-on support, crew coordination), **Tools & Equipment** (providing utility signs, asphalt patch, safety cones), or **Advocacy & Coordination** (reaching out to city officials, amplifying awareness) accompanied by a personalized message to coordinate community-led action.
- **Collaborative Status Lifecycle**: Community members can verify or resolve issues directly, changing status from *Pending* to *Verified* or *Resolved* with optional proof media.

### 5. 📊 AI Predictive Analytics & Risk Forecasting
- **Live Civic Timelines**: Implements **Recharts** area charts charting the historical accumulation of community reports.
- **AI Backlog Forecast Simulator**: Interactive slider simulating the compound effects of maintenance response delays. Users can adjust horizons from 15 to 90 days and set simulated response speeds (*Swift Resolution <3 Days*, *10-Day Lag*, *Severe Neglect >21 Days*) to watch the backlog exponentially climb or shrink.
- **Cascade Deterioration Warnings**: Displays dynamic AI evaluations showing secondary hazard risks (e.g., how deferred water leaks weaken road sub-base to cause sinkholes, or how neglect expands pothole diameters 4x).
- **Financial Risk Matrix**: Computes the financial multiplier cost of inaction (e.g., deferred water repairs result in a 5x cost multiplier, potholes result in an 8x structural collapse multiplier).

### 6. 🎨 Premium Interface & Tactile Micro-Interactions
- **Cohesive Warm Slate Palette**: Soft off-white backgrounds paired with elegant, organic forest greens (`#5A6B5D`) and amber highlights.
- **Spring-Animated Toast Pop-ups**: Beautiful contextual pop-up alerts driven by **Framer Motion** for success entries, validation warnings, and errors.
- **Physical Audio Synthesizer**: Features a dedicated web-audio synthesizer (`audio.ts`) triggering custom, hand-crafted sound frequencies for clicks, alert ticks, successes, and level-ups.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion (`motion/react`)
- **Visualizations**: Recharts (Responsive Area, Bar, and Pie chart instances)
- **Backend**: Node.js Express Server (Port 3000)
- **Database**: Firebase Firestore (Durable persistent database)
- **Auth**: Firebase Authentication (Safe sign-up, email login, and neighborhood allocation)
- **AI Integration**: Google Gen AI Node SDK (`@google/genai` targeting the `gemini-3.5-flash` model)

---

## 🚀 How It Works (The Core Loop)
1. **Sign Up**: Register with your email and designate your community region.
2. **Describe & Rephrase**: Write your raw hazard description and tap **Rephrase with Gemini** to let AI rewrite it into a polite, descriptive log sentence.
3. **Scan For Duplicates**: Click **Scan For Duplicates** to ensure a similar issue hasn't been reported in your vicinity.
4. **Pledge & Coordinate**: Browse neighbor reports, pledge Labor, Tools, or advocacy support to help solve pending civic issues collaboratively.
5. **Analyze**: Head to the **Predictive** tab to run simulations of civic neglect in your country.
