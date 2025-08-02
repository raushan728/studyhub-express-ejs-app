const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    req.flash('error', 'Please login to access this page');
    res.redirect('/auth/login');
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    req.flash('error', 'Access denied. Admin privileges required.');
    res.redirect('/');
};

// GET - Signup page
router.get('/signup', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('auth/signup', { 
        title: 'Sign Up - StudyHub',
        user: null,
        errors: req.flash('error'),
        success: req.flash('success')
    });
});

// POST - Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            req.flash('error', 'All fields are required');
            return res.redirect('/auth/signup');
        }

        if (password !== confirmPassword) {
            req.flash('error', 'Passwords do not match');
            return res.redirect('/auth/signup');
        }

        if (password.length < 6) {
            req.flash('error', 'Password must be at least 6 characters long');
            return res.redirect('/auth/signup');
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            req.flash('error', 'Email already registered');
            return res.redirect('/auth/signup');
        }

        // Create new user
        const user = new User({
            name,
            email,
            password
        });

        await user.save();

        req.flash('success', 'Account created successfully! Please login.');
        res.redirect('/auth/login');

    } catch (error) {
        console.error('Signup error:', error);
        req.flash('error', 'An error occurred during signup');
        res.redirect('/auth/signup');
    }
});

// GET - Login page
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('auth/login', { 
        title: 'Login - StudyHub',
        user: null,
        errors: req.flash('error'),
        success: req.flash('success')
    });
});

// POST - Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            req.flash('error', 'Email and password are required');
            return res.redirect('/auth/login');
        }

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/auth/login');
        }

        // Check if user is active
        if (!user.isActive) {
            req.flash('error', 'Account is deactivated. Please contact support.');
            return res.redirect('/auth/login');
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/auth/login');
        }

        // Update last login
        await user.updateLastLogin();

        // Store user in session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar
        };

        req.flash('success', `Welcome back, ${user.name}!`);
        
        // Redirect based on role
        if (user.role === 'admin') {
            res.redirect('/admin/dashboard');
        } else {
            res.redirect('/dashboard');
        }

    } catch (error) {
        console.error('Login error:', error);
        req.flash('error', 'An error occurred during login');
        res.redirect('/auth/login');
    }
});

// GET - Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

// GET - Profile page
router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);
        if (!user) {
            req.session.destroy();
            req.flash('error', 'User not found');
            return res.redirect('/auth/login');
        }

        res.render('auth/profile', {
            title: 'Profile - StudyHub',
            user: user.getPublicProfile(),
            errors: req.flash('error'),
            success: req.flash('success')
        });

    } catch (error) {
        console.error('Profile error:', error);
        req.flash('error', 'An error occurred while loading profile');
        res.redirect('/dashboard');
    }
});

// POST - Update profile
router.post('/profile', isAuthenticated, async (req, res) => {
    try {
        const { name, email, bio } = req.body;
        const user = await User.findById(req.session.user.id);

        if (!user) {
            req.session.destroy();
            req.flash('error', 'User not found');
            return res.redirect('/auth/login');
        }

        // Check if email is already taken by another user
        if (email !== user.email) {
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                req.flash('error', 'Email already taken');
                return res.redirect('/auth/profile');
            }
        }

        // Update user
        user.name = name;
        user.email = email;
        user.bio = bio;

        await user.save();

        // Update session
        req.session.user.name = name;
        req.session.user.email = email;

        req.flash('success', 'Profile updated successfully!');
        res.redirect('/auth/profile');

    } catch (error) {
        console.error('Profile update error:', error);
        req.flash('error', 'An error occurred while updating profile');
        res.redirect('/auth/profile');
    }
});

// GET - Change password page
router.get('/change-password', isAuthenticated, (req, res) => {
    res.render('auth/change-password', {
        title: 'Change Password - StudyHub',
        user: req.session.user,
        errors: req.flash('error'),
        success: req.flash('success')
    });
});

// POST - Change password
router.post('/change-password', isAuthenticated, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            req.flash('error', 'All fields are required');
            return res.redirect('/auth/change-password');
        }

        if (newPassword !== confirmPassword) {
            req.flash('error', 'New passwords do not match');
            return res.redirect('/auth/change-password');
        }

        if (newPassword.length < 6) {
            req.flash('error', 'New password must be at least 6 characters long');
            return res.redirect('/auth/change-password');
        }

        const user = await User.findById(req.session.user.id);
        if (!user) {
            req.session.destroy();
            req.flash('error', 'User not found');
            return res.redirect('/auth/login');
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            req.flash('error', 'Current password is incorrect');
            return res.redirect('/auth/change-password');
        }

        // Update password
        user.password = newPassword;
        await user.save();

        req.flash('success', 'Password changed successfully!');
        res.redirect('/auth/change-password');

    } catch (error) {
        console.error('Change password error:', error);
        req.flash('error', 'An error occurred while changing password');
        res.redirect('/auth/change-password');
    }
});

// GET - Forgot password page
router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password', {
        title: 'Forgot Password - StudyHub',
        user: null,
        errors: req.flash('error'),
        success: req.flash('success')
    });
});

// POST - Forgot password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            req.flash('error', 'Email is required');
            return res.redirect('/auth/forgot-password');
        }

        const user = await User.findByEmail(email);
        if (!user) {
            // Don't reveal if email exists or not for security
            req.flash('success', 'If an account with this email exists, you will receive a password reset link.');
            return res.redirect('/auth/forgot-password');
        }

        // Generate reset token (simplified version)
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // In a real app, send email here
        console.log('Password reset token:', resetToken);

        req.flash('success', 'Password reset link sent to your email (check console for token)');
        res.redirect('/auth/forgot-password');

    } catch (error) {
        console.error('Forgot password error:', error);
        req.flash('error', 'An error occurred while processing your request');
        res.redirect('/auth/forgot-password');
    }
});

// GET - Reset password page
router.get('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired');
            return res.redirect('/auth/forgot-password');
        }

        res.render('auth/reset-password', {
            title: 'Reset Password - StudyHub',
            user: null,
            token,
            errors: req.flash('error'),
            success: req.flash('success')
        });

    } catch (error) {
        console.error('Reset password error:', error);
        req.flash('error', 'An error occurred');
        res.redirect('/auth/forgot-password');
    }
});

// POST - Reset password
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        if (!password || !confirmPassword) {
            req.flash('error', 'All fields are required');
            return res.redirect(`/auth/reset-password/${token}`);
        }

        if (password !== confirmPassword) {
            req.flash('error', 'Passwords do not match');
            return res.redirect(`/auth/reset-password/${token}`);
        }

        if (password.length < 6) {
            req.flash('error', 'Password must be at least 6 characters long');
            return res.redirect(`/auth/reset-password/${token}`);
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired');
            return res.redirect('/auth/forgot-password');
        }

        // Update password and clear reset token
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        req.flash('success', 'Password has been reset successfully! Please login with your new password.');
        res.redirect('/auth/login');

    } catch (error) {
        console.error('Reset password error:', error);
        req.flash('error', 'An error occurred while resetting password');
        res.redirect('/auth/forgot-password');
    }
});

module.exports = router; 