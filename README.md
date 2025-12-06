# 🎤 Singers Dreams

The ultimate real-time vocal analysis and music companion app.

## 🌟 Features

### 1. **Live Pitch Monitor**
*   **Real-time Hz & Note Detection**: See exactly what note you are singing with millisecond precision.
*   **Voice Type Analysis**: Detects if you are in Chest Voice, Mix, or Head Voice based on frequency.
*   **Vibrato Analyzer**: Visualizes your vibrato waves and stability.
*   **Noise Gate**: Filters out background noise for cleaner detection.

### 2. **Key Finder Module**
*   **Spotify Integration**: Search the "Global Top 50" or any song on Spotify to instantly get its Key & BPM.
*   **YouTube Integration**: Search and play "Trending Music" videos directly in the app.
*   **Live Analysis**: Analyze the key of YouTube videos in real-time using system audio loopback.
*   **Demo Mode**: Browse popular songs even without an API connection.

### 3. **Design**
*   **Neon/Glass Aesthetics**: A modern, dark-themed UI with glassmorphism effects.
*   **Responsive**: Works on various screen sizes.

---

## 🚀 Getting Started

### Installation
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```

### API Setup
To unlock the full power of the **Key Finder** (Spotify & YouTube search), you need to configure your free API keys.

**👉 [Click here to read the SETUP GUIDE](./SETUP_GUIDE.md)**

---

## 🛠️ Tech Stack
*   **React + Vite**: Fast frontend framework.
*   **Tailwind CSS**: Utility-first styling.
*   **Web Audio API**: Client-side audio processing.
*   **Lucide React**: Beautiful icons.
