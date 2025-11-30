const mapService = require('../services/map.service');
const { validationResult } = require('express-validator');

module.exports.getCoordinate = async (req, res, next) => {
    try {
        const { address } = req.query;
        if (!address) {
            return res.status(400).json({ error: 'Address query parameter is required' });
        }

        const coordinates = await mapService.getAddressCoordinate(address);
        res.status(200).json({ coordinates });
    } catch (error) {
        console.error('Error fetching coordinates:', error.message);
        res.status(500).json({ error: 'Failed to fetch coordinates' });
    }
};

module.exports.getDistanceTime = async (req, res, next) => {
    try {
        const errors = validationResult(req); // Fixed typo from 'errores' to 'errors'
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { origin, destination } = req.query;

        const distanceTime = await mapService.getDistanceTime(origin, destination);
        const hours = Math.floor(distanceTime.duration / 3600);
        const minutes = Math.floor((distanceTime.duration % 3600) / 60);
        const seconds = Math.round(distanceTime.duration % 60);

        res.status(200).json({
            distanceTime: {
                distance: `${(distanceTime.distance / 1000).toFixed(2)} km`,
                duration: `${hours > 0 ? `${hours} hours ` : ''}${minutes} minutes`
            }
        });
    } catch (error) {
        console.error('Error fetching distance and time:', error.message);
        res.status(500).json({ error: 'Failed to fetch distance and time' });
    }
};

module.exports.getSuggestions = async (req, res, next) => {

    try {
        const { address } = req.query;
        if (!address) {
            return res.status(400).json({ error: 'Address query parameter is required' });
        }

        const suggestions = await mapService.getSuggestions(address);
        res.status(200).json({ suggestions });
    } catch (error) {
        console.error('Error fetching suggestions:', error.message);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
}