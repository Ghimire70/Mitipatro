import { findTithiTransition } from './lib/astronomy/tithiTransitions.js';
import { getDailyPanchanga } from './lib/astronomy/panchanga.js';

const MODE = 'lahiri';

// Check if Shukla Shashthi (tithi 6) begins during Oct 27, 2025
const start = new Date(Date.UTC(2025, 9, 26, 12, 0, 0, 0)); // Oct 26 noon
const end = new Date(Date.UTC(2025, 9, 28, 12, 0, 0, 0));   // Oct 28 noon

try {
  const t = findTithiTransition(MODE, start, 6); // Find when tithi becomes 6 (Shashthi)
  if (t) {
    const kathmanduTime = new Date(t.utcInstant.getTime() + 5 * 3600 * 1000 + 45 * 60 * 1000);
    console.log('Shashthi transition:', kathmanduTime.toISOString(), kathmanduTime.toLocaleString());
    console.log('Is this on Oct 27?', kathmanduTime.getUTCDate() === 27 && kathmanduTime.getUTCMonth() === 9);
  } else {
    console.log('No Shukla Shashthi transition found in range');
  }
} catch (e) {
  console.log('Error:', e.message);
}

// Check what tithi is active at sunrise on Oct 27
const p27 = getDailyPanchanga(new Date(Date.UTC(2025, 9, 27, 12, 0, 0, 0)), MODE);
console.log('\nOct 27, 2025 sunrise tithi:', p27.tithi.name, p27.tithi.paksha, 'index:', p27.tithi.index, 'tithiNumber:', p27.tithi.tithiNumber);

const p28 = getDailyPanchanga(new Date(Date.UTC(2025, 9, 28, 12, 0, 0, 0)), MODE);
console.log('Oct 28, 2025 sunrise tithi:', p28.tithi.name, p28.tithi.paksha, 'index:', p28.tithi.index, 'tithiNumber:', p28.tithi.tithiNumber);