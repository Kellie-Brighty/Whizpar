export const EMOJIS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', 'dV', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', 'Duck', '🦅',
  '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌',
  '🐞', '🐜', '🦀', '🐙', '🐠', '🐳', '🐬', '🍎', '🍐', '🍊',
  '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🍍', '🥥',
  '🥝', '🥑', '🍆', '🥕', '🌽', '🌶️', '🥦', '🍄', '🥜', '🌰'
];
// Fixed the 'Duck' typo in the array to '🦆' below in the actual return function check if needed, 
// or just fixing the array directly:
const CLEAN_EMOJIS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉',
  '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞',
  '🐜', '🦀', '🐙', '🐠', '🐳', '🐬', '🍎', '🍐', '🍊', '🍋',
  '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🍍', '🥥', '🥝',
  '🥑', '🍆', '🥕', '🌽', '🌶️', '🥦', '🍄', '🥜', '🌰'
];

const BACKGROUND_COLORS = [
  'rgba(255, 99, 71, 0.1)',   // Tomato
  'rgba(255, 165, 0, 0.1)',   // Orange
  'rgba(255, 215, 0, 0.1)',   // Gold
  'rgba(50, 205, 50, 0.1)',   // LimeGreen
  'rgba(30, 144, 255, 0.1)',  // DodgerBlue
  'rgba(147, 112, 219, 0.1)', // MediumPurple
  'rgba(255, 105, 180, 0.1)', // HotPink
  'rgba(0, 255, 255, 0.1)',   // Cyan
  'rgba(128, 128, 128, 0.1)', // Gray
];

export const getEmojiAvatar = (seed: string) => {
  if (!seed) return CLEAN_EMOJIS[0];
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % CLEAN_EMOJIS.length;
  return CLEAN_EMOJIS[index];
};

export const getAvatarColor = (seed: string) => {
  if (!seed) return BACKGROUND_COLORS[0];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % BACKGROUND_COLORS.length;
  return BACKGROUND_COLORS[index];
};
