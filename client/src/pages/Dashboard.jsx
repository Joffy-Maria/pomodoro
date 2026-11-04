import React, { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    Clock,
    Flame,
    History,
    Image as ImageIcon,
    LayoutGrid,
    Menu,
    Plus,
    Sparkles,
    Target,
    Timer,
    Users,
    Wifi,
    WifiOff,
    X,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import UserManual from '../components/UserManual';
import Logo from '../components/ui/Logo';
import {
    formatMinutes,
    getDisplayName,
    getStats,
    getStreak,
    getWeeklyFocus,
    recordSessionStart,
    setDisplayName,
} from '../lib/stats';

const SCENES = [
    { id: 'BloomingGarden', label: 'Garden', gradient: 'linear-gradient(140deg,#1d5b3f,#0a1f16)' },
    { id: 'ClimbingCube', label: 'Cube', gradient: 'linear-gradient(140deg,#3b2f6b,#0b0d1c)' },
    { id: 'SaturnHula', label: 'Saturn', gradient: 'linear-gradient(140deg,#6b2f5e,#150a1f)' },
    { id: 'LighthouseOcean', label: 'Ocean', gradient: 'linear-gradient(140deg,#16657a,#061a24)' },
    { id: 'CustomGIF', label: 'Custom', gradient: 'linear-gradient(140deg,#2a3040,#0b0e16)' },
];

const DURATIONS = [15, 25, 45, 60];

const TONE = {
    brand: 'bg-brand-500/12 text-brand-300 ring-brand-400/25',
    mint: 'bg-mint-500/12 text-mint-300 ring-mint-400/25',
    focus: 'bg-focus-500/12 text-focus-300 ring-focus-400/25',
};

const navItemClass = (active) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
            ? 'bg-white/[0.07] text-white'
            : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
    }`;

const formatDateTime = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

const StatusPill = ({ connected }) => (
    <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${
            connected
                ? 'border-mint-500/25 bg-mint-500/10 text-mint-300'
                : 'border-focus-500/25 bg-focus-500/10 text-focus-300'
        }`}
    >
        <span
            className={`h-1.5 w-1.5 rounded-full ${
                connected ? 'bg-mint-400' : 'animate-pulse bg-focus-400'
            }`}
        />
        {connected ? 'Live' : 'Connecting'}
    </span>
);

const StatusCard = ({ connected }) => (
    <div className="surface flex items-center gap-3 p-3.5">
        <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                connected ? 'bg-mint-500/15 text-mint-300' : 'bg-focus-500/15 text-focus-300'
            }`}
        >
            {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
        </span>
        <div className="min-w-0">
            <p className="text-xs font-semibold text-white">
                {connected ? 'Server connected' : 'Reconnecting…'}
            </p>
            <p className="truncate text-[11px] text-slate-500">
                {connected ? 'Real-time sync active' : 'Waiting for the backend'}
            </p>
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const { socket, isConnected } = useSocket();

    const [name, setName] = useState(() => getDisplayName());
    const [stats, setStats] = useState(() => getStats());
    const [roomIdInput, setRoomIdInput] = useState('');
    const [focusTime, setFocusTime] = useState(25);
    const [selectedBg, setSelectedBg] = useState('BloomingGarden');
    const [customGifUrl, setCustomGifUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [manualOpen, setManualOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const quickStartRef = useRef(null);
    const weekly = useMemo(() => getWeeklyFocus(stats), [stats]);
    const streak = useMemo(() => getStreak(stats), [stats]);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const firstName = name.trim().split(' ')[0];
    const today = new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    const weekTotal = weekly.reduce((total, day) => total + day.minutes, 0);
    const weekMax = Math.max(25, ...weekly.map((day) => day.minutes));

    const scrollToStart = () => {
        setMobileNavOpen(false);
        quickStartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const updateName = (value) => {
        setName(value);
        setDisplayName(value);
    };

    const createRoom = (mode = 'shared') => {
        if (!socket || !isConnected) {
            setError('Still connecting to the server. Give it a moment and try again.');
            return;
        }

        setLoading(true);
        setError('');

        socket.emit('create_room', { isSolo: mode === 'solo' }, (response) => {
            setLoading(false);
            if (!response?.success) {
                setError('Could not create a session. Please try again.');
                return;
            }

            socket.emit('set_focus_duration', { roomId: response.roomId, minutes: focusTime });

            const background =
                selectedBg === 'CustomGIF'
                    ? customGifUrl.trim()
                        ? `custom:${customGifUrl.trim()}`
                        : null
                    : selectedBg;
            if (background) {
                socket.emit('change_background', { roomId: response.roomId, background });
            }

            setDisplayName(name);
            recordSessionStart({ roomId: response.roomId, durationMinutes: focusTime });
            navigate(`/room/${response.roomId}`);
        });
    };

    const joinRoom = (event) => {
        event.preventDefault();
        const code = roomIdInput.trim().toUpperCase();
        if (!code) return;

        if (!socket || !isConnected) {
            setError('Still connecting to the server. Give it a moment and try again.');
            return;
        }

        setLoading(true);
        setError('');

        socket.emit('join_room_direct', { roomId: code }, (response) => {
            setLoading(false);
            if (response?.success) {
                setDisplayName(name);
                setStats(recordSessionStart({ roomId: code, durationMinutes: 25 }));
                navigate(`/room/${code}`);
            } else {
                setError(response?.message || 'Room not found. Check the code and try again.');
            }
        });
    };

    const statCards = [
        {
            icon: Timer,
            label: 'Focus time',
            value: formatMinutes(stats.focusMinutes),
            hint: 'all time',
            tone: 'brand',
        },
        {
            icon: Target,
            label: 'Pomodoros',
            value: stats.completedPomodoros,
            hint: 'completed',
            tone: 'mint',
        },
        {
            icon: Flame,
            label: 'Streak',
            value: `${streak}`,
            suffix: streak === 1 ? 'day' : 'days',
            hint: streak > 0 ? 'keep it alive' : 'start today',
            tone: 'focus',
        },
        {
            icon: History,
            label: 'Sessions',
            value: stats.history.length,
            hint: 'created or joined',
            tone: 'brand',
        },
    ];

    const navContent = (
        <>
            <button type="button" className={navItemClass(true)} onClick={scrollToStart}>
                <LayoutGrid size={17} />
                Overview
            </button>
            <button type="button" className={navItemClass(false)} onClick={scrollToStart}>
                <Plus size={17} />
                New session
            </button>
            <button
                type="button"
                className={navItemClass(false)}
                onClick={() => {
                    setManualOpen(true);
                    setMobileNavOpen(false);
                }}
            >
                <BookOpen size={17} />
                How it works
            </button>
            <Link to="/" className={navItemClass(false)}>
                <ArrowLeft size={17} />
                Back to site
            </Link>
        </>
    );

    return (
        <div className="relative min-h-screen bg-ink-950">
            <div
                className="pointer-events-none fixed inset-x-0 top-0 -z-0 h-[420px]"
                style={{
                    background:
                        'radial-gradient(ellipse 55% 70% at 45% 0%, rgba(124,92,255,0.16), transparent 70%), radial-gradient(ellipse 35% 50% at 85% 0%, rgba(255,107,94,0.08), transparent 70%)',
                }}
                aria-hidden="true"
            />

            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/[0.07] bg-ink-900/50 backdrop-blur-xl lg:flex">
                <div className="flex h-16 items-center px-5">
                    <Link to="/" aria-label="Promate home">
                        <Logo size={32} />
                    </Link>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4">{navContent}</nav>

                <div className="space-y-3 p-3">
                    <StatusCard connected={isConnected} />

                    <div className="surface p-4">
                        <label
                            htmlFor="display-name"
                            className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                            Display name
                        </label>
                        <input
                            id="display-name"
                            value={name}
                            onChange={(event) => updateName(event.target.value)}
                            placeholder="Anonymous"
                            maxLength={24}
                            className="field mt-2 px-3 py-2 text-sm"
                        />
                    </div>

                    <p className="px-2 text-[11px] leading-relaxed text-slate-600">
                        Sessions live in memory only. Nothing is stored on a server.
                    </p>
                </div>
            </aside>

            {/* Mobile top bar */}
            <div className="sticky top-0 z-30 border-b border-white/[0.07] bg-ink-950/85 backdrop-blur-xl lg:hidden">
                <div className="flex h-16 items-center justify-between px-5">
                    <Link to="/" aria-label="Promate home">
                        <Logo size={30} />
                    </Link>
                    <div className="flex items-center gap-2">
                        <StatusPill connected={isConnected} />
                        <button
                            type="button"
                            className="btn btn-ghost p-2.5"
                            onClick={() => setMobileNavOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {mobileNavOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-ink-950/95 backdrop-blur-xl lg:hidden"
                    >
                        <div className="flex h-16 items-center justify-between px-5">
                            <Logo size={30} />
                            <button
                                type="button"
                                className="btn btn-ghost p-2.5"
                                onClick={() => setMobileNavOpen(false)}
                                aria-label="Close menu"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <nav className="space-y-1 px-4 py-2">{navContent}</nav>
                        <div className="mx-4 mt-4">
                            <StatusCard connected={isConnected} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="relative lg:pl-64">
                <div className="mx-auto w-full max-w-6xl px-5 pb-16 pt-6 sm:px-8 lg:pt-10">
                    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                <span className="h-1 w-1 rounded-full bg-brand-400" />
                                {today}
                            </p>
                            <h1 className="mt-2 font-display text-[1.9rem] font-bold leading-tight text-white sm:text-4xl">
                                {greeting}
                                {firstName ? `, ${firstName}` : ''}
                            </h1>
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
                                Ready for a focused block? Pick a length, choose a scene, and start
                                — or join a room with a code.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="hidden sm:block">
                                <StatusPill connected={isConnected} />
                            </div>
                            <button type="button" className="btn btn-primary" onClick={scrollToStart}>
                                <Plus size={16} />
                                New session
                            </button>
                        </div>
                    </header>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-focus-500/25 bg-focus-500/10 px-4 py-3 text-sm text-focus-200"
                                role="alert"
                            >
                                <span>{error}</span>
                                <button
                                    type="button"
                                    onClick={() => setError('')}
                                    className="shrink-0 text-focus-300/70 transition-colors hover:text-white"
                                    aria-label="Dismiss"
                                >
                                    <X size={16} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-7 grid gap-4 lg:grid-cols-3">
                        {/* Quick start */}
                        <section
                            ref={quickStartRef}
                            className="surface relative scroll-mt-24 overflow-hidden p-6 lg:col-span-2"
                        >
                            <div
                                className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-500/15 blur-3xl"
                                aria-hidden="true"
                            />
                            <div className="relative">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="chip">
                                        <Timer size={12} />
                                        Quick start
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                        {focusTime} min ·{' '}
                                        {SCENES.find((scene) => scene.id === selectedBg)?.label}
                                    </span>
                                </div>

                                <h2 className="mt-4 font-display text-2xl font-bold text-white">
                                    Launch a focus block
                                </h2>
                                <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-400">
                                    Solo sessions are private. Shared rooms give you a code to send
                                    to your team.
                                </p>

                                <div className="mt-6">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                            Block length
                                        </label>
                                        <span className="text-xs text-slate-500">{focusTime} minutes</span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {DURATIONS.map((minutes) => (
                                            <button
                                                key={minutes}
                                                type="button"
                                                onClick={() => setFocusTime(minutes)}
                                                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                                                    focusTime === minutes
                                                        ? 'border-brand-400/60 bg-brand-500/20 text-white shadow-[0_8px_24px_-12px_rgba(124,92,255,0.9)]'
                                                        : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white'
                                                }`}
                                            >
                                                {minutes}m
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Scene
                                    </label>
                                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                                        {SCENES.map((scene) => {
                                            const active = selectedBg === scene.id;
                                            return (
                                                <button
                                                    key={scene.id}
                                                    type="button"
                                                    onClick={() => setSelectedBg(scene.id)}
                                                    className={`flex items-center gap-2 rounded-xl border p-2 text-left transition-all ${
                                                        active
                                                            ? 'border-brand-400/60 bg-brand-500/10'
                                                            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                                                    }`}
                                                >
                                                    <span
                                                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10"
                                                        style={{ background: scene.gradient }}
                                                    >
                                                        {scene.id === 'CustomGIF' && (
                                                            <ImageIcon size={13} className="text-slate-300" />
                                                        )}
                                                    </span>
                                                    <span
                                                        className={`truncate text-xs font-medium ${
                                                            active ? 'text-white' : 'text-slate-400'
                                                        }`}
                                                    >
                                                        {scene.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {selectedBg === 'CustomGIF' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="overflow-hidden"
                                    >
                                        <input
                                            type="url"
                                            value={customGifUrl}
                                            onChange={(event) => setCustomGifUrl(event.target.value)}
                                            placeholder="Paste a direct image or GIF URL"
                                            className="field mt-3"
                                        />
                                    </motion.div>
                                )}

                                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => createRoom('solo')}
                                        disabled={!isConnected || loading}
                                        className="btn btn-primary w-full"
                                    >
                                        {loading ? 'Starting…' : 'Start solo session'}
                                        {!loading && <ArrowRight size={16} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => createRoom('shared')}
                                        disabled={!isConnected || loading}
                                        className="btn btn-ghost w-full"
                                    >
                                        <Users size={16} />
                                        Create shared room
                                    </button>
                                </div>

                                {!isConnected && (
                                    <p className="mt-3 text-xs text-focus-300/80">
                                        Waiting for the server… this usually takes a few seconds on
                                        a cold start.
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* Join room */}
                        <section className="surface flex flex-col p-6">
                            <span className="chip">
                                <Users size={12} />
                                Join a room
                            </span>
                            <h2 className="mt-4 font-display text-xl font-bold text-white">
                                Have a code?
                            </h2>
                            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                                Enter the six-character code the host shared with you.
                            </p>

                            <form onSubmit={joinRoom} className="mt-5 space-y-2.5">
                                <input
                                    value={roomIdInput}
                                    onChange={(event) => {
                                        setRoomIdInput(event.target.value.toUpperCase());
                                        if (error) setError('');
                                    }}
                                    placeholder="ABC123"
                                    maxLength={12}
                                    autoComplete="off"
                                    spellCheck={false}
                                    aria-label="Room code"
                                    className="field text-center font-mono text-lg uppercase tracking-[0.35em]"
                                />
                                <button
                                    type="submit"
                                    disabled={!isConnected || loading || !roomIdInput.trim()}
                                    className="btn btn-mint w-full"
                                >
                                    Join session
                                    <ArrowRight size={16} />
                                </button>
                            </form>

                            <div className="mt-auto pt-5">
                                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
                                    <p className="flex items-center gap-2 text-xs font-medium text-slate-300">
                                        <Sparkles size={13} className="text-brand-300" />
                                        No code yet?
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                        Create a shared room and send the code. It works on any
                                        device, instantly.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {statCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <div key={card.label} className="surface p-5">
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ring-inset ${TONE[card.tone]}`}
                                        >
                                            <Icon size={17} />
                                        </span>
                                        <span className="text-[10px] uppercase tracking-[0.12em] text-slate-600">
                                            {card.hint}
                                        </span>
                                    </div>
                                    <p className="mt-4 font-display text-2xl font-bold text-white">
                                        {card.value}
                                        {card.suffix && (
                                            <span className="ml-1 text-sm font-medium text-slate-500">
                                                {card.suffix}
                                            </span>
                                        )}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">{card.label}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* History + week */}
                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                        <section className="surface p-6 lg:col-span-2">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="font-display text-lg font-semibold text-white">
                                        Recent sessions
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Stored locally in this browser
                                    </p>
                                </div>
                                <span className="chip">{stats.history.length}</span>
                            </div>

                            {stats.history.length === 0 ? (
                                <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center">
                                    <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-white/5 text-slate-400">
                                        <History size={20} />
                                    </span>
                                    <p className="mt-3 text-sm font-medium text-white">
                                        No sessions yet
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Your completed blocks will show up here.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={scrollToStart}
                                        className="btn btn-ghost mt-4 py-2 text-xs"
                                    >
                                        Start your first block
                                    </button>
                                </div>
                            ) : (
                                <ul className="mt-4 divide-y divide-white/[0.06]">
                                    {stats.history.slice(0, 6).map((entry) => (
                                        <li key={entry.id} className="flex items-center gap-3 py-3">
                                            <span
                                                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                                                    entry.completed
                                                        ? 'bg-mint-500/12 text-mint-300'
                                                        : 'bg-brand-500/12 text-brand-300'
                                                }`}
                                            >
                                                {entry.completed ? (
                                                    <Check size={16} />
                                                ) : (
                                                    <Clock size={16} />
                                                )}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-white">
                                                    {entry.completed
                                                        ? 'Focus block completed'
                                                        : 'Session opened'}
                                                </p>
                                                <p className="truncate text-xs text-slate-500">
                                                    Room {entry.roomId} ·{' '}
                                                    {formatDateTime(entry.startedAt)}
                                                </p>
                                            </div>
                                            <span className="text-xs text-slate-500">
                                                {entry.durationMinutes}m
                                            </span>
                                            <span
                                                className={`hidden rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider sm:inline ${
                                                    entry.completed
                                                        ? 'bg-mint-500/10 text-mint-300'
                                                        : 'bg-white/5 text-slate-400'
                                                }`}
                                            >
                                                {entry.completed ? 'Done' : 'Ended'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <section className="surface flex flex-col p-6">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-display text-lg font-semibold text-white">
                                        This week
                                    </h2>
                                    <p className="text-xs text-slate-500">Focus minutes</p>
                                </div>
                                <span className="chip">
                                    <Flame size={11} className="text-focus-400" />
                                    {streak}d
                                </span>
                            </div>

                            <p className="mt-4 font-display text-3xl font-bold text-white">
                                {formatMinutes(weekTotal)}
                            </p>

                            <div className="mt-6 flex flex-1 items-end gap-2">
                                {weekly.map((day) => {
                                    const height = day.minutes
                                        ? Math.max(8, Math.round((day.minutes / weekMax) * 100))
                                        : 4;
                                    return (
                                        <div
                                            key={day.key}
                                            className="flex flex-1 flex-col items-center gap-2"
                                        >
                                            <div
                                                className="flex h-32 w-full items-end rounded-lg bg-white/[0.04]"
                                                title={`${day.minutes} min`}
                                            >
                                                <div
                                                    className={`w-full rounded-lg ${
                                                        day.isToday
                                                            ? 'bg-gradient-to-t from-focus-600 to-focus-400'
                                                            : 'bg-gradient-to-t from-brand-600 to-brand-400'
                                                    }`}
                                                    style={{ height: `${height}%` }}
                                                />
                                            </div>
                                            <span
                                                className={`text-[10px] uppercase tracking-wider ${
                                                    day.isToday ? 'text-white' : 'text-slate-500'
                                                }`}
                                            >
                                                {day.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="mt-4 text-xs leading-relaxed text-slate-500">
                                {weekTotal > 0
                                    ? 'Every completed focus block counts toward your weekly total.'
                                    : 'Complete a block to start your weekly chart.'}
                            </p>
                        </section>
                    </div>

                    <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-slate-600 sm:flex-row">
                        <p>Sessions are ephemeral — closing the last tab ends the room.</p>
                        <button
                            type="button"
                            onClick={() => setManualOpen(true)}
                            className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-300"
                        >
                            <BookOpen size={13} />
                            How Promate works
                        </button>
                    </div>
                </div>
            </main>

            <UserManual isOpen={manualOpen} onClose={() => setManualOpen(false)} />
        </div>
    );
};

export default Dashboard;
