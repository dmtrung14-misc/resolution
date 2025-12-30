export const celebrateTaskCompletion = (completedBy: 'doggo' | 'ducko') => {
  // Create profile pic in center
  const profilePic = document.createElement('div');
  profilePic.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    width: 200px;
    height: 200px;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
    padding: 20px;
  `;
  
  // Add keyframe animation
  if (!document.getElementById('celebration-styles')) {
    const style = document.createElement('style');
    style.id = 'celebration-styles';
    style.textContent = `
      @keyframes popIn {
        0% { transform: translate(-50%, -50%) scale(0); }
        100% { transform: translate(-50%, -50%) scale(1); }
      }
      
      @keyframes popOut {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
      }
      
      @keyframes fallDown {
        0% { 
          top: -100px;
          opacity: 1;
        }
        100% { 
          top: calc(100vh + 100px);
          opacity: 0.8;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Set the main profile emoji using Noto Emoji Animation
  const picture = document.createElement('picture');
  const source = document.createElement('source');
  const img = document.createElement('img');
  
  if (completedBy === 'doggo') {
    source.srcset = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f415/512.webp';
    source.type = 'image/webp';
    img.src = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f415/512.gif';
    img.alt = '🐕';
  } else {
    source.srcset = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f425/512.webp';
    source.type = 'image/webp';
    img.src = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f425/512.gif';
    img.alt = '🐥';
  }
  
  img.style.cssText = 'width: 160px; height: 160px;';
  picture.appendChild(source);
  picture.appendChild(img);
  profilePic.appendChild(picture);
  
  document.body.appendChild(profilePic);
  
  // Create RAINING emojis - DUCK/DOG RAIN!
  const rainingEmoji = completedBy === 'doggo' ? '🦆' : '🐕';
  const numberOfDucks = 100; // 100 ducks raining down!
  const fallers: HTMLDivElement[] = [];
  
  const screenWidth = window.innerWidth;
  
  for (let i = 0; i < numberOfDucks; i++) {
    const duck = document.createElement('div');
    
    // Random horizontal position across the screen
    const xPosition = Math.random() * screenWidth;
    
    // Random delay so they don't all start at once
    const delay = Math.random() * 2;
    
    // Random duration for variety (2-4 seconds to fall)
    const duration = 2 + Math.random() * 2;
    
    // Random size for depth effect
    const size = 40 + Math.random() * 30;
    
    duck.style.cssText = `
      position: fixed;
      left: ${xPosition}px;
      top: -100px;
      font-size: ${size}px;
      z-index: 9999;
      animation: fallDown ${duration}s ease-in ${delay}s forwards;
      pointer-events: none;
      line-height: 1;
    `;
    
    duck.textContent = rainingEmoji;
    document.body.appendChild(duck);
    fallers.push(duck);
  }
  
  // Remove profile pic after animation
  setTimeout(() => {
    profilePic.style.animation = 'popOut 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';
    setTimeout(() => {
      profilePic.remove();
    }, 300);
  }, 2500);
  
  // Remove fallers after they finish
  setTimeout(() => {
    fallers.forEach(faller => faller.remove());
  }, 5000);
};

export const celebrateTaskCreation = (deadline: Date, tags?: string[]) => {
  // Tag-to-emoji mapping
  const tagEmojiMap: { [key: string]: string[] } = {
    // Food related (randomly choose one)
    'food': ['1f35c', '1f32f', '1f35d'], // 🍜 🌯 🍝
    'restaurant': ['1f35c', '1f32f', '1f35d'],
    'dining': ['1f35c', '1f32f', '1f35d'],
    'eating': ['1f35c', '1f32f', '1f35d'],
    'lunch': ['1f35c', '1f32f', '1f35d'],
    'dinner': ['1f35c', '1f32f', '1f35d'],
    'brunch': ['1f35c', '1f32f', '1f35d'],
    'meal': ['1f35c', '1f32f', '1f35d'],
    
    // Cooking
    'cooking': ['1f373'], // 🍳
    'cook': ['1f373'],
    'recipe': ['1f373'],
    'baking': ['1f373'],
    'kitchen': ['1f373'],
    
    // Movie nights
    'movie': ['1f37f'], // 🍿
    'film': ['1f37f'],
    'cinema': ['1f37f'],
    'watching': ['1f37f'],
    'netflix': ['1f37f'],
    'show': ['1f37f'],
    'series': ['1f37f'],
    
    // Travel
    'travel': ['1f3d5_fe0f'], // 🏕
    'trip': ['1f3d5_fe0f'],
    'vacation': ['1f3d5_fe0f'],
    'holiday': ['1f3d5_fe0f'],
    'adventure': ['1f3d5_fe0f'],
    'camping': ['1f3d5_fe0f'],
    'hiking': ['1f3d5_fe0f'],
    'explore': ['1f3d5_fe0f'],
    
    // Study
    'study': ['270d_1f3fc'], // ✍
    'studying': ['270d_1f3fc'],
    'learning': ['270d_1f3fc'],
    'education': ['270d_1f3fc'],
    'homework': ['270d_1f3fc'],
    'exam': ['270d_1f3fc'],
    'reading': ['270d_1f3fc'],
    'book': ['270d_1f3fc'],
    'research': ['270d_1f3fc'],
    
    // Photo
    'photo': ['1f4f8'], // 📸
    'photography': ['1f4f8'],
    'camera': ['1f4f8'],
    'picture': ['1f4f8'],
    'photoshoot': ['1f4f8'],
    
    // Career
    'career': ['1f4b8'], // 💸
    'work': ['1f4b8'],
    'job': ['1f4b8'],
    'interview': ['1f4b8'],
    'business': ['1f4b8'],
    'professional': ['1f4b8'],
    'meeting': ['1f4b8'],
    
    // Art/Music
    'art': ['1f3bb'], // 🎻
    'piano': ['1f3bb'],
    'violin': ['1f3bb'],
    'duet': ['1f3bb'],
    'music': ['1f3bb'],
    'instrument': ['1f3bb'],
    'practice': ['1f3bb'],
    'concert': ['1f3bb'],
    'performance': ['1f3bb'],
  };
  
  let emojiCode: string | null = null;
  
  // Check tags first (case-insensitive)
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      const lowerTag = tag.toLowerCase();
      if (tagEmojiMap[lowerTag]) {
        const options = tagEmojiMap[lowerTag];
        // Randomly select if multiple options
        emojiCode = options[Math.floor(Math.random() * options.length)];
        break; // Stop at first match
      }
    }
  }
  
  // Fall back to season if no tag match
  if (!emojiCode) {
    const month = deadline.getMonth();
    
    if (month >= 2 && month <= 4) {
      emojiCode = '1f331'; // 🌱 Seedling
    } else if (month >= 5 && month <= 7) {
      emojiCode = '26f5'; // ⛵ Sailboat
    } else if (month >= 8 && month <= 10) {
      emojiCode = '1f342'; // 🍂 Fallen Leaf
    } else {
      emojiCode = '2744'; // ❄️ Snowflake
    }
  }
  
  // Add keyframe animation if not exists
  if (!document.getElementById('celebration-styles')) {
    const style = document.createElement('style');
    style.id = 'celebration-styles';
    style.textContent = `
      @keyframes popIn {
        0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); }
        50% { transform: translate(-50%, -50%) scale(1.2) rotate(10deg); }
        100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
      }
      
      @keyframes popOut {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Create celebration - just the emoji, no background
  const celebration = document.createElement('div');
  celebration.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    z-index: 10000;
    animation: popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
    filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3));
  `;
  
  // Create the animated emoji using Noto Emoji
  const picture = document.createElement('picture');
  const source = document.createElement('source');
  const img = document.createElement('img');
  
  source.srcset = `https://fonts.gstatic.com/s/e/notoemoji/latest/${emojiCode}/512.webp`;
  source.type = 'image/webp';
  img.src = `https://fonts.gstatic.com/s/e/notoemoji/latest/${emojiCode}/512.gif`;
  img.style.cssText = 'width: 150px; height: 150px;';
  
  picture.appendChild(source);
  picture.appendChild(img);
  celebration.appendChild(picture);
  document.body.appendChild(celebration);
  
  // Create some sparkles
  const sparkleCount = 12;
  const sparkles: HTMLDivElement[] = [];
  
  for (let i = 0; i < sparkleCount; i++) {
    const sparkle = document.createElement('div');
    const angle = (i / sparkleCount) * Math.PI * 2;
    const distance = 150 + Math.random() * 50;
    const xOffset = Math.cos(angle) * distance;
    const yOffset = Math.sin(angle) * distance;
    
    sparkle.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      font-size: 24px;
      z-index: 9999;
      opacity: 0;
      pointer-events: none;
    `;
    sparkle.textContent = '✨';
    
    // Animate manually with setTimeout
    document.body.appendChild(sparkle);
    
    setTimeout(() => {
      sparkle.style.transition = 'all 0.8s ease-out';
      sparkle.style.opacity = '1';
      sparkle.style.transform = `translate(calc(-50% + ${xOffset}px), calc(-50% + ${yOffset}px)) scale(1.5)`;
      
      setTimeout(() => {
        sparkle.style.opacity = '0';
      }, 400);
    }, i * 50);
    
    sparkles.push(sparkle);
  }
  
  // Remove celebration after animation
  setTimeout(() => {
    celebration.style.animation = 'popOut 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';
    setTimeout(() => {
      celebration.remove();
    }, 300);
  }, 2000);
  
  // Remove sparkles
  setTimeout(() => {
    sparkles.forEach(sparkle => sparkle.remove());
  }, 1500);
};

export const celebrateMilestoneCustom = (percentage: number, user: 'doggo' | 'ducko') => {
  // Similar celebration but smaller for milestones
  const milestoneEmoji = '🎯';
  
  const badge = document.createElement('div');
  badge.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    padding: 30px 40px;
    background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  `;
  
  badge.innerHTML = `
    <div style="font-size: 60px; margin-bottom: 10px;">${milestoneEmoji}</div>
    <div style="color: white; font-size: 24px; font-weight: bold;">${percentage}% Complete!</div>
  `;
  
  document.body.appendChild(badge);
  
  // Create a few celebrating emojis
  const celebEmojis = ['🎉', '✨', '⭐', '🌟'];
  const numEmojis = 8;
  
  for (let i = 0; i < numEmojis; i++) {
    const emoji = document.createElement('div');
    const randomEmoji = celebEmojis[Math.floor(Math.random() * celebEmojis.length)];
    const randomX = Math.random() * window.innerWidth;
    const randomDelay = Math.random() * 0.5;
    
    emoji.style.cssText = `
      position: fixed;
      left: ${randomX}px;
      top: -50px;
      font-size: 40px;
      z-index: 9999;
      animation: fall ${2 + Math.random()}s ease-in ${randomDelay}s forwards;
      pointer-events: none;
    `;
    
    emoji.textContent = randomEmoji;
    document.body.appendChild(emoji);
    
    // Add fall animation if not exists
    if (!document.getElementById('fall-animation')) {
      const style = document.createElement('style');
      style.id = 'fall-animation';
      style.textContent = `
        @keyframes fall {
          0% { 
            top: -50px; 
            transform: rotate(0deg);
            opacity: 1;
          }
          100% { 
            top: calc(100vh + 50px); 
            transform: rotate(360deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    setTimeout(() => emoji.remove(), 3000);
  }
  
  // Remove badge after animation
  setTimeout(() => {
    badge.style.animation = 'popOut 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';
    setTimeout(() => {
      badge.remove();
    }, 300);
  }, 2000);
};

