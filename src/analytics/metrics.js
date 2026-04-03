export const getFocusLevelDescription = (score) => {
  if (score >= 80) return 'Deep Focus';
  if (score >= 55) return 'Sustained Attention';
  if (score >= 35) return 'Light Focus';
  return 'Distracted';
};

export const getFocusMode = (score) => {
  if (score >= 80) return 'Deep Work';
  if (score >= 60) return 'Study';
  return 'Relax';
};

export const normalize = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
