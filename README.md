# Spelling Game

A browser-based educational game designed to help children learn English spelling through interactive gameplay. The game uses text-to-speech technology to pronounce words, provides helpful hints, and tracks progress with scores and streaks.

## Features

- 🔊 **Text-to-Speech**: Click the "Play Word" button to hear the word pronounced
- 💡 **Helpful Hints**: Visual hints displayed for each word
- 📊 **Score Tracking**: Earn 10 points for each correct answer
- 🔥 **Streak Counter**: Track consecutive correct answers
- 📈 **Statistics**: Monitor correct and incorrect answers
- 🎨 **Clean UI**: Simple, child-friendly interface with plain CSS
- ⌨️ **Keyboard Support**: Press Enter to submit answers

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/okonet/spelling-game.git
   cd spelling-game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Game

#### Development Mode

Start the development server with hot module replacement:

```bash
npm run dev
```

Then open your browser and navigate to `http://localhost:5173/`

#### Production Build

Build the game for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## How to Play

1. **Listen**: Click the "🔊 Play Word" button to hear the word
2. **Read the Hint**: Look at the hint displayed below the button
3. **Type**: Enter your spelling in the text box
4. **Submit**: Click "Check" or press Enter
5. **Learn**: Get instant feedback on your answer
6. **Continue**: The game automatically moves to the next word after a correct answer

## Technology Stack

- **Vite**: Fast build tool and development server
- **TypeScript**: Type-safe JavaScript for better code quality
- **Plain CSS**: No CSS frameworks - pure, lightweight styling
- **Web Speech API**: Browser-native text-to-speech

## Project Structure

```
spelling-game/
├── index.html          # Main HTML file
├── src/
│   ├── main.ts         # Game logic and TypeScript code
│   └── style.css       # All styling
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md          # This file
```

## Customization

### Adding More Words

Edit the `wordList` array in `src/main.ts` to add more words:

```typescript
const wordList: { word: string; hint: string }[] = [
  { word: 'example', hint: 'A sample or illustration' },
  // Add your words here...
];
```

### Styling

Modify `src/style.css` to customize colors, fonts, and layout.

## Browser Compatibility

This game works best in modern browsers that support:
- ES2020 JavaScript features
- Web Speech API (for text-to-speech)
- CSS Grid and Flexbox

Recommended browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Future Enhancements

- Support for multiple languages
- Difficulty levels
- More word categories
- User profiles and saved progress
- Sound effects
- Animations

## License

See the [LICENSE](LICENSE) file for details.