export function determineWinnerOnTie(blue, red) {
  // اولویت ۱: ضربات با ارزش‌تر
  const priorities = ['five', 'four', 'three', 'two'];
  for (const p of priorities) {
    if (blue.pointsBreakdown[p] > red.pointsBreakdown[p]) return 'BLUE';
    if (red.pointsBreakdown[p] > blue.pointsBreakdown[p]) return 'RED';
  }

  // اولویت ۲: جریمه کمتر
  if (blue.gamJeom < red.gamJeom) return 'BLUE';
  if (red.gamJeom < blue.gamJeom) return 'RED';

  // اگر هنوز مساوی بود
  return 'TIE';
}