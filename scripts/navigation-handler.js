// Navigation active state handler
document.addEventListener('DOMContentLoaded', function() {
    // Set active navigation based on current page
    const currentPage = window.location.pathname.split('/').pop().toLowerCase();
    const navItems = document.querySelectorAll('.main-nav .menu li');
    
    // Remove all active classes
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class based on current page
    if (currentPage.includes('index') || currentPage === '') {
        document.querySelector('.nav-home')?.classList.add('active');
    } else if (currentPage.includes('category') || currentPage.includes('product')) {
        document.querySelector('.nav-categories')?.classList.add('active');
    } else if (currentPage.includes('starlink')) {
        document.querySelector('.nav-starlink')?.classList.add('active');
    } else if (currentPage.includes('newyear') || currentPage.includes('new-year')) {
        document.querySelector('.nav-newyear')?.classList.add('active');
    } else if (currentPage.includes('independence')) {
        document.querySelector('.nav-independence')?.classList.add('active');
    } else if (currentPage.includes('repairs')) {

        document.querySelector('.nav-repairs')?.classList.add('active');
    } else if (currentPage.includes('blog')) {
        document.querySelector('.nav-blog')?.classList.add('active');
    } else if (currentPage.includes('about')) {
        document.querySelector('.nav-about')?.classList.add('active');
    } else if (currentPage.includes('contact')) {
        document.querySelector('.nav-contact')?.classList.add('active');
    }
});

// Horizontal scrolling functionality for product containers
function initializeHorizontalScroll() {
    const productContainers = document.querySelectorAll('.horizontal-scroll-container');
    
    productContainers.forEach(container => {
        const wrapper = document.createElement('div');
        wrapper.className = 'scroll-wrapper';
        wrapper.innerHTML = `
            <div class="scroll-content">
                ${container.innerHTML}
            </div>
            <button class="scroll-btn scroll-prev" aria-label="Previous products">
                <i class="icon-left-open-big"></i>
            </button>
            <button class="scroll-btn scroll-next" aria-label="Next products">
                <i class="icon-right-open-big"></i>
            </button>
        `;
        
        container.innerHTML = '';
        container.appendChild(wrapper);
        
        const scrollContent = wrapper.querySelector('.scroll-content');
        const prevBtn = wrapper.querySelector('.scroll-prev');
        const nextBtn = wrapper.querySelector('.scroll-next');
        
        // Calculate scroll amount (width of one product card)
        const firstCard = scrollContent.querySelector('.product-card, .vd-card, .ny-card');
        const scrollAmount = firstCard ? firstCard.offsetWidth + 20 : 300; // fallback
        
        // Event listeners for scroll buttons
        prevBtn.addEventListener('click', () => {
            scrollContent.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });
        
        nextBtn.addEventListener('click', () => {
            scrollContent.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });
        
        // Update button visibility based on scroll position
        function updateButtons() {
            const maxScroll = scrollContent.scrollWidth - scrollContent.clientWidth;
            
            prevBtn.style.display = scrollContent.scrollLeft > 0 ? 'block' : 'none';
            nextBtn.style.display = scrollContent.scrollLeft < maxScroll ? 'block' : 'none';
        }
        
        scrollContent.addEventListener('scroll', updateButtons);
        updateButtons(); // Initial call
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeHorizontalScroll);

// Also initialize after content is loaded dynamically
window.addEventListener('load', initializeHorizontalScroll);