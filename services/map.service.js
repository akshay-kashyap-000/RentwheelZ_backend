const axios = require('axios');
const captainModel = require('../models/captain.model'); // Ensure you have the correct path to your captain model
module.exports.getAddressCoordinate = async (address) => {
    try {
        const mapboxToken = process.env.MAPBOX_API_KEY; // Ensure your Mapbox API key is stored in the environment variables
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${process.env.MAPBOX_API_KEY}`;

        const response = await axios.get(url);

        if (response.data && response.data.features && response.data.features.length > 0) {
            const [longitude, latitude] = response.data.features[0].center;
            return { ltd: latitude, lng: longitude };
        } else {
            throw new Error('No coordinates found for the given address');
        }
    } catch (error) {
        console.error('Error fetching coordinates:', error.message);
        throw error;
    }
};


module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    const mapboxToken = process.env.MAPBOX_API_KEY;

    try {
        // Fetch coordinates for origin
        const originUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(origin)}.json?access_token=${process.env.MAPBOX_API_KEY}`;
        const originResponse = await axios.get(originUrl);
        if (!originResponse.data.features || originResponse.data.features.length === 0) {
            throw new Error(`No coordinates found for origin: ${origin}`);
        }
        const [originLng, originLat] = originResponse.data.features[0].center;

        // Fetch coordinates for destination
        const destinationUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination)}.json?access_token=${process.env.MAPBOX_API_KEY}`;
        const destinationResponse = await axios.get(destinationUrl);
        if (!destinationResponse.data.features || destinationResponse.data.features.length === 0) {
            throw new Error(`No coordinates found for destination: ${destination}`);
        }
        const [destinationLng, destinationLat] = destinationResponse.data.features[0].center;

        // Call Directions API with coordinates
        const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destinationLng},${destinationLat}?access_token=${process.env.MAPBOX_API_KEY}&geometries=geojson`;

        const directionsResponse = await axios.get(directionsUrl);

        if (directionsResponse.data && directionsResponse.data.routes && directionsResponse.data.routes.length > 0) {
            const { distance, duration } = directionsResponse.data.routes[0];

            // Convert distance to kilometers and duration to minutes
            return {
                distance: (distance / 1000).toFixed(2), // Convert meters to kilometers
                duration: (duration / 60).toFixed(2)   // Convert seconds to minutes
            };
        } else {
            throw new Error('No route found between the origin and destination');
        }
    } catch (error) {
        console.error('Error fetching distance and time:', error.response?.data || error.message);
        throw error;
    }
};

module.exports.getSuggestions = async (address) => {
    if (!address) {
        throw new Error('Address is required for suggestions');
    }
    try {
        const mapboxToken = process.env.MAPBOX_API_KEY; // Ensure your Mapbox API key is stored in the environment variables
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}`;

        const response = await axios.get(url);

        if (response.data && response.data.features && response.data.features.length > 0) {
            return response.data.features.map(feature => ({
                place_name: feature.place_name,
                coordinates: feature.center
            }));
        } else {
            throw new Error('No suggestions found for the given address');
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error.message);
        throw error;
    }
};

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {
    if (!ltd || !lng || !radius) {
        throw new Error('Latitude, longitude, and radius are required');
    }

    try {
        const captains = await captainModel.find({
            location: {
                $geoWithin: {
                    $centerSphere: [[ltd,lng], radius / 6371] 
                }
            }
        });

        return captains;
    } catch (error) {
        console.error('Error fetching captains in the radius:', error.message);
        throw error;
    }
}