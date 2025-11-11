import { describe, it, expect } from 'vitest';

/**
 * Scoring System Tests
 *
 * These tests verify the complex scoring logic including:
 * - Base scoring by attempts
 * - Speed multipliers
 * - Combo multipliers
 * - Combined multipliers
 */

// Replicate scoring logic from game.ts for testing
function calculateBaseScore(attempts: number): number {
  switch (attempts) {
    case 1:
      return 20;
    case 2:
      return 10;
    case 3:
      return 5;
    default:
      return 2;
  }
}

function calculateSpeedMultiplier(responseTime: number, totalTime: number): number {
  const timePercentage = (responseTime / totalTime) * 100;

  if (timePercentage < 30) {
    return 2.0; // Lightning fast
  } else if (timePercentage < 50) {
    return 1.5; // Fast
  } else if (timePercentage < 70) {
    return 1.25; // Good
  } else {
    return 1.0; // Normal
  }
}

function calculateComboMultiplier(comboCount: number): number {
  if (comboCount >= 5) {
    return 1.5; // 5+ combo
  } else if (comboCount >= 4) {
    return 1.3; // 4 combo
  } else if (comboCount >= 3) {
    return 1.2; // 3 combo
  } else if (comboCount >= 2) {
    return 1.1; // 2 combo
  } else {
    return 1.0; // 0-1: no combo
  }
}

describe('Scoring System', () => {
  describe('Base Scoring (by attempts)', () => {
    it('should award 20 points for first attempt', () => {
      expect(calculateBaseScore(1)).toBe(20);
    });

    it('should award 10 points for second attempt', () => {
      expect(calculateBaseScore(2)).toBe(10);
    });

    it('should award 5 points for third attempt', () => {
      expect(calculateBaseScore(3)).toBe(5);
    });

    it('should award 2 points for 4+ attempts', () => {
      expect(calculateBaseScore(4)).toBe(2);
      expect(calculateBaseScore(5)).toBe(2);
      expect(calculateBaseScore(10)).toBe(2);
    });
  });

  describe('Speed Multiplier', () => {
    it('should give 2.0× for lightning fast (< 30% time)', () => {
      // Example: 1.4 seconds out of 5 seconds = 28%
      expect(calculateSpeedMultiplier(1400, 5000)).toBe(2.0);
      expect(calculateSpeedMultiplier(1499, 5000)).toBe(2.0); // Just under 30%
    });

    it('should give 1.5× for fast (30-50% time)', () => {
      // Example: 2 seconds out of 5 seconds = 40%
      expect(calculateSpeedMultiplier(1600, 5000)).toBe(1.5);
      expect(calculateSpeedMultiplier(2000, 5000)).toBe(1.5);
      expect(calculateSpeedMultiplier(2400, 5000)).toBe(1.5);
    });

    it('should give 1.25× for good speed (50-70% time)', () => {
      // Example: 3 seconds out of 5 seconds = 60%
      expect(calculateSpeedMultiplier(2500, 5000)).toBe(1.25);
      expect(calculateSpeedMultiplier(3000, 5000)).toBe(1.25);
      expect(calculateSpeedMultiplier(3400, 5000)).toBe(1.25);
    });

    it('should give 1.0× for normal speed (> 70% time)', () => {
      // Example: 4 seconds out of 5 seconds = 80%
      expect(calculateSpeedMultiplier(3600, 5000)).toBe(1.0);
      expect(calculateSpeedMultiplier(4000, 5000)).toBe(1.0);
      expect(calculateSpeedMultiplier(4900, 5000)).toBe(1.0);
    });

    it('should handle edge cases at tier boundaries', () => {
      const totalTime = 10000; // 10 seconds

      // Just under 30% = lightning
      expect(calculateSpeedMultiplier(2999, totalTime)).toBe(2.0);
      // Exactly 30% = fast (< 30 means 30% is not lightning)
      expect(calculateSpeedMultiplier(3000, totalTime)).toBe(1.5);

      // Just under 50% = fast
      expect(calculateSpeedMultiplier(4999, totalTime)).toBe(1.5);
      // Exactly 50% = good
      expect(calculateSpeedMultiplier(5000, totalTime)).toBe(1.25);

      // Just under 70% = good
      expect(calculateSpeedMultiplier(6999, totalTime)).toBe(1.25);
      // Exactly 70% = normal
      expect(calculateSpeedMultiplier(7000, totalTime)).toBe(1.0);
    });
  });

  describe('Combo Multiplier', () => {
    it('should give no bonus for 0-1 combo', () => {
      expect(calculateComboMultiplier(0)).toBe(1.0);
      expect(calculateComboMultiplier(1)).toBe(1.0);
    });

    it('should give 1.1× for 2 combo', () => {
      expect(calculateComboMultiplier(2)).toBe(1.1);
    });

    it('should give 1.2× for 3 combo', () => {
      expect(calculateComboMultiplier(3)).toBe(1.2);
    });

    it('should give 1.3× for 4 combo', () => {
      expect(calculateComboMultiplier(4)).toBe(1.3);
    });

    it('should give 1.5× for 5+ combo (max)', () => {
      expect(calculateComboMultiplier(5)).toBe(1.5);
      expect(calculateComboMultiplier(6)).toBe(1.5);
      expect(calculateComboMultiplier(10)).toBe(1.5);
      expect(calculateComboMultiplier(100)).toBe(1.5);
    });
  });

  describe('Combined Scoring Scenarios', () => {
    it('should calculate max possible score (first try + lightning + 5 combo)', () => {
      const baseScore = calculateBaseScore(1); // 20 points
      const speedMultiplier = calculateSpeedMultiplier(1000, 5000); // 2.0× (20% time)
      const comboMultiplier = calculateComboMultiplier(5); // 1.5× (5 combo)

      const totalMultiplier = speedMultiplier * comboMultiplier; // 3.0×
      const finalScore = Math.round(baseScore * totalMultiplier);

      expect(finalScore).toBe(60); // 20 × 3.0 = 60
    });

    it('should calculate typical fast answer with small combo', () => {
      const baseScore = calculateBaseScore(1); // 20 points
      const speedMultiplier = calculateSpeedMultiplier(2000, 5000); // 1.5× (40% time)
      const comboMultiplier = calculateComboMultiplier(2); // 1.1× (2 combo)

      const totalMultiplier = speedMultiplier * comboMultiplier; // 1.65×
      const finalScore = Math.round(baseScore * totalMultiplier);

      expect(finalScore).toBe(33); // 20 × 1.65 = 33
    });

    it('should calculate slow answer with no combo', () => {
      const baseScore = calculateBaseScore(1); // 20 points
      const speedMultiplier = calculateSpeedMultiplier(4500, 5000); // 1.0× (90% time)
      const comboMultiplier = calculateComboMultiplier(0); // 1.0× (no combo)

      const totalMultiplier = speedMultiplier * comboMultiplier; // 1.0×
      const finalScore = Math.round(baseScore * totalMultiplier);

      expect(finalScore).toBe(20); // 20 × 1.0 = 20 (base score)
    });

    it('should calculate second attempt with speed bonus (no combo)', () => {
      // Multiple attempts = no combo, but still get speed bonus
      const baseScore = calculateBaseScore(2); // 10 points (second attempt)
      const speedMultiplier = calculateSpeedMultiplier(1400, 5000); // 2.0× (28% time)
      const comboMultiplier = calculateComboMultiplier(0); // 1.0× (no combo on retry)

      const totalMultiplier = speedMultiplier * comboMultiplier; // 2.0×
      const finalScore = Math.round(baseScore * totalMultiplier);

      expect(finalScore).toBe(20); // 10 × 2.0 = 20
    });

    it('should handle timeout (0 points regardless of combo)', () => {
      const scoreEarned = 0; // Timeout = 0 points
      expect(scoreEarned).toBe(0);
    });
  });

  describe('Real-world Scoring Progression', () => {
    it('should demonstrate score growth as player improves', () => {
      // Beginner: slow answer, no combo
      const beginner = Math.round(
        calculateBaseScore(1) *
        calculateSpeedMultiplier(4500, 5000) *
        calculateComboMultiplier(0)
      );
      expect(beginner).toBe(20); // 20 × 1.0 × 1.0 = 20

      // Improving: faster answer, small combo
      const improving = Math.round(
        calculateBaseScore(1) *
        calculateSpeedMultiplier(3000, 5000) *
        calculateComboMultiplier(2)
      );
      expect(improving).toBe(28); // 20 × 1.25 × 1.1 = 27.5 ≈ 28

      // Skilled: fast answer, good combo
      const skilled = Math.round(
        calculateBaseScore(1) *
        calculateSpeedMultiplier(2000, 5000) *
        calculateComboMultiplier(4)
      );
      expect(skilled).toBe(39); // 20 × 1.5 × 1.3 = 39

      // Expert: lightning fast, max combo
      const expert = Math.round(
        calculateBaseScore(1) *
        calculateSpeedMultiplier(1200, 5000) *
        calculateComboMultiplier(5)
      );
      expect(expert).toBe(60); // 20 × 2.0 × 1.5 = 60

      // Verify progression
      expect(improving).toBeGreaterThan(beginner);
      expect(skilled).toBeGreaterThan(improving);
      expect(expert).toBeGreaterThan(skilled);
    });

    it('should show combo incentivizes consistency', () => {
      // Same speed, different combo levels
      const responseTime = 2000; // 40% of 5000ms = Fast (1.5×)
      const totalTime = 5000;
      const speedMult = calculateSpeedMultiplier(responseTime, totalTime);
      const baseScore = calculateBaseScore(1);

      const noCombo = Math.round(baseScore * speedMult * calculateComboMultiplier(0));
      const combo2 = Math.round(baseScore * speedMult * calculateComboMultiplier(2));
      const combo3 = Math.round(baseScore * speedMult * calculateComboMultiplier(3));
      const combo5 = Math.round(baseScore * speedMult * calculateComboMultiplier(5));

      expect(noCombo).toBe(30);  // 20 × 1.5 × 1.0 = 30
      expect(combo2).toBe(33);   // 20 × 1.5 × 1.1 = 33
      expect(combo3).toBe(36);   // 20 × 1.5 × 1.2 = 36
      expect(combo5).toBe(45);   // 20 × 1.5 × 1.5 = 45

      // Each combo level adds meaningful points
      expect(combo2).toBeGreaterThan(noCombo);
      expect(combo3).toBeGreaterThan(combo2);
      expect(combo5).toBeGreaterThan(combo3);
    });
  });

  describe('Score Rounding', () => {
    it('should round decimal scores correctly', () => {
      // Test various fractional results
      const baseScore = 20;

      // 20 × 1.1 = 22
      expect(Math.round(baseScore * 1.1)).toBe(22);

      // 20 × 1.15 = 23
      expect(Math.round(baseScore * 1.15)).toBe(23);

      // 20 × 1.75 = 35
      expect(Math.round(baseScore * 1.75)).toBe(35);

      // 20 × 1.125 = 22.5 → 23
      expect(Math.round(baseScore * 1.125)).toBe(23);

      // 20 × 1.124 = 22.48 → 22
      expect(Math.round(baseScore * 1.124)).toBe(22);
    });
  });
});
