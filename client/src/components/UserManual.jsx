import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Focus, ListTodo, Palette, MessageSquare } from 'lucide-react';
import PageTransition from './ui/PageTransition';

export default function UserManual({ isOpen, onClose }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="glass-panel w-full max-w-2xl p-6 md:p-12 max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-[2rem] shadow-2xl bg-[#09090b]/90 border border-white/10 relative"
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/20 text-white/50 hover:text-white transition-colors z-10"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative z-10 space-y-8">
                            <div className="space-y-2 text-center">
                                <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-400">
                                    Promate Manual
                                </h2>
                                <p className="text-white/60 font-light text-sm tracking-wide">
                                    Ephemeral flow-state synchronization. No databases. No accounts.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

                                {/* Feature 1 */}
                                <div className="space-y-3 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                                        <Users size={20} />
                                    </div>
                                    <h3 className="text-white font-semibold">Ephemeral Shared Rooms</h3>
                                    <p className="text-white/50 text-sm leading-relaxed">
                                        Create a room to instantly generate a unique session link. Anyone with the link is immediately synced to your master timer.
                                    </p>
                                </div>

                                {/* Feature 2 */}
                                <div className="space-y-3 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                        <Focus size={20} />
                                    </div>
                                    <h3 className="text-white font-semibold">Master Timer Control</h3>
                                    <p className="text-white/50 text-sm leading-relaxed">
                                        The host controls the Start, Pause, and Reset commands. Everyone sees exactly what the host sees within milliseconds.
                                    </p>
                                </div>

                                {/* Feature 3 */}
                                <div className="space-y-3 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                        <Palette size={20} />
                                    </div>
                                    <h3 className="text-white font-semibold">3D Environments</h3>
                                    <p className="text-white/50 text-sm leading-relaxed">
                                        Select from curated 3D CodePen themes or upload a direct image/GIF URL. The host's 3D theme is synced across all clients.
                                    </p>
                                </div>

                                {/* Feature 4 */}
                                <div className="space-y-3 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                        <ListTodo size={20} />
                                    </div>
                                    <h3 className="text-white font-semibold">Shared Task List</h3>
                                    <p className="text-white/50 text-sm leading-relaxed">
                                        Use the floating button in the room to track team goals. Adding, toggling, or removing a task updates for everyone instantly.
                                    </p>
                                </div>

                                {/* Feature 5 */}
                                <div className="space-y-3 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors md:col-span-2 lg:col-span-1">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                                        <MessageSquare size={20} />
                                    </div>
                                    <h3 className="text-white font-semibold">Real-Time Chat</h3>
                                    <p className="text-white/50 text-sm leading-relaxed">
                                        Communicate with everyone in the room via the bottom-left chat panel. Send quick messages without leaving your state of flow.
                                    </p>
                                </div>

                            </div>

                            <div className="pt-6 flex justify-center">
                                <button
                                    onClick={onClose}
                                    className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold tracking-wide transition-all"
                                >
                                    Got it, let's focus
                                </button>
                            </div>

                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
