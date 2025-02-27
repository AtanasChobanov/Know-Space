document.addEventListener("DOMContentLoaded", () => {
  const counter = document.querySelector(".counter-number");
  const target = parseInt(counter.getAttribute("data-target"));
  
  // Clear counter
  counter.innerHTML = '';
  
  // Convert target number to string and pad with zeros if needed
  const targetStr = target.toString().padStart(1, '0');
  
  targetStr.split('').forEach((targetDigit, index) => {
    const digitContainer = document.createElement('div');
    digitContainer.className = 'digit-container';
    
    const digitStrip = document.createElement('div');
    digitStrip.className = 'digit-strip';
    
    // Add the sequence of numbers (0-9)
    for (let i = 0; i <= 9; i++) {
      const digitElement = document.createElement('div');
      digitElement.className = 'digit';
      digitElement.textContent = i;
      digitStrip.appendChild(digitElement);
    }
    
    // Add the target number at the end
    const finalDigit = document.createElement('div');
    finalDigit.className = 'digit';
    finalDigit.textContent = targetDigit;
    digitStrip.appendChild(finalDigit);
    
    digitContainer.appendChild(digitStrip);
    counter.appendChild(digitContainer);
    
    // Calculate final position to show the target digit
    const digitHeight = 64;
    const finalPosition = -parseInt(targetDigit) * digitHeight;
    
    // Start animation after a small delay
    setTimeout(() => {
      digitStrip.style.transform = `translateY(${finalPosition}px)`;
    }, index * 200);
  });
});

// Add hover effects for feature cards
const featureCards = document.querySelectorAll(".feature-card");
featureCards.forEach((card) => {
  card.addEventListener("mouseenter", () => {
    card.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.2)";
  });
  card.addEventListener("mouseleave", () => {
    card.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.1)";
  });
});
