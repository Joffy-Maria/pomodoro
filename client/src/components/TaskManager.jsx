import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trash2, Plus, ListTodo, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const TaskManager = ({ roomId, tasks }) => {
    const { socket } = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const [newTaskText, setNewTaskText] = useState('');

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTaskText.trim() || !socket) return;

        socket.emit('task_add', { roomId, text: newTaskText.trim() });
        setNewTaskText('');
    };

    const handleToggleTask = (taskId) => {
        if (!socket) return;
        socket.emit('task_toggle', { roomId, taskId });
    };

    const handleRemoveTask = (taskId) => {
        if (!socket) return;
        socket.emit('task_remove', { roomId, taskId });
    };

    const completedCount = tasks.filter(t => t.completed).length;

    return (
        <div className="relative z-50 flex flex-col items-end">

            {/* The Task Widget Body */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="absolute bottom-full mb-4 right-0 glass-panel w-[calc(100vw-3rem)] sm:w-80 h-[350px] rounded-3xl border border-white/20 shadow-2xl backdrop-blur-xl bg-[#09090b]/90 z-50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 h-[60px]">
                            <div className="flex items-center gap-2">
                                <ListTodo size={18} className="text-purple-400" />
                                <h3 className="font-semibold text-white tracking-wide">Session Tasks</h3>
                            </div>
                            <span className="text-xs font-mono text-white/50 bg-black/40 px-2 py-1 rounded-md">
                                {completedCount}/{tasks.length}
                            </span>
                        </div>

                        {/* Task List */}
                        <div className="h-[225px] overflow-y-auto p-2 space-y-1">
                            {tasks.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-white/30 text-sm py-8 text-center px-4">
                                    <p>No tasks yet.</p>
                                    <p className="text-xs mt-1">Add tasks to sync them with everyone in the room.</p>
                                </div>
                            ) : (
                                <AnimatePresence initial={false}>
                                    {tasks.map(task => (
                                        <motion.div
                                            key={task.id}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className={`group flex items-center justify-between p-3 rounded-xl transition-all ${task.completed ? 'bg-white/5' : 'bg-white/10 hover:bg-white/15'}`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <button
                                                    onClick={() => handleToggleTask(task.id)}
                                                    className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-white/30 hover:border-purple-400'}`}
                                                >
                                                    {task.completed && <Check size={12} className="text-white" />}
                                                </button>
                                                <span className={`text-sm truncate transition-all ${task.completed ? 'text-white/40 line-through' : 'text-white/90'}`}>
                                                    {task.text}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => handleRemoveTask(task.id)}
                                                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-rose-400 transition-all p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t border-white/10 bg-black/40">
                            <form onSubmit={handleAddTask} className="relative">
                                <input
                                    type="text"
                                    value={newTaskText}
                                    onChange={(e) => setNewTaskText(e.target.value)}
                                    placeholder="Add a new task..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-base md:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!newTaskText.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-purple-600 rounded-lg text-white disabled:opacity-50 disabled:bg-white/10 transition-colors"
                                >
                                    <Plus size={16} />
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
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md border border-white/20 transition-colors overflow-hidden relative ${isOpen ? 'bg-purple-600/80 text-white' : 'glass-panel text-purple-300 hover:text-white hover:bg-white/10'}`}
            >
                {isOpen ? <X size={24} /> : <ListTodo size={24} />}

                {/* Notification Badge */}
                {!isOpen && tasks.length > 0 && tasks.filter(t => !t.completed).length > 0 && (
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-pink-500 rounded-full border border-black animate-pulse" />
                )}
            </motion.button>

        </div>
    );
};

export default TaskManager;
