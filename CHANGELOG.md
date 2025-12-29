# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Documentation
- Added live demo link to README.

## [0.1.0] - 2025-12-29

### Added
- **Core Functionality**: Support for parsing TavernAI/SillyTavern format PNG character cards.
  - Support for V1 and V2 character card metadata structures.
  - Implemented PNG `tEXt` chunk reading and JSON data extraction.
  - Fallback mechanism: Brute-force search for JSON structures if standard metadata reading fails.
- **UI/UX**: Clean user interface based on React.
  - Drag-and-drop or click to upload images.
  - Real-time image preview.
  - Real-time Markdown preview of extraction results.
- **AI Enhancement**: Integrated Google Gemini API.
  - Automatically optimizes raw extracted data into well-formatted Markdown documents.
  - Intelligently organizes character settings, personality, scenarios, etc.
- **Architecture**:
  - Built with Vite + TypeScript.
  - Basic ESLint and TypeScript rules configured.
