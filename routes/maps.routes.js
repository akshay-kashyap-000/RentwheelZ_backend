const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const { query } = require('express-validator'); // Import 'query' from 'express-validator'
const { getCoordinate } = require('../controllers/map.controller');
const { map } = require('../app');
const mapController = require('../controllers/map.controller'); // Import the map controller
const getSuggestions = require('../controllers/map.controller');

router.get(
    '/get-coordinates',
    query('address').isString().isLength({ min: 3 }).withMessage('Address must be at least 3 characters long'),
    // authMiddleware.authUser,
    mapController.getCoordinate
);

router.get('/get-distance-time',
    query('origin').isString().isLength({min:3}),
    query('destination').isString().isLength({min:3}),
    // authMiddleware.authUser,
    mapController.getDistanceTime
)

router.get('/get-suggestions',
    query('address').isString().isLength({ min: 3 }).withMessage('Address must be at least 3 characters long'),
    // authMiddleware.authUser,
    mapController.getSuggestions
);


module.exports = router;