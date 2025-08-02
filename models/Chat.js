const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    messageType: {
        type: String,
        enum: ['text', 'file', 'image'],
        default: 'text'
    },
    fileUrl: {
        type: String
    },
    fileName: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    chatType: {
        type: String,
        enum: ['individual', 'group'],
        default: 'individual'
    },
    chatName: {
        type: String,
        trim: true
    },
    groupAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: new Map()
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Add messages as a subdocument
chatSchema.add({
    messages: [messageSchema]
});

// Index for efficient querying
chatSchema.index({ participants: 1 });
chatSchema.index({ 'messages.createdAt': -1 });

// Method to get chat participants excluding current user
chatSchema.methods.getOtherParticipants = function(userId) {
    return this.participants.filter(participant => 
        participant.toString() !== userId.toString()
    );
};

// Method to mark messages as read
chatSchema.methods.markAsRead = function(userId) {
    this.messages.forEach(message => {
        if (!message.readBy.some(read => read.user.toString() === userId.toString())) {
            message.readBy.push({
                user: userId,
                readAt: new Date()
            });
            message.isRead = true;
        }
    });
    this.unreadCount.set(userId.toString(), 0);
    return this.save();
};

// Method to add message to chat
chatSchema.methods.addMessage = function(senderId, content, messageType = 'text', fileUrl = null, fileName = null) {
    const message = {
        sender: senderId,
        content: content,
        messageType: messageType,
        fileUrl: fileUrl,
        fileName: fileName,
        isRead: false,
        readBy: []
    };
    
    this.messages.push(message);
    this.lastMessage = this.messages[this.messages.length - 1]._id;
    
    // Update unread count for other participants
    this.participants.forEach(participantId => {
        if (participantId.toString() !== senderId.toString()) {
            const currentCount = this.unreadCount.get(participantId.toString()) || 0;
            this.unreadCount.set(participantId.toString(), currentCount + 1);
        }
    });
    
    return this.save();
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat; 