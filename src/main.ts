import './styles.css';
import { SpellingGame } from './game';

// Initialize the game when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const game = new SpellingGame();
  await game.initialize();

  console.log('Spelling Game initialized and ready to play!');
});
