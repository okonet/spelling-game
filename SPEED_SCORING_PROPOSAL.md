# Speed-Based Scoring System Proposals

## Current System

- **1st attempt**: 20 points
- **2nd attempt**: 10 points
- **3rd attempt**: 5 points
- **4+ attempts**: 2 points

No time-based rewards currently exist.

---

## Option 1: Speed Multiplier (Recommended)

**Keep base scoring, add speed multiplier**

### Scoring Formula

```
finalScore = baseScore × speedMultiplier
```

### Speed Tiers

- **Lightning Fast** (< 30% of time): 2.0× multiplier → Max 40 points
- **Fast** (30-50% of time): 1.5× multiplier → Max 30 points
- **Good** (50-70% of time): 1.25× multiplier → Max 25 points
- **Normal** (> 70% of time): 1.0× multiplier → Max 20 points

### Example

- First attempt, answered in 2 seconds (out of 5 second limit)
- Base score: 20 points
- Speed: 40% of time (Fast tier)
- Final score: 20 × 1.5 = **30 points**

### Pros

✅ Simple to understand
✅ Rewards both accuracy (attempts) and speed
✅ Doesn't punish slower players (still get base points)
✅ Clear visual feedback (can show multiplier)

### Cons

❌ Max score increases significantly (40 vs 20)

---

## Option 2: Speed Bonus Points

**Add flat bonus points for speed**

### Scoring Formula

```
finalScore = baseScore + speedBonus
```

### Speed Bonuses

- **Lightning Fast** (< 30% of time): +10 bonus
- **Fast** (30-50% of time): +5 bonus
- **Good** (50-70% of time): +2 bonus
- **Normal** (> 70% of time): +0 bonus

### Example

- First attempt, answered in 2 seconds
- Base score: 20 points
- Speed bonus: +5 points
- Final score: **25 points**

### Pros

✅ Very simple math
✅ Predictable max score (30 points)
✅ Easy to communicate to children

### Cons

❌ Less dramatic reward for speed
❌ Bonus feels small compared to base

---

## Option 3: Sliding Scale (Most Complex)

**Points decrease linearly as time passes**

### Scoring Formula

```
baseScore = attemptScore (20/10/5/2)
timeBonus = baseScore × (timeRemaining / totalTime)
finalScore = baseScore + timeBonus
```

### Example

- First attempt, 3 seconds remaining (out of 5)
- Base score: 20 points
- Time bonus: 20 × (3/5) = 12 points
- Final score: **32 points**

### Pros

✅ Most granular reward system
✅ Every second matters
✅ Perfectly smooth scaling

### Cons

❌ Complex for children to understand
❌ Harder to predict score
❌ Requires more calculation

---

## Option 4: Early Bird Bonus (Simplest)

**Bonus only for very fast responses**

### Scoring Formula

```
finalScore = baseScore + earlyBonus
```

### Early Bird Rule

- If answered in **first 50% of time**: +10 bonus
- Otherwise: +0 bonus

### Example

- First attempt, answered in 2 seconds (out of 5)
- Base score: 20 points
- Early bonus: +10 points (answered before 2.5 sec mark)
- Final score: **30 points**

### Pros

✅ Dead simple
✅ Clear goal ("answer in first half")
✅ Easy visual indicator (progress bar color)

### Cons

❌ Binary (either you get it or don't)
❌ No reward for "pretty fast" answers

---

## Option 5: Combo System (Gamified)

**Consecutive fast answers build a combo multiplier**

### Scoring Formula

```
finalScore = baseScore × comboMultiplier
comboMultiplier = 1.0 + (consecutiveFastAnswers × 0.2)
```

### Combo Building

- Answer fast (< 50% of time) → Combo +1
- Answer slow → Combo resets to 0
- Max combo: 5 (2.0× multiplier)

### Example Progress

1. Fast answer: 20 × 1.2 = **24 points** (Combo: 1)
2. Fast answer: 20 × 1.4 = **28 points** (Combo: 2)
3. Slow answer: 20 × 1.0 = **20 points** (Combo: 0)

### Pros

✅ Exciting and engaging
✅ Encourages consistency
✅ Visual combo counter is fun

### Cons

❌ Most complex to implement
❌ Can be frustrating when combo breaks
❌ Older words might be easier (unfair advantage)

---

## Recommendation: **Option 1 (Speed Multiplier)**

### Why?

1. **Child-friendly**: Easy to understand "2× SPEED BONUS!"
2. **Balanced**: Rewards speed without punishing slower learners
3. **Visual**: Can show sparkles/effects for multipliers
4. **Fair**: Time percentages scale with level difficulty
5. **Motivating**: Clear tiers to aim for

### Implementation Notes

- Show speed tier after answer (⚡ LIGHTNING FAST! 2× Bonus)
- Display multiplier with animation
- Use different confetti colors for different tiers
- Track "lightning fast" count in stats

### Visual Feedback

```
[Answer submitted]
  ↓
⚡ LIGHTNING FAST! ⚡
    2× BONUS
  20 → 40 points!
  ↓
[Jump animation]
  ↓
[Score increases]
```

---

## Additional Features (All Options)

### 1. Score Delay

- Don't update score number until **after** jump animation
- Show "+X" floating text during jump
- Increment score with animation when landing

### 2. Fast-Forward

- When Enter pressed, calculate remaining wait time
- Reduce wait by 50-75% (keep some animation for satisfaction)
- Jump happens faster but still visible

### 3. Visual Timer

- Show subtle progress bar under obstacle
- Color changes: Green → Yellow → Red
- Helps player gauge speed tier
