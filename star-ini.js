// Animation on scroll functionality
    function animateOnScroll() {
        const elements = document.querySelectorAll('.page-title, .starlink-card, .order-section, .section-heading, .animated-element');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if(elementPosition < screenPosition) {
                element.classList.add('animated');
            }
        });
    }

    // Initialize animations on page load and scroll
    window.addEventListener('load', animateOnScroll);
    window.addEventListener('scroll', animateOnScroll);

    // Form submission
    document.querySelector('form').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Thank you for your Starlink Mini order! We will contact you shortly to confirm your order.');
    });