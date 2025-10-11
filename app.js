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

// Environment and Privacy Controls
const ENV = {
    isProduction: () => window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost',
    isDevelopment: () => window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost',
    shouldHideSupabase: () => true, // Always hide Supabase usage from users
    enableLogging: () => ENV.isDevelopment() && localStorage.getItem('debug') === 'true'
};

// Safe logging function that respects privacy settings
const logger = {
    info: (message, data) => {
        if (ENV.enableLogging() && !ENV.shouldHideSupabase()) {
            console.log(`ℹ️ ${message}`, data || '');
        }
    },
    warn: (message, data) => {
        if (ENV.enableLogging()) {
            console.warn(`⚠️ ${message}`, data || '');
        }
    },
    error: (message, data) => {
        if (ENV.enableLogging()) {
            console.error(`❌ ${message}`, data || '');
        }
    },
    privacy: (message) => {
        if (ENV.enableLogging()) {
            console.log(`🔒 ${message}`);
        }
    }
};

// Load Supabase client dynamically - Privacy Optimized version
const loadSupabaseClient = (() => {
    let supabasePromise = null;

    return () => {
        if (window.supabaseClient) {
            logger.privacy('Using existing Supabase client');
            return Promise.resolve(window.supabaseClient);
        }

        if (supabasePromise) {
            logger.privacy('Using pending Supabase promise');
            return supabasePromise;
        }

        supabasePromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                setTimeout(() => {
                    if (typeof supabase !== 'undefined' && supabase.createClient) {
                        const supabaseUrl = 'https://pqvsulbbeuwtlngggkgc.supabase.co';
                        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdnN1bGJiZXV3dGxuZ2dna2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTA0NzMsImV4cCI6MjA3NTA4NjQ3M30.PZS_vUoogiKedshNOZAS0sYZT0cUxNM-3CkovLsj6Po';

                        window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
                        window.supabase = window.supabaseClient;
                        resolve(window.supabaseClient);
                    } else {
                        logger.error('Supabase library not loaded properly');
                        reject(new Error('Supabase library not loaded properly'));
                    }
                }, 50);
            };
            script.onerror = () => {
                logger.error('Failed to load Supabase script');
                reject(new Error('Failed to load Supabase script'));
            };
            document.head.appendChild(script);
        });

        return supabasePromise;
    };
})();



document.addEventListener('DOMContentLoaded', () => {
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
});

// This function is called after the form HTML is loaded into the page
function initializeForm() {
    const form = document.getElementById('registration-form');
    if (!form) return;

    const submitBtn = document.getElementById('submit-btn');
    // Load Supabase client
    loadSupabaseClient().then(() => {
    }).catch(error => {
        // Error loading Supabase client - continue silently
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
                showToast('An error occurred while submitting the form. Please try again.', 'error');
            } else {
                showToast('Registration successful! A confirmation email has been sent.', 'success');
                form.reset();
                window.location.href = 'dashboard.html';
            }

        } catch (error) {
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

// This function is called after the donation form HTML is loaded into the page
function initializeDonationForm() {
    const form = document.getElementById('donation-form');
    if (!form) return;

    const submitBtn = document.getElementById('submit-btn');

    // Load Supabase client
    loadSupabaseClient().then(() => {
    }).catch(error => {
        // Error loading Supabase client - continue silently
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
                // Handle nested keys like money.amount, food.type, preferredPickup.date, etc.
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

        // Spam check
        if (data.website) {
            logger.warn('Spam detected in donation form');
            setLoading(false);
            return;
        }

        try {
            logger.privacy('Processing donation form submission');

            // Wait for backend client to be loaded
            if (!window.supabase) {
                let retries = 0;
                while (!window.supabase && retries < 10) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    retries++;
                }
                if (!window.supabase) {
                    throw new Error('Backend client not loaded');
                }
            }

            // Prepare data for backend insertion
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
                    types: Array.isArray(data.clothes?.types) ? data.clothes.types : (data.clothes?.types ? [data.clothes.types] : []),
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

                // Pickup details - fix the field name mapping
                preferred_pickup_date: data.preferredPickup?.date || null,
                preferred_pickup_time: data.preferredPickup?.timeWindow || null,

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
                logger.error('Donation submission failed');
                showToast('An error occurred while submitting the form. Please try again.', 'error');
            } else {
                logger.privacy('Donation submitted successfully');

                // Show epic full-screen celebration
                showCelebrationToast('Donation submitted successfully! Thank you for your incredible generosity!', 'success');

                // Reset form after celebration starts (so user sees the celebration)
                setTimeout(() => {
                    form.reset();
                }, 1000);
                // Reset conditional sections
                document.getElementById('moneySection').style.display = 'none';
                document.getElementById('clothesSection').style.display = 'none';
                document.getElementById('foodSection').style.display = 'none';
                document.getElementById('otherSection').style.display = 'none';
                document.getElementById('orgNameGroup').style.display = 'none';
                document.getElementById('dropOffGroup').style.display = 'none';
            }

        } catch (error) {
            logger.error('Donation form error');
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


// Optimized initialization - single DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all core functionality
    initializeApp();
});

// Main initialization function
function initializeApp() {
    logger.privacy('Initializing application features');

    // Initialize hamburger menu
    initializeHamburgerMenu();

    // Initialize smooth scrolling
    initializeSmoothScrolling();

    // Initialize button effects
    initializeButtonEffects();

    // Initialize footer year animation
    initializeFooterYear();

    // Initialize dark mode toggle
    initializeDarkModeToggle();

    // Initialize scroll animations
    initializeScrollAnimations();

    // Initialize image slider
    initializeImageSlider();

    // Initialize animated counters
    initializeAnimatedCounters();

    // Initialize rotating text
    initializeRotatingText();

    logger.privacy('Application initialization complete');
}

// Hamburger Menu Toggle - Optimized
function initializeHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('.nav');

    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !isExpanded);
        });

        // Close menu when clicking on mobile menu links
        const navLinks = nav.querySelectorAll('.nav__link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                setTimeout(() => {
                    hamburger.classList.remove('active');
                    nav.classList.remove('active');
                    hamburger.setAttribute('aria-expanded', 'false');
                }, 100);
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !nav.contains(e.target)) {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }
}

// Smooth Scrolling - Optimized
function initializeSmoothScrolling() {
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
}

// Enhanced button click effects - Optimized
function initializeButtonEffects() {
    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener('click', function(e) {
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
}

// Dynamic footer year animation - Optimized
function initializeFooterYear() {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        let displayYear = currentYear - 5;

        function animateYear() {
            if (displayYear <= currentYear) {
                yearElement.textContent = displayYear;
                displayYear++;
                setTimeout(animateYear, 100);
            }
        }

        setTimeout(animateYear, 1000);
    }
}

// Dark Mode Toggle - Optimized
function initializeDarkModeToggle() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        const currentTheme = localStorage.getItem('theme') || 'light';
        if (currentTheme === 'dark') {
            document.body.classList.add('dark-mode');
            updateDarkModeIcon(true);
        }

        darkModeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateDarkModeIcon(isDark);
        });

        function updateDarkModeIcon(isDark) {
            const icon = darkModeToggle.querySelector('.dark-mode-toggle__icon');
            if (icon) {
                icon.textContent = isDark ? '☀️' : '🌙';
            }
        }
    }
}

// Scroll-triggered animations - Optimized
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
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

    document.querySelectorAll('.animate-on-scroll, .animate-fade-in, .animate-slide-up, .animate-scale-up').forEach(el => {
        observer.observe(el);
    });
}

// Image Slider - Optimized
function initializeImageSlider() {
    const slider = document.querySelector('.image-slider');
    if (slider) {
        const slides = slider.querySelectorAll('.slide');
        const prevBtn = slider.querySelector('.prev');
        const nextBtn = slider.querySelector('.next');
        const sliderContainer = slider.querySelector('.slider-container');

        let currentSlide = 0;
        let autoPlayInterval;
        let isPaused = false;

        function updateSlider() {
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === currentSlide);
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

        function startAutoPlay() {
            if (autoPlayInterval) clearInterval(autoPlayInterval);
            autoPlayInterval = setInterval(nextSlide, 4000);
        }

        function pauseAutoPlay() {
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
            }
        }

        // Initialize slider
        if (slides.length > 0) {
            updateSlider();
            startAutoPlay();

            // Event listeners
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    pauseAutoPlay();
                    previousSlide();
                    setTimeout(startAutoPlay, 2000);
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    pauseAutoPlay();
                    nextSlide();
                    setTimeout(startAutoPlay, 2000);
                });
            }

            // Touch/swipe support
            if (sliderContainer) {
                let startX = 0, endX = 0;

                sliderContainer.addEventListener('touchstart', (e) => {
                    startX = e.touches[0].clientX;
                });

                sliderContainer.addEventListener('touchend', (e) => {
                    endX = e.changedTouches[0].clientX;
                    const diff = startX - endX;
                    const threshold = 50;

                    if (Math.abs(diff) > threshold) {
                        pauseAutoPlay();
                        if (diff > 0) {
                            nextSlide();
                        } else {
                            previousSlide();
                        }
                        setTimeout(startAutoPlay, 2000);
                    }
                });
            }
        }
    }
}

// Animated counters - Optimized
function initializeAnimatedCounters() {
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

    const statsSection = document.querySelector('.hero__content');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }
}

// Rotating text - Optimized
function initializeRotatingText() {
    // Rotating facts for hero subtitle
    const rotatingSubtitle = document.getElementById('rotating-subtitle');
    if (rotatingSubtitle) {
        function getTranslatedFacts() {
            return [
                window.translate ? window.translate('crisis.fact1') : "Every 3 seconds, a life is lost to hunger - This translates to approximately 25,000 deaths daily, with children being most vulnerable as one child dies from malnutrition every 10 seconds.",
                window.translate ? window.translate('crisis.fact2') : "1.05 billion tonnes of food wasted annually - Despite 733 million people facing hunger daily, we waste enough food to feed billions. This represents 40% of all food produced globally.",
                window.translate ? window.translate('crisis.fact3') : "Every minute, 2,000 tonnes of food are discarded - Based on the annual waste of 1.05 billion tonnes, this equals massive quantities of edible food being thrown away while 345 million people face acute hunger.",
                window.translate ? window.translate('crisis.fact4') : "A truckload of textiles is wasted every second - This equals 92 million tonnes of textile waste annually, with most ending up in landfills or being incinerated.",
                window.translate ? window.translate('crisis.fact5') : "Garment lifespan has dropped 36% in 15 years - Average clothing is worn only 7-10 times before disposal, while less than 1% of textile waste gets recycled into new clothing.",
                window.translate ? window.translate('crisis.fact6') : "60 billion garments thrown away yearly - With 100 billion new garments produced annually, and three out of five articles discarded within a year of production, the fast fashion cycle creates enormous waste.",
                window.translate ? window.translate('crisis.fact7') : "Fashion produces 8-10% of global carbon emissions - The industry's environmental footprint rivals entire countries, while textile production consumes 20,000 litres of water per kilogram of cotton.",
                window.translate ? window.translate('crisis.fact8') : "Food waste generates 8-10% of global greenhouse gases - Wasted food occupies nearly 30% of the world's agricultural land while contributing significantly to climate change.",
                window.translate ? window.translate('crisis.fact9') : "Together, these sectors waste resources that could sustain millions - The combination of food and clothing waste represents a massive misallocation of resources in a world where basic needs remain unmet."
            ];
        }

        let crisisFacts = getTranslatedFacts();
        let currentFactIndex = 0;

        function rotateSubtitle() {
            if (rotatingSubtitle) {
                rotatingSubtitle.classList.remove('fade-in');
                rotatingSubtitle.classList.add('fade-out');

                setTimeout(() => {
                    currentFactIndex = (currentFactIndex + 1) % crisisFacts.length;
                    rotatingSubtitle.textContent = crisisFacts[currentFactIndex];
                    rotatingSubtitle.classList.remove('fade-out');
                    rotatingSubtitle.classList.add('fade-in');
                }, 800);
            }
        }

        // Listen for language change events
        document.addEventListener('languageChanged', () => {
            crisisFacts = getTranslatedFacts();
        });

        document.addEventListener('languageChange', () => {
            crisisFacts = getTranslatedFacts();
        });

        setTimeout(() => {
            setInterval(rotateSubtitle, 12000);
        }, 3000);
    }
}

// This function is called after the form HTML is loaded into the page
function initializeForm() {
    const form = document.getElementById('registration-form');
    if (!form) return;

    const submitBtn = document.getElementById('submit-btn');
    // Load Supabase client (hidden from users for privacy)
    loadSupabaseClient().then(() => {
        logger.privacy('Backend client ready for registration form');
    }).catch(error => {
        logger.error('Backend client failed to load');
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
            setLoading(false);
            return;
        }

        try {

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
                showToast('An error occurred while submitting the form. Please try again.', 'error');
            } else {
                showToast('Registration successful! A confirmation email has been sent.', 'success');
                form.reset();
                window.location.href = 'dashboard.html';
            }

        } catch (error) {
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

// EPIC FULL-SCREEN CELEBRATION for donation success
function showCelebrationToast(message, type = 'success') {
    console.log('🚀 Triggering EPIC full-screen celebration...');

    const fullscreenCelebration = document.getElementById('fullscreen-celebration');

    if (!fullscreenCelebration) {
        console.error('Full-screen celebration element not found!');
        // Fallback to regular toast
        showToast('Donation submitted successfully! Thank you for your incredible generosity.', 'success');
        return;
    }

    // Show full-screen celebration
    fullscreenCelebration.classList.add('show');

    console.log('🎉 EPIC Full-screen celebration displayed!');

    // Hide celebration after 6 seconds and redirect to top
    setTimeout(() => {
        fullscreenCelebration.classList.remove('show');
        console.log('🎊 Full-screen celebration completed');

        // Redirect to home page (top of website)
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);

    }, 6000);
}

// Test function for epic celebration (for debugging)
window.testEpicCelebration = function() {
    console.log('🧪 Testing EPIC celebration...');
    showCelebrationToast('Test donation successful! 🎉', 'success');
};

// Test function for celebration toast (for debugging)
window.testCelebrationToast = function() {
    console.log('🧪 Testing celebration toast...');
    showCelebrationToast('Test celebration message! 🎉', 'success');
};

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = toast?.querySelector('.toast__message');

    if (!toast || !toastMessage) {
        console.error('Toast element not found!');
        return;
    }

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

// This function is called after the donation form HTML is loaded into the page
function initializeDonationForm() {
    const form = document.getElementById('donation-form');
    if (!form) return;

    const submitBtn = document.getElementById('submit-btn');

    // Load backend client (hidden from users for privacy)
    loadSupabaseClient().then(() => {
        logger.privacy('Backend client ready for donation form');
    }).catch(error => {
        logger.error('Backend client failed to load');
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
                // Handle nested keys like money.amount, food.type, preferredPickup.date, etc.
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
            setLoading(false);
            return;
        }

        try {

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
                    types: Array.isArray(data.clothes?.types) ? data.clothes.types : (data.clothes?.types ? [data.clothes.types] : []),
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

                // Pickup details - fix the field name mapping
                preferred_pickup_date: data.preferredPickup?.date || null,
                preferred_pickup_time: data.preferredPickup?.timeWindow || null,

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
                showToast('An error occurred while submitting the form. Please try again.', 'error');
            } else {
                showCelebrationToast('Donation submitted successfully! Thank you for your incredible generosity!', 'success');

                // Reset form after celebration starts
                setTimeout(() => {
                    form.reset();
                }, 1000);
                // Reset conditional sections
                document.getElementById('moneySection').style.display = 'none';
                document.getElementById('clothesSection').style.display = 'none';
                document.getElementById('foodSection').style.display = 'none';
                document.getElementById('otherSection').style.display = 'none';
                document.getElementById('orgNameGroup').style.display = 'none';
                document.getElementById('dropOffGroup').style.display = 'none';
            }

        } catch (error) {
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

        // Close menu when clicking on mobile menu links
        const navLinks = nav.querySelectorAll('.nav__link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Close menu after a small delay to allow navigation
                setTimeout(() => {
                    hamburger.classList.remove('active');
                    nav.classList.remove('active');
                    hamburger.setAttribute('aria-expanded', 'false');
                }, 100);
            });
        });

        // Close menu when clicking outside (optional)
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !nav.contains(e.target)) {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        // Check for saved theme preference or default to light mode
        const currentTheme = localStorage.getItem('theme') || 'light';
        if (currentTheme === 'dark') {
            document.body.classList.add('dark-mode');
            updateDarkModeIcon(true);
        }

        darkModeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateDarkModeIcon(isDark);
        });

        function updateDarkModeIcon(isDark) {
            const icon = darkModeToggle.querySelector('.dark-mode-toggle__icon');
            if (icon) {
                icon.textContent = isDark ? '☀️' : '🌙';
            }
        }
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

    // Rotating facts for hero subtitle
    const rotatingSubtitle = document.getElementById('rotating-subtitle');
    if (rotatingSubtitle) {
        // Function to get translated facts array
        function getTranslatedFacts() {
            return [
                // Card 1: Hunger & Food Crisis
                window.translate ? window.translate('crisis.fact1') : "Every 3 seconds, a life is lost to hunger - This translates to approximately 25,000 deaths daily, with children being most vulnerable as one child dies from malnutrition every 10 seconds.",
                window.translate ? window.translate('crisis.fact2') : "1.05 billion tonnes of food wasted annually - Despite 733 million people facing hunger daily, we waste enough food to feed billions. This represents 40% of all food produced globally.",
                window.translate ? window.translate('crisis.fact3') : "Every minute, 2,000 tonnes of food are discarded - Based on the annual waste of 1.05 billion tonnes, this equals massive quantities of edible food being thrown away while 345 million people face acute hunger.",

                // Card 2: Clothing & Textile Waste
                window.translate ? window.translate('crisis.fact4') : "A truckload of textiles is wasted every second - This equals 92 million tonnes of textile waste annually, with most ending up in landfills or being incinerated.",
                window.translate ? window.translate('crisis.fact5') : "Garment lifespan has dropped 36% in 15 years - Average clothing is worn only 7-10 times before disposal, while less than 1% of textile waste gets recycled into new clothing.",
                window.translate ? window.translate('crisis.fact6') : "60 billion garments thrown away yearly - With 100 billion new garments produced annually, and three out of five articles discarded within a year of production, the fast fashion cycle creates enormous waste.",

                // Card 3: Environmental Impact
                window.translate ? window.translate('crisis.fact7') : "Fashion produces 8-10% of global carbon emissions - The industry's environmental footprint rivals entire countries, while textile production consumes 20,000 litres of water per kilogram of cotton.",
                window.translate ? window.translate('crisis.fact8') : "Food waste generates 8-10% of global greenhouse gases - Wasted food occupies nearly 30% of the world's agricultural land while contributing significantly to climate change.",
                window.translate ? window.translate('crisis.fact9') : "Together, these sectors waste resources that could sustain millions - The combination of food and clothing waste represents a massive misallocation of resources in a world where basic needs remain unmet."
            ];
        }

        // Initial facts array
        let crisisFacts = getTranslatedFacts();

        let currentFactIndex = 0;

        function rotateSubtitle() {
            if (rotatingSubtitle) {
                // Remove any existing animation classes
                rotatingSubtitle.classList.remove('fade-in');

                // Add fade-out animation
                rotatingSubtitle.classList.add('fade-out');

                setTimeout(() => {
                    // Select random fact (or cycle through them)
                    currentFactIndex = (currentFactIndex + 1) % crisisFacts.length;
                    rotatingSubtitle.textContent = crisisFacts[currentFactIndex];

                    // Remove fade-out and add fade-in for emotional entrance
                    rotatingSubtitle.classList.remove('fade-out');
                    rotatingSubtitle.classList.add('fade-in');

                }, 800);
            }
        }

        // Function to update facts when language changes
        function updateFactsForLanguage() {
            crisisFacts = getTranslatedFacts();
        }

        // Listen for language change events
        document.addEventListener('languageChanged', (e) => {
            updateFactsForLanguage();
        });

        // Also listen for languageChange events (alternative event name)
        document.addEventListener('languageChange', (e) => {
            updateFactsForLanguage();
        });

        // Start rotation after page loads
        setTimeout(() => {
            setInterval(rotateSubtitle, 12000); // Change fact every 12 seconds (even slower for emotional impact)
        }, 3000); // Wait 3 seconds after page load before starting
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

});


// This function is called after the form HTML is loaded into the page
function initializeForm() {
    const form = document.getElementById('registration-form');
    if (!form) return;

    const submitBtn = document.getElementById('submit-btn');
    // Load Supabase client
    loadSupabaseClient().then(() => {
    }).catch(error => {
        // Error loading Supabase client - continue silently
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
            setLoading(false);
            return;
        }

        try {
            logger.privacy('Processing registration form submission');

            // Wait for backend client to be loaded
            if (!window.supabase) {
                let retries = 0;
                while (!window.supabase && retries < 10) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    retries++;
                }
                if (!window.supabase) {
                    throw new Error('Backend client not loaded');
                }
            }

            // Prepare data for backend insertion
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
                logger.error('Registration submission failed');
                showToast('An error occurred while submitting the form. Please try again.', 'error');
            } else {
                logger.privacy('Registration submitted successfully');
                showToast('Registration successful! A confirmation email has been sent.', 'success');
                form.reset();
                window.location.href = 'dashboard.html';
            }

        } catch (error) {
            logger.error('Registration form error');
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

    // Load Supabase client
    loadSupabaseClient().then(() => {
    }).catch(error => {
        // Error loading Supabase client - continue silently
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
                // Handle nested keys like money.amount, food.type, preferredPickup.date, etc.
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
                    types: Array.isArray(data.clothes?.types) ? data.clothes.types : (data.clothes?.types ? [data.clothes.types] : []),
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

                // Pickup details - fix the field name mapping
                preferred_pickup_date: data.preferredPickup?.date || null,
                preferred_pickup_time: data.preferredPickup?.timeWindow || null,

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
                showToast('An error occurred while submitting the form. Please try again.', 'error');
            } else {
                showCelebrationToast('Donation submitted successfully! Thank you for your generosity.', 'success');
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
