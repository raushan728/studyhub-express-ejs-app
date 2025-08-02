// Dark Mode Functionality
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme === 'dark' || (savedTheme === 'auto' && prefersDark)) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
    
    // Theme toggle functionality
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            setTheme(newTheme);
            saveThemePreference(newTheme);
            
            // Add click animation
            themeToggle.style.transform = 'scale(0.8)';
            setTimeout(() => {
                themeToggle.style.transform = 'scale(1)';
            }, 150);
        });
    }
    
    // Set theme function
    function setTheme(theme) {
        body.setAttribute('data-theme', theme);
        
        // Update toggle button icon
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                if (theme === 'dark') {
                    icon.className = 'fas fa-sun';
                    icon.style.color = '#ffd700'; // Golden color for sun
                } else {
                    icon.className = 'fas fa-moon';
                    icon.style.color = '#6366f1'; // Purple color for moon
                }
            }
        }
        
        // Add theme transition class
        body.classList.add('theme-transitioning');
        setTimeout(() => {
            body.classList.remove('theme-transitioning');
        }, 300);
        
        // Trigger custom event for other scripts
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }
    
    // Save theme preference
    function saveThemePreference(theme) {
        localStorage.setItem('theme', theme);
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'auto') {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
    
    // Keyboard shortcut for theme toggle (Ctrl/Cmd + T)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            if (themeToggle) {
                themeToggle.click();
            }
        }
    });
    
    // Add theme transition styles
    const style = document.createElement('style');
    style.textContent = `
        .theme-transitioning * {
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease !important;
        }
        
        .theme-toggle {
            transition: all 0.3s ease;
        }
        
        .theme-toggle i {
            transition: all 0.3s ease;
        }
        
        /* Smooth theme switching animations */
        [data-theme="dark"] .hero-title {
            animation: darkGlow 2s ease-in-out infinite alternate;
        }
        
        @keyframes darkGlow {
            from { 
                text-shadow: 0 0 5px var(--accent-primary), 0 0 10px var(--accent-primary);
            }
            to { 
                text-shadow: 0 0 20px var(--accent-primary), 0 0 30px var(--accent-primary), 0 0 40px var(--accent-primary);
            }
        }
        
        /* Floating animation for dark mode */
        [data-theme="dark"] .floating-cards .card {
            animation: darkFloat 3s ease-in-out infinite;
        }
        
        @keyframes darkFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(-10px) rotate(1deg); }
            50% { transform: translateY(-5px) rotate(-1deg); }
            75% { transform: translateY(-15px) rotate(0.5deg); }
        }
        
        /* Pulse animation for dark mode elements */
        [data-theme="dark"] .btn-primary {
            animation: darkPulse 2s ease-in-out infinite;
        }
        
        @keyframes darkPulse {
            0%, 100% { box-shadow: 0 4px 12px var(--shadow-medium); }
            50% { box-shadow: 0 4px 20px var(--accent-primary), 0 0 30px rgba(99, 102, 241, 0.3); }
        }
        
        /* Gradient animation for dark mode backgrounds */
        [data-theme="dark"] .hero {
            background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-tertiary) 100%);
            background-size: 400% 400%;
            animation: darkGradient 8s ease infinite;
        }
        
        @keyframes darkGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        /* Typing indicator for dark mode */
        [data-theme="dark"] .typing-indicator {
            background: var(--accent-primary);
            animation: darkTyping 1.4s ease-in-out infinite;
        }
        
        @keyframes darkTyping {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
        }
        
        /* Message bubble animation for dark mode */
        [data-theme="dark"] .message-text {
            animation: darkMessageBubble 0.3s ease-out;
        }
        
        @keyframes darkMessageBubble {
            from { 
                opacity: 0;
                transform: scale(0.8) translateY(10px);
            }
            to { 
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        /* Loading spinner for dark mode */
        [data-theme="dark"] .loading-spinner {
            border: 2px solid var(--bg-secondary);
            border-top: 2px solid var(--accent-primary);
            animation: darkSpin 1s linear infinite;
        }
        
        @keyframes darkSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Ripple effect for dark mode buttons */
        [data-theme="dark"] .btn {
            position: relative;
            overflow: hidden;
        }
        
        [data-theme="dark"] .btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }
        
        [data-theme="dark"] .btn:active::before {
            width: 300px;
            height: 300px;
        }
    `;
    document.head.appendChild(style);
    
    // Add theme-aware scrollbar
    function updateScrollbar() {
        const scrollbarStyle = document.createElement('style');
        scrollbarStyle.textContent = `
            ::-webkit-scrollbar {
                width: 12px;
            }
            
            ::-webkit-scrollbar-track {
                background: var(--bg-secondary);
                border-radius: 6px;
            }
            
            ::-webkit-scrollbar-thumb {
                background: var(--border-color);
                border-radius: 6px;
                border: 2px solid var(--bg-secondary);
            }
            
            ::-webkit-scrollbar-thumb:hover {
                background: var(--accent-primary);
            }
            
            ::-webkit-scrollbar-corner {
                background: var(--bg-secondary);
            }
        `;
        document.head.appendChild(scrollbarStyle);
    }
    
    updateScrollbar();
    
    // Theme-aware focus styles
    function updateFocusStyles() {
        const focusStyle = document.createElement('style');
        focusStyle.textContent = `
            *:focus {
                outline: 2px solid var(--accent-primary);
                outline-offset: 2px;
                border-radius: 4px;
            }
            
            *:focus:not(:focus-visible) {
                outline: none;
            }
            
            *:focus-visible {
                outline: 2px solid var(--accent-primary);
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(focusStyle);
    }
    
    updateFocusStyles();
    
    // Add theme-aware selection styles
    function updateSelectionStyles() {
        const selectionStyle = document.createElement('style');
        selectionStyle.textContent = `
            ::selection {
                background-color: var(--accent-primary);
                color: white;
            }
            
            ::-moz-selection {
                background-color: var(--accent-primary);
                color: white;
            }
        `;
        document.head.appendChild(selectionStyle);
    }
    
    updateSelectionStyles();
    
    // Theme-aware alert styles
    function updateAlertStyles() {
        const alertStyle = document.createElement('style');
        alertStyle.textContent = `
            .alert {
                border-radius: 8px;
                padding: 12px 16px;
                margin: 10px 0;
                border-left: 4px solid;
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .alert-success {
                background-color: rgba(40, 167, 69, 0.1);
                border-color: var(--success-color);
                color: var(--success-color);
            }
            
            .alert-error {
                background-color: rgba(220, 53, 69, 0.1);
                border-color: var(--error-color);
                color: var(--error-color);
            }
            
            .alert-info {
                background-color: rgba(23, 162, 184, 0.1);
                border-color: var(--info-color);
                color: var(--info-color);
            }
            
            .alert-warning {
                background-color: rgba(255, 193, 7, 0.1);
                border-color: var(--warning-color);
                color: var(--warning-color);
            }
        `;
        document.head.appendChild(alertStyle);
    }
    
    updateAlertStyles();
    
    // Initialize theme-aware components
    function initializeThemeAwareComponents() {
        // Add theme-aware loading states
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(element => {
            element.classList.add('loading-spinner');
        });
        
        // Add theme-aware hover effects
        const interactiveElements = document.querySelectorAll('.btn, .card, .feature-card');
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 8px 25px var(--shadow-medium)';
            });
            
            element.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 2px 8px var(--shadow-light)';
            });
        });
    }
    
    // Call initialization after a short delay to ensure DOM is ready
    setTimeout(initializeThemeAwareComponents, 100);
    
    // Export theme functions for use in other scripts
    window.themeUtils = {
        setTheme,
        getCurrentTheme: () => body.getAttribute('data-theme'),
        toggleTheme: () => themeToggle?.click()
    };
    
    console.log('🌙 Dark mode functionality initialized');
}); 