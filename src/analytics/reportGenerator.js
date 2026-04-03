export function categorizePerformance(summary) {
  const { averageFocus, distractionFrequency, bestStreak, duration } = summary;
  
  // Category thresholds
  const focusThreshold = {
    gamma: 85,
    delta: 75,
    beta: 55,
    alpha: 0,
  };

  const distractionThreshold = {
    gamma: 0.05,
    delta: 0.1,
    beta: 0.2,
    alpha: 1,
  };

  // Scoring logic
  let score = 0;

  // Focus score component (40%)
  if (averageFocus >= focusThreshold.gamma) score += 40;
  else if (averageFocus >= focusThreshold.delta) score += 30;
  else if (averageFocus >= focusThreshold.beta) score += 20;
  else score += 10;

  // Distraction component (35%)
  if (distractionFrequency <= distractionThreshold.gamma) score += 35;
  else if (distractionFrequency <= distractionThreshold.delta) score += 28;
  else if (distractionFrequency <= distractionThreshold.beta) score += 18;
  else score += 8;

  // Consistency component (25%)
  if (bestStreak >= duration * 0.8) score += 25;
  else if (bestStreak >= duration * 0.6) score += 20;
  else if (bestStreak >= duration * 0.4) score += 12;
  else score += 5;

  // Assign category
  let category, label;
  if (score >= 85) {
    category = 'Gamma';
    label = 'gamma';
  } else if (score >= 70) {
    category = 'Delta';
    label = 'delta';
  } else if (score >= 50) {
    category = 'Beta';
    label = 'beta';
  } else {
    category = 'Alpha';
    label = 'alpha';
  }

  return {
    category,
    label,
    score,
    criteria: generateCriteria(averageFocus, distractionFrequency, bestStreak, duration),
    categoryDetails: getCategoryDetails(label),
  };
}

function generateCriteria(avgFocus, distractionFreq, bestStreak, duration) {
  const criteria = [];

  criteria.push({
    name: 'Average Focus Score',
    value: `${Math.round(avgFocus)}%`,
    threshold: `Target: 75%+`,
    met: avgFocus >= 75,
  });

  criteria.push({
    name: 'Distraction Frequency',
    value: `${(distractionFreq * 100).toFixed(2)}/min`,
    threshold: `Target: <0.1/min`,
    met: distractionFreq < 0.1,
  });

  const streakPercent = ((bestStreak / Math.max(1, duration)) * 100).toFixed(0);
  criteria.push({
    name: 'Consistency (Best Streak)',
    value: `${streakPercent}% of session`,
    threshold: `Target: >80%`,
    met: parseFloat(streakPercent) > 80,
  });

  criteria.push({
    name: 'Session Duration',
    value: `${Math.floor(duration)}s`,
    threshold: `Valid: >30s`,
    met: duration >= 30,
  });

  return criteria;
}

function getCategoryDetails(label) {
  const details = {
    gamma: {
      name: 'Gamma — Exceptional',
      description: 'Peak performance focus with mastery-level discipline.',
      requirements: [
        'Average Focus: 85%+',
        'Distractions: <3 per minute',
        'Consistency: >80% of session',
        'Focus Stability: Unwavering attention control',
      ],
    },
    delta: {
      name: 'Delta — Strong',
      description: 'Excellent focus management with minimal interruptions.',
      requirements: [
        'Average Focus: 75-84%',
        'Distractions: 3-6 per minute',
        'Consistency: 60-79% of session',
        'Focus Stability: Good attention control with occasional minor dips',
      ],
    },
    beta: {
      name: 'Beta — Good',
      description: 'Solid focus with moderate distractions managed well.',
      requirements: [
        'Average Focus: 55-74%',
        'Distractions: 6-12 per minute',
        'Consistency: 40-59% of session',
        'Focus Stability: Fair attention with regular recovery',
      ],
    },
    alpha: {
      name: 'Alpha — Building',
      description: 'Early-stage focus development with learning opportunity.',
      requirements: [
        'Average Focus: <55%',
        'Distractions: >12 per minute',
        'Consistency: <40% of session',
        'Focus Stability: Frequent interruptions; practice increases control',
      ],
    },
  };

  return details[label] || details.alpha;
}

export function generateInsight(category, summary) {
  const { averageFocus, distractions, bestStreak, duration } = summary;

  const insights = {
    Gamma: [
      'Outstanding session! You maintained exceptional focus throughout. Your discipline and consistency are exemplary.',
      'Peak performance achieved. You demonstrate mastery-level focus with minimal distractions.',
    ],
    Delta: [
      'Excellent work with strong focus. You showed good control despite minor distraction events.',
      'Solid performance. Your focus management is above average with room for minimal optimization.',
    ],
    Beta: [
      'Good effort. You maintained moderate focus with some distraction management needed.',
      'Decent session. Consider strategies to reduce distraction frequency for next time.',
    ],
    Alpha: [
      'You showed early-stage focus with frequent distractions. Keep practicing focus techniques.',
      'Challenge accepted. Each session builds better focus habits. Try again!',
    ],
  };

  const categoryInsights = insights[category] || insights.Alpha;
  return categoryInsights[Math.floor(Math.random() * categoryInsights.length)];
}
