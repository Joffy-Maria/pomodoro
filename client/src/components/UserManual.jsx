import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Focus, ListTodo, Palette, MessageSquare } from 'lucide-react';

const FEATURES = [
    {
        icon: Users,
        title: 'Ephemeral shared rooms',
        description:
            'Create a room to instantly generate a unique session code. Anyone with the link is synced to the same timer — and the room disappears when the last person leaves.',
        tone: 'bg-brand-500/12 text-brand-300 ring-brand-400/25',
    },
    {
        icon: Focus,
        title: 'Master timer control',
        description:
            'The host controls start, pause and reset. Everyone sees exactly the same second, because the server owns the clock rather than the browser.',
        tone: 'bg-mint-500/12 text-mint-300 ring-mint-400/25',
    },
    {
        icon: Palette,
        title: 'Immersive environments',
        description:
            'Pick one of the curated 3D scenes or drop in a direct image/GIF URL. The host’s choice is shared with the whole room.',
        tone: 'bg-focus-500/12 text-focus-300 ring-focus-400/25',
    },
    {
        icon: ListTodo,
        title: 'Shared task list',
        description:
            'Use the floating list in the room to track the block. Adding, ticking off or removing a task updates for everyone instantly.',
        tone: 'bg-brand-500/12 text-brand-300 ring-brand-400/25',
    },
    {
        icon: MessageSquare,
        title: 'Real-time chat',
        description:
            'Shared rooms get a lightweight chat beside the timer. Send a blocker, a link or a quiet “nice work” without leaving focus mode. Solo sessions stay chat-free.',
        tone: 'bg-mint-500/12 text-mint-300 ring-mint-400/25',
    },
];

export default function UserManual({ isOpen, onClose }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-ink-950/80 px-4 backdrop-blur-md"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Promate manual"
                >
                    <motion.div
                        initial={{ scale: 0.96, y: 18, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.97, y: 10, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="surface-raised relative max-h-[86vh] w-full max-w-2xl overflow-y-auto overflow-x-hidden p-6 sm:p-9 md:p-11"
                    >
                        {/* Background decoration */}
                        <div
                            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/18 blur-3xl"
                            aria-hidden="true"
                        />
                        <div
                            className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-focus-500/12 blur-3xl"
                            aria-hidden="true"
                        />

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close manual"
                            className="absolute right-5 top-5 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            <X size={18} />
                        </button>

                        <div className="relative z-10 space-y-7">
                            <header className="space-y-2 pr-10">
                                <span className="chip">The manual</span>
                                <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                                    How <span className="text-gradient">Promate</span> works
                                </h2>
                                <p className="max-w-lg text-sm leading-relaxed text-slate-400">
                                    Ephemeral, synchronized focus. No accounts, no database — one timer
                                    shared by everyone in the room.
                                </p>
                            </header>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {FEATURES.map((feature) => {
                                    const Icon = feature.icon;
                                    return (
                                        <div
                                            key={feature.title}
                                            className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 transition-colors hover:border-white/[0.14] hover:bg-white/[0.05]"
                                        >
                                            <span
                                                className={`inline-grid h-9 w-9 place-items-center rounded-xl ring-1 ring-inset ${feature.tone}`}
                                            >
                                                <Icon size={17} />
                                            </span>
                                            <h3 className="mt-3 text-sm font-semibold text-white">
                                                {feature.title}
                                            </h3>
                                            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                                                {feature.description}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-center pt-1">
                                <button type="button" onClick={onClose} className="btn btn-primary">
                                    Got it, let&apos;s focus
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
