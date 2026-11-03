import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight,
    Check,
    ListChecks,
    Menu,
    MessageSquare,
    Palette,
    Play,
    Share2,
    ShieldCheck,
    Sparkles,
    Timer,
    Users,
    X,
} from 'lucide-react';
import Logo from '../components/ui/Logo';
import Reveal from '../components/ui/Reveal';
import UserManual from '../components/UserManual';

const NAV_LINKS = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Environments', href: '#environments' },
];

const FEATURES = [
    {
        icon: Timer,
        title: 'Onetimer, everyone',
        description:
            'The server owns the clock. Start, pause or reset once and every participant sees the same second — no drift, no "is it running?"',
        tone: 'brand',
    },
    {
        icon: ListChecks,
        title: 'Shared task list',
        description:
            'Add what you are working on together. Ticking a task off updates the whole room instantly, so nobody doubles up.',
        tone: 'mint',
    },
    {
        icon: MessageSquare,
        title: 'Friction-free chat',
        description:
            'A lightweight room chat for quick coordination, a blocker, or a quiet "nice work" without leaving the session.',
        tone: 'focus',
    },
    {
        icon: Palette,
        title: 'Immersive scenes',
        description:
            'Pick a 3D environment or drop in your own GIF. The chosen atmosphere syncs with the room, not just your screen.',
        tone: 'brand',
    },
    {
        icon: ShieldCheck,
        title: 'Nothing to sign up for',
        description:
            'No accounts, no onboarding, no database. A session exists in memory and disappears when the last person leaves.',
        tone: 'mint',
    },
    {
        icon: Share2,
        title: 'Link-based invites',
        description:
            'A six-character code is all a teammate needs. Share it and they are in the same focus block within seconds.',
        tone: 'focus',
    },
];

const STEPS = [
    {
        title: 'Open the dashboard',
        description: 'Choose how long you want to focus and pick an environment. Everything is optional — defaults are already sensible.',
    },
    {
        title: 'Start or share a room',
        description: 'Go solo in one click, or create a shared room and send the code to whoever is joining you.',
    },
    {
        title: 'Focus in sync',
        description: 'Work through the block together with one timer, one task list and one chat. Leave when you are done; nothing lingers.',
    },
];

const ENVIRONMENTS = [
    {
        name: 'Blooming Garden',
        blurb: 'Soft petals, slow motion',
        gradient: 'linear-gradient(150deg, #123b2b 0%, #1d5b3f 45%, #0a1f16 100%)',
        accent: '#74c69d',
    },
    {
        name: 'Climbing Cube',
        blurb: 'Geometric momentum',
        gradient: 'linear-gradient(150deg, #1b1f3a 0%, #3b2f6b 45%, #0b0d1c 100%)',
        accent: '#9c82ff',
    },
    {
        name: 'Saturn Hula',
        blurb: 'Orbit and unwind',
        gradient: 'linear-gradient(150deg, #2b1637 0%, #6b2f5e 45%, #150a1f 100%)',
        accent: '#ff8a7a',
    },
    {
        name: 'Lighthouse Ocean',
        blurb: 'A bright horizon',
        gradient: 'linear-gradient(150deg, #0b2d3a 0%, #16657a 45%, #061a24 100%)',
        accent: '#5eead4',
    },
];

const TONE_STYLES = {
    brand: 'bg-brand-500/12 text-brand-300 ring-brand-400/25',
    mint: 'bg-mint-500/12 text-mint-300 ring-mint-400/25',
    focus: 'bg-focus-500/12 text-focus-300 ring-focus-400/25',
};

/* ------------------------------------------------------------------ */

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
                scrolled ? 'border-b border-white/[0.07] bg-ink-950/80 backdrop-blur-xl' : 'bg-transparent'
            }`}
        >
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                <Link to="/" className="shrink-0" aria-label="Promate home">
                    <Logo />
                </Link>

                <div className="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex">
                    {NAV_LINKS.map((link) => (
                        <a key={link.href} href={link.href} className="transition-colors hover:text-white">
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-2.5">
                    <Link to="/dashboard" className="btn btn-primary hidden sm:inline-flex">
                        Open dashboard
                        <ArrowRight size={16} />
                    </Link>
                    <button
                        type="button"
                        className="btn btn-ghost p-2.5 md:hidden"
                        onClick={() => setOpen((value) => !value)}
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        aria-expanded={open}
                    >
                        {open ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </nav>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden border-t border-white/[0.07] bg-ink-950/95 backdrop-blur-xl md:hidden"
                    >
                        <div className="flex flex-col gap-1 px-6 py-4">
                            {NAV_LINKS.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setOpen(false)}
                                    className="rounded-lg px-2 py-3 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <Link
                                to="/dashboard"
                                onClick={() => setOpen(false)}
                                className="btn btn-primary mt-2 w-full"
                            >
                                Open dashboard
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

/* ------------------------------------------------------------------ */

const FOCUS_PREVIEW_TOTAL = 25 * 60;

const FocusPreview = () => {
     const [secondsLeft, setSecondsLeft] = useState(FOCUS_PREVIEW_TOTAL - 7 * 60 - 12);

    useEffect(() => {
        const interval = setInterval(() => {
            setSecondsLeft((current) => (current <= 1 ? FOCUS_PREVIEW_TOTAL : current - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const radius = 86;
    const circumference = 2 * Math.PI * radius;
    const progress = secondsLeft / FOCUS_PREVIEW_TOTAL;
    const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const seconds = String(secondsLeft % 60).padStart(2, '0');

    const syncPoints = [
        { icon: Timer, text: 'One timer for everyone in the room' },
        { icon: ListChecks, text: 'Tasks tick off for everyone' },
        { icon: MessageSquare, text: 'Chat without leaving focus' },
    ];

    return (
        <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-8 rounded-[3rem] bg-brand-500/20 blur-3xl" aria-hidden="true" />

            <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="surface-raised relative overflow-hidden p-6 sm:p-7"
            >
                <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
                        <span className="relative flex h-2 w-2">
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
                        </span>
                        Focus timer
                    </span>
                    <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                        Ephemeral
                    </span>
                </div>

                <div className="relative mx-auto mt-7 aspect-square w-52 sm:w-60">
                    <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
                        <defs>
                            <linearGradient id="preview-ring" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#9c82ff" />
                                <stop offset="100%" stopColor="#ff6b5e" />
                            </linearGradient>
                        </defs>
                        <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
                        <circle
                            cx="100"
                            cy="100"
                            r={radius}
                            fill="none"
                            stroke="url(#preview-ring)"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - progress)}
                            style={{ transition: 'stroke-dashoffset 1s linear' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                            Focus
                        </span>
                        <span className="mt-1 font-display text-5xl font-bold tabular-nums tracking-tight text-white">
                            {minutes}:{seconds}
                        </span>
                        <span className="mt-1.5 text-xs text-slate-500">Timer · tasks · chat</span>
                    </div>
                </div>

                <div className="mt-6 space-y-2">
                    {syncPoints.map((point) => {
                        const Icon = point.icon;
                        return (
                            <div
                                key={point.text}
                                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5"
                            >
                                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-mint-500/60 bg-mint-500/20 text-mint-300">
                                    <Icon size={11} />
                                </span>
                                <span className="truncate text-sm text-slate-300">{point.text}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                    <span className="flex items-center gap-2 text-xs text-slate-400">
                        <ShieldCheck size={14} className="text-mint-400" />
                        Gone when the last tab closes
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-ink-950">
                        No signup
                    </span>
                </div>
            </motion.div>

            <div className="animate-float absolute -right-4 top-16 hidden rounded-2xl border border-white/10 bg-ink-900/90 px-4 py-3 shadow-2xl backdrop-blur-xl lg:block">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                    <ListChecks size={15} className="text-mint-400" />
                    Shared tasks
                </div>
                <p className="mt-1 font-display text-lg font-bold text-white">Real-time</p>
            </div>

            <div className="animate-float absolute -left-6 bottom-24 hidden rounded-2xl border border-white/10 bg-ink-900/90 px-4 py-3 shadow-2xl backdrop-blur-xl lg:block [animation-delay:-3s]">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Share2 size={15} className="text-focus-400" />
                    Room code
                </div>
                <p className="mt-1 font-display text-lg font-bold text-white">6 chars</p>
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */

const Hero = () => (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <div className="mesh-grid absolute inset-0 opacity-70" />
            <div
                className="absolute left-1/2 top-[-18%] h-[560px] w-[900px] -translate-x-1/2 rounded-full blur-[130px]"
                style={{
                    background:
                        'radial-gradient(circle, rgba(124,92,255,0.34), rgba(255,107,94,0.12) 46%, transparent 72%)',
                }}
            />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950 to-transparent" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8">
            <div>
                <Reveal>
                    <span className="chip">
                        <Sparkles size={12} className="text-brand-300" />
                        Real-time focus rooms
                    </span>
                </Reveal>

                <Reveal delay={0.05}>
                    <h1 className="mt-6 font-display text-[2.75rem] font-extrabold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[4.4rem]">
                        Focus together.
                        <br />
                        <span className="text-gradient">Finish faster.</span>
                    </h1>
                </Reveal>

                <Reveal delay={0.12}>
                    <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
                        Promate is a synchronized Pomodoro workspace. Share one timer, one task list
                        and one calm environment with your team — then let the session disappear when
                        you are done.
                    </p>
                </Reveal>

                <Reveal delay={0.18}>
                    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                        <Link to="/dashboard" className="btn btn-primary px-6 py-3.5 text-[0.95rem]">
                            Start a session
                            <ArrowRight size={18} />
                        </Link>
                        <a href="#how-it-works" className="btn btn-ghost px-6 py-3.5 text-[0.95rem]">
                            <Play size={16} />
                            See how it works
                        </a>
                    </div>
                </Reveal>

                <Reveal delay={0.24}>
                    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
                        {['No signup', 'No installs', 'Fully ephemeral'].map((item) => (
                            <span key={item} className="inline-flex items-center gap-2">
                                <span className="grid h-4 w-4 place-items-center rounded-full bg-mint-500/15 text-mint-400">
                                    <Check size={10} />
                                </span>
                                {item}
                            </span>
                        ))}
                    </div>
                </Reveal>
            </div>

            <Reveal delay={0.1} className="lg:pl-4">
                <FocusPreview />
            </Reveal>
        </div>
    </section>
);

/* ------------------------------------------------------------------ */

const StatsStrip = () => {
    const stats = [
        { value: '25 min', label: 'Default focus block' },
        { value: '6', label: 'Char room codes' },
        { value: '4', label: 'Immersive scenes' },
        { value: '0', label: 'Accounts required' },
    ];

    return (
        <section className="border-y border-white/[0.06] bg-white/[0.015]">
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-6 py-10 sm:grid-cols-4 lg:px-8">
                {stats.map((stat, index) => (
                    <Reveal key={stat.label} delay={index * 0.05} className="text-center">
                        <p className="font-display text-2xl font-bold text-white sm:text-3xl">{stat.value}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
                    </Reveal>
                ))}
            </div>
        </section>
    );
};

/* ------------------------------------------------------------------ */

const Features = () => (
    <section id="features" className="relative scroll-mt-20 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Reveal className="max-w-2xl">
                <span className="chip">Built for shared focus</span>
                <h2 className="mt-5 font-display text-3xl font-bold text-white sm:text-4xl lg:text-[2.75rem]">
                    Everything a focus block needs.
                    <span className="text-slate-500"> Nothing it doesn&apos;t.</span>
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-400">
                    No project management bloat. Just the few primitives that actually help a group
                    sit down and work at the same time.
                </p>
            </Reveal>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                        <Reveal key={feature.title} delay={(index % 3) * 0.06} className="h-full">
                            <div className="surface group h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.05]">
                                <span
                                    className={`inline-grid h-11 w-11 place-items-center rounded-xl ring-1 ring-inset ${TONE_STYLES[feature.tone]}`}
                                >
                                    <Icon size={20} />
                                </span>
                                <h3 className="mt-5 font-display text-lg font-semibold text-white">
                                    {feature.title}
                                </h3>
                                <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
                                    {feature.description}
                                </p>
                            </div>
                        </Reveal>
                    );
                })}
            </div>
        </div>
    </section>
);

/* ------------------------------------------------------------------ */

const HowItWorks = () => (
    <section id="how-it-works" className="relative scroll-mt-20 overflow-hidden py-24 lg:py-32">
        <div
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(circle, rgba(124,92,255,0.16), transparent 70%)' }}
            aria-hidden="true"
        />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                <Reveal>
                    <span className="chip">How it works</span>
                    <h2 className="mt-5 font-display text-3xl font-bold text-white sm:text-4xl">
                        From open tab to deep focus in under a minute.
                    </h2>
                    <p className="mt-4 max-w-md text-lg leading-relaxed text-slate-400">
                        There is no setup wizard and no account wall. Open the dashboard, choose a
                        block length, and invite whoever is joining you.
                    </p>
                    <Link to="/dashboard" className="btn btn-primary mt-8">
                        Try it now
                        <ArrowRight size={16} />
                    </Link>
                </Reveal>

                <div className="relative">
                    <div className="absolute bottom-6 left-[1.1rem] top-6 w-px bg-gradient-to-b from-brand-500/60 via-white/10 to-transparent sm:left-[1.35rem]" />
                    <div className="space-y-4">
                        {STEPS.map((step, index) => (
                            <Reveal key={step.title} delay={index * 0.08}>
                                <div className="surface flex gap-4 p-5 sm:gap-5 sm:p-6">
                                    <span className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-brand-400/30 bg-brand-500/15 font-display text-sm font-bold text-brand-200 sm:h-11 sm:w-11 sm:text-base">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <h3 className="font-display text-lg font-semibold text-white">
                                            {step.title}
                                        </h3>
                                        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </section>
);

/* ------------------------------------------------------------------ */

const Environments = () => (
    <section id="environments" className="scroll-mt-20 border-t border-white/[0.06] py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <Reveal className="max-w-xl">
                    <span className="chip">Atmospheres</span>
                    <h2 className="mt-5 font-display text-3xl font-bold text-white sm:text-4xl">
                        Pick a place to do the work.
                    </h2>
                    <p className="mt-4 text-lg leading-relaxed text-slate-400">
                        The host&apos;s scene is shared with everyone in the room, so the whole team
                        lands in the same headspace.
                    </p>
                </Reveal>
                <Reveal delay={0.1}>
                    <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                        <Palette size={16} className="text-brand-300" />
                        Custom GIFs supported
                    </span>
                </Reveal>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {ENVIRONMENTS.map((environment, index) => (
                    <Reveal key={environment.name} delay={index * 0.06} className="h-full">
                        <div className="group relative h-56 overflow-hidden rounded-2xl border border-white/[0.08] transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
                            <div
                                className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                                style={{ background: environment.gradient }}
                            />
                            <div
                                className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                                style={{ background: environment.accent, opacity: 0.35 }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-5">
                                <span
                                    className="mb-3 inline-block h-1.5 w-8 rounded-full"
                                    style={{ background: environment.accent }}
                                />
                                <h3 className="font-display text-base font-semibold text-white">
                                    {environment.name}
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-400">{environment.blurb}</p>
                            </div>
                        </div>
                    </Reveal>
                ))}
            </div>
        </div>
    </section>
);

/* ------------------------------------------------------------------ */

const FinalCta = ({ onOpenManual }) => (
    <section className="pb-24 lg:pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Reveal>
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-ink-900 px-6 py-14 text-center sm:px-12 lg:py-20">
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(124,92,255,0.28), transparent 70%), radial-gradient(ellipse 40% 60% at 80% 100%, rgba(255,107,94,0.14), transparent 70%)',
                        }}
                        aria-hidden="true"
                    />
                    <div className="mesh-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

                    <div className="relative mx-auto max-w-2xl">
                        <span className="chip mx-auto">
                            <Users size={12} className="text-mint-300" />
                            Your next block
                        </span>
                        <h2 className="mt-6 font-display text-3xl font-bold text-white sm:text-4xl lg:text-[2.9rem]">
                            Stop coordinating. Start focusing.
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-400">
                            Open a room, send the code, and get 25 uninterrupted minutes with the
                            people you work with.
                        </p>
                        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                            <Link to="/dashboard" className="btn btn-primary px-6 py-3.5">
                                Open the dashboard
                                <ArrowRight size={17} />
                            </Link>
                            <button type="button" onClick={onOpenManual} className="btn btn-ghost px-6 py-3.5">
                                Read the manual
                            </button>
                        </div>
                    </div>
                </div>
            </Reveal>
        </div>
    </section>
);

/* ------------------------------------------------------------------ */

const Footer = () => (
    <footer className="border-t border-white/[0.06] py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row lg:px-8">
            <div className="flex flex-col items-center gap-2 sm:items-start">
                <Logo size={30} />
                <p className="text-xs text-slate-500">Ephemeral focus rooms. Built for teams that ship.</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
                <a href="#features" className="transition-colors hover:text-white">Features</a>
                <a href="#how-it-works" className="transition-colors hover:text-white">How it works</a>
                <Link to="/dashboard" className="transition-colors hover:text-white">Dashboard</Link>
            </div>
        </div>
    </footer>
);

/* ------------------------------------------------------------------ */

const Landing = () => {
    const [manualOpen, setManualOpen] = useState(false);

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-ink-950">
            <Navbar />
            <main>
                <Hero />
                <StatsStrip />
                <Features />
                <HowItWorks />
                <Environments />
                <FinalCta onOpenManual={() => setManualOpen(true)} />
            </main>
            <Footer />
            <UserManual isOpen={manualOpen} onClose={() => setManualOpen(false)} />
        </div>
    );
};

export default Landing;
