const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 chat requests per windowMs
});

// Get or create chat with specific user
router.get('/chat/:userId', chatLimiter, auth, async (req, res) => {
    try {
        console.log('Getting chat for users:', req.user.id, req.params.userId);
        
        let chat = await Chat.findOne({
            participants: { 
                $all: [req.user.id, req.params.userId] 
            }
        })
        .populate('participants', 'username profilePicture')
        .populate('messages.sender', 'username');

        if (!chat) {
            console.log('Creating new chat');
            chat = new Chat({
                participants: [req.user.id, req.params.userId],
                messages: []
            });
            await chat.save();
            chat = await chat.populate('participants', 'username profilePicture');
        }

        console.log('Returning chat:', chat);
        res.json(chat);
    } catch (error) {
        console.error('Chat route error:', error);
        res.status(500).json({ message: 'Error accessing chat' });
    }
});

// Send message
router.post('/chat/:chatId/message', chatLimiter, auth, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        const message = {
            sender: req.user.id,
            content: req.body.content,
            timestamp: new Date()
        };

        chat.messages.push(message);
        chat.lastMessage = message.timestamp;
        await chat.save();

        res.json(message);
    } catch (error) {
        console.error('Message route error:', error);
        res.status(500).json({ message: 'Error sending message' });
    }
});

module.exports = router; 