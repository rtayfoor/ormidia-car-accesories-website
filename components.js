// components.js - Global Header and Footer Components
// Handle bank transfer payment
async function handleBankTransfer(orderId) {
    try {
        // Get transfer details
        const response = await fetch(`/api/bank-transfer/${orderId}`);
        const data = await response.json();

        if (response.ok) {
            // Populate bank details
            document.getElementById('bankName').textContent = data.bankDetails.bankName;
            document.getElementById('accountHolder').textContent = data.bankDetails.accountHolder;
            document.getElementById('accountNumber').textContent = data.bankDetails.accountNumber;
            document.getElementById('iban').textContent = data.bankDetails.iban;
            document.getElementById('swiftCode').textContent = data.bankDetails.swiftCode;
            document.getElementById('referenceNumber').textContent = data.reference_number;
            document.getElementById('transferAmount').textContent = data.amount;

            // Show bank transfer info
            document.getElementById('bankTransferInfo').style.display = 'block';
        }
    } catch (error) {
        console.error('Error getting transfer details:', error);
        alert('Failed to get transfer details');
    }
}

// Confirm transfer
async function confirmTransfer() {
    const orderId = sessionStorage.getItem('currentOrderId');
    if (!orderId) {
        alert('No order found');
        return;
    }

    const transferDate = prompt('Enter transfer date (YYYY-MM-DD):');
    const referenceNumber = prompt('Enter your transfer reference number:');

    if (!transferDate || !referenceNumber) {
        alert('Transfer date and reference number are required');
        return;
    }

    try {
        const response = await fetch('/api/bank-transfer/confirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderId: parseInt(orderId),
                transferDate: transferDate,
                referenceNumber: referenceNumber
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Transfer confirmed successfully! We will verify it within 24 hours.');
            window.location.href = '/order-confirmation.html';
        } else {
            alert(data.error || 'Failed to confirm transfer');
        }
    } catch (error) {
        console.error('Error confirming transfer:', error);
        alert('An error occurred');
    }
}

// Process checkout with bank transfer
async function processCheckout() {
    // ... your existing checkout code ...

    // After creating the order, show bank transfer info
    if (data.success) {
        sessionStorage.setItem('currentOrderId', data.orderId);
        await handleBankTransfer(data.orderId);
    }
}
// Supabase Configuration
// Supabase config from environment
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global Header Component
function createHeader(activePage = '') {
    return `
        <nav class="navbar">
            <div class="nav-container">
                <div class="logo">
                    <img src="logo.jpg" alt="Ormidia Logo" class="logo-img" onerror="this.src='https://via.placeholder.com/40x40?text=Logo'">
                    <span class="logo-text">Ormidia</span>
                </div>
                <ul class="nav-menu">
                    <li><a href="index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">Home</a></li>
                    <li><a href="products.html" class="nav-link ${activePage === 'products' ? 'active' : ''}">Products</a></li>
                    <li><a href="index.html#about" class="nav-link ${activePage === 'about' ? 'active' : ''}">About</a></li>
                    <li><a href="index.html#contact" class="nav-link ${activePage === 'contact' ? 'active' : ''}">Contact</a></li>
                </ul>
                <div class="nav-icons">
                    <a href="cart.html" class="cart-icon">
                        <i class="fas fa-shopping-cart"></i>
                        <span class="cart-count">0</span>
                    </a>
                    <div id="auth-icon" class="user-icon">
                        <!-- User menu will be rendered by JavaScript -->
                    </div>
                    <div class="menu-toggle">
                        <i class="fas fa-bars"></i>
                    </div>
                </div>
            </div>
        </nav>
    `;
}

// Global Footer Component
function createFooter() {
    return `
        <footer class="footer">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-section">
                        <h3>Ormidia</h3>
                        <p>Premium car accessories for the modern driver.</p>
                        <div class="social-links">
                            <a href="#"><i class="fab fa-facebook"></i></a>
                            <a href="#"><i class="fab fa-instagram"></i></a>
                            <a href="#"><i class="fab fa-twitter"></i></a>
                            <a href="#"><i class="fab fa-youtube"></i></a>
                        </div>
                    </div>
                    <div class="footer-section">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="index.html">Home</a></li>
                            <li><a href="products.html">Products</a></li>
                            <li><a href="index.html#about">About Us</a></li>
                            <li><a href="index.html#contact">Contact</a></li>
                        </ul>
                    </div>
                    <div class="footer-section">
                        <h4>Customer Service</h4>
                        <ul>
                            <li><a href="#">FAQ</a></li>
                            <li><a href="#">Shipping Policy</a></li>
                            <li><a href="#">Returns & Exchanges</a></li>
                            <li><a href="#">Privacy Policy</a></li>
                        </ul>
                    </div>
                    <div class="footer-section">
                        <h4>Working Hours</h4>
                        <ul>
                            <li>Monday - Friday: 9am - 8pm</li>
                            <li>Saturday: 10am - 6pm</li>
                            <li>Sunday: Closed</li>
                        </ul>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; 2026 Ormidia Car Accessories. All rights reserved.</p>
                </div>
            </div>
        </footer>
    `;
}

// Generate CSS for global components
function getGlobalStyles() {
    return `
        /* Global Styles for Header and Footer */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: #f8fafc;
            color: #1e293b;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1.5rem;
        }
        
        /* Navbar Styles */
        .navbar {
            background: white;
            padding: 1rem 0;
            border-bottom: 1px solid #e2e8f0;
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
        }
        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .logo-img {
            height: 40px;
            width: 40px;
            border-radius: 50%;
            object-fit: cover;
        }
        .logo-text {
            font-size: 1.2rem;
            font-weight: 700;
            color: #E30613;
        }
        .nav-menu {
            display: flex;
            gap: 2rem;
            list-style: none;
        }
        .nav-link {
            color: #1e293b;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s ease;
        }
        .nav-link:hover, .nav-link.active {
            color: #E30613;
        }
        .nav-icons {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .cart-icon {
            position: relative;
            color: #1e293b;
            font-size: 1.2rem;
        }
        .cart-count {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #E30613;
            color: white;
            font-size: 0.6rem;
            padding: 2px 6px;
            border-radius: 50%;
            min-width: 18px;
            text-align: center;
        }
        .user-icon a {
            color: #1e293b;
            font-size: 1.2rem;
        }
        .menu-toggle {
            display: none;
            font-size: 1.2rem;
            cursor: pointer;
        }
        
        /* User Dropdown */
        .user-menu {
            position: relative;
            cursor: pointer;
            display: inline-block;
        }
        .user-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            min-width: 200px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            display: none;
            z-index: 100;
            padding: 0.5rem 0;
            margin-top: 0.5rem;
        }
        .user-dropdown .dropdown-header {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid #eee;
        }
        .user-dropdown .dropdown-header .name {
            font-weight: 600;
            color: #1e293b;
        }
        .user-dropdown .dropdown-header .email {
            font-size: 0.8rem;
            color: #94a3b8;
        }
        .user-dropdown a {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            color: #1e293b;
            text-decoration: none;
            transition: 0.3s ease;
            font-size: 0.9rem;
        }
        .user-dropdown a:hover {
            background: #fef9f5;
            color: #E30613;
        }
        .user-dropdown a i {
            width: 20px;
        }
        .user-dropdown .logout {
            color: #e74c3c;
            border-top: 1px solid #eee;
            margin-top: 0.25rem;
            padding-top: 0.75rem;
        }
        .user-dropdown .logout:hover {
            background: #fee2e2;
        }
        
        /* Footer Styles */
        .footer {
            background: #1e293b;
            color: white;
            padding: 3rem 0 1rem;
            margin-top: 2rem;
        }
        .footer-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
        }
        .footer-section h3, .footer-section h4 {
            margin-bottom: 1rem;
        }
        .footer-section p {
            color: #94a3b8;
            line-height: 1.6;
        }
        .footer-section ul {
            list-style: none;
            padding: 0;
        }
        .footer-section ul li {
            margin-bottom: 0.5rem;
        }
        .footer-section ul li a {
            color: #94a3b8;
            text-decoration: none;
            transition: color 0.3s ease;
        }
        .footer-section ul li a:hover {
            color: white;
        }
        .social-links {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
        }
        .social-links a {
            color: #94a3b8;
            font-size: 1.2rem;
            transition: color 0.3s ease;
        }
        .social-links a:hover {
            color: white;
        }
        .footer-bottom {
            text-align: center;
            padding-top: 2rem;
            margin-top: 2rem;
            border-top: 1px solid #334155;
            color: #94a3b8;
            font-size: 0.85rem;
        }
        
        @media (max-width: 768px) {
            .menu-toggle {
                display: block;
            }
            .nav-menu {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                flex-direction: column;
                padding: 1rem 1.5rem;
                border-bottom: 1px solid #e2e8f0;
            }
            .nav-menu.active {
                display: flex;
            }
            .footer-content {
                grid-template-columns: 1fr;
            }
        }
    `;
}

// Initialize components
function initComponents() {
    // Get current page for active link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    let activePage = '';
    if (currentPage === 'index.html' || currentPage === '') activePage = 'home';
    else if (currentPage === 'products.html') activePage = 'products';
    else if (currentPage === 'profile.html') activePage = 'profile';
    else if (currentPage === 'cart.html') activePage = 'cart';
    else if (currentPage === 'auth.html') activePage = 'auth';
    
    // Inject header and footer
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');
    
    if (headerPlaceholder) {
        headerPlaceholder.innerHTML = createHeader(activePage);
        // Initialize auth UI after header is loaded
        setTimeout(updateAuthUI, 100);
    }
    if (footerPlaceholder) {
        footerPlaceholder.innerHTML = createFooter();
    }
    
    // Add global styles if not already present
    if (!document.getElementById('global-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'global-styles';
        styleEl.textContent = getGlobalStyles();
        document.head.appendChild(styleEl);
    }
    
    // Setup mobile menu toggle
    document.addEventListener('click', function(e) {
        if (e.target.closest('.menu-toggle')) {
            document.querySelector('.nav-menu')?.classList.toggle('active');
        }
    });
    
    // Close mobile menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelector('.nav-menu')?.classList.remove('active');
        });
    });
}

// Update Auth UI with user info
function updateAuthUI() {
    const user = getCurrentUser();
    const authIcon = document.getElementById('auth-icon');
    
    if (authIcon) {
        if (user && user.name) {
            authIcon.innerHTML = `
                <div class="user-menu">
                    <i class="fas fa-user-circle"></i>
                    <span style="font-size: 0.9rem; margin-left: 0.3rem;">${user.name.split(' ')[0]}</span>
                    <div class="user-dropdown">
                        <div class="dropdown-header">
                            <div class="name">${user.name}</div>
                            <div class="email">${user.email}</div>
                        </div>
                        <a href="profile.html"><i class="fas fa-user"></i> My Profile</a>
                        <a href="cart.html"><i class="fas fa-shopping-cart"></i> My Cart</a>
                        <a href="profile.html#orders"><i class="fas fa-shopping-bag"></i> My Orders</a>
                        <a href="#" class="logout" onclick="event.preventDefault(); handleLogout();"><i class="fas fa-sign-out-alt"></i> Logout</a>
                    </div>
                </div>
            `;
            
            const userMenu = authIcon.querySelector('.user-menu');
            const dropdown = authIcon.querySelector('.user-dropdown');
            if (userMenu && dropdown) {
                userMenu.addEventListener('mouseenter', () => dropdown.style.display = 'block');
                dropdown.addEventListener('mouseenter', () => dropdown.style.display = 'block');
                userMenu.addEventListener('mouseleave', () => {
                    setTimeout(() => {
                        if (!dropdown.matches(':hover')) {
                            dropdown.style.display = 'none';
                        }
                    }, 100);
                });
                dropdown.addEventListener('mouseleave', () => {
                    setTimeout(() => {
                        if (!userMenu.matches(':hover')) {
                            dropdown.style.display = 'none';
                        }
                    }, 100);
                });
            }
        } else {
            authIcon.innerHTML = '<a href="auth.html"><i class="fas fa-user"></i></a>';
        }
    }
    
    // Update cart count
    updateCartCount();
}

// Get current user
function getCurrentUser() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.id) return user;
        return null;
    } catch (e) {
        return null;
    }
}

// Update cart count
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
    });
}

// Handle logout
window.handleLogout = function() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('cart');
        localStorage.removeItem('cartId');
        showToast('Logged out successfully!');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
};

// Show toast notification
function showToast(message, isError = false) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'toast';
    notification.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${message}`;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${isError ? '#dc2626' : '#1e293b'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 2100;
        font-size: 0.85rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideInRight 0.3s ease;
        font-family: 'Inter', sans-serif;
        max-width: 400px;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initComponents();
});

// Re-initialize on page changes (for SPA-like behavior)
window.addEventListener('load', function() {
    // Update cart count after page load
    setTimeout(updateCartCount, 500);
});
