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
    font-size: 120px;
    z-index: 10000;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
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
  
  // Set the main profile emoji
  profilePic.textContent = completedBy === 'doggo' ? '🐶' : '🐥';
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

