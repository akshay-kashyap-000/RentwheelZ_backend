const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/map.service');
const { sendMessageToSocketId} = require('../socket');
const rideModel = require('../models/ride.model');

module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userId, pickup, destination, vehicleType } = req.body;
    try {
        const ride = await rideService.createRide({
            user: req.user._id,
            pickup,
            destination,
            vehicleType
        });

        const pickupCoordinates = await mapService.getAddressCoordinate(pickup);

        // Validate coordinates before proceeding
        if (
            !pickupCoordinates ||
            pickupCoordinates.ltd < -90 || pickupCoordinates.ltd > 90 ||
            pickupCoordinates.lng < -180 || pickupCoordinates.lng > 180
        ) {
            return res.status(400).json({ error: "Longitude/latitude is out of bounds" });
        }

        const captainsInRadius = await mapService.getCaptainsInTheRadius(
            pickupCoordinates.ltd,
            pickupCoordinates.lng,
            5000 // 5 km radius
        );

        ride.otp = "";

        const rideWithUser = await rideModel.findOne({ _id: ride._id }).populate('user');

        captainsInRadius.forEach(captain => {
            sendMessageToSocketId(captain.socketId, {
                event: 'new-ride',
                data: rideWithUser
            });
        });

        // Only send the response after all logic is done
        return res.status(201).json({ ride });
    } catch (error) {
        console.error('Error creating ride:', error.message);
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to create ride' });
        }
    }
};

module.exports.getFare = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination } = req.query;
    try {
        const fare = await rideService.getFare(pickup, destination);
        return res.status(200).json({ fare });
    } catch (error) {
        console.error('Error fetching fare:', error.message);
        return res.status(500).json({ error: 'Failed to fetch fare' });
    }
}

module.exports.confirmRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;
    try {
        const ride = await rideService.confirmRide(rideId, req.captain._id);

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-confirmed',
            data: ride
        })
        return res.status(200).json({ ride });
    } catch (error) {
        console.error('Error confirming ride:', error.message);
        return res.status(500).json({ error: 'Failed to confirm ride' });
    }
}

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;
    try {
        const ride = await rideService.startRide({rideId, otp, captain: req.captain});

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-started',
            data: ride
        })
        return res.status(200).json({ ride });
        } catch (error) {
        console.error('Error starting ride:', error.message);
        return res.status(500).json({ message:error.message });
    }
}


module.exports.endRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;
    try {
        const ride = await rideService.endRide({rideId, captain: req.captain});
        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-ended',
            data: ride
        })
        
        return res.status(200).json({ ride });
    } catch (error) {
        console.error('Error ending ride:', error.message);
        return res.status(500).json({ error: 'Failed to end ride' });
    }
}
