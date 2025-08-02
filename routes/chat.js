const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Chat = require('../models/Chat');
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/chat/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: function (req, file, cb) {
        // Allow images and documents
        if (file.mimetype.startsWith('image/') || 
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/msword' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.mimetype === 'text/plain') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
        }
    }
});

// Middleware to ensure user is authenticated
router.use(isAuthenticated);

// Get all chats for current user
router.get('/', async (req, res) => {
    try {
        const userId = req.session.user._id;
        
        const chats = await Chat.find({
            participants: userId,
            isActive: true
        })
        .populate('participants', 'name email avatar')
        .populate('lastMessage')
        .populate('groupAdmin', 'name')
        .sort({ updatedAt: -1 });

        // Format chats for frontend
        const formattedChats = chats.map(chat => {
            const otherParticipants = chat.getOtherParticipants(userId);
            const unreadCount = chat.unreadCount.get(userId.toString()) || 0;
            
            return {
                _id: chat._id,
                chatType: chat.chatType,
                chatName: chat.chatName || (chat.chatType === 'individual' ? 
                    otherParticipants[0]?.name : chat.chatName),
                participants: chat.participants,
                otherParticipants: otherParticipants,
                lastMessage: chat.lastMessage,
                unreadCount: unreadCount,
                updatedAt: chat.updatedAt,
                isGroup: chat.chatType === 'group'
            };
        });

        res.render('chat/index', {
            title: 'Chats',
            chats: formattedChats,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching chats:', error);
        req.flash('error', 'Failed to load chats');
        res.redirect('/dashboard');
    }
});

// Get specific chat
router.get('/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.session.user._id;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
            isActive: true
        })
        .populate('participants', 'name email avatar')
        .populate('messages.sender', 'name email avatar')
        .populate('groupAdmin', 'name');

        if (!chat) {
            req.flash('error', 'Chat not found');
            return res.redirect('/chat');
        }

        // Mark messages as read
        await chat.markAsRead(userId);

        // Get all users for new chat creation
        const allUsers = await User.find({
            _id: { $ne: userId },
            isActive: true
        }).select('name email avatar');

        const otherParticipants = chat.getOtherParticipants(userId);

        res.render('chat/conversation', {
            title: 'Chat',
            chat: chat,
            otherParticipants: otherParticipants,
            allUsers: allUsers,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching chat:', error);
        req.flash('error', 'Failed to load chat');
        res.redirect('/chat');
    }
});

// Create new individual chat
router.post('/create', async (req, res) => {
    try {
        const { participantId } = req.body;
        const userId = req.session.user._id;

        if (!participantId) {
            return res.status(400).json({ error: 'Participant ID is required' });
        }

        // Check if chat already exists
        let existingChat = await Chat.findOne({
            participants: { $all: [userId, participantId] },
            chatType: 'individual',
            isActive: true
        });

        if (existingChat) {
            return res.json({ 
                success: true, 
                chatId: existingChat._id,
                message: 'Chat already exists'
            });
        }

        // Create new chat
        const newChat = new Chat({
            participants: [userId, participantId],
            chatType: 'individual',
            messages: []
        });

        await newChat.save();

        res.json({ 
            success: true, 
            chatId: newChat._id,
            message: 'Chat created successfully'
        });
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ error: 'Failed to create chat' });
    }
});

// Create new group chat
router.post('/create-group', async (req, res) => {
    try {
        const { chatName, participantIds } = req.body;
        const userId = req.session.user._id;

        if (!chatName || !participantIds || participantIds.length === 0) {
            return res.status(400).json({ error: 'Chat name and participants are required' });
        }

        // Add current user to participants
        const allParticipants = [userId, ...participantIds];

        const newGroupChat = new Chat({
            participants: allParticipants,
            chatType: 'group',
            chatName: chatName,
            groupAdmin: userId,
            messages: []
        });

        await newGroupChat.save();

        res.json({ 
            success: true, 
            chatId: newGroupChat._id,
            message: 'Group chat created successfully'
        });
    } catch (error) {
        console.error('Error creating group chat:', error);
        res.status(500).json({ error: 'Failed to create group chat' });
    }
});

// Send message
router.post('/:chatId/message', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content, messageType = 'text', fileUrl = null, fileName = null } = req.body;
        const userId = req.session.user._id;

        if (!content) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
            isActive: true
        });

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Add message to chat
        await chat.addMessage(userId, content, messageType, fileUrl, fileName);

        // Populate sender info for response
        const populatedChat = await Chat.findById(chatId)
            .populate('messages.sender', 'name email avatar')
            .populate('participants', 'name email avatar');

        const newMessage = populatedChat.messages[populatedChat.messages.length - 1];

        res.json({
            success: true,
            message: newMessage,
            chatId: chatId
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get users for chat creation
router.get('/users', async (req, res) => {
    try {
        const userId = req.session.user._id;
        
        const users = await User.find({
            _id: { $ne: userId },
            isActive: true
        }).select('name email avatar');

        res.json({
            success: true,
            users: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get messages for a chat (for AJAX requests)
router.get('/:chatId/messages', async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.session.user._id;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
            isActive: true
        })
        .populate('messages.sender', 'name email avatar');

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        res.json({
            success: true,
            messages: chat.messages
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Upload file for chat
router.post('/:chatId/upload', upload.single('file'), async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.session.user._id;
        const { messageType } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
            isActive: true
        });

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const fileUrl = `/uploads/chat/${req.file.filename}`;
        const fileName = req.file.originalname;

        // Add message to chat
        await chat.addMessage(userId, '', messageType, fileUrl, fileName);

        res.json({
            success: true,
            fileUrl: fileUrl,
            fileName: fileName
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Mark chat as read
router.post('/:chatId/read', async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.session.user._id;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
            isActive: true
        });

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        await chat.markAsRead(userId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking chat as read:', error);
        res.status(500).json({ error: 'Failed to mark chat as read' });
    }
});

// Delete chat (for individual chats only)
router.delete('/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.session.user._id;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
            chatType: 'individual',
            isActive: true
        });

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Soft delete - mark as inactive
        chat.isActive = false;
        await chat.save();

        res.json({ success: true, message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ error: 'Failed to delete chat' });
    }
});

module.exports = router;