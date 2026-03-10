// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');
const { updateProfile, getProfile } = require('../controllers/profileController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

const profileLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 profile update requests per windowMs
});

// Auth routes
router.post('/signup', signup);
router.post('/login', login);

// Profile routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, profileLimiter, upload, updateProfile);

// Matches route
router.get('/matches', auth, async (req, res) => {
    try {
        console.log('Matches route hit for user:', req.user.id);
        
        // Check if user exists
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            console.log('Current user not found');
            return res.status(404).json({ message: 'User not found' });
        }

        // Log current user's interests
        console.log('Current user interests:', currentUser.interests);

        // Find matches only if user has interests
        if (!currentUser.interests || currentUser.interests.length === 0) {
            console.log('User has no interests set');
            return res.json([]); // Return empty array if no interests
        }

        // Find matches
        const matches = await User.find({
            _id: { $ne: req.user.id }, // Exclude current user
            interests: { $in: currentUser.interests } // Match any shared interests
        }).select('username age profilePicture');

        console.log('Found matches:', matches.length);
        res.json(matches);

    } catch (error) {
        console.error('Error in /matches route:', error);
        res.status(500).json({ 
            message: 'Error fetching matches',
            error: error.message 
        });
    }
});

// Add this route to create an admin (you may want to remove this after creating the first admin)
router.post('/create-admin', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new admin user
        user = new User({
            email,
            password,
            username,
            role: 'admin'  // Set role as admin
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        res.status(201).json({ message: 'Admin created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add this route to check admin status
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
