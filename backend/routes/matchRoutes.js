// routes/matchRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const rateLimit = require('express-rate-limit');

const matchLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs for this route
});

router.get('/find-matches', matchLimiter, async (req, res) => {
    try {
        const { userId } = req.query;
        
        // Fetch the current user's data
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Define matching criteria based on interests and gender preference
        const matchCriteria = {
            _id: { $ne: userId },  // Exclude the current user
            gender: currentUser.genderPreference === 'any' ? { $exists: true } : currentUser.genderPreference,
            genderPreference: { $in: [currentUser.gender, 'any'] },  // Match user's gender or 'any'
            interests: { $in: currentUser.interests }  // At least one common interest
        };

        // Find users who match the criteria
        const matches = await User.find(matchCriteria);

        res.json(matches);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error finding matches' });
    }
});

module.exports = router;
