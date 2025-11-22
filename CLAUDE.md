# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based educational spelling game built for children to learn English spelling. The game features a continuous runner-style animation where the player types words they hear spoken aloud, and a character jumps over (correct) or crashes into (incorrect) obstacles representing their typed words.

## Development Commands

- `npm run dev` - Start Vite development server (typically runs on http://localhost:5174)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Architecture

### Core Game Loop

The game follows this sequence:

1. **Word Selection** (`WordManager`) - Randomly selects a word based on difficulty level
2. **Speech** (`AudioManager`) - Speaks the word using Web Speech API
3. **User Input** - Player types the word and presses Enter
4. **Validation** (`SpellingGame`) - Compares input with correct spelling
5. **Animation** - Character jumps (correct) or crashes (incorrect) while obstacle slides left across screen
6. **Scoring** - Updates score and lives, shows confetti on success

### Key Timing Relationships

**Critical:** The game's animation timing is tightly coupled between CSS animations and JavaScript delays:

- **Obstacle animation**: 3s to slide from right to left (CSS: `slideLeft` animation)
- **Jump trigger**: 1500ms delay after Enter is pressed (when obstacle reaches character)
- **Crash trigger**: 1400ms delay after Enter is pressed
- **Character position**: Fixed at `left: 100px` (CSS)
- **Jump animation**: 0.8s duration, peaks at `bottom: 140px`

When adjusting timing, all three components (CSS animation duration, character position, JavaScript delays) must be synchronized.

### Module Organization

- `types.ts` - TypeScript interfaces and type definitions
- `words.ts` - Word management with difficulty levels (easy/medium/hard), supports loading custom words from `/public/words.json`
- `audio.ts` - Web Speech API wrapper, prioritizes high-quality voices (Google, Microsoft, Apple)
- `game.ts` - Core game state and logic, manages game flow and animations
- `main.ts` - Entry point, initializes game on DOM ready
- `styles.css` - All styling including animations

### Word Management

Words are stored in two places:

1. **Default words** - Hard-coded in `src/words.ts` by difficulty
2. **Custom words** - Optional JSON file at `/public/words.json` (merged with defaults)

The `WordManager` tracks used words to avoid repetition within a session.

### Animation System

The character has three animation states:

- `run` - Continuous subtle bounce (0.3s infinite loop)
- `jumping` - 0.8s jump animation triggered on correct answer
- `crashing` - 0.6s crash animation with rotation on incorrect answer

Obstacles always slide from right to left using the `slideLeft` animation. The character stays fixed while obstacles move.

## Speech Synthesis

The game uses Web Speech API with these settings:

- **Rate**: 0.6 (slow for clarity)
- **Voice priority**: Looks for Google/Microsoft/Apple voices first, falls back to any English voice
- **Console logging**: Voice selection is logged to help debug speech issues

## State Management

Game state is managed in a single `GameState` object containing:

- Current word, score, lives (starts at 5)
- Game phase tracking (idle, speaking, waiting-input, validating, jumping, crashing, game-over)
- Input validation state

Lives display uses filled hearts (❤️) for remaining lives and black hearts (🖤) for lost lives, always showing 5 total.
