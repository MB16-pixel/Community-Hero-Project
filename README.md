# 🏛️ Community Hero: Civic Hazard Hub

An interactive, gamified, and AI-powered civic engagement platform designed for neighbors to report local hazards, collaborate on resolutions, and forecast urban infrastructure risks.

---

## ✨ Core Features

### 1. 📋 Real-Time Civil Hazard Reporting
- **Category Preset Selector**: Report issues across standard categories (*Potholes*, *Water Leakage*, *Damaged Streetlights*, *Trash Piles*, and more).
- **Mandatory Location Validation**: Requires precise address/location routing to guarantee actionable municipal and citizen coordination.
- **Durable Persistence**: All reports are written and synchronized instantly using **Firebase Firestore** to allow cross-device and multi-user visibility.

### 2. 🧠 Gemini AI Semantic Duplicate Detector
- **Semantic Analysis**: Integrates the official `@google/genai` SDK via a secure server-side Express proxy to scan existing active neighborhood issues in real-time and identify semantic duplicates.
- **Prevent Multi-Submissions**: Warns users if their reported issue matches an existing report in the system, detailing the duplicate match and advising them on how to help resolve the existing issue instead.
- **Exponential Backoff Resilience**: Uses custom server-side retries to smoothly manage transient 503 UNAVAILABLE or 429 rate-limit surges on Gemini API endpoints without impacting user experience.

### 3. 🎮 Gamification & Citizen Leaderboard
- **Dynamic XP Engine**: Gain **+50 Experience Points (XP)** for every civic report filed.
- **Dynamic Progress Bar**: Live progress tracking indicating points remaining until advancing to the next virtual citizen badge level.
- **National Community Leaderboard**: Tracks total regional civic XP, charting engagement across several countries (*United States*, *United Kingdom*, *Canada*, *Australia*, *Japan*, etc.).

### 4. 🧭 Interactive Collaborative Feed
- **Real-Time Synchronization**: Instantly reflects issues reported by other users in the district.
- **Smart Filtering**: Filter feed reports by *All*, *My Issues*, or *Nearby* (tailored to the logged-in user's regional profile).
- **Collaborative Status Lifecycle**: Community members can verify or resolve issues directly, changing status from *Pending* to *Verified* or *Resolved*.

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
- **AI Integration**: Google Gen AI Node SDK (`@google/genai` targeting the `gemini-2.5-flash` model)

---

## 🚀 How It Works (The Core Loop)
1. **Sign Up**: Register with your email and designate your community region.
2. **Describe & Check**: Write your hazard description and click **Scan For Duplicates** to ensure it hasn't been reported.
3. **Submit**: Enter location context, choose a category, and save. Watch your XP level up with custom sounds and toast animations.
4. **Analyze**: Head to the **Predictive** tab to run simulations of civic neglect in your country.
