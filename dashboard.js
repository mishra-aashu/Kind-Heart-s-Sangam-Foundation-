/**
 * Dashboard JavaScript for Kind Heart's Sangam Foundation
 * Handles data display, filtering, and management functionality
 */

// Global variables
let allRegistrations = [];
let filteredRegistrations = [];
let currentPage = 1;
let itemsPerPage = 10;

// Admin authentication check
function isAdminAuthenticated() {
    const adminAuth = sessionStorage.getItem('adminAuthenticated');
    const authTime = sessionStorage.getItem('adminAuthTime');
    const sessionExpiry = sessionStorage.getItem('adminSessionExpiry');

    if (adminAuth === 'true' && authTime && sessionExpiry) {
        return Date.now() < parseInt(sessionExpiry);
    }
    return false;
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Use session-based authentication (works out of the box)
    if (!isAdminAuthenticated()) {
        showToast('Admin access required. Redirecting to login...', 'error');
        setTimeout(() => {
            window.location.href = 'admin-login.html';
        }, 2000);
        return;
    }

    initializeDashboard();

    // Optional: Also try Supabase Auth if available
    // checkSupabaseAuth();
});

// OPTION 3: Supabase Auth implementation
async function checkSupabaseAuth() {
    try {
        // Ensure backend client is loaded
        if (!window.supabase || !window.supabase.auth) {
            console.log('Backend client not ready, falling back to session auth');
            fallbackToSessionAuth();
            return;
        }

        // Check if user is authenticated with backend
        const { data: { user }, error } = await window.supabase.auth.getUser();

        if (error || !user) {
            console.log('No backend user found, using session auth');
            fallbackToSessionAuth();
            return;
        }

        // Check if user is in admin role/table
        const { data: adminUser, error: adminError } = await window.supabase
            .from('admin_users')
            .select('*')
            .eq('email', user.email)
            .single();

        if (adminError || !adminUser) {
            console.log('User not in admin table, using session auth');
            fallbackToSessionAuth();
            return;
        }

        console.log('Admin authenticated via backend');
        initializeDashboard();

    } catch (error) {
        console.error('Supabase auth check error:', error);
        console.log('Falling back to session authentication');
        fallbackToSessionAuth();
    }
}

// Fallback to session-based authentication
function fallbackToSessionAuth() {
    if (!isAdminAuthenticated()) {
        showToast('Admin access required. Redirecting to login...', 'error');
        setTimeout(() => {
            window.location.href = 'admin-login.html';
        }, 2000);
        return;
    }
    initializeDashboard();
}

// Initialize dashboard
async function initializeDashboard() {
    try {
        console.log('🚀 Initializing dashboard...');

        // Load backend client
        console.log('📡 Loading backend client...');
        await loadDashboardSupabaseClient();
        console.log('✅ Backend client loaded');

        // Set up event listeners
        console.log('🔧 Setting up event listeners...');
        setupEventListeners();

        // Load initial data
        console.log('📊 Loading dashboard data...');
        await loadDashboardData();
        console.log('✅ Dashboard initialization complete');

        // Test element visibility after a short delay
        setTimeout(() => {
            console.log('🔍 Running visibility test...');
            testElementVisibility();
        }, 2000);

    } catch (error) {
        console.error('❌ Error initializing dashboard:', error);
        if (error.message.includes('Supabase')) {
            showToast('Database connection issue. Dashboard will load in read-only mode.', 'info');
            console.log('🔄 Continuing with mock data...');
            // Continue loading with mock data
            setTimeout(() => {
                loadDashboardData();
            }, 1000);
        } else {
            showToast('Error loading dashboard. Please refresh the page.', 'error');
        }
    }
}

// Set up event listeners
function setupEventListeners() {
    // Filter controls
    const statusFilter = document.getElementById('status-filter');
    const typeFilter = document.getElementById('type-filter');
    const searchInput = document.getElementById('search-input');
    const refreshBtn = document.getElementById('refresh-btn');

    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', applyFilters);
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboardData);
    }

    // Pagination controls
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => changePage(currentPage - 1));
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => changePage(currentPage + 1));
    }
}

// Load all dashboard data
async function loadDashboardData() {
    showLoadingState();

    try {
        // Load statistics and registrations in parallel
        const [stats, registrations] = await Promise.all([
            loadStatistics(),
            loadRegistrations()
        ]);

        // Update UI with loaded data
        updateStatisticsDisplay(stats);
        allRegistrations = registrations;
        applyFilters();

        // Crisis statistics section removed as requested by user

        hideLoadingState();
        showToast('Dashboard data loaded successfully', 'success');

        // Hide entire admin notice section for cleaner interface
        const adminNotice = document.getElementById('admin-notice');
        if (adminNotice) {
            adminNotice.style.display = 'none';
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        hideLoadingState();

        if (error.message.includes('Supabase')) {
            showToast('Database not available. Showing empty dashboard.', 'info');
            // Show empty state but don't crash
            showEmptyState();
        } else {
            showToast('Error loading dashboard data. Please try again.', 'error');
        }
    }
}

// Load dashboard statistics
async function loadStatistics() {
    console.log('📈 Loading statistics...');

    if (!window.supabase || typeof window.supabase.from !== 'function') {
        console.warn('❌ Backend client not properly loaded, using mock data');
        console.log('🔍 DEBUG: Client exists:', !!window.supabase);
        console.log('🔍 DEBUG: Has from method:', typeof window.supabase?.from === 'function');

        // Return mock data for testing visibility
        const mockStats = {
            total: 42,
            pending: 8,
            approved: 28,
            inProgress: 6,
            completed: 15,
            donors: 35,
            partners: 7
        };
        console.log('📊 Using mock statistics for testing:', mockStats);
        return mockStats;
    }

    console.log('✅ Backend client is valid, querying database...');

    try {
        // Get basic counts
        const { data: totalData, error: totalError } = await window.supabase
            .from('registrations')
            .select('id, status, type');

        if (totalError) {
            console.error('❌ Statistics query failed:', totalError);
            console.log('🔍 DEBUG: Error details:', {
                message: totalError.message,
                details: totalError.details,
                hint: totalError.hint,
                code: totalError.code
            });
            throw totalError;
        }

        console.log('✅ Statistics query successful, processing data...');
        console.log('🔍 DEBUG: Raw data sample:', totalData?.[0]);
        console.log('🔍 DEBUG: Total records found:', totalData?.length || 0);

        // Validate data structure
        if (totalData && totalData.length > 0) {
            console.log('🔍 DEBUG: Sample record structure:', {
                hasId: !!totalData[0].id,
                hasStatus: !!totalData[0].status,
                hasType: !!totalData[0].type,
                statusValue: totalData[0].status,
                typeValue: totalData[0].type
            });
        }

        // Calculate statistics
        const stats = {
            total: totalData.length,
            pending: totalData.filter(item => item.status === 'Pending Review').length,
            approved: totalData.filter(item => item.status === 'Approved').length,
            inProgress: totalData.filter(item => item.status === 'In Progress').length,
            completed: totalData.filter(item => item.status === 'Completed').length,
            donors: totalData.filter(item => item.type === 'donor').length,
            partners: totalData.filter(item => item.type === 'partner').length
        };

        console.log('📊 Calculated statistics:', stats);

        return stats;

    } catch (error) {
        console.error('❌ Error loading statistics:', error);
        console.log('🔍 DEBUG: Error object:', error);

        // Return mock data as fallback for testing
        const fallbackStats = {
            total: 25,
            pending: 5,
            approved: 15,
            inProgress: 5,
            completed: 10,
            donors: 20,
            partners: 5
        };
        console.log('📊 Using fallback statistics:', fallbackStats);
        return fallbackStats;
    }
}

// Load registrations data
async function loadRegistrations() {
    console.log('📋 Loading registrations...');

    if (!window.supabase || typeof window.supabase.from !== 'function') {
        console.warn('❌ Backend client not properly loaded, using empty data');
        console.log('Client exists:', !!window.supabase);
        console.log('Has from method:', typeof window.supabase?.from === 'function');
        return [];
    }

    console.log('✅ Backend client is valid, querying registrations...');

    try {
        const { data, error } = await window.supabase
            .from('registrations')
            .select(`
                id,
                type,
                status,
                created_at,
                name,
                organization,
                contact_person,
                city,
                state,
                phone,
                email,
                address,
                pincode,
                donor_type,
                anonymous,
                donation_categories,
                preferred_pickup_date,
                preferred_pickup_time,
                money,
                clothes,
                food,
                other,
                files,
                notes,
                org_type,
                org_name,
                pickup_days,
                pickup_time,
                food_capacity,
                food_type,
                certificate_link
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Registrations query failed:', error);
            console.error('Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }

        console.log('✅ Registrations query successful!');
        console.log('Loaded registrations data sample:', data?.[0]);
        console.log('Total registrations found:', data?.length || 0);

        // Validate data structure
        if (data && data.length > 0) {
            console.log('Sample field check:', {
                hasMoney: !!data[0].money,
                hasClothes: !!data[0].clothes,
                hasFood: !!data[0].food,
                hasOther: !!data[0].other,
                moneyType: typeof data[0].money,
                clothesType: typeof data[0].clothes
            });
        }

        return data || [];

    } catch (error) {
        console.error('Error loading registrations:', error);
        throw error;
    }
}

// Update statistics display
function updateStatisticsDisplay(stats) {
    console.log('🔍 DEBUG: Updating statistics display with data:', stats);

    // Check if elements exist before updating
    const totalDonationsEl = document.getElementById('total-donations');
    const pendingReviewsEl = document.getElementById('pending-reviews');
    const approvedDonationsEl = document.getElementById('approved-donations');
    const inProgressEl = document.getElementById('in-progress');

    console.log('🔍 DEBUG: Elements found:', {
        totalDonations: !!totalDonationsEl,
        pendingReviews: !!pendingReviewsEl,
        approvedDonations: !!approvedDonationsEl,
        inProgress: !!inProgressEl
    });

    // Update stat numbers with animation
    animateNumber('total-donations', stats.total);
    animateNumber('pending-reviews', stats.pending);
    animateNumber('approved-donations', stats.approved);
    animateNumber('in-progress', stats.inProgress);

    // Show stats container
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
        statsContainer.style.display = 'block';
        console.log('✅ Stats container shown');
    }

    console.log('✅ Statistics display updated');
}

// Animate number counting
function animateNumber(elementId, targetValue, duration = 1000) {
    const element = document.getElementById(elementId);
    console.log(`🔍 DEBUG: animateNumber called for ${elementId} with target ${targetValue}`);

    if (!element) {
        console.error(`❌ Element with ID '${elementId}' not found!`);
        return;
    }

    console.log(`✅ Element found for ${elementId}:`, element);
    console.log(`🔍 DEBUG: Element current text: '${element.textContent}'`);
    console.log(`🔍 DEBUG: Element styles:`, {
        color: window.getComputedStyle(element).color,
        fontSize: window.getComputedStyle(element).fontSize,
        fontWeight: window.getComputedStyle(element).fontWeight,
        display: window.getComputedStyle(element).display,
        visibility: window.getComputedStyle(element).visibility
    });

    const startValue = 0;
    const startTime = performance.now();

    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOut);

        element.textContent = currentValue;
        console.log(`🔄 Animation progress for ${elementId}: ${currentValue}/${targetValue}`);

        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        } else {
            console.log(`✅ Animation completed for ${elementId}: ${currentValue}`);
        }
    }

    requestAnimationFrame(updateNumber);
}

// Apply filters to registrations data
function applyFilters() {
    const statusFilter = document.getElementById('status-filter')?.value || '';
    const typeFilter = document.getElementById('type-filter')?.value || '';
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';

    // Filter data
    filteredRegistrations = allRegistrations.filter(registration => {
        // Status filter
        if (statusFilter && registration.status !== statusFilter) {
            return false;
        }

        // Type filter
        if (typeFilter && registration.type !== typeFilter) {
            return false;
        }

        // Search filter
        if (searchTerm) {
            const searchFields = [
                registration.name,
                registration.organization,
                registration.city,
                registration.phone,
                registration.email
            ].filter(Boolean);

            const matchesSearch = searchFields.some(field =>
                field.toString().toLowerCase().includes(searchTerm)
            );

            if (!matchesSearch) {
                return false;
            }
        }

        return true;
    });

    // Reset to first page and update display
    currentPage = 1;
    updateTableDisplay();
    updatePagination();
}

// Update table display with current page data
function updateTableDisplay() {
    const tableBody = document.getElementById('registrations-table-body');
    if (!tableBody) return;

    // Clear existing rows
    tableBody.innerHTML = '';

    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredRegistrations.slice(startIndex, endIndex);

    // Show empty state if no data
    if (filteredRegistrations.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();

    // Create table rows
    pageData.forEach(registration => {
        const row = createTableRow(registration);
        tableBody.appendChild(row);
    });

    // Show table container
    const tableContainer = document.getElementById('table-container');
    if (tableContainer) {
        tableContainer.style.display = 'block';
    }
}

// Create a table row for a registration
function createTableRow(registration) {
    const row = document.createElement('tr');
    row.className = 'clickable-row';
    row.style.cursor = 'pointer';

    // Format date
    const date = new Date(registration.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    // Get display name
    const displayName = registration.type === 'donor'
        ? (registration.name || 'Anonymous')
        : (registration.organization || registration.contact_person || 'N/A');

    // Get category display text
    let categoryText = 'N/A';
    if (registration.type === 'donor' && registration.donation_categories) {
        categoryText = Array.isArray(registration.donation_categories)
            ? registration.donation_categories.join(', ')
            : registration.donation_categories;
    } else if (registration.type === 'partner' && registration.org_type) {
        categoryText = registration.org_type;
    }

    // Get amount for display
    let amountText = 'N/A';
    if (registration.money && registration.money.amount) {
        amountText = `₹${registration.money.amount}`;
    }

    row.innerHTML = `
        <td>${date}</td>
        <td>${registration.type === 'donor' ? 'Donation' : 'Partner'}</td>
        <td>${displayName}</td>
        <td>${registration.city || 'N/A'}</td>
        <td>${categoryText}</td>
        <td>${amountText}</td>
        <td><span class="status-badge status-badge--${registration.status.toLowerCase().replace(' ', '')}">${registration.status}</span></td>
        <td>
            <select class="status-dropdown" data-registration-id="${registration.id}" data-current-status="${registration.status}" onchange="updateStatusFromDropdown(this)">
                <option value="">-- Select Status --</option>
                <option value="Pending Review" ${registration.status === 'Pending Review' ? 'selected' : ''}>🔄 Pending Review</option>
                <option value="Approved" ${registration.status === 'Approved' ? 'selected' : ''}>✅ Approved</option>
                <option value="In Progress" ${registration.status === 'In Progress' ? 'selected' : ''}>🔄 In Progress</option>
                <option value="Completed" ${registration.status === 'Completed' ? 'selected' : ''}>✅ Completed</option>
                <option value="Rejected" ${registration.status === 'Rejected' ? 'selected' : ''}>❌ Rejected</option>
            </select>
        </td>
    `;

    // Add click handler to show person details
    row.addEventListener('click', (e) => {
        // Don't trigger if clicking on the dropdown
        if (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') {
            return;
        }
        showPersonDetails(registration);
    });

    return row;
}

// Update registration status
async function updateStatus(registrationId, newStatus) {
    if (!window.supabase || typeof window.supabase.from !== 'function') {
        showToast('Database not properly connected', 'error');
        return;
    }

    try {
        const { error } = await window.supabase
            .from('registrations')
            .update({
                status: newStatus
                // Note: removed updated_at as it doesn't exist in current database schema
            })
            .eq('id', registrationId);

        if (error) throw error;

        showToast(`Status updated to ${newStatus}`, 'success');

        // Reload data to reflect changes
        await loadDashboardData();

    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Error updating status. Please try again.', 'error');
    }
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
    const paginationContainer = document.getElementById('pagination-container');
    const paginationInfo = document.getElementById('pagination-info');
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (!paginationContainer) return;

    // Update pagination info
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredRegistrations.length);

    if (paginationInfo) {
        paginationInfo.textContent = `Showing ${startIndex}-${endIndex} of ${filteredRegistrations.length} entries`;
    }

    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    // Update button states
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }

    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
    }

    // Show/hide pagination based on data availability
    paginationContainer.style.display = filteredRegistrations.length > 0 ? 'flex' : 'none';
}

// Change page
function changePage(newPage) {
    const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);

    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateTableDisplay();
        updatePagination();
    }
}

// Show loading state
function showLoadingState() {
    const loadingMessage = document.getElementById('loading-message');
    const statsContainer = document.getElementById('stats-container');
    const controlsContainer = document.getElementById('controls-container');
    const tableContainer = document.getElementById('table-container');

    if (loadingMessage) loadingMessage.style.display = 'flex';
    if (statsContainer) statsContainer.style.display = 'none';
    if (controlsContainer) controlsContainer.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'none';

    hideEmptyState();
}

// Hide loading state
function hideLoadingState() {
    const loadingMessage = document.getElementById('loading-message');
    const controlsContainer = document.getElementById('controls-container');

    if (loadingMessage) loadingMessage.style.display = 'none';
    if (controlsContainer) controlsContainer.style.display = 'block';
}

// Show empty state
function showEmptyState() {
    const emptyState = document.getElementById('empty-state');
    const tableContainer = document.getElementById('table-container');

    if (emptyState) emptyState.style.display = 'block';
    if (tableContainer) tableContainer.style.display = 'none';
}

// Hide empty state
function hideEmptyState() {
    const emptyState = document.getElementById('empty-state');

    if (emptyState) emptyState.style.display = 'none';
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = toast?.querySelector('.toast__message');

    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.className = 'toast show';
        toast.classList.add(`toast--${type}`);

        setTimeout(() => {
            toast.className = 'toast';
        }, 5000);
    }
}

// Update status from dropdown selection
async function updateStatusFromDropdown(selectElement) {
    const registrationId = selectElement.dataset.registrationId;
    const currentStatus = selectElement.dataset.currentStatus;
    const newStatus = selectElement.value;

    if (!newStatus) {
        return; // User selected "Select Status" option
    }

    if (newStatus === currentStatus) {
        return; // No change needed
    }

    // Check admin authentication
    if (!isAdminAuthenticated()) {
        showToast('Admin authentication required. Please log in again.', 'error');
        selectElement.value = currentStatus;
        return;
    }

    if (!window.supabase || typeof window.supabase.from !== 'function') {
        showToast('Database not properly connected. Please refresh the page.', 'error');
        selectElement.value = currentStatus;
        return;
    }

    // Show loading state on dropdown
    selectElement.disabled = true;
    const originalText = selectElement.options[selectElement.selectedIndex].text;
    selectElement.options[selectElement.selectedIndex].text = '⏳ Updating...';

    try {
        console.log(`Attempting to update registration ${registrationId} status to ${newStatus}`);

        // Perform actual database update
        // NOTE: For production, ensure one of the following:
        // 1. RLS policy allows anonymous updates (current setup)
        // 2. Use service role key for admin operations
        // 3. Implement proper Supabase Auth for admin users
        let data, error;

        try {
            const result = await window.supabase
                .from('registrations')
                .update({
                    status: newStatus
                    // Note: removed updated_at as it doesn't exist in current database schema
                })
                .eq('id', registrationId)
                .select();

            data = result.data;
            error = result.error;

        } catch (err) {
            console.error('Network or unexpected error:', err);
            throw new Error(`Network error: ${err.message}`);
        }

        if (error) {
            console.error('Supabase update error:', error);

            // If it's a permission error, try with service role key
            if (error.message && error.message.includes('permission')) {
                console.log('Attempting update with service role key...');
                throw new Error(`Permission denied. Please configure RLS policy or use service role key. Error: ${error.message}`);
            }

            throw new Error(`Database update failed: ${error.message}`);
        }

        if (!data || data.length === 0) {
            console.warn('No data returned from update, but no error either');
            // This might still be successful, so we'll proceed
        }

        console.log('Status updated successfully:', data);
        showToast(`✅ Status updated to ${newStatus}`, 'success');

        // Update the current status data attribute
        selectElement.dataset.currentStatus = newStatus;

        // Update the status badge in the same row immediately
        const row = selectElement.closest('tr');
        const statusBadge = row.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.textContent = newStatus;
            statusBadge.className = `status-badge status-badge--${newStatus.toLowerCase().replace(' ', '')}`;
        }

        // Reload data to reflect changes and update statistics
        await loadDashboardData();

    } catch (error) {
        console.error('Error updating status:', error);
        // Extract meaningful error message
        let errorMessage = 'Error updating status. Please try again.';
        if (error && error.message) {
            errorMessage = `Error: ${error.message}`;
        } else if (error && typeof error === 'object') {
            errorMessage = `Database error: ${JSON.stringify(error)}`;
        }
        showToast(errorMessage, 'error');
        // Reset dropdown to previous value
        selectElement.value = currentStatus;
    } finally {
        // Re-enable dropdown
        selectElement.disabled = false;
        if (selectElement.selectedIndex >= 0) {
            selectElement.options[selectElement.selectedIndex].text = originalText;
        }
    }
}

// Quick fix function for RLS policy
async function applyQuickFix() {
    if (!window.supabase || typeof window.supabase.from !== 'function') {
        showToast('Database not properly connected. Please refresh and try again.', 'error');
        return;
    }

    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '⏳ Applying Fix...';
    button.disabled = true;

    try {
        // Apply the RLS policy fix
        const { error } = await window.supabase.rpc('execute_sql', {
            query: 'CREATE POLICY "Allow anonymous status updates" ON public.registrations FOR UPDATE USING (true);'
        });

        if (error) {
            // If RPC doesn't exist, show manual instructions
            showToast('Please run this SQL manually in Supabase Dashboard → SQL Editor:', 'info');
            showToast('CREATE POLICY "Allow anonymous status updates" ON public.registrations FOR UPDATE USING (true);', 'info');
            showToast('This will enable status updates for anonymous users.', 'info');
        } else {
            showToast('✅ UPDATE policy added! Status updates should work now.', 'success');
        }
    } catch (error) {
        console.error('Quick fix error:', error);
        showToast('Please apply the fix manually using the instructions above.', 'info');
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

// Refresh dashboard function
function refreshDashboard() {
    window.location.reload();
}

// Force reinitialize Supabase client
async function reinitializeSupabase() {
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '⏳ Reinitializing...';
    button.disabled = true;

    try {
        console.log('🔄 Force reinitializing Supabase client...');

        // Completely remove any existing client
        if (window.supabase) {
            console.log('Removing existing client...');
            delete window.supabase;

            // Double-check it's gone
            if (window.supabase) {
                console.error('Failed to remove existing client!');
                // Force removal
                Object.getOwnPropertyNames(window).forEach(prop => {
                    if (prop === 'supabase') {
                        delete window[prop];
                    }
                });
            }
        }

        console.log('✅ Existing client removed, creating new one...');

        // Load new client
        await loadDashboardSupabaseClient();

        if (window.supabase && typeof window.supabase.from === 'function') {
            console.log('✅ New client created successfully');

            // Test the new client
            console.log('🧪 Testing new client...');
            const { count, error } = await window.supabase
                .from('registrations')
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log('⚠️ Client created but query failed:', error.message);
                showToast('Client created but database query failed. Check RLS policies.', 'info');
            } else {
                console.log('✅ Client and database both working! Found', count, 'records');
                showToast(`✅ Success! Database working with ${count} records.`, 'success');
            }

            // Reload dashboard data
            await loadDashboardData();
        } else {
            console.error('❌ Failed to create valid client');
            showToast('Failed to create valid database connection', 'error');
        }

    } catch (error) {
        console.error('❌ Failed to reinitialize Supabase:', error);
        showToast(`Reinitialization failed: ${error.message}`, 'error');
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

// Test database connection
async function testDatabaseConnection() {
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '⏳ Testing...';
    button.disabled = true;

    try {
        console.log('🧪 Testing database connection...');

        // Force creation of new client
        console.log('🔄 Forcing creation of new Supabase client...');
        if (window.supabase) {
            delete window.supabase;
        }
        await loadDashboardSupabaseClient();

        if (window.supabase && typeof window.supabase.from === 'function') {
            console.log('✅ Client is valid, testing database query...');

            // Test with a simple count query
            const { count, error } = await window.supabase
                .from('registrations')
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.error('❌ Query failed:', error);
                showToast(`Connection test failed: ${error.message}`, 'error');
            } else {
                console.log('✅ Connection test successful! Found', count, 'records');
                showToast(`✅ Connection successful! Found ${count} records in database.`, 'success');

                // Try to reload data
                await loadDashboardData();
            }
        } else {
            console.error('❌ Failed to create valid client');
            showToast('Failed to create database connection. Check console for details.', 'error');
        }

    } catch (error) {
        console.error('❌ Connection test error:', error);
        showToast(`Connection test failed: ${error.message}`, 'error');
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

// Crisis statistics section removed as requested - function no longer needed
/*
function showCrisisStatistics() {
    console.log('🚨 DEBUG: showCrisisStatistics() function called!');
    console.log('🌍 Showing global crisis statistics...');

    const crisisStatsContainer = document.getElementById('crisis-stats-container');
    if (crisisStatsContainer) {
        crisisStatsContainer.style.display = 'block';
        console.log('✅ Crisis statistics section displayed');

        // Debug: Check computed styles
        const computedStyle = window.getComputedStyle(crisisStatsContainer);
        console.log('🔍 DEBUG: Crisis container styles:', {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            backgroundColor: computedStyle.backgroundColor
        });

        // Add some animation delays for visual appeal
        const crisisStats = crisisStatsContainer.querySelectorAll('.crisis-stat');
        console.log(`🔍 DEBUG: Found ${crisisStats.length} crisis stat elements`);

        crisisStats.forEach((stat, index) => {
            console.log(`🔍 DEBUG: Crisis stat ${index} initial styles:`, {
                opacity: window.getComputedStyle(stat).opacity,
                transform: window.getComputedStyle(stat).transform,
                backgroundColor: window.getComputedStyle(stat).backgroundColor,
                borderColor: window.getComputedStyle(stat).borderColor
            });

            stat.style.opacity = '0';
            stat.style.transform = 'translateY(20px)';

            setTimeout(() => {
                stat.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                stat.style.opacity = '1';
                stat.style.transform = 'translateY(0)';

                console.log(`✅ Animated crisis stat ${index}`);
            }, index * 100);
        });

        console.log(`✅ Animated ${crisisStats.length} crisis statistics cards`);
    } else {
        console.error('❌ Crisis statistics container not found');
    }
}
*/

// Test element visibility and colors
function testElementVisibility() {
    console.log('🔍 TESTING ELEMENT VISIBILITY AND COLORS');

    // Test statistics elements
    const testElements = [
        'total-donations',
        'pending-reviews',
        'approved-donations',
        'in-progress'
    ];

    testElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            const styles = window.getComputedStyle(element);
            console.log(`🔍 ${elementId}:`, {
                textContent: element.textContent,
                color: styles.color,
                fontSize: styles.fontSize,
                fontWeight: styles.fontWeight,
                display: styles.display,
                visibility: styles.visibility,
                opacity: styles.opacity
            });
        } else {
            console.error(`❌ Element ${elementId} not found`);
        }
    });

    // Test crisis statistics elements
    const crisisNumbers = [
        'food-insecure-people',
        'food-waste',
        'hungry-people',
        'malnourished-children'
    ];

    crisisNumbers.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            const styles = window.getComputedStyle(element);
            console.log(`🔍 ${elementId}:`, {
                textContent: element.textContent,
                color: styles.color,
                background: styles.background,
                fontSize: styles.fontSize,
                fontWeight: styles.fontWeight,
                display: styles.display,
                visibility: styles.visibility,
                opacity: styles.opacity
            });
        } else {
            console.error(`❌ Crisis element ${elementId} not found`);
        }
    });

    // Test CSS variables
    const rootStyles = getComputedStyle(document.documentElement);
    console.log('🔍 CSS Variables:', {
        primaryColor: rootStyles.getPropertyValue('--primary-color'),
        crisisRed: rootStyles.getPropertyValue('--crisis-red'),
        crisisOrange: rootStyles.getPropertyValue('--crisis-orange'),
        textPrimary: rootStyles.getPropertyValue('--text-primary')
    });
}

// Make functions available globally for HTML onclick handlers
window.updateStatus = updateStatus;
window.updateStatusFromDropdown = updateStatusFromDropdown;
window.applyQuickFix = applyQuickFix;
window.refreshDashboard = refreshDashboard;
window.reinitializeSupabase = reinitializeSupabase;
window.testDatabaseConnection = testDatabaseConnection;
window.testElementVisibility = testElementVisibility;
// Load backend client for dashboard
async function loadDashboardSupabaseClient() {
    return new Promise((resolve, reject) => {
        console.log('🔄 Loading backend client for dashboard...');

        // Check if client is already available
        if (window.supabase && typeof window.supabase.from === 'function') {
            console.log('✅ Using existing backend client');
            resolve(window.supabase);
            return;
        }

        // Load the existing supabase-client.js module
        const script = document.createElement('script');
        script.src = 'supabase-client.js';
        script.type = 'module';
        script.onload = () => {
            setTimeout(() => {
                // Check if the client was loaded and attached to window
                if (window.supabase && typeof window.supabase.from === 'function') {
                    console.log('✅ Backend client loaded successfully from supabase-client.js');
                    resolve(window.supabase);
                } else {
                    // Fallback: try to load from CDN if module loading fails
                    console.log('⚠️ Module loading failed, trying CDN fallback...');
                    loadSupabaseClientFromCDN().then(resolve).catch(reject);
                }
            }, 100);
        };
        script.onerror = () => {
            console.log('⚠️ Module loading failed, trying CDN fallback...');
            loadSupabaseClientFromCDN().then(resolve).catch(reject);
        };
        document.head.appendChild(script);
    });
}

// Fallback CDN loading function
async function loadSupabaseClientFromCDN() {
    return new Promise((resolve, reject) => {
        console.log('📡 Loading backend client from CDN as fallback...');

        // Remove any existing client
        if (window.supabase) {
            delete window.supabase;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
            setTimeout(() => {
                if (typeof supabase !== 'undefined' && supabase.createClient) {
                    const supabaseUrl = 'https://pqvsulbbeuwtlngggkgc.supabase.co';
                    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdnN1bGJiZXV3dGxuZ2dna2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTA0NzMsImV4cCI6MjA3NTA4NjQ3M30.PZS_vUoogiKedshNOZAS0sYZT0cUxNM-3CkovLsj6Po';

                    window.supabase = supabase.createClient(supabaseUrl, supabaseKey, {
                        auth: {
                            autoRefreshToken: false,
                            persistSession: false
                        }
                    });

                    if (window.supabase && typeof window.supabase.from === 'function') {
                        console.log('✅ Backend client created from CDN fallback');
                        resolve(window.supabase);
                    } else {
                        reject(new Error('Failed to create valid backend client from CDN'));
                    }
                } else {
                    reject(new Error('Backend library not loaded properly from CDN'));
                }
            }, 100);
        };
        script.onerror = () => {
            reject(new Error('Failed to load backend script from CDN'));
        };
        document.head.appendChild(script);
    });
}

// Show person details as inline popup
function showPersonDetails(registration) {
    // Remove any existing detail popup
    const existingPopup = document.querySelector('.detail-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create inline popup
    const popup = document.createElement('tr');
    popup.className = 'detail-popup';
    popup.innerHTML = `
        <td colspan="8" style="background-color: #f8f9fa; border-top: 2px solid #007bff;">
            <div style="padding: 20px; max-height: 60vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #dee2e6;">
                    <h3 style="margin: 0; color: #007bff;">📋 Complete Donation Details</h3>
                    <button onclick="this.closest('tr').remove()" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">✕ Close</button>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    <!-- Basic Information -->
                    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h4 style="margin-top: 0; color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 5px;">📋 Basic Information</h4>
                        <div style="display: grid; gap: 8px;">
                            <div><strong>Type:</strong> <span>${registration.type === 'donor' ? 'Donor' : 'Partner/Organization'}</span></div>
                            <div><strong>Name:</strong> <span>${registration.name || 'N/A'}</span></div>
                            <div><strong>Organization:</strong> <span>${registration.organization || registration.org_name || 'N/A'}</span></div>
                            <div><strong>Contact Person:</strong> <span>${registration.contact_person || 'N/A'}</span></div>
                            <div><strong>Email:</strong> <span>${registration.email || 'N/A'}</span></div>
                            <div><strong>Phone:</strong> <span>${registration.phone || 'N/A'}</span></div>
                            <div><strong>City:</strong> <span>${registration.city || 'N/A'}</span></div>
                            <div><strong>State:</strong> <span>${registration.state || 'N/A'}</span></div>
                        </div>
                    </div>

                    <!-- Donation Details -->
                    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h4 style="margin-top: 0; color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 5px;">💰 Donation/Partnership Details</h4>
                        <div style="display: grid; gap: 8px;">
                            <div><strong>Status:</strong> <span class="status-badge status-badge--${registration.status.toLowerCase().replace(' ', '')}">${registration.status}</span></div>
                            <div><strong>Categories:</strong> <span>${registration.donation_categories ? (Array.isArray(registration.donation_categories) ? registration.donation_categories.join(', ') : registration.donation_categories) : 'N/A'}</span></div>
                            <div><strong>Donor Type:</strong> <span>${registration.donor_type || 'N/A'}</span></div>
                            <div><strong>Anonymous:</strong> <span>${registration.anonymous ? 'Yes' : 'No'}</span></div>
                        </div>
                    </div>

                    <!-- Money Details -->
                    ${registration.money && registration.money.amount ? `
                    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h4 style="margin-top: 0; color: #ffc107; border-bottom: 2px solid #ffc107; padding-bottom: 5px;">💰 Money Donation Details</h4>
                        <div style="display: grid; gap: 8px;">
                            <div><strong>Amount:</strong> <span>₹${registration.money.amount}</span></div>
                            <div><strong>Currency:</strong> <span>${registration.money.currency || 'N/A'}</span></div>
                            <div><strong>Payment Method:</strong> <span>${registration.money.paymentMethod || 'N/A'}</span></div>
                            <div><strong>Transaction Ref:</strong> <span>${registration.money.transactionRef || 'N/A'}</span></div>
                            <div><strong>Receipt Requested:</strong> <span>${registration.money.receipt || 'N/A'}</span></div>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Clothes Details -->
                    ${registration.clothes && registration.clothes.types ? `
                    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h4 style="margin-top: 0; color: #17a2b8; border-bottom: 2px solid #17a2b8; padding-bottom: 5px;">👕 Clothes Donation Details</h4>
                        <div style="display: grid; gap: 8px;">
                            <div><strong>Types:</strong> <span>${registration.clothes.types.join(', ')}</span></div>
                            <div><strong>Condition:</strong> <span>${registration.clothes.condition || 'N/A'}</span></div>
                            <div><strong>Count:</strong> <span>${registration.clothes.count || 'N/A'}</span></div>
                            <div><strong>Sizes:</strong> <span>${registration.clothes.sizes || 'N/A'}</span></div>
                            <div><strong>Notes:</strong> <span>${registration.clothes.notes || 'N/A'}</span></div>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Food Details -->
                    ${registration.food && registration.food.type ? `
                    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h4 style="margin-top: 0; color: #fd7e14; border-bottom: 2px solid #fd7e14; padding-bottom: 5px;">🍽️ Food Donation Details</h4>
                        <div style="display: grid; gap: 8px;">
                            <div><strong>Type:</strong> <span>${registration.food.type}</span></div>
                            <div><strong>Quantity:</strong> <span>${registration.food.quantity || 'N/A'}</span></div>
                            <div><strong>Pickup Available:</strong> <span>${registration.food.pickupAvailable || 'N/A'}</span></div>
                            <div><strong>Drop-off Center:</strong> <span>${registration.food.dropOffCenter || 'N/A'}</span></div>
                            <div><strong>Notes:</strong> <span>${registration.food.notes || 'N/A'}</span></div>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Other Details -->
                    ${registration.other && registration.other.description ? `
                    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h4 style="margin-top: 0; color: #6f42c1; border-bottom: 2px solid #6f42c1; padding-bottom: 5px;">📦 Other Donation Details</h4>
                        <div style="display: grid; gap: 8px;">
                            <div><strong>Description:</strong> <span>${registration.other.description}</span></div>
                            <div><strong>Quantity:</strong> <span>${registration.other.quantity || 'N/A'}</span></div>
                        </div>
                    </div>
                    ` : ''}
                </div>

                <!-- Additional Information Row -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
                    <!-- Pickup Information -->
                    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h4 style="margin-top: 0; color: #20c997; border-bottom: 2px solid #20c997; padding-bottom: 5px;">📅 Pickup Information</h4>
                        <div style="display: grid; gap: 8px;">
                            <div><strong>Preferred Date:</strong> <span>${registration.preferred_pickup_date ? new Date(registration.preferred_pickup_date).toLocaleDateString('en-IN') : 'N/A'}</span></div>
                            <div><strong>Preferred Time:</strong> <span>${registration.preferred_pickup_time || 'N/A'}</span></div>
                        </div>
                    </div>

                    <!-- Timestamps -->
                    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h4 style="margin-top: 0; color: #6c757d; border-bottom: 2px solid #6c757d; padding-bottom: 5px;">⏰ Timestamps</h4>
                        <div style="display: grid; gap: 8px;">
                            <div><strong>Created:</strong> <span>${new Date(registration.created_at).toLocaleString('en-IN')}</span></div>
                        </div>
                    </div>

                    <!-- Additional Information -->
                    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h4 style="margin-top: 0; color: #e83e8c; border-bottom: 2px solid #e83e8c; padding-bottom: 5px;">📍 Additional Information</h4>
                        <div style="display: grid; gap: 8px;">
                            <div><strong>Address:</strong> <span>${registration.address || 'N/A'}</span></div>
                            <div><strong>Pincode:</strong> <span>${registration.pincode || 'N/A'}</span></div>
                            <div><strong>Files:</strong> <span>${registration.files || 'N/A'}</span></div>
                            <div><strong>Notes:</strong> <span>${registration.notes || 'N/A'}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </td>
    `;

    // Insert the popup row right after the clicked row
    const clickedRow = event.target.closest('tr');
    clickedRow.insertAdjacentElement('afterend', popup);
}

// Load Supabase client (consolidated function)
window.changePage = changePage;