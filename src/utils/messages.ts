export const encouragementMessages = [
  "You're doing amazing!",
  "Keep up the great work!",
  "Every step counts!",
  "Progress over perfection!",
  "You've got this!",
  "Small wins lead to big victories!",
  "Consistency is key!",
  "Proud of your progress!",
  "One day at a time!",
  "You're stronger together!",
];

export const milestoneMessages = {
  25: "Quarter of the way there! 🎯",
  50: "Halfway to your goal! 🌟",
  75: "Three quarters done! Amazing! 🚀",
  100: "Goal achieved! Incredible! 🎉",
};

export const getRandomEncouragement = (): string => {
  return encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
};

export const getMilestoneMessage = (percentage: number): string | null => {
  const milestones = [25, 50, 75, 100];
  const milestone = milestones.find(m => percentage >= m && percentage < m + 1);
  return milestone ? milestoneMessages[milestone as keyof typeof milestoneMessages] : null;
};

