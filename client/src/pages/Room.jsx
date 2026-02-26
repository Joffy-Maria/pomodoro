import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Play, Pause, RotateCcw, Image as ImageIcon, Check } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import PageTransition from '../components/ui/PageTransition';
import InteractiveButton from '../components/ui/InteractiveButton';
import TaskManager from '../components/TaskManager';

const THEMES = {
    BloomingGarden: 'https://codepen.io/animmaster_studio/embed/jEqpopr?default-tab=result&theme-id=dark',
    ClimbingCube: 'https://codepen.io/bealivefr/embed/VwKrbYg?default-tab=result&theme-id=dark',
    SaturnHula: 'https://codepen.io/jcoulterdesign/embed/BrdPaw?default-tab=result&theme-id=dark',
    LighthouseOcean: 'https://codepen.io/agathaco/embed/JaGQPr?default-tab=result&theme-id=dark'
};

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { socket, isConnected } = useSocket();

    const [roomState, setRoomState] = useState(null);
    const [timerState, setTimerState] = useState(null);
    const [displayTime, setDisplayTime] = useState('25:00');
    const [tasks, setTasks] = useState([]);

    // UI States
    const [copied, setCopied] = useState(false);
    const [bgSelectionOpen, setBgSelectionOpen] = useState(false);
    const [customGif, setCustomGif] = useState(null);

    // Sync Timer Display
    useEffect(() => {
        if (!timerState) return;

        let interval;
        if (timerState.status === 'running' && timerState.endTime) {
            interval = setInterval(() => {
                const now = Date.now();
                const remainingRaw = Math.max(0, Math.ceil((timerState.endTime - now) / 1000));
                updateDisplay(remainingRaw);

                if (remainingRaw <= 0) {
                    clearInterval(interval);
                }
            }, 500);
        } else {
            updateDisplay(timerState.timeRemaining);
        }

        return () => clearInterval(interval);
    }, [timerState]);

    const updateDisplay = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        setDisplayTime(`${m}:${s}`);
    };

    // Socket Events
    useEffect(() => {
        if (!socket || !isConnected) {
            // Wait for reconnect or redirect to home if totally failed after timeout
            const t = setTimeout(() => {
                if (!isConnected) navigate('/home');
            }, 3000);
            return () => clearTimeout(t);
        }

        socket.emit('check_room', { roomId }, (response) => {
            if (response.success) {
                // Check if already in participants list 
                // If not, it means this was a shared link, so join directly
                if (!response.roomState.participants.includes(socket.id)) {
                    socket.emit('join_room_direct', { roomId }, (joinResponse) => {
                        if (joinResponse.success) {
                            setRoomState(joinResponse.roomState);
                            setTimerState(joinResponse.roomState.timer);
                            setTasks(joinResponse.roomState.tasks || []);
                        } else {
                            navigate('/home');
                        }
                    });
                } else {
                    // Already in room (created it or joined from Home modal)
                    setRoomState(response.roomState);
                    setTimerState(response.roomState.timer);
                    setTasks(response.roomState.tasks || []);
                }
            } else {
                navigate('/home'); // Room doesn't exist
            }
        });

        // Listeners
        const handleTimerSync = (newTimer) => {
            setTimerState(newTimer);
        };
        const handleBackgroundChanged = (bg) => {
            setRoomState(prev => prev ? { ...prev, settings: { ...prev.settings, background: bg } } : null);
        };
        const handleTasksSync = (updatedTasks) => {
            setTasks(updatedTasks);
        };

        socket.on('timer_sync', handleTimerSync);
        socket.on('background_changed', handleBackgroundChanged);
        socket.on('tasks_sync', handleTasksSync);

        return () => {
            socket.off('timer_sync', handleTimerSync);
            socket.off('background_changed', handleBackgroundChanged);
            socket.off('tasks_sync', handleTasksSync);
        };
    }, [roomId, socket, isConnected, navigate]);

    // Actions
    const handleCommand = (command) => {
        if (!socket) return;
        socket.emit(`timer_${command}`, { roomId });
    };

    const handleSwitchMode = (mode) => {
        if (!socket) return;
        socket.emit('timer_switch_mode', { roomId, mode });
    };

    const handleChangeBg = (bgName) => {
        if (!socket) return;
        setCustomGif(null); // Clear custom gif when switching to 3D
        socket.emit('change_background', { roomId, background: bgName });
        setBgSelectionOpen(false);
    };

    const handleGifUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type.includes('image/')) {
            const url = URL.createObjectURL(file);
            setCustomGif(url);
            setBgSelectionOpen(false);
        }
    };

    const copyLink = () => {
        const link = `${window.location.origin}/room/${roomId}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!roomState) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">Syncing Session...</div>;
    }

    const currentBg = roomState.settings.background;

    // Check if the current background is actually a custom URL
    const isCustomUrl = currentBg.startsWith('custom:');
    const customUrlString = isCustomUrl ? currentBg.replace('custom:', '') : null;

    const currentIframeUrl = !isCustomUrl && THEMES[currentBg] ? THEMES[currentBg] : THEMES.BloomingGarden;

    return (
        <PageTransition transitionType="morph">
            <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">

                {/* Background rendering (Custom string URL, local upload, or iFrame) */}
                <div className="absolute inset-0 z-0 overflow-hidden bg-black">
                    {customGif || isCustomUrl ? (
                        <div
                            className="w-full h-full bg-cover bg-center opacity-60 mix-blend-screen pointer-events-none"
                            style={{ backgroundImage: `url(${customGif || customUrlString})` }}
                        />
                    ) : (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[105vw] opacity-70 mix-blend-screen pointer-events-auto" style={{ height: 'calc(100vh + 140px)' }}>
                            <iframe
                                src={currentIframeUrl}
                                className="w-full h-full border-none"
                                title="3D Background"
                                sandbox="allow-scripts allow-same-origin"
                            />
                        </div>
                    )}
                </div>

                {/* Noise overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay"></div>

                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-10 glass-panel rounded-b-2xl md:rounded-b-3xl border-t-0 shadow-lg">
                    <div className="flex flex-col">
                        <span className="text-xs md:text-sm text-white/50 tracking-widest uppercase">Session ID</span>
                        <div className="flex items-center gap-2">
                            <span className="text-lg md:text-xl font-bold tracking-widest text-purple-300">{roomId}</span>
                            <button onClick={copyLink} className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white">
                                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="md:w-4 md:h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <InteractiveButton variant="secondary" onClick={() => setBgSelectionOpen(!bgSelectionOpen)} className="text-sm px-4 py-2">
                            <ImageIcon size={16} className="mr-2" />
                            Theme
                        </InteractiveButton>

                        <AnimatePresence>
                            {bgSelectionOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-4 w-56 glass-panel rounded-2xl p-2 flex flex-col gap-1 shadow-2xl border border-white/20 origin-top-right box-border"
                                >
                                    {Object.keys(THEMES).map((theme) => (
                                        <button
                                            key={theme}
                                            onClick={() => handleChangeBg(theme)}
                                            className={`text-left px-4 py-3 rounded-xl text-sm transition-all ${currentBg === theme && !customGif ? 'bg-purple-500/30 text-white' : 'hover:bg-white/10 text-white/70'}`}
                                        >
                                            {theme.replace(/([A-Z])/g, ' $1').trim()}
                                        </button>
                                    ))}
                                    <div className="h-px bg-white/10 my-1 mx-2"></div>
                                    <label className="text-left px-4 py-3 rounded-xl text-sm transition-all hover:bg-white/10 text-emerald-300 cursor-pointer flex items-center justify-between">
                                        Upload Local File
                                        <input type="file" accept="image/gif, image/jpeg, image/png" className="hidden" onChange={handleGifUpload} />
                                    </label>
                                    <p className="text-[10px] text-white/30 px-3 pb-1">Local uploads are not synced.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Timer Center Piece */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none px-4">
                    <div className="pointer-events-auto glass-panel p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] w-full max-w-[90vw] md:max-w-max flex flex-col items-center gap-6 md:gap-10 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">

                        {/* Mode Selector */}
                        <div className="flex gap-2 md:gap-4 p-1.5 md:p-2 bg-black/40 rounded-xl md:rounded-2xl w-full md:w-auto">
                            <button
                                onClick={() => handleSwitchMode('focus')}
                                className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all ${timerState?.mode === 'focus' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-white/50 hover:text-white'}`}
                            >
                                Focus
                            </button>
                            <button
                                onClick={() => handleSwitchMode('break')}
                                className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all ${timerState?.mode === 'break' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'text-white/50 hover:text-white'}`}
                            >
                                Break
                            </button>
                        </div>

                        {/* Clock Display */}
                        <motion.div
                            className="text-[22vw] md:text-8xl lg:text-9xl font-extrabold tracking-tighter tabular-nums drop-shadow-[0_0_40px_currentColor] leading-none my-4 md:my-0"
                            animate={{
                                color: timerState?.mode === 'focus' ? '#e879f9' : '#34d399',
                                scale: timerState?.status === 'running' ? [1, 1.02, 1] : 1
                            }}
                            transition={{ duration: 2, repeat: timerState?.status === 'running' ? Infinity : 0, ease: "easeInOut" }}
                        >
                            {displayTime}
                        </motion.div>

                        {/* Controls */}
                        <div className="flex gap-4 md:gap-6 items-center">
                            {timerState?.status !== 'running' ? (
                                <InteractiveButton variant="primary" onClick={() => handleCommand('start')} className="w-16 h-16 md:w-20 md:h-20 !rounded-full p-0 flex items-center justify-center bg-white text-black hover:bg-slate-200">
                                    <Play size={24} className="ml-1 md:w-8 md:h-8 md:ml-2" />
                                </InteractiveButton>
                            ) : (
                                <InteractiveButton variant="secondary" onClick={() => handleCommand('pause')} className="w-16 h-16 md:w-20 md:h-20 !rounded-full p-0 flex items-center justify-center border-2 border-white/30 text-white hover:bg-white/10">
                                    <Pause size={24} className="md:w-8 md:h-8" />
                                </InteractiveButton>
                            )}

                            <InteractiveButton variant="ghost" onClick={() => handleCommand('reset')} className="w-14 h-14 md:w-16 md:h-16 !rounded-full p-0 flex items-center justify-center md:mt-2 group">
                                <RotateCcw size={20} className="md:w-6 md:h-6 group-hover:-rotate-90 transition-transform duration-500" />
                            </InteractiveButton>
                        </div>

                    </div>

                    {/* Participants count indicator */}
                    <div className="mt-8 px-6 py-2 glass-panel rounded-full text-sm text-white/50 tracking-widest font-medium">
                        {roomState.participants?.length || 1} Syncing Participant(s)
                    </div>
                </div>

                {/* Floating Task Manager Widget */}
                <TaskManager roomId={roomId} tasks={tasks} />

            </div>
        </PageTransition>
    );
};

export default Room;
