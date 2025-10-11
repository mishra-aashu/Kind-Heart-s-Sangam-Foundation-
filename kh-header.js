document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.kh-hamburger');
    const nav = document.querySelector('.kh-nav');

    if (hamburger && nav) {
        // Remove any existing event listeners to prevent conflicts
        const newHamburger = hamburger.cloneNode(true);
        hamburger.parentNode.replaceChild(newHamburger, hamburger);

        // Add fresh event listener
        newHamburger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            nav.classList.toggle('active');
            const icon = newHamburger.querySelector('i');

            if (nav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close mobile menu when clicking on nav links
        const navLinks = nav.querySelectorAll('.kh-nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                const icon = newHamburger.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!newHamburger.contains(e.target) && !nav.contains(e.target)) {
                nav.classList.remove('active');
                const icon = newHamburger.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
});

// Global function to test KH header mobile navigation
window.testKHHeaderNavigation = function() {
    console.log('🧪 Testing KH Header mobile navigation...');

    const hamburger = document.querySelector('.kh-hamburger');
    const nav = document.querySelector('.kh-nav');

    if (hamburger && nav) {
        console.log('✅ KH Header mobile navigation elements found');

        // Simulate click
        hamburger.click();

        // Check if menu opened
        setTimeout(() => {
            const isActive = nav.classList.contains('active');
            console.log(isActive ? '✅ KH Header mobile menu opened successfully' : '❌ KH Header mobile menu failed to open');

            // Close menu
            hamburger.click();

            setTimeout(() => {
                const isClosed = !nav.classList.contains('active');
                console.log(isClosed ? '✅ KH Header mobile menu closed successfully' : '❌ KH Header mobile menu failed to close');
            }, 100);
        }, 100);

    } else {
        console.error('❌ KH Header mobile navigation elements not found for testing');
    }
};
