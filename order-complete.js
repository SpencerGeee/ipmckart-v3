 // Create confetti effect
        document.addEventListener('DOMContentLoaded', function() {
            const container = document.querySelector('.order-complete-container');
            
            // Create confetti elements
            for (let i = 0; i < 50; i++) {
                setTimeout(() => {
                    const confetti = document.createElement('div');
                    confetti.className = 'confetti';
                    
                    // Random position and color
                    const colors = ['#ff0000', '#4caf50', '#2196f3', '#ff9800', '#9c27b0'];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    
                    confetti.style.left = Math.random() * 100 + 'vw';
                    confetti.style.backgroundColor = color;
                    
                    // Add to container
                    container.appendChild(confetti);
                    
                    // Animate confetti
                    const animation = confetti.animate([
                        { 
                            top: '-10px', 
                            opacity: 1,
                            transform: 'scale(0)'
                        },
                        { 
                            top: Math.random() * 100 + 'vh', 
                            opacity: 0.8,
                            transform: 'scale(1)'
                        }
                    ], {
                        duration: 2000 + Math.random() * 3000,
                        easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)'
                    });
                    
                    // Remove element after animation completes
                    animation.onfinish = () => {
                        confetti.remove();
                    };
                }, i * 100);
            }
        });