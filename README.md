# Character Card MD Extractor

A web tool built with React and TypeScript for extracting metadata from TavernAI / SillyTavern format character card images (PNG) and converting them into well-formatted Markdown documentation.

This project integrates the Google Gemini API to automatically optimize the extracted text layout using AI, making it easier to read and share.

## ✨ Features

- **Multi-Format Support**: Compatible with TavernAI V1 and V2 character card formats.
- **Smart Parsing**:
  - Standard PNG `tEXt` chunk metadata reading.
  - Intelligent fallback mechanism: Supports JSON data extraction via Base64 decoding or brute-force file content search.
- **AI Enhanced Formatting**:
  - **Basic Mode**: Instantly generates Markdown from raw data locally.
  - **Enhanced Mode**: Uses Google Gemini models to intelligently organize character personality, background, and dialogue examples into a beautifully formatted document.
- **Privacy & Security**: Image parsing is performed entirely locally in the browser (AI enhancement features send text data to Google servers).

## 🛠️ Tech Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **AI Service**: Google Gemini SDK (@google/genai)

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher recommended)
- Google Gemini API Key (for AI enhancement features)

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/character_card_md_extractor.git
   cd character_card_md_extractor
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   Create a `.env.local` file in the project root and add your Gemini API key:

   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Start Development Server**

   ```bash
   npm run dev
   ```

5. **Open Browser**

   Visit the address shown in the console (usually `http://localhost:5173`).

## 📂 Project Structure

```
.
├── services/
│   ├── pngMetadata.ts    # PNG parsing core logic
│   └── geminiService.ts  # Gemini AI calling logic
├── App.tsx               # Main application component
├── types.ts              # Type definitions
├── index.tsx             # Entry file
├── index.html
├── package.json
└── vite.config.ts
```

## 📝 Todo / Roadmap

- [ ] Add "Copy Markdown" button
- [ ] Support batch processing of multiple images
- [ ] Add export to PDF or JSON
- [ ] Optimize for mobile devices

## 📄 License

MIT License
