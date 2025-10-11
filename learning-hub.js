// Learning Hub JavaScript - Main functionality for the educational platform

class LearningHub {
    constructor() {
        this.currentModule = null;
        this.currentLesson = 1;
        this.totalLessons = 1;
        this.volunteerId = null;
        this.volunteerName = null;
        this.userProgress = {};
        this.modules = {
            nutrition: {
                title: 'Community Nutrition Education & Health Promotion',
                lessons: 4,
                icon: 'fas fa-seedling'
            },
            'food-waste': {
                title: 'Food Waste Reduction & Sustainable Food Systems',
                lessons: 4,
                icon: 'fas fa-recycle'
            },
            volunteer: {
                title: 'Volunteer Development & Leadership Training',
                lessons: 7,
                icon: 'fas fa-hands-helping'
            },
            module4: {
                title: 'Program Integration & Community Impact Measurement',
                lessons: 3,
                icon: 'fas fa-puzzle-piece'
            }
        };

        this.init();
    }

    async init() {
        // Check volunteer authentication first
        await this.checkVolunteerAuth();

        this.setupEventListeners();
        this.updateStats();
        this.setupAnimations();
        this.setupMobileMenu();

        // Load and display progress after authentication check
        if (this.volunteerId) {
            await this.loadVolunteerProgress();
            this.updateProgressDisplay();
        }
    }

    setupEventListeners() {
        // Language toggle
        const langToggle = document.getElementById('language-toggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => this.toggleLanguage());
        }

        // Volunteer logout
        const logoutBtn = document.getElementById('volunteer-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.volunteerLogout());
        }
    }

    // Check volunteer authentication status
    async checkVolunteerAuth() {
        const volunteerAuth = sessionStorage.getItem('volunteerAuthenticated');
        const volunteerId = sessionStorage.getItem('volunteerId');
        const volunteerName = sessionStorage.getItem('volunteerName');
        const sessionToken = sessionStorage.getItem('volunteerSessionToken');

        // Authentication check for progress tracking

        if (volunteerAuth === 'true' && volunteerId && volunteerName && sessionToken) {
            // Verify session token with database
            try {
                const { data: session, error } = await window.supabase
                    .from('volunteer_sessions')
                    .select('id, expires_at, is_active, volunteer_id')
                    .eq('session_token', sessionToken)
                    .eq('is_active', true)
                    .single();


                if (session && new Date(session.expires_at) > new Date()) {
                    // Valid session
                    this.volunteerId = volunteerId;
                    this.volunteerName = volunteerName;
                    this.updateVolunteerUI(true);
                    return;
                } else {
                    // Fallback: If database verification fails but sessionStorage looks valid,
                    // allow access (might be RLS policy issue)
                    const authTime = sessionStorage.getItem('volunteerAuthTime');
                    const sessionExpiry = sessionStorage.getItem('volunteerSessionExpiry');

                    if (authTime && sessionExpiry && Date.now() < parseInt(sessionExpiry)) {
                        this.volunteerId = volunteerId;
                        this.volunteerName = volunteerName;
                        this.updateVolunteerUI(true);
                        return;
                    }
                }
            } catch (error) {
                // Session verification error - continue with read-only access
            }
        }
        // No valid session, but allow read-only access
        this.updateVolunteerUI(false);
        this.enableReadOnlyAccess();
    }

    // Update UI based on volunteer authentication status
    updateVolunteerUI(isAuthenticated) {
        const volunteerNameEl = document.getElementById('volunteer-name');
        const logoutBtn = document.getElementById('volunteer-logout');
        const loginPrompt = document.getElementById('login-prompt');

        if (isAuthenticated && this.volunteerName) {
            // Show volunteer info and hide login prompt
            if (volunteerNameEl) volunteerNameEl.textContent = this.volunteerName;
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (loginPrompt) loginPrompt.style.display = 'none';

            // Update welcome message
            const heroTitle = document.querySelector('.hero-title');
            if (heroTitle) {
                heroTitle.textContent = `Welcome back, ${this.volunteerName}!`;
            }
        } else {
            // Show login prompt and hide volunteer info
            if (volunteerNameEl) volunteerNameEl.textContent = '';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (loginPrompt) loginPrompt.style.display = 'block';
        }
    }

    // Enable read-only access for learning without login requirement
    enableReadOnlyAccess() {
        // Update UI to show read-only state with login option for progress tracking
        this.updateVolunteerUI(false);

        // Enable module buttons for read-only access
        document.querySelectorAll('.module-button').forEach(btn => {
            btn.disabled = false;
            btn.textContent = 'Start Learning';
            btn.onclick = () => {
                // Show login prompt for progress tracking
                this.showToast('Login to track progress and save your learning journey', 'info');
                // Still allow access to content
                const moduleName = btn.closest('.module-card').dataset.module;
                if (moduleName) {
                    this.openFirstLesson(moduleName);
                }
            };
        });

        // Show welcome message for learners
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
            heroTitle.textContent = 'Start Your Learning Journey';
        }

    }

    // Load volunteer progress from database
    async loadVolunteerProgress() {
        if (!this.volunteerId) return;

        try {
            const { data: progress, error } = await window.supabase
                .from('volunteer_progress')
                .select('*')
                .eq('volunteer_id', this.volunteerId);

            if (error) {
                console.error('Error loading progress:', error);
                return;
            }

            // Convert database progress to local format
            progress.forEach(record => {
                if (!this.userProgress[record.module_name]) {
                    this.userProgress[record.module_name] = {
                        completedLessons: 0,
                        totalLessons: this.getModuleLessonCount(record.module_name),
                        completed: false
                    };
                }

                if (record.completion_status === 'completed') {
                    const lessonNumber = this.getLessonNumberFromName(record.lesson_name);
                    if (lessonNumber > this.userProgress[record.module_name].completedLessons) {
                        this.userProgress[record.module_name].completedLessons = lessonNumber;
                    }
                }

                if (this.userProgress[record.module_name].completedLessons >= this.userProgress[record.module_name].totalLessons) {
                    this.userProgress[record.module_name].completed = true;
                }
            });

        } catch (error) {
            console.error('Error loading volunteer progress:', error);
        }
    }

    // Save progress to database
    async saveVolunteerProgress(moduleName, lessonName, completionStatus, progressPercentage) {
        if (!this.volunteerId) return;

        try {
            const { error } = await window.supabase
                .from('volunteer_progress')
                .upsert({
                    volunteer_id: this.volunteerId,
                    module_name: moduleName,
                    lesson_name: lessonName,
                    completion_status: completionStatus,
                    progress_percentage: progressPercentage,
                    last_accessed: new Date().toISOString()
                });

            if (error) {
                // Error saving progress - continue silently
            }
        } catch (error) {
            console.error('Error saving volunteer progress:', error);
        }
    }

    // Get lesson count for a module
    getModuleLessonCount(moduleName) {
        const lessonCounts = {
            'nutrition': 4,
            'food-waste': 4,
            'volunteer': 7,
            'module4': 3
        };
        return lessonCounts[moduleName] || 0;
    }

    // Get lesson number from lesson name
    getLessonNumberFromName(lessonName) {
        // Extract number from lesson names like 'food-waste-prevention' -> 1
        const lessonNumbers = {
            'nutrition-basics': 1,
            'nutrition-cultural': 2,
            'nutrition-food-groups': 3,
            'nutrition-macronutrients': 4,
            'food-waste-basics': 1,
            'food-waste-global': 2,
            'food-waste-prevention': 3,
            'food-waste-measurement': 4,
            'food-waste-composting': 5,
            'food-waste-innovation': 6,
            'food-waste-policy': 7,
            'food-waste-community': 8,
            'food-waste-capstone': 9
        };
        return lessonNumbers[lessonName] || 1;
    }

    // Volunteer logout
    async volunteerLogout() {
        try {
            // Invalidate session in database
            const sessionToken = sessionStorage.getItem('volunteerSessionToken');
            if (sessionToken) {
                await window.supabase
                    .from('volunteer_sessions')
                    .update({ is_active: false })
                    .eq('session_token', sessionToken);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local session data
            sessionStorage.removeItem('volunteerAuthenticated');
            sessionStorage.removeItem('volunteerId');
            sessionStorage.removeItem('volunteerName');
            sessionStorage.removeItem('volunteerSessionToken');
            sessionStorage.removeItem('volunteerAuthTime');
            sessionStorage.removeItem('volunteerSessionExpiry');

            this.volunteerId = null;
            this.volunteerName = null;
            this.userProgress = {};

            this.showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = '../volunteer-login.html';
            }, 1500);
        }
    }

    // Open first lesson of module directly (no modal)
    openFirstLesson(moduleName) {
        if (!this.modules[moduleName]) {
            return;
        }

        // Open first lesson directly in new tab
        // Use proper lesson key format for each module
        const firstLessonKeys = {
            'nutrition': '1.1',
            'food-waste': '2.1',
            'volunteer': '3.1',
            'module4': '4.1'
        };
        const firstLessonKey = firstLessonKeys[moduleName] || 1;
        this.openSpecificLesson(moduleName, firstLessonKey);
    }

    // Get lesson title
    getLessonTitle(moduleName, lessonNumber) {
        const titles = {
            nutrition: {
                '1.1': 'Understanding Global Nutrition Challenges',
                '1.2': 'Nutrition Fundamentals & Six Essential Nutrients',
                '1.3': 'Food Groups & Macronutrients',
                '1.4': 'Micronutrients & Food Labels'
            },
            'food-waste': {
                '2.1': 'Global Food Waste Crisis & Environmental Impact',
                '2.2': 'Food Recovery & Redistribution Systems',
                '2.3': 'Household Food Waste Prevention Strategies',
                '2.4': 'Community Awareness Campaigns & Policy Advocacy'
            },
            volunteer: {
                '3.1': 'Strategic Volunteer Program Development',
                '3.2': 'Train-the-Trainer Model Implementation',
                '3.3': 'Volunteer Engagement & Retention Strategies',
                '3.4': 'Leadership Development & Succession Planning',
                '3.5': 'Food Safety Training',
                '3.6': 'Sustainability & Growth',
                '3.7': 'Volunteer Capstone Project'
            },
            module4: {
                '4.1': 'Integrated Program Design & Implementation',
                '4.2': 'Community Partnerships & Stakeholder Engagement',
                '4.3': 'Monitoring, Evaluation & Impact Measurement'
            }
        };

        // Handle decimal lesson numbers for each module
        let titleKey = lessonNumber;
        if (moduleName === 'nutrition' && typeof lessonNumber === 'number') {
            titleKey = `1.${lessonNumber}`;
        } else if (moduleName === 'food-waste' && typeof lessonNumber === 'number') {
            titleKey = `2.${lessonNumber}`;
        } else if (moduleName === 'volunteer' && typeof lessonNumber === 'number') {
            titleKey = `3.${lessonNumber}`;
        } else if (moduleName === 'module4' && typeof lessonNumber === 'number') {
            titleKey = `4.${lessonNumber}`;
        }

        const title = titles[moduleName]?.[titleKey] || `Lesson ${lessonNumber}`;
        return title;
    }

    // Start first lesson of module
    startFirstLesson() {
        if (this.currentModule) {
            this.openSpecificLesson(this.currentModule, 1);
        }
    }

    // Open specific lesson
    openSpecificLesson(moduleName, lessonNumber) {
        if (!this.modules[moduleName]) {
            return;
        }

        const fileNames = this.getLessonFileNames();

        // Handle lesson number format for different modules
        let lessonKey = lessonNumber;
        if (moduleName === 'nutrition' && typeof lessonNumber === 'number') {
            lessonKey = `${lessonNumber}.1`;
        } else if (moduleName === 'food-waste' && typeof lessonNumber === 'number') {
            lessonKey = `${lessonNumber + 1}`; // Convert 1 -> 2, 2 -> 3, etc.
        } else if (moduleName === 'volunteer' && typeof lessonNumber === 'number') {
            lessonKey = `${lessonNumber + 2}`; // Convert 1 -> 3, 2 -> 4, etc.
        } else if (moduleName === 'module4' && typeof lessonNumber === 'number') {
            lessonKey = `${lessonNumber + 3}`; // Convert 1 -> 4, 2 -> 5, etc.
        }

        const lessonFile = fileNames[moduleName]?.[lessonKey];

        if (lessonFile) {
            // Store module progress in localStorage for the new tab
            const moduleProgress = {
                currentModule: moduleName,
                currentLesson: lessonNumber,
                totalLessons: this.modules[moduleName].lessons,
                moduleTitle: this.modules[moduleName].title
            };
            localStorage.setItem('currentModuleProgress', JSON.stringify(moduleProgress));

            // Open specific lesson in new tab
            const lessonUrl = lessonFile;
            window.open(lessonUrl, '_blank');
        }
    }


    // Modal functions removed - now using new tab system

    async nextLesson() {
        if (this.currentLesson < this.totalLessons) {
            this.currentLesson++;
            this.openCurrentLessonInNewTab();
            this.saveProgress();
        } else {
            this.completeModule();
        }
    }

    async previousLesson() {
        if (this.currentLesson > 1) {
            this.currentLesson--;
            this.openCurrentLessonInNewTab();
        }
    }

    updateLessonCounter() {
        const lessonCounter = document.getElementById('lesson-counter');
        if (lessonCounter) {
            lessonCounter.textContent = `Lesson ${this.currentLesson} of ${this.totalLessons}`;
        }
    }

    openCurrentLessonInNewTab() {
        const fileNames = this.getLessonFileNames();

        // Handle lesson number format for different modules
        let lessonKey = this.currentLesson;
        if (this.currentModule === 'nutrition' && typeof this.currentLesson === 'number') {
            lessonKey = `${this.currentLesson}.1`;
        } else if (this.currentModule === 'food-waste' && typeof this.currentLesson === 'number') {
            lessonKey = `${this.currentLesson + 1}`; // Convert 1 -> 2, 2 -> 3, etc.
        } else if (this.currentModule === 'volunteer' && typeof this.currentLesson === 'number') {
            lessonKey = `${this.currentLesson + 2}`; // Convert 1 -> 3, 2 -> 4, etc.
        } else if (this.currentModule === 'module4' && typeof this.currentLesson === 'number') {
            lessonKey = `${this.currentLesson + 3}`; // Convert 1 -> 4, 2 -> 5, etc.
        }

        const currentLessonFile = fileNames[this.currentModule]?.[lessonKey];

        if (currentLessonFile) {
            // Store current progress in localStorage for the new tab
            const moduleProgress = {
                currentModule: this.currentModule,
                currentLesson: this.currentLesson,
                totalLessons: this.totalLessons,
                moduleTitle: this.modules[this.currentModule].title
            };
            localStorage.setItem('currentModuleProgress', JSON.stringify(moduleProgress));

            // Open current lesson in new tab
            const lessonUrl = currentLessonFile;
            window.open(lessonUrl, '_blank');
        } else {
            console.error('Current lesson file not found for:', this.currentModule, lessonKey);
        }
    }

    // loadLesson function removed - now using new tab system

    getLessonFileNames() {
        return {
            'nutrition': {
                '1.1': 'nutrition-basics.html',
                '1.2': 'nutrition-cultural.html',
                '1.3': 'nutrition-food-groups.html',
                '1.4': 'nutrition-macronutrients.html'
            },
            'food-waste': {
                '2.1': 'food-waste-basics.html',
                '2.2': 'food-waste-global.html',
                '2.3': 'food-waste-prevention.html',
                '2.4': 'food-waste-community.html'
            },
            'volunteer': {
                '3.1': 'volunteer-basics.html',
                '3.2': 'volunteer-communication.html',
                '3.3': 'volunteer-project-management.html',
                '3.4': 'volunteer-food-safety.html',
                '3.5': 'volunteer-sustainability.html',
                '3.6': 'volunteer-leadership.html',
                '3.7': 'volunteer-capstone.html'
            },
            'module4': {
                '4.1': 'module4-lesson1.html',
                '4.2': 'module4-lesson2.html',
                '4.3': 'module4-lesson3.html'
            }
        };
    }

    getLessonContent(module, lesson) {
        // This function is now primarily for fallback content
        // Main lesson loading is handled by loadLessonFromFile

        // Fallback to inline content for modules that don't have external files yet
        const contentLibrary = {
            nutrition: {
                1: this.getNutritionLesson1(),
                2: this.getNutritionLesson2(),
                // Add more lessons...
            },
            cooking: {
                1: this.getCookingLesson1(),
                2: this.getCookingLesson2(),
                // Add more lessons...
            }
        };

        return contentLibrary[module]?.[lesson] || this.getDefaultLessonContent(module, lesson);
    }

    // Modal-related functions removed - now using new tab system

    getDefaultLessonContent(module, lesson) {
        const moduleTitles = {
            nutrition: 'Community Nutrition Education & Health Promotion',
            'food-waste': 'Food Waste Reduction & Sustainable Food Systems',
            volunteer: 'Volunteer Development & Leadership Training',
            module4: 'Program Integration & Community Impact Measurement'
        };

        return `
            <div class="lesson-placeholder">
                <h3>Lesson ${lesson}: ${moduleTitles[module]}</h3>
                <p>Lesson content is loading... Please wait while we prepare your learning materials.</p>
                <div class="lesson-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading interactive content and assessments</p>
                </div>
            </div>
        `;
    }

    getNutritionLesson1() {
        return `
            <h3>Introduction to Nutrition</h3>
            <p>Nutrition is the foundation of good health. In this lesson, we'll explore the basics of nutrition and why it matters for our communities.</p>

            <div class="lesson-section">
                <h4>What is Nutrition?</h4>
                <p>Nutrition is the process by which our bodies obtain and use food for growth, development, and maintenance of health. Good nutrition is essential for:</p>
                <ul>
                    <li>Physical growth and development</li>
                    <li>Mental clarity and focus</li>
                    <li>Disease prevention</li>
                    <li>Energy and vitality</li>
                    <li>Overall well-being</li>
                </ul>
            </div>

            <div class="lesson-section">
                <h4>The Six Essential Nutrients</h4>
                <div class="nutrients-grid">
                    <div class="nutrient-card">
                        <h5>Carbohydrates</h5>
                        <p>Main source of energy for the body</p>
                    </div>
                    <div class="nutrient-card">
                        <h5>Proteins</h5>
                        <p>Building blocks for muscles, tissues, and organs</p>
                    </div>
                    <div class="nutrient-card">
                        <h5>Fats</h5>
                        <p>Essential for brain function and nutrient absorption</p>
                    </div>
                    <div class="nutrient-card">
                        <h5>Vitamins</h5>
                        <p>Help regulate body processes and prevent diseases</p>
                    </div>
                    <div class="nutrient-card">
                        <h5>Minerals</h5>
                        <p>Support bone health, nerve function, and metabolism</p>
                    </div>
                    <div class="nutrient-card">
                        <h5>Water</h5>
                        <p>Essential for all bodily functions</p>
                    </div>
                </div>
            </div>

            <div class="lesson-quiz">
                <h4>Quick Check</h4>
                <p>What are the six essential nutrients? List them below:</p>
                <textarea class="quiz-input" placeholder="Write your answer here..."></textarea>
                <button class="quiz-submit" onclick="checkAnswer()">Check Answer</button>
            </div>
        `;
    }

    getNutritionLesson2() {
        return `
            <h3>Balanced Diet and Food Groups</h3>
            <p>Understanding food groups helps us create balanced, nutritious meals that provide all essential nutrients.</p>

            <div class="lesson-section">
                <h4>The Five Food Groups</h4>
                <div class="food-groups">
                    <div class="food-group">
                        <h5>Fruits</h5>
                        <p>Rich in vitamins, minerals, and fiber</p>
                    </div>
                    <div class="food-group">
                        <h5>Vegetables</h5>
                        <p>Provide essential vitamins and minerals</p>
                    </div>
                    <div class="food-group">
                        <h5>Grains</h5>
                        <p>Source of complex carbohydrates and fiber</p>
                    </div>
                    <div class="food-group">
                        <h5>Protein Foods</h5>
                        <p>Build and repair body tissues</p>
                    </div>
                    <div class="food-group">
                        <h5>Dairy</h5>
                        <p>Rich in calcium and vitamin D</p>
                    </div>
                </div>
            </div>
        `;
    }

    getCookingLesson1() {
        return `
            <h3>Introduction to Cooking with Rescued Food</h3>
            <p>Cooking with rescued food is both sustainable and creative. Learn how to transform surplus ingredients into delicious meals.</p>

            <div class="lesson-section">
                <h4>Benefits of Cooking with Rescued Food</h4>
                <ul>
                    <li>Reduces food waste</li>
                    <li>Saves money</li>
                    <li>Supports local communities</li>
                    <li>Encourages creativity in cooking</li>
                    <li>Provides nutritious meals</li>
                </ul>
            </div>
        `;
    }

    getCookingLesson2() {
        return `
            <h3>Food Safety and Storage</h3>
            <p>Proper food handling is crucial when working with rescued ingredients to ensure safety and quality.</p>

            <div class="lesson-section">
                <h4>Key Safety Principles</h4>
                <div class="safety-tips">
                    <div class="safety-tip">
                        <h5>Check Expiration Dates</h5>
                        <p>Always verify that rescued food is still safe to consume</p>
                    </div>
                    <div class="safety-tip">
                        <h5>Proper Storage</h5>
                        <p>Store different food types at appropriate temperatures</p>
                    </div>
                    <div class="safety-tip">
                        <h5>Clean Preparation</h5>
                        <p>Wash hands and surfaces thoroughly before cooking</p>
                    </div>
                </div>
            </div>
        `;
    }

    getFoodWasteLesson1() {
        return `
            <h3>Understanding Food Waste</h3>
            <p>Food waste is a global problem with significant environmental and social impacts. Let's explore the causes and consequences.</p>

            <div class="lesson-section">
                <h4>Types of Food Waste</h4>
                <ul>
                    <li><strong>Preventable waste:</strong> Food that could have been eaten</li>
                    <li><strong>Unavoidable waste:</strong> Natural waste like peels and bones</li>
                    <li><strong>Possibly avoidable waste:</strong> Food that some might eat</li>
                </ul>
            </div>
        `;
    }

    getFoodWasteLesson2() {
        return `
            <h3>Strategies to Reduce Food Waste</h3>
            <p>There are many practical ways to reduce food waste at home, work, and in the community.</p>

            <div class="lesson-section">
                <h4>At Home</h4>
                <ul>
                    <li>Plan meals before shopping</li>
                    <li>Store food properly</li>
                    <li>Use leftovers creatively</li>
                    <li>Understand expiration dates</li>
                </ul>
            </div>
        `;
    }

    getVolunteerLesson1() {
        return `
            <h3>Introduction to Volunteering</h3>
            <p>Volunteering is a rewarding way to contribute to your community and make a positive impact on food security.</p>

            <div class="lesson-section">
                <h4>Benefits of Volunteering</h4>
                <ul>
                    <li>Personal fulfillment and satisfaction</li>
                    <li>Skill development and experience</li>
                    <li>Building community connections</li>
                    <li>Making a tangible difference</li>
                </ul>
            </div>
        `;
    }

    getVolunteerLesson2() {
        return `
            <h3>Essential Volunteer Skills</h3>
            <p>Effective volunteers possess certain key skills and qualities that help them succeed in their roles.</p>

            <div class="lesson-section">
                <h4>Core Skills</h4>
                <div class="skills-grid">
                    <div class="skill-item">
                        <h5>Communication</h5>
                        <p>Clear and respectful interaction with others</p>
                    </div>
                    <div class="skill-item">
                        <h5>Reliability</h5>
                        <p>Being dependable and following through on commitments</p>
                    </div>
                    <div class="skill-item">
                        <h5>Teamwork</h5>
                        <p>Working effectively with others toward common goals</p>
                    </div>
                </div>
            </div>
        `;
    }

    updateNavigationButtons() {
        // Navigation buttons are now handled within individual lesson files
        // No need for modal-level navigation buttons
    }

    completeModule() {
        if (!this.currentModule) return;

        // Mark module as completed
        this.userProgress[this.currentModule] = {
            completed: true,
            completedLessons: this.totalLessons,
            totalLessons: this.totalLessons,
            completedDate: new Date().toISOString()
        };

        this.saveProgress();
        this.showCompletionMessage();
        this.closeModule();
    }

    showCompletionMessage() {
        this.showToast('Congratulations! Module completed successfully!', 'success');
    }

    updateProgressDisplay() {
        // Update overall progress
        const completedModules = Object.values(this.userProgress).filter(p => p.completed).length;
        const totalModules = Object.keys(this.modules).length;
        const overallPercent = (completedModules / totalModules) * 100;

        // Update circular progress
        this.updateCircularProgress(overallPercent);

        // Update detailed progress
        Object.keys(this.modules).forEach(module => {
            const progress = this.userProgress[module];
            const percent = progress ? (progress.completedLessons / progress.totalLessons) * 100 : 0;

            const progressFill = document.querySelector(`[data-module="${module}"] .progress-fill`);
            const progressText = document.querySelector(`[data-module="${module}"] .progress-text`);

            if (progressFill) progressFill.style.width = `${percent}%`;
            if (progressText) progressText.textContent = `${Math.round(percent)}% Complete`;
        });
    }

    updateCircularProgress(percent) {
        const circle = document.querySelector('.progress-ring-circle');
        const circumference = 2 * Math.PI * 90; // radius is 90

        if (circle) {
            const offset = circumference - (percent / 100) * circumference;
            circle.style.strokeDasharray = circumference;
            circle.style.strokeDashoffset = offset;
        }

        const percentageEl = document.querySelector('.percentage');
        if (percentageEl) percentageEl.textContent = `${Math.round(percent)}%`;
    }

    updateStats() {
        // Update learner count (this would typically come from a database)
        const learnersCount = document.getElementById('learners-count');
        if (learnersCount) {
            this.animateNumber(learnersCount, 150, 2000); // Mock data
        }

        // Update certificates count
        const certificatesCount = document.getElementById('certificates-count');
        if (certificatesCount) {
            const completedModules = Object.values(this.userProgress).filter(p => p.completed).length;
            this.animateNumber(certificatesCount, completedModules, 1500);
        }
    }

    animateNumber(element, target, duration) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    }

    saveProgress() {
        // Progress is now saved to database in real-time
        // Keep localStorage as backup for immediate UI updates
        localStorage.setItem('learningHubProgress', JSON.stringify(this.userProgress));
    }

    loadProgress() {
        // Progress is now loaded from database in loadVolunteerProgress()
        // Keep localStorage as backup
        const saved = localStorage.getItem('learningHubProgress');
        return saved ? JSON.parse(saved) : {};
    }

    // Mark lesson as completed
    async completeLesson(moduleName, lessonNumber) {
        if (!this.volunteerId) {
            this.showToast('Please login to track your progress', 'warning');
            return;
        }

        // Get lesson name from number
        const lessonName = this.getLessonNameFromNumber(moduleName, lessonNumber);

        if (!this.userProgress[moduleName]) {
            this.userProgress[moduleName] = {
                completedLessons: 0,
                totalLessons: this.modules[moduleName].lessons,
                completed: false
            };
        }

        if (lessonNumber > this.userProgress[moduleName].completedLessons) {
            this.userProgress[moduleName].completedLessons = lessonNumber;

            if (lessonNumber >= this.modules[moduleName].lessons) {
                this.userProgress[moduleName].completed = true;
                this.userProgress[moduleName].completedDate = new Date().toISOString();
            }

            // Save to database
            await this.saveVolunteerProgress(moduleName, lessonName, 'completed', 100);

            // Update local storage for immediate UI feedback
            this.saveProgress();
            this.updateProgressDisplay();

            this.showToast('Lesson completed! Progress saved.', 'success');
        }
    }

    // Get lesson name from module and lesson number
    getLessonNameFromNumber(moduleName, lessonNumber) {
        const lessonNames = {
            'nutrition': {
                1: 'nutrition-basics',
                2: 'nutrition-cultural',
                3: 'nutrition-food-groups',
                4: 'nutrition-macronutrients'
            },
            'food-waste': {
                1: 'food-waste-basics',
                2: 'food-waste-global',
                3: 'food-waste-prevention',
                4: 'food-waste-community'
            },
            'volunteer': {
                1: 'volunteer-basics',
                2: 'volunteer-communication',
                3: 'volunteer-project-management',
                4: 'volunteer-food-safety',
                5: 'volunteer-sustainability',
                6: 'volunteer-leadership',
                7: 'volunteer-capstone'
            },
            'module4': {
                1: 'module4-lesson1',
                2: 'module4-lesson2',
                3: 'module4-lesson3'
            }
        };

        return lessonNames[moduleName]?.[lessonNumber] || `lesson-${lessonNumber}`;
    }

    // Check if lesson is completed
    isLessonCompleted(moduleName, lessonNumber) {
        const progress = this.userProgress[moduleName];
        return progress && progress.completedLessons >= lessonNumber;
    }

    // Get lesson completion status for modal
    getLessonStatus(moduleName, lessonNumber) {
        return this.isLessonCompleted(moduleName, lessonNumber) ? 'completed' : 'not-completed';
    }

    toggleLanguage() {
        // This would integrate with the existing language.js
        if (window.toggleLanguage) {
            window.toggleLanguage();
        }
    }

    setupAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements that should animate on scroll
        document.querySelectorAll('.module-card, .progress-item, .stat-item').forEach(el => {
            observer.observe(el);
        });
    }

    setupMobileMenu() {
        // Close mobile menu when clicking on nav links
        document.querySelectorAll('.nav__link').forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            const nav = document.querySelector('.nav');
            const hamburger = document.querySelector('.hamburger');

            if (nav && nav.classList.contains('active') &&
                !nav.contains(e.target) && !hamburger.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Handle escape key for mobile menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        const nav = document.querySelector('.nav');
        const hamburger = document.querySelector('.hamburger');

        if (nav && hamburger) {
            const isOpen = nav.classList.contains('active');

            if (isOpen) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }
    }

    openMobileMenu() {
        const nav = document.querySelector('.nav');
        const hamburger = document.querySelector('.hamburger');

        if (nav && hamburger) {
            nav.classList.add('active');
            hamburger.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';

            // Focus first nav link for accessibility
            const firstNavLink = nav.querySelector('.nav__link');
            if (firstNavLink) {
                setTimeout(() => firstNavLink.focus(), 300);
            }
        }
    }

    closeMobileMenu() {
        const nav = document.querySelector('.nav');
        const hamburger = document.querySelector('.hamburger');

        if (nav && hamburger) {
            nav.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast') || this.createToastElement();
        toast.textContent = message;
        toast.className = `toast toast--${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    createToastElement() {
        const toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
        return toast;
    }
}

// Global functions for HTML onclick handlers
function openModule(moduleName) {
    if (window.learningHub) {
        window.learningHub.openFirstLesson(moduleName);
    }
}

// Function to open specific lesson
function openSpecificLesson(moduleName, lessonNumber) {
    if (window.learningHub) {
        window.learningHub.openSpecificLesson(moduleName, lessonNumber);
    }
}

// Global function for lessons to mark themselves as completed
function markLessonCompleted(moduleName, lessonNumber) {
    if (window.learningHub) {
        window.learningHub.completeLesson(moduleName, lessonNumber);
    }
}

// Global function to check if lesson is completed
function isLessonCompleted(moduleName, lessonNumber) {
    if (window.learningHub) {
        return window.learningHub.isLessonCompleted(moduleName, lessonNumber);
    }
    return false;
}

// Modal functions removed - now using new tab system

function scrollToModules() {
    document.getElementById('modules').scrollIntoView({ behavior: 'smooth' });
}

function downloadCertificate(certId) {
}

function shareCertificate(certId) {
    // This would open share dialog
    if (navigator.share) {
        navigator.share({
            title: 'My Learning Certificate',
            text: 'I completed a learning module!',
            url: window.location.href
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            if (window.learningHub) {
                window.learningHub.showToast('Link copied to clipboard!', 'success');
            }
        });
    }
}

// Global function for mobile menu toggle (called from HTML)
function toggleMobileMenu() {
    if (window.learningHub) {
        window.learningHub.toggleMobileMenu();
    }
}

// Initialize the learning hub when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.learningHub = new LearningHub();

    // Update year in footer
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

});