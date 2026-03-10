// routes/matchRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/find-matches', async (req, res) => {
    try {
        const { userId } = req.query;
        // Validate that userId is a primitive string to avoid NoSQL injection
        if (typeof userId !== 'string') {
            return res.status(400).json({ message: 'Invalid userId' });
        }
        
        // Fetch the current user's data
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Define matching criteria based on interests and gender preference
        const matchCriteria = {
            _id: { $ne: { $eq: userId } },  // Exclude the current user, treating userId as a literal
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
