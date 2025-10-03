/**
* CRITICAL: ADMIN PERMISSION REQUIRED BEFORE EDITING THIS FILE
*
* This file contains core application logic for the KIND HEART'S registration system.
* Any modifications to this file must be approved by an administrator.
*
* Contact admin before making any changes to:
* - Form validation logic
* - Supabase integration
* - Registration flow
* - Error handling
*
* Unauthorized edits may break the registration system functionality.
*/

document.addEventListener('DOMContentLoaded', () => {
    // Hamburger Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('.nav');

    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !isExpanded);
        });
    }

    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Scroll-triggered animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                // Stagger animations for multiple elements
                const siblings = Array.from(entry.target.parentElement?.children || []);
                siblings.forEach((sibling, index) => {
                    if (sibling !== entry.target && sibling.classList.contains('animate-on-scroll')) {
                        setTimeout(() => {
                            sibling.classList.add('animated');
                        }, index * 100);
                    }
                });
            }
        });
    }, observerOptions);

    // Observe all elements with animation classes
    document.querySelectorAll('.animate-on-scroll, .animate-fade-in, .animate-slide-up, .animate-scale-up').forEach(el => {
        observer.observe(el);
    });

    // Animated counters for statistics
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(start);
            }
        }, 16);
    }

    // Statistics counter animation
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stats = entry.target.querySelectorAll('[data-count]');
                stats.forEach(stat => {
                    const target = parseInt(stat.getAttribute('data-count'));
                    animateCounter(stat, target);
                });
                statsObserver.unobserve(entry.target);
            }
        });
    });

    // Crisis statistics animation
    const crisisStatsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const crisisNumbers = entry.target.querySelectorAll('.crisis-number');
                crisisNumbers.forEach(number => {
                    const target = parseInt(number.getAttribute('data-count'));
                    animateCounter(number, target);
                });
                crisisStatsObserver.unobserve(entry.target);
            }
        });
    });

    const statsSection = document.querySelector('.hero__content');
    if (statsSection) {
        statsObserver.observe(statsSection);
        crisisStatsObserver.observe(statsSection);
    }

    // Dynamic text rotation for hero title
    const heroTitle = document.querySelector('.hero__title');
    if (heroTitle) {
        const words = ['Communities', 'Families', 'Children', 'Hope'];
        let currentIndex = 0;

        function rotateText() {
            const rotatingSpan = heroTitle.querySelector('.rotating-text');
            if (rotatingSpan) {
                rotatingSpan.style.opacity = '0';
                rotatingSpan.style.transform = 'translateY(20px)';

                setTimeout(() => {
                    rotatingSpan.textContent = words[currentIndex];
                    rotatingSpan.style.opacity = '1';
                    rotatingSpan.style.transform = 'translateY(0)';
                    currentIndex = (currentIndex + 1) % words.length;
                }, 300);
            }
        }

        // Start rotation after page loads
        setTimeout(() => {
            setInterval(rotateText, 3000);
        }, 2000);
    }

    // Removed parallax effect to prevent scroll overlap issues
    // Clean scroll behavior without transform interference

    // Enhanced button click effects
    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Dynamic footer year animation
    const yearElement = document.getElementById('year');
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        let displayYear = currentYear - 5; // Start from 5 years ago for animation

        function animateYear() {
            if (displayYear <= currentYear) {
                yearElement.textContent = displayYear;
                displayYear++;
                setTimeout(animateYear, 100);
            }
        }

        // Start animation after a short delay
        setTimeout(animateYear, 1000);
    }

    // Image Slider Functionality
    const slider = document.querySelector('.image-slider');
    if (slider) {
        const slides = slider.querySelectorAll('.slide');
        const dots = slider.querySelectorAll('.dot');
        const prevBtn = slider.querySelector('.prev');
        const nextBtn = slider.querySelector('.next');
        const sliderContainer = slider.querySelector('.slider-container');

        let currentSlide = 0;
        let autoPlayInterval;
        let isPaused = false;

        // Initialize slider
        function initSlider() {
            if (slides.length === 0) return;

            // Set initial state
            updateSlider();

            // Start auto-play
            startAutoPlay();

            // Add event listeners
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    pauseAutoPlay();
                    previousSlide();
                    resumeAutoPlayAfterDelay();
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    pauseAutoPlay();
                    nextSlide();
                    resumeAutoPlayAfterDelay();
                });
            }

            // Dot navigation
            dots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    pauseAutoPlay();
                    goToSlide(index);
                    resumeAutoPlayAfterDelay();
                });
            });

            // Pause on hover (but resume quickly)
            if (sliderContainer) {
                sliderContainer.addEventListener('mouseenter', () => {
                    if (autoPlayInterval) {
                        clearInterval(autoPlayInterval);
                    }
                });
                sliderContainer.addEventListener('mouseleave', () => {
                    // Resume auto-play immediately when mouse leaves
                    startAutoPlay();
                });
            }

            // Touch/swipe support for mobile
            let startX = 0;
            let endX = 0;

            if (sliderContainer) {
                sliderContainer.addEventListener('touchstart', (e) => {
                    startX = e.touches[0].clientX;
                });

                sliderContainer.addEventListener('touchend', (e) => {
                    endX = e.changedTouches[0].clientX;
                    handleSwipe();
                });
            }

            function handleSwipe() {
                const diff = startX - endX;
                const threshold = 50;

                if (Math.abs(diff) > threshold) {
                    pauseAutoPlay();
                    if (diff > 0) {
                        nextSlide(); // Swipe left - next slide
                    } else {
                        previousSlide(); // Swipe right - previous slide
                    }
                    resumeAutoPlayAfterDelay();
                }
            }

            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    pauseAutoPlay();
                    previousSlide();
                    resumeAutoPlayAfterDelay();
                } else if (e.key === 'ArrowRight') {
                    pauseAutoPlay();
                    nextSlide();
                    resumeAutoPlayAfterDelay();
                }
            });
        }

        function updateSlider() {
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === currentSlide);
            });

            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
        }

        function nextSlide() {
            currentSlide = (currentSlide + 1) % slides.length;
            updateSlider();
        }

        function previousSlide() {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            updateSlider();
        }

        function goToSlide(index) {
            currentSlide = index;
            updateSlider();
        }

        function startAutoPlay() {
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
            }

            autoPlayInterval = setInterval(() => {
                nextSlide();
            }, 4000); // Change slide every 4 seconds for smoother experience
        }

        function pauseAutoPlay() {
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
            }
        }

        function resumeAutoPlayAfterDelay() {
            setTimeout(() => {
                startAutoPlay();
            }, 2000); // Resume after 2 seconds of inactivity
        }

        // Initialize slider when DOM is ready
        initSlider();

        // Also start auto-play as a failsafe
        setTimeout(() => {
            if (!autoPlayInterval) {
                startAutoPlay();
            }
        }, 1000);
    }

    // Crisis Study Flashcards Functionality
    const flashcardsContainer = document.querySelector('.flashcards-container');
    if (flashcardsContainer) {
        const flashcardsGrid = flashcardsContainer.querySelector('.flashcards-grid');
        const prevBtn = flashcardsContainer.querySelector('.prev');
        const nextBtn = flashcardsContainer.querySelector('.next');
        const dots = document.querySelectorAll('.flashcard-dot');
        const progressCurrent = document.querySelector('.progress-current');

        let currentCardSet = 0;
        const cardsPerPage = 4;
        const totalCards = 20;
        const totalSets = Math.ceil(totalCards / cardsPerPage);

        // Flashcard data
        const flashcardData = [
            {
                id: 1,
                category: "🌍 Global Hunger",
                question: "How many people face hunger globally in 2024?",
                answer: "<strong>673 million people</strong> (8.2% of world population)",
                source: "UN State of Food Security Report 2025",
                priority: "high"
            },
            {
                id: 2,
                category: "🌍 Global Hunger",
                question: "How many people die daily from hunger?",
                answer: "<strong>25,000 people die daily</strong> from hunger and related causes<br>Including <strong>10,000+ children</strong>",
                source: "UN Chronicle & Global Hunger Statistics",
                priority: "high"
            },
            {
                id: 3,
                category: "🗑️ Food Waste",
                question: "How much food is wasted globally each year?",
                answer: "<strong>1.05 billion tonnes</strong> of food wasted annually<br>That's nearly <strong>20% of all food</strong> available to consumers",
                source: "UNEP Food Waste Index 2024",
                priority: "high"
            },
            {
                id: 4,
                category: "🇮🇳 India Malnutrition",
                question: "What percentage of Indian children suffer from wasting?",
                answer: "<strong>18.7% of Indian children</strong> under 5 suffer from wasting<br><strong>Highest rate globally</strong> - affecting 21+ million children",
                source: "UN SOFI Report 2025",
                priority: "high"
            },
            {
                id: 5,
                category: "🇮🇳 India Malnutrition",
                question: "How many Indians are undernourished?",
                answer: "<strong>194.6 million Indians</strong> are undernourished<br><strong>Highest number in the world</strong>",
                source: "Drishti IAS Global Hunger Report",
                priority: "high"
            },
            {
                id: 6,
                category: "🇮🇳 India Malnutrition",
                question: "What percentage of rural Indians consume inadequate calories?",
                answer: "<strong>80% of rural population</strong> consumes less than 2,200 calories per day<br>Below the required 2,400 calories",
                source: "Economic Times & Business Standard 2024",
                priority: "high"
            },
            {
                id: 7,
                category: "👕 Clothing Poverty",
                question: "How many homeless people are in India?",
                answer: "<strong>1.77 million people</strong> are homeless in India (2011 census)<br>Actual number likely exceeds <strong>3 million</strong> today",
                source: "Census of India & Civil Society Estimates",
                priority: "high"
            },
            {
                id: 8,
                category: "❄️ Winter Deaths",
                question: "How many homeless people died in Delhi during winter 2024-25?",
                answer: "<strong>474 homeless people</strong> died in Delhi<br>During Nov 15 - Jan 10 due to cold exposure",
                source: "Centre for Holistic Development NGO 2025",
                priority: "high"
            },
            {
                id: 9,
                category: "👕 Clothing Poverty",
                question: "How much clothing is wasted globally each year?",
                answer: "<strong>92 million tonnes</strong> of clothing discarded globally<br>Equivalent to a garbage truck full of clothes every second",
                source: "Clean Clothes Campaign & Earth.org 2024",
                priority: "high"
            },
            {
                id: 10,
                category: "👶 Child Impact",
                question: "How does lack of clean clothes affect student attendance?",
                answer: "<strong>20% of students</strong> struggle with clean clothing access<br>Leading to chronic absenteeism and missing <strong>10%+ school days</strong>",
                source: "Whirlpool Research Study 2024",
                priority: "high"
            },
            {
                id: 11,
                category: "👶 Child Impact",
                question: "How many children globally are stunted due to malnutrition?",
                answer: "<strong>148 million children</strong> globally are stunted<br><strong>45 million</strong> are wasted",
                source: "Global Hunger Index 2024",
                priority: "high"
            },
            {
                id: 12,
                category: "🇮🇳 India Malnutrition",
                question: "What percentage of Indian women suffer from anaemia?",
                answer: "<strong>53.7% of Indian women</strong> aged 15-49 suffer from anaemia<br>That's <strong>203 million women</strong>",
                source: "UN SOFI Report 2025",
                priority: "medium"
            },
            {
                id: 13,
                category: "🗑️ Food Waste",
                question: "What fraction of all food produced goes uneaten?",
                answer: "<strong>One-third of all food</strong> produced goes uneaten worldwide<br>Enough to feed billions of hungry people",
                source: "Global Hunger Statistics",
                priority: "medium"
            },
            {
                id: 14,
                category: "👕 Clothing Poverty",
                question: "What percentage of textile waste ends up in landfills in India?",
                answer: "<strong>85% of textile waste</strong> ends up in landfills<br>While millions lack basic clothing",
                source: "Saaha Zero Waste 2025",
                priority: "medium"
            },
            {
                id: 15,
                category: "❄️ Winter Deaths",
                question: "How many homeless people die daily in Delhi during January?",
                answer: "<strong>Approximately 8 homeless people</strong> die daily in January<br>Due to hypothermia and cold-related conditions",
                source: "Times of India & The Wire 2025",
                priority: "medium"
            },
            {
                id: 16,
                category: "🌍 Global Hunger",
                question: "How many people cannot afford healthy diets globally?",
                answer: "<strong>2.8 billion people</strong> worldwide cannot afford healthy diets<br>Due to rising food costs",
                source: "UN State of Food Security Report 2025",
                priority: "medium"
            },
            {
                id: 17,
                category: "🇮🇳 India Malnutrition",
                question: "How many Indian children are stunted?",
                answer: "<strong>37 million children</strong> under 5 are stunted in India<br>Indicating chronic undernutrition",
                source: "UN SOFI Report 2025",
                priority: "medium"
            },
            {
                id: 18,
                category: "👶 Child Impact",
                question: "What percentage of child deaths are linked to malnutrition?",
                answer: "<strong>Half of all child deaths</strong> are linked to malnutrition<br>Almost <strong>5 million children</strong> die before age 5 annually",
                source: "Our World in Data & Global Hunger Index",
                priority: "high"
            },
            {
                id: 19,
                category: "👕 Clothing Poverty",
                question: "How many homeless people are there in Delhi?",
                answer: "<strong>300,000 homeless people</strong> in Delhi struggle without adequate clothing<br><strong>154,369</strong> living directly on streets",
                source: "Shahri Adhikar Manch 2024",
                priority: "medium"
            },
            {
                id: 20,
                category: "👶 Child Impact",
                question: "How does clothing access affect school attendance improvement?",
                answer: "<strong>90% of students</strong> showed improved attendance<br>When provided access to clean clothes through school programs",
                source: "Whirlpool Research Study 2024",
                priority: "medium"
            }
        ];

        // Initialize flashcards
        function initFlashcards() {
            updateFlashcards();
            setupEventListeners();
        }

        function updateFlashcards() {
            const dataToShow = window.filteredFlashcardData || flashcardData;
            const totalCardsToShow = dataToShow.length;
            const startIndex = currentCardSet * cardsPerPage;
            const endIndex = Math.min(startIndex + cardsPerPage, totalCardsToShow);

            // Update progress indicator
            if (progressCurrent) {
                progressCurrent.textContent = `${startIndex + 1}-${endIndex}${window.filteredFlashcardData ? ` of ${totalCardsToShow}` : ''}`;
            }

            // Update dots
            const totalSetsToShow = Math.ceil(totalCardsToShow / cardsPerPage);
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentCardSet);
                dot.style.display = index < totalSetsToShow ? 'block' : 'none';
            });

            // Update card content with smooth transitions
            const cards = flashcardsGrid.querySelectorAll('.flashcard');
            cards.forEach((card, index) => {
                const dataIndex = startIndex + index;
                if (dataIndex < totalCardsToShow && dataToShow[dataIndex]) {
                    const data = dataToShow[dataIndex];

                    // Add fade-out effect
                    card.classList.add('fade-out');

                    setTimeout(() => {
                        updateCardContent(card, data);
                        card.classList.remove('fade-out');
                        card.classList.add('fade-in');

                        // Remove fade-in class after animation completes
                        setTimeout(() => {
                            card.classList.remove('fade-in');
                        }, 400);
                    }, 150);

                    card.style.display = 'block';
                } else {
                    card.classList.add('fade-out');
                    setTimeout(() => {
                        card.style.display = 'none';
                        card.classList.remove('fade-out');
                    }, 300);
                }
            });
        }

        function updateCardContent(card, data) {
            const categoryEl = card.querySelector('.flashcard-category');
            const questionEl = card.querySelector('.flashcard-question');
            const answerEl = card.querySelector('.flashcard-answer');
            const sourceEl = card.querySelector('.flashcard-source');
            const priorityEl = card.querySelector('.flashcard-priority');

            if (categoryEl) categoryEl.textContent = data.category;
            if (questionEl) questionEl.textContent = data.question;
            if (answerEl) answerEl.innerHTML = data.answer;
            if (sourceEl) sourceEl.textContent = data.source;
            if (priorityEl) priorityEl.textContent = data.priority === 'high' ? 'High Priority' : 'Medium Priority';

            // Update category classes for styling
            card.className = 'flashcard';
            if (data.category.includes('Global Hunger')) card.classList.add('category-global-hunger');
            if (data.category.includes('Food Waste')) card.classList.add('category-food-waste');
            if (data.category.includes('India Malnutrition')) card.classList.add('category-india-malnutrition');
            if (data.category.includes('Clothing Poverty')) card.classList.add('category-clothing-poverty');
            if (data.category.includes('Winter Deaths')) card.classList.add('category-winter-deaths');
            if (data.category.includes('Child Impact')) card.classList.add('category-child-impact');
        }

        function setupEventListeners() {
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (currentCardSet > 0) {
                        currentCardSet--;
                        updateFlashcards();
                    }
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (currentCardSet < totalSets - 1) {
                        currentCardSet++;
                        updateFlashcards();
                    }
                });
            }

            dots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    currentCardSet = index;
                    updateFlashcards();
                });
            });

            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft' && currentCardSet > 0) {
                    currentCardSet--;
                    updateFlashcards();
                } else if (e.key === 'ArrowRight' && currentCardSet < totalSets - 1) {
                    currentCardSet++;
                    updateFlashcards();
                }
            });
        }

        // Initialize flashcards when DOM is ready
        initFlashcards();

        // Initialize category filtering
        initCategoryFiltering();

        // Category filtering functionality
        function initCategoryFiltering() {
            const categoryItems = document.querySelectorAll('.category-item.clickable');
            let currentFilter = null;
            let isFilterActive = false;

            categoryItems.forEach(item => {
                item.addEventListener('click', () => {
                    const category = item.getAttribute('data-category');
                    const scrollTarget = item.getAttribute('data-scroll-target');

                    // Auto-scroll to flashcards section
                    if (scrollTarget) {
                        const targetElement = document.querySelector(`.${scrollTarget}`);
                        if (targetElement) {
                            targetElement.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }
                    }

                    // Apply category filter after scrolling
                    setTimeout(() => {
                        applyCategoryFilter(category);
                    }, 500);
                });
            });

            function applyCategoryFilter(category) {
                currentFilter = category;
                isFilterActive = true;

                // Remove selected class from all categories
                categoryItems.forEach(item => {
                    item.classList.remove('selected');
                });

                // Add selected class to clicked category
                const selectedCategory = document.querySelector(`[data-category="${category}"]`);
                if (selectedCategory) {
                    selectedCategory.classList.add('selected');
                }

                // Filter flashcards by category
                filterFlashcardsByCategory(category);

                // Set up scroll listener to clear filter when user scrolls
                setupScrollListener();
            }

            function filterFlashcardsByCategory(category) {
                const filteredData = flashcardData.filter(card => {
                    switch(category) {
                        case 'global-hunger':
                            return card.category.includes('Global Hunger');
                        case 'food-waste':
                            return card.category.includes('Food Waste');
                        case 'india-malnutrition':
                            return card.category.includes('India Malnutrition');
                        case 'clothing-poverty':
                            return card.category.includes('Clothing Poverty');
                        case 'winter-deaths':
                            return card.category.includes('Winter Deaths');
                        case 'child-impact':
                            return card.category.includes('Child Impact');
                        default:
                            return true;
                    }
                });

                // Update flashcard data temporarily
                window.originalFlashcardData = window.originalFlashcardData || flashcardData;
                window.filteredFlashcardData = filteredData;

                // Reset to first set and update
                currentCardSet = 0;
                updateFilteredFlashcards();
            }

            function updateFilteredFlashcards() {
                const dataToShow = window.filteredFlashcardData || flashcardData;
                const startIndex = currentCardSet * cardsPerPage;
                const endIndex = Math.min(startIndex + cardsPerPage, dataToShow.length);

                // Update progress indicator
                if (progressCurrent) {
                    progressCurrent.textContent = `${startIndex + 1}-${Math.min(endIndex, dataToShow.length)} of ${dataToShow.length}`;
                }

                // Update dots
                const filteredTotalSets = Math.ceil(dataToShow.length / cardsPerPage);
                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === currentCardSet);
                    dot.style.display = index < filteredTotalSets ? 'block' : 'none';
                });

                // Update card content
                const cards = flashcardsGrid.querySelectorAll('.flashcard');
                cards.forEach((card, index) => {
                    const dataIndex = startIndex + index;
                    if (dataIndex < dataToShow.length && dataToShow[dataIndex]) {
                        const data = dataToShow[dataIndex];
                        updateCardContent(card, data);
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            }

            function setupScrollListener() {
                function handleScroll() {
                    const scrollY = window.scrollY;
                    const windowHeight = window.innerHeight;
                    const documentHeight = document.documentElement.scrollHeight;

                    // Clear filter if user scrolls significantly or reaches bottom
                    if (scrollY > windowHeight * 0.5 || scrollY + windowHeight > documentHeight - 100) {
                        clearCategoryFilter();
                        window.removeEventListener('scroll', handleScroll);
                    }
                }

                // Debounce scroll events
                let scrollTimeout;
                window.addEventListener('scroll', () => {
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(handleScroll, 150);
                });
            }

            function clearCategoryFilter() {
                if (!isFilterActive) return;

                isFilterActive = false;
                currentFilter = null;

                // Remove selected class from all categories
                categoryItems.forEach(item => {
                    item.classList.remove('selected');
                });

                // Restore original flashcard data
                if (window.originalFlashcardData) {
                    Object.assign(flashcardData, window.originalFlashcardData);
                }

                // Reset and update flashcards
                currentCardSet = 0;
                updateFlashcards();

                // Restore dot visibility
                dots.forEach(dot => {
                    dot.style.display = 'block';
                });
            }

            // Make clearFilter function available globally for manual reset
            window.clearCategoryFilter = clearCategoryFilter;
        }

        // Auto-play functionality - change cards every 5 seconds for better viewing
        setInterval(() => {
            if (currentCardSet < totalSets - 1) {
                currentCardSet++;
            } else {
                currentCardSet = 0; // Loop back to beginning
            }
            updateFlashcards();
        }, 5000);
    }
});


// This function is called after the form HTML is loaded into the page
function initializeForm() {
    const form = document.getElementById('registration-form');
    if (!form) return;

    const submitBtn = document.getElementById('submit-btn');
    // Import supabase client
    import('./supabase-client.js').then(({ default: supabase }) => {
        window.supabase = supabase;
    }).catch(error => {
        console.error('Error loading Supabase client:', error);
    });

    const fields = {
        orgType: { required: true },
        orgName: { required: true },
        contactPerson: { required: true },
        phone: { required: true, pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number.' },
        email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email address.' },
        address: { required: true },
        city: { required: true },
        pincode: { required: true, pattern: /^[0-9]{6}$/, message: 'Please enter a valid 6-digit pincode.' },
        pickupDays: { required: true, type: 'checkbox', message: 'Please select at least one pickup day.' },
        pickupTime: { required: true },
        foodCapacity: { required: true },
        foodType: { required: true, type: 'radio', message: 'Please select a food type.' },
        terms: { required: true, type: 'checkbox', message: 'You must agree to the terms.' }
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateForm()) {
            submitForm();
        }
    });

    function validateForm() {
        let isValid = true;
        for (const fieldName in fields) {
            if (!validateField(fieldName)) {
                isValid = false;
            }
        }
        return isValid;
    }

    function validateField(fieldName) {
        const fieldConfig = fields[fieldName];
        const input = form.elements[fieldName];

        let actualInput = input;
        let errorEl = null;

        if (input) {
            if (input.closest && typeof input.closest === 'function') {
                // Single element
                actualInput = input;
                errorEl = input.closest('.form__group')?.querySelector('.form__error-message');
            } else if (input.length && input[0] && input[0].closest) {
                // RadioNodeList or HTMLCollection - get first element
                actualInput = input[0];
                errorEl = input[0].closest('.form__group')?.querySelector('.form__error-message');
            }
        }
        let isValid = true;
        let errorMessage = '';

        if (fieldConfig.required) {
            if (fieldConfig.type === 'checkbox') {
                if (fieldName === 'pickupDays') {
                    const checked = form.querySelectorAll(`input[name="${fieldName}"]:checked`).length;
                    if (checked === 0) {
                        isValid = false;
                        errorMessage = fieldConfig.message || 'This field is required.';
                    }
                } else {
                    if (actualInput && !actualInput.checked) {
                        isValid = false;
                        errorMessage = fieldConfig.message || 'This field is required.';
                    }
                }
            } else if (fieldConfig.type === 'radio') {
                const checked = form.querySelector(`input[name="${fieldName}"]:checked`);
                if (!checked) {
                    isValid = false;
                    errorMessage = fieldConfig.message || 'Please make a selection.';
                }
            } else {
                if (!actualInput || !actualInput.value.trim()) {
                    isValid = false;
                    errorMessage = 'This field is required.';
                }
            }
        }

        if (isValid && fieldConfig.pattern && actualInput && actualInput.value.trim()) {
            if (!fieldConfig.pattern.test(actualInput.value.trim())) {
                isValid = false;
                errorMessage = fieldConfig.message || 'Invalid format.';
            }
        }

        if (!isValid && errorEl) {
            actualInput.classList.add('invalid');
            errorEl.textContent = errorMessage;
            errorEl.style.display = 'block';
        } else if (errorEl) {
            actualInput.classList.remove('invalid');
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }

        return isValid;
    }

    async function submitForm() {
        setLoading(true);

        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            if (key === 'pickupDays') {
                if (!data[key]) data[key] = [];
                data[key].push(value);
            } else {
                data[key] = value;
            }
        });

        if (data.website) {
            console.log('Spam detected');
            setLoading(false);
            return;
        }

        try {
            console.log('Attempting to insert into Supabase');
            console.log('Request data:', data);

            // Wait for supabase to be loaded
            if (!window.supabase) {
                // Wait a bit more for supabase to load
                let retries = 0;
                while (!window.supabase && retries < 10) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    retries++;
                }
                if (!window.supabase) {
                    throw new Error('Supabase client not loaded');
                }
            }

            // Prepare data for Supabase insertion
            const registrationData = {
                timestamp: new Date().toISOString(),
                org_type: data.orgType || '',
                org_name: data.orgName || '',
                contact_person: data.contactPerson || '',
                phone: data.phone || '',
                email: data.email || '',
                address: data.address || '',
                city: data.city || '',
                pincode: data.pincode || '',
                pickup_days: Array.isArray(data.pickupDays) ? data.pickupDays.join(', ') : (data.pickupDays || ''),
                pickup_time: data.pickupTime || '',
                food_capacity: data.foodCapacity || '',
                food_type: data.foodType || '',
                certificate_link: data.certificateLink || '',
                status: 'Pending Review'
            };

            const { data: result, error } = await window.supabase
                .from('registrations')
                .insert([registrationData])
                .select();

            if (error) {
                console.error('Supabase error:', error);
                showToast('An error occurred while submitting the form. Please try again.', 'error');
            } else {
                console.log('Supabase insertion successful:', result);
                showToast('Registration successful! A confirmation email has been sent.', 'success');
                form.reset();
                window.location.href = 'dashboard.html';
            }

        } catch (error) {
            console.error('Error submitting form:', error);
            showToast('An error occurred. Please try again later.', 'error');
        } finally {
            setLoading(false);
        }
    }

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        if (isLoading) {
            submitBtn.classList.add('button--loading');
        } else {
            submitBtn.classList.remove('button--loading');
        }
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast__message');

    toastMessage.textContent = message;
    toast.className = 'toast show';
    toast.classList.add(`toast--${type}`);

    setTimeout(() => {
        toast.className = 'toast';
    }, 5000);
}




function setLoading(isLoading) {
    const submitBtn = document.querySelector('#registration-form #submit-btn');
    if (!submitBtn) return;

    submitBtn.disabled = isLoading;
    if (isLoading) {
        submitBtn.classList.add('button--loading');
    } else {
        submitBtn.classList.remove('button--loading');
    }
}

/*
Unit Test Suggestions for JS validation functions:

1. For `validateField`:
    - Test a required text field: should return false if empty, true if filled.
    - Test a phone number field: should return false for invalid patterns (e.g., <10 digits, letters), true for a valid 10-digit number.
    - Test an email field: should return false for invalid emails, true for valid ones.
    - Test a required checkbox (like terms): should return false if unchecked, true if checked.
    - Test a checkbox group (like pickupDays): should return false if none are checked, true if at least one is checked.
    - Test a radio button group (like foodType): should return false if none are selected, true if one is selected.

Example Test Case (using a testing framework like Jest):

describe('validateField', () => {
  it('should return false for an empty required text field', () => {
    // Setup: create a mock form element in the DOM
    document.body.innerHTML = `
      <form id="test-form">
        <div class="form__group">
          <input type="text" id="orgName" name="orgName" required>
          <p class="form__error-message"></p>
        </div>
      </form>
    `;
    // Execution: call validateField('orgName')
    // Assertion: expect(result).toBe(false) and check if error message is displayed.
  });
});

 */

// This function is called after the donation form HTML is loaded into the page
function initializeDonationForm() {
    const form = document.getElementById('donation-form');
    if (!form) return;

    const submitBtn = document.getElementById('submit-btn');

    // Import supabase client
    import('./supabase-client.js').then(({ default: supabase }) => {
        window.supabase = supabase;
        console.log('Supabase client loaded successfully for donation form');
    }).catch(error => {
        console.error('Error loading Supabase client:', error);
    });

    // Set up conditional field display logic
    setupConditionalFields();

    const fields = {
        donorType: { required: true, type: 'radio', message: 'Please select a donor type.' },
        organization: { required: false }, // Required only if organization type selected
        name: { required: true },
        phone: { required: true, pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number.' },
        email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email address.' },
        address: { required: true },
        city: { required: true },
        state: { required: true },
        pincode: { required: true, pattern: /^[0-9]{6}$/, message: 'Please enter a valid 6-digit pincode.' },
        donationCategories: { required: true, type: 'checkbox', message: 'Please select at least one donation category.' },
        amount: { required: false }, // Required only if money category selected
        currency: { required: false }, // Required only if money category selected
        paymentMethod: { required: false }, // Required only if money category selected
        condition: { required: false }, // Required only if clothes category selected
        count: { required: false }, // Required only if clothes category selected
        foodType: { required: false, type: 'radio' }, // Required only if food category selected
        quantity: { required: false }, // Required only if food category selected
        pickupAvailable: { required: false, type: 'radio' }, // Required only if food category selected
        otherDescription: { required: false }, // Required only if other category selected
        preferredDate: { required: true },
        timeWindow: { required: true },
        terms: { required: true, type: 'checkbox', message: 'You must agree to the terms and conditions.' }
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateDonationForm()) {
            submitDonationForm();
        }
    });

    function setupConditionalFields() {
        // Organization name field visibility
        const donorTypeRadios = form.querySelectorAll('input[name="donorType"]');
        const orgNameGroup = document.getElementById('orgNameGroup');

        donorTypeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const organization = document.getElementById('organization');
                if (radio.value === 'Organization') {
                    orgNameGroup.style.display = 'block';
                    if (organization) organization.required = true;
                } else {
                    orgNameGroup.style.display = 'none';
                    if (organization) organization.required = false;
                }
            });
        });

        // Donation category sections
        const categoryCheckboxes = form.querySelectorAll('input[name="donationCategories"]');
        const moneySection = document.getElementById('moneySection');
        const clothesSection = document.getElementById('clothesSection');
        const foodSection = document.getElementById('foodSection');
        const otherSection = document.getElementById('otherSection');

        categoryCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                // Money section
                if (document.getElementById('money').checked) {
                    moneySection.style.display = 'block';
                } else {
                    moneySection.style.display = 'none';
                }

                // Clothes section
                if (document.getElementById('clothes').checked) {
                    clothesSection.style.display = 'block';
                } else {
                    clothesSection.style.display = 'none';
                }

                // Food section
                if (document.getElementById('food').checked) {
                    foodSection.style.display = 'block';
                    setupFoodPickupFields();
                } else {
                    foodSection.style.display = 'none';
                }

                // Other section
                if (document.getElementById('other').checked) {
                    otherSection.style.display = 'block';
                } else {
                    otherSection.style.display = 'none';
                }
            });
        });

        // Food pickup availability
        const pickupRadios = form.querySelectorAll('input[name="food.pickupAvailable"]');
        const dropOffGroup = document.getElementById('dropOffGroup');

        pickupRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'No') {
                    dropOffGroup.style.display = 'block';
                } else {
                    dropOffGroup.style.display = 'none';
                }
            });
        });
    }

    function setupFoodPickupFields() {
        // This will be called when food category is selected
        console.log('Food category selected - pickup fields initialized');
    }

    function validateDonationForm() {
        let isValid = true;

        // Validate donor type specific fields
        const donorType = form.querySelector('input[name="donorType"]:checked')?.value;
        if (donorType === 'Organization') {
            const organization = document.getElementById('organization');
            if (!organization.value.trim()) {
                showFieldError('organization', 'Organization name is required.');
                isValid = false;
            } else {
                clearFieldError('organization');
            }
        }

        // Validate conditional required fields based on donation categories
        const moneyChecked = document.getElementById('money').checked;
        const clothesChecked = document.getElementById('clothes').checked;
        const foodChecked = document.getElementById('food').checked;
        const otherChecked = document.getElementById('other').checked;

        if (moneyChecked) {
            const amount = document.getElementById('amount');
            const currency = document.getElementById('currency');
            const paymentMethod = document.getElementById('paymentMethod');

            if (amount && (!amount.value || amount.value <= 0)) {
                showFieldError('amount', 'Please enter a valid amount.');
                isValid = false;
            } else if (amount) {
                clearFieldError('amount');
            }

            if (currency && !currency.value) {
                showFieldError('currency', 'Please select a currency.');
                isValid = false;
            } else if (currency) {
                clearFieldError('currency');
            }

            if (paymentMethod && !paymentMethod.value) {
                showFieldError('paymentMethod', 'Please select a payment method.');
                isValid = false;
            } else if (paymentMethod) {
                clearFieldError('paymentMethod');
            }
        }

        if (clothesChecked) {
            const condition = document.getElementById('condition');
            const count = document.getElementById('count');

            if (condition && !condition.value) {
                showFieldError('condition', 'Please select the condition of clothes.');
                isValid = false;
            } else if (condition) {
                clearFieldError('condition');
            }

            if (count && (!count.value || count.value <= 0)) {
                showFieldError('count', 'Please enter a valid count.');
                isValid = false;
            } else if (count) {
                clearFieldError('count');
            }
        }

        if (foodChecked) {
            const foodType = form.querySelector('input[name="food.type"]:checked');
            const quantity = document.getElementById('quantity');
            const pickupAvailable = form.querySelector('input[name="food.pickupAvailable"]:checked');

            if (!foodType) {
                showToast('Please select food type.', 'error');
                isValid = false;
            }

            if (quantity && !quantity.value.trim()) {
                showFieldError('quantity', 'Please enter quantity estimate.');
                isValid = false;
            } else if (quantity) {
                clearFieldError('quantity');
            }

            if (!pickupAvailable) {
                showToast('Please specify if pickup is available.', 'error');
                isValid = false;
            }
        }

        if (otherChecked) {
            const otherDescription = document.getElementById('otherDescription');
            if (otherDescription && !otherDescription.value.trim()) {
                showFieldError('otherDescription', 'Please describe what you\'re donating.');
                isValid = false;
            } else if (otherDescription) {
                clearFieldError('otherDescription');
            }
        }

        // Validate standard fields
        for (const fieldName in fields) {
            if (!validateField(fieldName)) {
                isValid = false;
            }
        }

        return isValid;
    }

    function showFieldError(fieldName, message) {
        const input = form.elements[fieldName];
        const errorEl = input?.closest('.form__group')?.querySelector('.form__error-message');
        if (input && errorEl) {
            input.classList.add('invalid');
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    function clearFieldError(fieldName) {
        const input = form.elements[fieldName];
        const errorEl = input?.closest('.form__group')?.querySelector('.form__error-message');
        if (input && errorEl) {
            input.classList.remove('invalid');
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
    }

    function validateField(fieldName) {
        const fieldConfig = fields[fieldName];
        const input = form.elements[fieldName];

        let actualInput = input;
        let errorEl = null;

        if (input) {
            if (input.closest && typeof input.closest === 'function') {
                actualInput = input;
                errorEl = input.closest('.form__group')?.querySelector('.form__error-message');
            } else if (input.length && input[0] && input[0].closest) {
                actualInput = input[0];
                errorEl = input[0].closest('.form__group')?.querySelector('.form__error-message');
            }
        }

        let isValid = true;
        let errorMessage = '';

        if (fieldConfig.required) {
            if (fieldConfig.type === 'checkbox') {
                if (fieldName === 'donationCategories') {
                    const checked = form.querySelectorAll(`input[name="${fieldName}"]:checked`).length;
                    if (checked === 0) {
                        isValid = false;
                        errorMessage = fieldConfig.message || 'Please select at least one category.';
                    }
                } else {
                    if (actualInput && !actualInput.checked) {
                        isValid = false;
                        errorMessage = fieldConfig.message || 'This field is required.';
                    }
                }
            } else if (fieldConfig.type === 'radio') {
                const checked = form.querySelector(`input[name="${fieldName}"]:checked`);
                if (!checked) {
                    isValid = false;
                    errorMessage = fieldConfig.message || 'Please make a selection.';
                }
            } else {
                if (!actualInput || !actualInput.value.trim()) {
                    isValid = false;
                    errorMessage = 'This field is required.';
                }
            }
        }

        if (isValid && fieldConfig.pattern && actualInput && actualInput.value.trim()) {
            if (!fieldConfig.pattern.test(actualInput.value.trim())) {
                isValid = false;
                errorMessage = fieldConfig.message || 'Invalid format.';
            }
        }

        if (!isValid && errorEl) {
            actualInput.classList.add('invalid');
            errorEl.textContent = errorMessage;
            errorEl.style.display = 'block';
        } else if (errorEl) {
            actualInput.classList.remove('invalid');
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }

        return isValid;
    }

    async function submitDonationForm() {
        setLoading(true);

        const formData = new FormData(form);
        const data = {};

        // Handle different field name formats
        formData.forEach((value, key) => {
            if (key.includes('.')) {
                // Handle nested keys like money.amount, food.type, etc.
                const keys = key.split('.');
                if (!data[keys[0]]) data[keys[0]] = {};
                data[keys[0]][keys[1]] = value;
            } else if (key === 'donationCategories') {
                if (!data[key]) data[key] = [];
                data[key].push(value);
            } else {
                data[key] = value;
            }
        });

        if (data.website) {
            console.log('Spam detected');
            setLoading(false);
            return;
        }

        try {
            console.log('Attempting to insert donation into Supabase');
            console.log('Request data:', data);

            // Wait for supabase to be loaded
            if (!window.supabase) {
                let retries = 0;
                while (!window.supabase && retries < 10) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    retries++;
                }
                if (!window.supabase) {
                    throw new Error('Supabase client not loaded');
                }
            }

            // Prepare data for Supabase insertion
            const donationData = {
                timestamp: new Date().toISOString(),
                donor_type: data.donorType || '',
                anonymous: data.anonymous === 'on',
                organization: data.organization || '',
                name: data.name || '',
                phone: data.phone || '',
                email: data.email || '',
                address: data.address || '',
                city: data.city || '',
                state: data.state || '',
                pincode: data.pincode || '',
                donation_categories: Array.isArray(data.donationCategories) ? data.donationCategories : [],

                // Money donation details (nested JSONB)
                money: data.money?.amount ? {
                    amount: data.money.amount,
                    currency: data.money.currency || 'INR',
                    paymentMethod: data.money.paymentMethod || '',
                    transactionRef: data.money.transactionRef || '',
                    receipt: data.money.receipt === 'Yes' ? 'Yes' : 'No'
                } : null,

                // Clothes donation details (nested JSONB)
                clothes: (data.clothes?.types || data.clothes?.condition || data.clothes?.count) ? {
                    types: data.clothes?.types ? (Array.isArray(data.clothes.types) ? data.clothes.types : [data.clothes.types]) : [],
                    condition: data.clothes?.condition || '',
                    count: data.clothes?.count || '',
                    sizes: data.clothes?.sizes || '',
                    notes: data.clothes?.notes || ''
                } : null,

                // Food donation details (nested JSONB)
                food: (data.food?.type || data.food?.quantity || data.food?.pickupAvailable) ? {
                    type: data.food?.type || '',
                    quantity: data.food?.quantity || '',
                    pickupAvailable: data.food?.pickupAvailable || '',
                    dropOffCenter: data.food?.dropOffCenter || '',
                    notes: data.food?.notes || ''
                } : null,

                // Other donation details (nested JSONB)
                other: data.other?.description ? {
                    description: data.other?.description || '',
                    quantity: data.other?.quantity || ''
                } : null,

                // Pickup details
                preferred_pickup_date: data.preferredDate || null,
                preferred_pickup_time: data.timeWindow || null,

                // Additional info
                files: data.files || null,
                notes: data.notes || null,

                status: 'Pending Review'
            };

            const { data: result, error } = await window.supabase
                .from('registrations')
                .insert([{
                    ...donationData,
                    type: 'donor'
                }])
                .select();

            if (error) {
                console.error('Supabase error:', error);
                showToast('An error occurred while submitting the form. Please try again.', 'error');
            } else {
                console.log('Supabase insertion successful:', result);
                showToast('Donation submitted successfully! Thank you for your generosity.', 'success');
                form.reset();
                // Reset conditional sections
                document.getElementById('moneySection').style.display = 'none';
                document.getElementById('clothesSection').style.display = 'none';
                document.getElementById('foodSection').style.display = 'none';
                document.getElementById('otherSection').style.display = 'none';
                document.getElementById('orgNameGroup').style.display = 'none';
                document.getElementById('dropOffGroup').style.display = 'none';
            }

        } catch (error) {
            console.error('Error submitting form:', error);
            showToast('An error occurred. Please try again later.', 'error');
        } finally {
            setLoading(false);
        }
    }

    function setLoading(isLoading) {
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            if (isLoading) {
                submitBtn.classList.add('button--loading');
            } else {
                submitBtn.classList.remove('button--loading');
            }
        }
    }
}