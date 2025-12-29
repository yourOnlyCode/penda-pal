# Penda Matching Algorithm

## Overview

Penda uses an interest-based compatibility scoring system to create meaningful penpal connections.

## Matching Rules

### 1. Age Appropriateness (Hard Constraint)
- Minors (< 18) ONLY match with minors
- Adults (≥ 18) ONLY match with adults
- Enforced at database and algorithm level
- No exceptions

### 2. Interest Compatibility (Primary Factor)
- Calculates compatibility score for all waitlist candidates
- Matches with person who has highest shared interests
- Score formula: `shared_interests / average_interest_count`

## Algorithm Flow

```
1. User completes onboarding with interests
2. System queries waitlist for same age group (isMinor)
3. Calculates compatibility score with EVERY candidate
4. Selects candidate with highest score
5. Creates penpal relationship
6. Removes both users from waitlist
```

If no candidates available:
- User added to waitlist
- Matched when next compatible person joins

## Compatibility Calculation

```typescript
function calculateCompatibility(userInterests, candidateInterests) {
  // Find shared interests (case-insensitive)
  sharedCount = intersection(userInterests, candidateInterests).length
  
  // Average interest count
  avgCount = (userInterests.length + candidateInterests.length) / 2
  
  // Compatibility score (0.0 to 1.0)
  return sharedCount / avgCount
}
```

## Examples

### Example 1: Perfect Match
```
User A: [gaming, anime, coding]
User B: [gaming, anime, coding]

Shared: 3
Average: 3
Score: 3/3 = 1.0 (100% match)
```

### Example 2: Partial Match
```
User A: [gaming, anime, coding, music]
User B: [gaming, anime, movies, art]

Shared: 2 (gaming, anime)
Average: 4
Score: 2/4 = 0.5 (50% match)
```

### Example 3: No Match
```
User A: [gaming, esports]
User B: [cooking, baking]

Shared: 0
Average: 2
Score: 0/2 = 0.0 (0% match)
```

## Real-World Scenario

**Waitlist:**
- User A (adult): [gaming, esports, streaming]
- User B (adult): [cooking, baking, recipes]
- User C (adult): [anime, manga, cosplay]
- User D (minor): [gaming, anime, movies]

**New User E joins (adult): [gaming, anime, movies]**

**Compatibility Scores:**
- E vs A: 1/3 = 0.33 (gaming)
- E vs B: 0/3 = 0.00 (no shared interests)
- E vs C: 2/3 = 0.67 (anime, manga)
- E vs D: Age mismatch - SKIP

**Result:** E matches with C (highest score: 0.67)

## Edge Cases

### Empty Interests
- If user has no interests: score = 0 with everyone
- Still matches (random from age group)
- Encourages users to add interests

### Tie Scores
- Multiple candidates with same score
- First candidate in list selected
- Future: Add secondary factors (location, join time)

### Single Candidate
- Only one person in waitlist
- Automatic match (no calculation needed)
- Even if score is 0

## Future Enhancements

- **Language preference** - Match by spoken languages
- **Time zone** - Match by active hours
- **Activity level** - Match frequent users together
- **Personality quiz** - Deeper compatibility
- **Manual preferences** - Let users set filters
