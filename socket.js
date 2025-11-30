const socketIo = require('socket.io');
const userModel = require('./models/user.model'); // Adjust the path as necessary
const captainModel = require('./models/captain.model'); // Adjust the path as necessary

let io; // Socket.IO server instance

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: '*', // Adjust for production
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on('join', async (data) => {
            const { userId, userType } = data;

            if (userType === 'user') {
                await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
            } else if (userType === 'captain') {
                await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
            }
        });

        socket.on('update-location-captain', async (data) => {
            const { userId, location } = data;

            if (!location || !location.ltd || !location.lng) {
                return socket.emit('error', { message: 'Invalid location data' });
            }

            await captainModel.findByIdAndUpdate(userId, {
                location: {
                    ltd: location.ltd,
                    lng: location.lng
                }
            });
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
}

/**
 * Sends a message to a specific socket ID.
 * @param {string} socketId - The target socket ID.
 * @param {string} event - The event name.
 * @param {any} message - The data to send.
 */
const sendMessageToSocketId = (socketId, messageObject) => {
    // console.log(messageObject);

    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log('Socket.io not initialized.');
    }
}

module.exports = {
    initializeSocket,
    sendMessageToSocketId,
};