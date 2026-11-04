import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Music, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';

const getYouTubeId = (url) => {
    const host = url.hostname.toLowerCase().replace(/^www\./, '');

    if (host === 'youtu.be') {
        return url.pathname.split('/').filter(Boolean)[0] || null;
    }

    if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
        if (url.pathname === '/watch') {
            return url.searchParams.get('v');
        }

        const match = url.pathname.match(/^\/(embed|shorts|live)\/([^/?#]+)/);
        if (match) return match[2];
    }

    return null;
};

const getAudioTitle = (url) => {
    try {
        const segments = new URL(url).pathname.split('/').filter(Boolean);
        const name = decodeURIComponent(segments[segments.length - 1] || '');
        return name.replace(/\.[^.]+$/, '') || 'Audio stream';
    } catch {
        return 'Audio stream';
    }
};

const parseSource = (value) => {
    let url;
    try {
        url = new URL(value);
    } catch {
        return null;
    }

    if (!['http:', 'https:'].includes(url.protocol)) return null;

    const youtubeId = getYouTubeId(url);
    if (youtubeId) {
        return {
            type: 'youtube',
            id: youtubeId,
            title: 'YouTube audio',
            url: value,
        };
    }

    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'soundcloud.com' || host.endsWith('.soundcloud.com') || host === 'snd.sc') {
        return {
            type: 'soundcloud',
            title: 'SoundCloud audio',
            url: value,
        };
    }

    return {
        type: 'audio',
        title: getAudioTitle(value),
        url: value,
    };
};

const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${rest}`;
};

const MusicPlayer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [source, setSource] = useState(null);
    const [error, setError] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const audioRef = useRef(null);

    // Keep the audio element in sync with the volume slider.
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume, source]);

    const handleLoad = (event) => {
        event.preventDefault();
        const value = urlInput.trim();
        if (!value) return;

        const nextSource = parseSource(value);
        if (!nextSource) {
            setError('Paste a valid link starting with http:// or https://.');
            return;
        }

        setError('');
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setSource(nextSource);
        setIsOpen(true);
    };

    const togglePlayback = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        try {
            if (audio.paused) {
                await audio.play();
            } else {
                audio.pause();
            }
        } catch {
            setError('Playback was blocked. Press play again to start the audio.');
        }
    };

    const handleSeek = (event) => {
        const audio = audioRef.current;
        if (!audio) return;
        const nextTime = Number(event.target.value);
        audio.currentTime = nextTime;
        setCurrentTime(nextTime);
    };

    const clearSource = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setSource(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setError('');
    };

    const isYouTube = source?.type === 'youtube';
    const isSoundCloud = source?.type === 'soundcloud';

    return (
        <div className="relative z-50 flex flex-col items-center">
            <motion.div
                initial={false}
                animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 10, scale: isOpen ? 1 : 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                aria-hidden={!isOpen}
                inert={!isOpen}
                className={`absolute bottom-full mb-4 left-1/2 -translate-x-1/2 glass-panel w-[calc(100vw-2rem)] sm:w-80 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-3xl border border-white/20 shadow-2xl backdrop-blur-xl bg-[#09090b]/95 z-50 ${
                    isOpen ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
            >
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-2">
                                <Music size={18} className="text-focus-300" />
                                <h3 className="font-semibold text-white tracking-wide">Session Music</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
                                aria-label="Close music player"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleLoad} className="p-4 space-y-2 border-b border-white/10">
                            <label
                                htmlFor="music-url"
                                className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40"
                            >
                                Paste an audio link
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Link2
                                        size={14}
                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                                    />
                                    <input
                                        id="music-url"
                                        type="url"
                                        value={urlInput}
                                        onChange={(event) => {
                                            setUrlInput(event.target.value);
                                            if (error) setError('');
                                        }}
                                        placeholder="YouTube, SoundCloud or MP3 URL"
                                        autoComplete="off"
                                        spellCheck={false}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-400/60 focus:bg-white/10 transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!urlInput.trim()}
                                    className="shrink-0 rounded-xl bg-brand-500 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Load
                                </button>
                            </div>
                            {error && <p className="text-xs leading-relaxed text-rose-300">{error}</p>}
                            {!error && !source && (
                                <p className="text-[11px] leading-relaxed text-white/30">
                                    Direct audio files play here. YouTube and SoundCloud links open in an
                                    embedded player — nothing leaves this session.
                                </p>
                            )}
                        </form>

                        {source && (
                            <div className="p-4 space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-white">
                                            {source.title}
                                        </p>
                                        <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-white/35">
                                            {isYouTube
                                                ? 'YouTube'
                                                : isSoundCloud
                                                  ? 'SoundCloud'
                                                  : 'Audio file'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearSource}
                                        className="shrink-0 text-[11px] text-white/40 transition-colors hover:text-white"
                                    >
                                        Remove
                                    </button>
                                </div>

                                {isYouTube && (
                                    <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black">
                                        <iframe
                                            title="Session music player"
                                            src={`https://www.youtube-nocookie.com/embed/${source.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                                            className="h-full w-full"
                                            allow="autoplay; encrypted-media; picture-in-picture"
                                            allowFullScreen
                                            referrerPolicy="strict-origin-when-cross-origin"
                                        />
                                    </div>
                                )}

                                {isSoundCloud && (
                                    <iframe
                                        title="Session music player"
                                        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(
                                            source.url
                                        )}&color=%237c5cff&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=false`}
                                        className="h-[166px] w-full rounded-xl border border-white/10"
                                        allow="autoplay"
                                    />
                                )}

                                {source.type === 'audio' && (
                                    <>
                                        <audio
                                            ref={audioRef}
                                            src={source.src || source.url}
                                            autoPlay
                                            onPlay={() => setIsPlaying(true)}
                                            onPause={() => setIsPlaying(false)}
                                            onTimeUpdate={(event) =>
                                                setCurrentTime(event.currentTarget.currentTime)
                                            }
                                            onLoadedMetadata={(event) =>
                                                setDuration(event.currentTarget.duration || 0)
                                            }
                                            onEnded={() => setIsPlaying(false)}
                                            onError={() =>
                                                setError(
                                                    'That link could not be played as audio. Try a direct MP3, OGG, WAV or M4A link, or a YouTube/SoundCloud URL.'
                                                )
                                            }
                                        />

                                        <div className="space-y-2">
                                            <input
                                                type="range"
                                                min={0}
                                                max={duration || 0}
                                                step="0.1"
                                                value={Math.min(currentTime, duration || 0)}
                                                onChange={handleSeek}
                                                aria-label="Seek"
                                                className="w-full cursor-pointer"
                                                style={{ accentColor: '#9b87ff' }}
                                            />
                                            <div className="flex justify-between text-[10px] tabular-nums text-white/35">
                                                <span>{formatTime(currentTime)}</span>
                                                <span>{formatTime(duration)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <button
                                                type="button"
                                                onClick={togglePlayback}
                                                className="grid h-10 w-10 place-items-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-400"
                                                aria-label={isPlaying ? 'Pause music' : 'Play music'}
                                            >
                                                {isPlaying ? (
                                                    <Pause size={17} />
                                                ) : (
                                                    <Play size={17} className="ml-0.5" />
                                                )}
                                            </button>

                                            <div className="flex flex-1 items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setVolume((current) =>
                                                            current > 0 ? 0 : 0.7
                                                        )
                                                    }
                                                    className="text-white/50 transition-colors hover:text-white"
                                                    aria-label={
                                                        volume > 0 ? 'Mute music' : 'Unmute music'
                                                    }
                                                >
                                                    {volume > 0 ? (
                                                        <Volume2 size={16} />
                                                    ) : (
                                                        <VolumeX size={16} />
                                                    )}
                                                </button>
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={1}
                                                    step="0.05"
                                                    value={volume}
                                                    onChange={(event) =>
                                                        setVolume(Number(event.target.value))
                                                    }
                                                    aria-label="Volume"
                                                    className="w-full cursor-pointer"
                                                    style={{ accentColor: '#9b87ff' }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
            </motion.div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen((open) => !open)}
                className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/20 shadow-2xl backdrop-blur-md transition-colors ${
                    isOpen || source
                        ? 'bg-brand-500/85 text-white'
                        : 'glass-panel text-focus-300 hover:bg-white/10 hover:text-white'
                }`}
                aria-label="Session music"
            >
                {isOpen ? <X size={24} /> : <Music size={24} />}

                {source && !isOpen && (
                    <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-400 opacity-60" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-black bg-mint-400" />
                    </span>
                )}
            </motion.button>
        </div>
    );
};

export default MusicPlayer;
