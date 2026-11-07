import { httpServer } from './app.js';

// Global last-resort exception handlers to prevent unexpected process crashes
process.on('uncaughtException', (err) => {
    console.error('[Process Error] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Process Error] Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
