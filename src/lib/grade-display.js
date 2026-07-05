// Formats a numeric grade for display according to the user's Number Display
// setting. Mirrors the mobile app's lib/grade-display.ts so both platforms show
// grades identically.

export function formatGrade(grade, displayMode = 'decimal') {
  if (grade === null || grade === undefined || grade === '') {
    return '···';
  }

  const numeric = parseFloat(String(grade));
  if (isNaN(numeric)) {
    return String(grade);
  }

  switch (displayMode) {
    case 'decimal':
      return numeric.toPrecision(4);
    case 'rounded':
      return Math.round(numeric).toString();
    case 'letter':
      return numericToLetter(numeric);
    case 'letter+':
      return numericToLetterPlus(numeric);
    default:
      return numeric.toPrecision(4);
  }
}

function numericToLetter(numeric) {
  if (numeric >= 90) return 'A';
  if (numeric >= 80) return 'B';
  if (numeric >= 70) return 'C';
  if (numeric >= 60) return 'D';
  return 'F';
}

function numericToLetterPlus(numeric) {
  if (numeric >= 97) return 'A+';
  if (numeric >= 93) return 'A';
  if (numeric >= 90) return 'A-';
  if (numeric >= 87) return 'B+';
  if (numeric >= 83) return 'B';
  if (numeric >= 80) return 'B-';
  if (numeric >= 77) return 'C+';
  if (numeric >= 73) return 'C';
  if (numeric >= 70) return 'C-';
  if (numeric >= 67) return 'D+';
  if (numeric >= 63) return 'D';
  if (numeric >= 60) return 'D-';
  return 'F';
}
