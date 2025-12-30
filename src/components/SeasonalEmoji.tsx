interface SeasonalEmojiProps {
  date: Date;
  size?: 'small' | 'medium' | 'large';
}

const getSeason = (date: Date): 'spring' | 'summer' | 'fall' | 'winter' => {
  const month = date.getMonth(); // 0-indexed (0 = January)
  
  if (month >= 2 && month <= 4) return 'spring'; // March, April, May
  if (month >= 5 && month <= 7) return 'summer'; // June, July, August
  if (month >= 8 && month <= 10) return 'fall'; // September, October, November
  return 'winter'; // December, January, February
};

const seasonalEmojis = {
  spring: '🌸',
  summer: '🏖️',
  fall: '🍂',
  winter: '❄️',
};

export default function SeasonalEmoji({ date, size = 'medium' }: SeasonalEmojiProps) {
  const season = getSeason(date);
  const emoji = seasonalEmojis[season];
  
  const sizeClasses = {
    small: 'text-base',
    medium: 'text-xl',
    large: 'text-3xl',
  };

  return (
    <span 
      className={`inline-block ${sizeClasses[size]} seasonal-emoji seasonal-${season}`}
      title={season.charAt(0).toUpperCase() + season.slice(1)}
    >
      {emoji}
    </span>
  );
}

