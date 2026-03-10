const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Escape special characters in a string so it can be safely used inside a RegExp
function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.signup = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        console.log('Received signup request:', { username, email });

        if (!username || !email || !password) {
            return res.status(400).json({ 
                message: 'All fields are required',
                details: {
                    username: !username ? 'Username is required' : null,
                    email: !email ? 'Email is required' : null,
                    password: !password ? 'Password is required' : null
                }
            });
        }

        if (username.length < 3) {
            return res.status(400).json({ 
                message: 'Username must be at least 3 characters long' 
            });
        }

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                message: 'Please provide a valid email address' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters long' 
            });
        }

        const existingUser = await User.findOne({ 
            email: email.toLowerCase() 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                message: 'Email is already registered' 
            });
        }

        const existingUsername = await User.findOne({ 
            username: new RegExp(`^${escapeRegExp(username)}$`, 'i') 
        });
        
        if (existingUsername) {
            return res.status(400).json({ 
                message: 'Username is already taken' 
            });
        }

        const user = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password
        });

        await user.save();

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({ 
            message: 'User created successfully',
            token
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            message: 'Error creating user',
            error: error.message 
        });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        res.json({ 
            token,
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};
