/**
* CRITICAL: ADMIN PERMISSION REQUIRED BEFORE EDITING THIS FILE
*
* This file contains core application logic for the Kind Heart's Sangam Foundation registration system.
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
        const errorEl = (input.length ? input[0] : input).closest('.form__group').querySelector('.form__error-message');
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
                    if (!input.checked) {
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
                if (!input.value.trim()) {
                    isValid = false;
                    errorMessage = 'This field is required.';
                }
            }
        }

        if (isValid && fieldConfig.pattern && input.value.trim()) {
            if (!fieldConfig.pattern.test(input.value.trim())) {
                isValid = false;
                errorMessage = fieldConfig.message || 'Invalid format.';
            }
        }

        if (!isValid) {
            (input.length ? input[0] : input).classList.add('invalid');
            errorEl.textContent = errorMessage;
            errorEl.style.display = 'block';
        } else {
            (input.length ? input[0] : input).classList.remove('invalid');
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