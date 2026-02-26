import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const ChatBox = ({ roomId, initialMessages = [], username = '' }) => {
    const { socket } = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [hasUnread, setHasUnread] = useState(false);
    const messagesEndRef = useRef(null);

    // Seed messages when initial history arrives from Room.jsx
    useEffect(() => {
        if (initialMessages.length > 0) {
            setMessages(initialMessages);
        }
    }, [initialMessages]);

    // Subscribe directly to chat_sync from within ChatBox
    useEffect(() => {
        if (!socket) return;

        const handleChatSync = (updatedChat) => {
            setMessages(updatedChat);
            if (!isOpen) setHasUnread(true);
        };

        socket.on('chat_sync', handleChatSync);
        return () => socket.off('chat_sync', handleChatSync);
    }, [socket, isOpen]);

    // Clear unread badge when opened
    useEffect(() => {
        if (isOpen) setHasUnread(false);
    }, [isOpen]);

    // Auto-scroll to bottom on new message
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        const text = newMessage.trim();
        if (!text || !socket) return;

        const sender = username || `User-${socket.id.substring(0, 4)}`;

        // Optimistic update: show own message immediately
        const optimisticMsg = {
            id: `opt-${Date.now()}`,
            sender,
            text,
            timestamp: Date.now(),
            optimistic: true,
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');

        socket.emit('send_message', { roomId, sender, text });
    };

    return (
        <div className="relative z-50 flex flex-col items-start group/chatbox">

            {/* The Chat Widget Body */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="absolute bottom-full mb-4 left-0 glass-panel w-[calc(100vw-3rem)] sm:w-80 h-[350px] rounded-3xl border border-white/20 shadow-2xl backdrop-blur-xl bg-[#09090b]/90 z-50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <MessageSquare size={18} className="text-emerald-400" />
                                <h3 className="font-semibold text-white tracking-wide">Room Chat</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Message Feed */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-white/30 text-sm text-center">
                                    <p>No messages yet.</p>
                                    <p className="text-xs mt-1">Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const myName = username || (socket && `User-${socket.id.substring(0, 4)}`);
                                    const isMe = msg.sender === myName;
                                    return (
                                        <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <span className="text-[10px] text-white/30 mb-1 tracking-wider uppercase">
                                                {isMe ? 'You' : msg.sender}
                                            </span>
                                            <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm break-words whitespace-pre-wrap ${isMe ? 'bg-emerald-600/80 text-white rounded-br-sm' : 'bg-white/10 text-white/90 rounded-bl-sm'} ${msg.optimistic ? 'opacity-70' : ''}`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t border-white/10 bg-black/40 flex-shrink-0">
                            <form onSubmit={handleSendMessage} className="relative">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-base md:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-600 rounded-lg text-white disabled:opacity-50 disabled:bg-white/10 transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md border border-white/20 transition-colors overflow-hidden relative ${isOpen ? 'bg-emerald-600/80 text-white' : 'glass-panel text-emerald-300 hover:text-white hover:bg-white/10'}`}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}

                {/* Notification Badge */}
                {hasUnread && (
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-pink-500 rounded-full border border-black animate-pulse" />
                )}
            </motion.button>

        </div>
    );
};

export default ChatBox;
