# Spelling Game

A browser-based educational game designed to help children learn English spelling through interactive gameplay and audio feedback.

## Game Concept

The game presents an engaging way to practice spelling:

1. A word is spoken aloud using text-to-speech
2. The player types the word they heard
3. After pressing Enter, the typed word becomes an obstacle on screen
4. A character runs continuously and attempts to jump over the obstacle
5. **Correct spelling**: The character successfully jumps over, the player gets points and sees a confetti celebration
6. **Incorrect spelling**: The character crashes into the obstacle, loses a life, and the correct spelling is shown
7. After seeing the correct spelling, the player gets another chance to spell the word correctly
8. The game continues until all 3 lives are lost

## Features

- **Three difficulty levels**: Easy, Medium, and Hard with age-appropriate word lists
- **Text-to-Speech**: Words are spoken aloud using the browser's Web Speech API with optimized clarity
- **Continuous runner animation**: Character runs in place while obstacles slide from right to left
- **Life system**: Start with 5 lives (❤️), lose one for each mistake (shown as 🖤)
- **Retry mechanism**: See the correct spelling and get another chance after mistakes
- **Score tracking**: Earn 10 points for each correct word
- **Confetti celebration**: Animated celebration on successful jumps
- **Customizable word lists**: Easy to add your own words via JSON file

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd spelling-game
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to the URL shown (typically http://localhost:5174)

## Development

### Available Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Project Structure

```
spelling-game/
├── src/
│   ├── main.ts          # Application entry point
│   ├── game.ts          # Core game logic and state management
│   ├── audio.ts         # Web Speech API wrapper
│   ├── words.ts         # Word management by difficulty
│   ├── types.ts         # TypeScript type definitions
│   └── styles.css       # All game styling and animations
├── public/
│   └── words.json       # Custom word list (optional)
├── index.html           # HTML structure
├── vite.config.ts       # Vite configuration
└── tsconfig.json        # TypeScript configuration
```

## Customizing Word Lists

You can add your own words by editing `/public/words.json`:

```json
{
  "easy": ["hat", "cup", "pen", "box"],
  "medium": ["rabbit", "orange", "purple"],
  "hard": ["kangaroo", "spectacular", "magnificent"]
}
```

These words are **merged** with the default word lists, so you only need to include additional words you want to add.

Default word lists are defined in `src/words.ts` and include:
- **Easy**: 20 simple 3-4 letter words (cat, dog, sun, etc.)
- **Medium**: 20 common 5-6 letter words (house, table, friend, etc.)
- **Hard**: 20 challenging words (beautiful, elephant, butterfly, etc.)

## Technologies Used

- **TypeScript** - Type-safe game logic
- **Vite** - Fast development and build tooling
- **Web Speech API** - Text-to-speech for word pronunciation
- **canvas-confetti** - Celebration animations
- **Plain CSS** - Colorful, child-friendly styling with animations

## Browser Compatibility

The game requires a modern browser with support for:
- Web Speech API (for text-to-speech)
- ES2020+ JavaScript features
- CSS animations

Recommended browsers: Chrome, Edge, Safari (latest versions)

## Future Language Support

The game architecture is designed to support multiple languages in the future. The word management system can be extended to include word lists for other languages beyond English.

## License

MIT
