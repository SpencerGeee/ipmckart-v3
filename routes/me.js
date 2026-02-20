// routes/me.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // For password hashing
const User = require('../models/User'); // Adjust path to your User model
const { isAuthenticated } = require('../middleware/auth'); // Assuming you have an auth middleware

// GET /api/me - Fetch current user's data (EXPANDED)
router.get('/', isAuthenticated, async (req, res) => {
    try {
        // Find user but exclude the password hash
        const user = await User.findById(req.user.id || req.user._id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Server Error');
    }
});

// PUT /api/me/details - Update account details (name, email)
router.put('/details', isAuthenticated, async (req, res) => {
    const { firstName, lastName, displayName, email } = req.body;

    // Basic validation
    if (!firstName || !lastName || !displayName || !email) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const user = await User.findById(req.user.id || req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        user.firstName = firstName;
        user.lastName = lastName;
        user.displayName = displayName;
        user.email = email;

        await user.save();
        res.json({ message: 'Account details updated successfully.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during update.' });
    }
});

// PUT /api/me/password - Update user password
router.put('/password', isAuthenticated, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide current and new passwords.' });
    }

    try {
        const user = await User.findById(req.user.id || req.user._id);
        if (!user || !user.passwordHash) {
          return res.status(404).json({ message: 'User not found or no password set' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }
        
        // Hash new password
        user.passwordHash = await bcrypt.hash(newPassword, 12);
        
        await user.save();
        res.json({ message: 'Password updated successfully.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during password update.' });
    }
});

// PUT /api/me/address/:type - Update billing or shipping address
router.put('/address/:type', isAuthenticated, async (req, res) => {
    const { type } = req.params; // 'billing' or 'shipping'
    
    if (type !== 'billing' && type !== 'shipping') {
        return res.status(400).json({ message: 'Invalid address type.' });
    }

    try {
        const user = await User.findById(req.user.id || req.user._id);
        const addressData = req.body;
        
        // Using a dynamic key to update the correct address
        user[`${type}Address`] = addressData;

        await user.save();
        res.json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} address saved.` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error saving address.' });
    }
});

module.exports = router;