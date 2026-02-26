import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/ui/PageTransition';
import InteractiveButton from '../components/ui/InteractiveButton';
import FeatureCarousel from '../components/FeatureCarousel';
import UserManual from '../components/UserManual';
import { useSocket } from '../context/SocketContext';
import { Sparkles } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    const { socket, isConnected } = useSocket();
    const [roomIdInput, setRoomIdInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [isSoloFlow, setIsSoloFlow] = useState(false);
    const [focusTime, setFocusTime] = useState(25); // Minutes
    const [selectedBg, setSelectedBg] = useState('BloomingGarden');

    const THEMES = ['BloomingGarden', 'ClimbingCube', 'SaturnHula', 'LighthouseOcean'];

    const handleCreateRoom = (isSolo = false) => {
        if (!socket || !isConnected) return setError("Not connected to server");
        setLoading(true);
        socket.emit('create_room', (response) => {
            setLoading(false);
            if (response.success) {

                // Apply Focus time
                socket.emit('timer_switch_mode', { roomId: response.roomId, mode: 'focus' });

                // Check if it's a custom GIF or a predefined 3D theme
                if (selectedBg === 'CustomGIF') {
                    const urlInput = document.getElementById('custom-gif-url')?.value;
                    if (urlInput) {
                        socket.emit('change_background', { roomId: response.roomId, background: `custom:${urlInput}` });
                    }
                } else if (selectedBg !== 'BloomingGarden') {
                    socket.emit('change_background', { roomId: response.roomId, background: selectedBg });
                }

                navigate(`/room/${response.roomId}`);
            } else {
                setError("Failed to create room");
            }
        });
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (!roomIdInput.trim()) return;
        if (!socket || !isConnected) return setError("Not connected to server");

        setLoading(true);
        socket.emit('join_room_direct', { roomId: roomIdInput }, (response) => {
            setLoading(false);
            if (response.success) {
                navigate(`/room/${roomIdInput}`);
            } else {
                setError(response.message || "Failed to join room");
            }
        });
    };

    const handleFeatureSelect = (id) => {
        if (id === 3) {
            setIsManualOpen(true);
        } else {
            setIsSoloFlow(id === 2);
            setIsModalOpen(true);
        }
    };

    return (
        <PageTransition transitionType="slideMap">
            <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">

                {/* Background glow noise */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>

                <div className="z-10 flex flex-col items-center max-w-lg w-full px-6 space-y-12">

                    <div className="text-center space-y-4">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]"
                        >
                            Ready to Focus?
                        </motion.h1>
                        <p className="text-white/60 font-light tracking-widest text-sm uppercase">Ephemeral synchronized sessions</p>
                    </div>

                    {/* Replaced Cube with Carousel */}
                    <FeatureCarousel onSelectFeature={handleFeatureSelect} />

                    <div className="w-full relative mt-4">
                        {error && <p className="text-rose-400 text-sm text-center absolute -top-8 left-0 right-0">{error}</p>}

                        <form onSubmit={handleJoinRoom} className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={roomIdInput}
                                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                                placeholder="Or Join By Room Code"
                                className="flex-1 w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all uppercase tracking-widest shadow-inner text-sm backdrop-blur-md"
                                maxLength={6}
                            />
                            <InteractiveButton variant="primary" onClick={handleJoinRoom} className="w-full sm:w-auto px-8 !rounded-2xl">
                                Join
                            </InteractiveButton>
                        </form>
                    </div>
                </div>

                {/* User Manual Overlay */}
                <UserManual isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />

                {/* Modal Overlay for Room Configuration */}
                <AnimatePresence>
                    {isModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="glass-panel w-[95%] max-w-md p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 md:space-y-8 bg-[#09090b]/80 border border-white/10"
                            >
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Configure Session</h2>
                                    <p className="text-white/50 text-sm font-light leading-relaxed">Customize your ephemeral room settings before launching.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-xs tracking-widest uppercase text-white/50 block font-medium">Focus Duration</label>
                                        <div className="flex gap-4">
                                            {[15, 25, 45].map((time) => (
                                                <button
                                                    key={time}
                                                    onClick={() => setFocusTime(time)}
                                                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${focusTime === time ? 'bg-purple-600/30 border border-purple-500 text-purple-200' : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'}`}
                                                >
                                                    {time} min
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs tracking-widest uppercase text-white/50 block font-medium">3D Environment</label>
                                        <select
                                            value={selectedBg}
                                            onChange={(e) => setSelectedBg(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 appearance-none text-sm"
                                        >
                                            {THEMES.map((theme) => (
                                                <option key={theme} value={theme} className="bg-gray-900 border-0">{theme.replace(/([A-Z])/g, ' $1').trim()}</option>
                                            ))}
                                            <option value="CustomGIF" className="bg-gray-900 border-0">Upload Custom GIF</option>
                                        </select>
                                    </div>

                                    {/* Conditional GIF Upload Field */}
                                    {selectedBg === 'CustomGIF' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-3 overflow-hidden"
                                        >
                                            <label className="text-xs tracking-widest uppercase text-white/50 block font-medium">Custom Background URL</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="url"
                                                    placeholder="Paste GIF or Image URL here..."
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 text-sm"
                                                    onChange={(e) => {
                                                        // This uses a hack: we prefix 'custom:' to the URL so the Room component knows it's a direct URL
                                                        if (e.target.value) {
                                                            // We won't set selectedBg directly to avoid losing the "CustomGIF" select state, 
                                                            // instead we'll handle this in the submit
                                                        }
                                                    }}
                                                    id="custom-gif-url"
                                                />
                                            </div>
                                            <p className="text-white/30 text-[10px] uppercase tracking-wider">For ephemeral sync, please provide a direct public image/GIF URL.</p>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-medium text-white/50 hover:text-white transition-colors">Cancel</button>
                                    <InteractiveButton onClick={() => handleCreateRoom(isSoloFlow)} className="flex-1 font-semibold flex items-center justify-center gap-2">
                                        <Sparkles size={16} /> Launch {isSoloFlow ? 'Solo' : 'Room'}
                                    </InteractiveButton>
                                </div>

                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
};

export default Home;
