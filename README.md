# Spelling Game

A browser-based educational game designed to help children learn English spelling through interactive gameplay, time pressure, and progressive difficulty.

## Game Concept

The game presents an engaging way to practice spelling with time-based challenges:

1. A word is spoken aloud using text-to-speech
2. An obstacle showing the word appears and starts moving toward the character
3. The player must type the word correctly **before the obstacle reaches the character**
4. **Correct spelling in time**: The character jumps over the obstacle, the player earns points and sees a confetti celebration
5. **Incorrect spelling or timeout**: The character crashes, loses a life, and the correct spelling is shown
6. The game continues until all 3 lives are lost

## Progressive Difficulty System

The game features an **automatic level progression system**:

- **Start at Level 1** with easy words and 5 seconds per word
- **Level up every 5 correct words** with celebration effects
- **Speed increases** with each level (decreases by 300ms per level, minimum 2 seconds)
- **Word difficulty increases** automatically:
  - **Levels 1-3**: Easy words (3-4 letters)
  - **Levels 4-6**: Medium words (5-6 letters)
  - **Levels 7+**: Hard words (longer, complex words)

## Features

- **Level progression**: Automatic difficulty increase as you improve
- **Time pressure**: Beat the clock to spell each word correctly
- **Text-to-Speech**: Words are spoken aloud using the browser's Web Speech API with optimized clarity (rate: 0.6 for children)
- **Continuous runner animation**: Character runs in place while obstacles approach from the right
- **Life system**: Start with 3 lives (❤️), lose one for each mistake or timeout (shown as 🖤)
- **Dynamic scoring**: Earn more points for fewer attempts (20/10/5/2 points)
- **Level-up celebrations**: Cinematic effects with confetti and triumphant sound when reaching a new level
- **Session tracking**: Track performance with player name, level progression, and detailed word-by-word results
- **Statistics page**: View past game sessions, filter by player, and analyze progress
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
│   ├── main.ts           # Application entry point
│   ├── game.ts           # Core game logic, level system, and timing
│   ├── audio.ts          # Web Speech API wrapper
│   ├── words.ts          # Word management by difficulty
│   ├── sessionManager.ts # Player session tracking and localStorage
│   ├── stats.ts          # Statistics page logic
│   ├── types.ts          # TypeScript type definitions
│   ├── styles.css        # Game styling and animations
│   └── statsStyles.css   # Statistics page styling
├── public/
│   └── words.json        # Custom word list (optional)
├── index.html            # Main game HTML structure
├── stats.html            # Statistics page HTML
├── vite.config.ts        # Vite configuration
└── tsconfig.json         # TypeScript configuration
```

## Game Mechanics Details

### Timing System

The time available to spell each word decreases as you progress:
- **Level 1**: 5000ms (5 seconds)
- **Level 2**: 4700ms (4.7 seconds)
- **Level 3**: 4400ms (4.4 seconds)
- And so on... minimum 2000ms (2 seconds) at higher levels

### Scoring System

Points are awarded based on the number of attempts:
- **First attempt**: 20 points
- **Second attempt**: 10 points
- **Third attempt**: 5 points
- **More attempts**: 2 points per word
- **Timeout**: 0 points and lose a life

### Session Tracking

All game sessions are saved to localStorage and include:
- Player name and timestamp
- Level progression during the session
- Score and lives remaining
- Complete word-by-word breakdown with:
  - Each spelling attempt
  - Time taken per word
  - Whether the word timed out
  - Level when the word was played

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
