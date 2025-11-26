import './styles.css';
import { SpellingGame } from './game';
import { inject } from '@vercel/analytics';

// Initialize Vercel Analytics
inject();

// Initialize the game when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const game = new SpellingGame();
  await game.initialize();

  console.log('Spelling Game initialized and ready to play!');
});
