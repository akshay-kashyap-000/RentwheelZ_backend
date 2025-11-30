const rideModel = require('../models/ride.model');
const mapService = require('../services/map.service');
const crypto = require('crypto');
const { sendMessageToSocketId } = require('../socket');

async function getFare(pickup, destination) {
    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required to calculate fare.');
    }

    const distanceTime = await mapService.getDistanceTime(pickup, destination);

    if (!distanceTime || isNaN(distanceTime.distance) || isNaN(distanceTime.duration)) {
        throw new Error('Invalid distance or duration data from map service.');
    }

    const baseFare = {
        auto: 6,
        car: 8,
        moto: 4
    };

    const perKmRate = {
        auto: 6,
        car: 8,
        moto: 3
    };

    const perMinute = {
        auto: 2,
        car: 3,
        moto: 1.5
    };
    
    // console.log(distanceTime);
    const fare = {
        auto:Math.round( (baseFare.auto + (distanceTime.distance ) * perKmRate.auto + (distanceTime.duration ) * perMinute.auto)),
        car:Math.round( (baseFare.car + (distanceTime.distance ) * perKmRate.car + (distanceTime.duration ) * perMinute.car)),
        moto:Math.round( (baseFare.moto + (distanceTime.distance) * perKmRate.moto + (distanceTime.duration ) * perMinute.moto))
    };

    return fare;
}

module.exports.getFare = getFare;

function getOtp(num){
    function generateOtp(num){
        const otp = crypto.randomInt(Math.pow(10, num - 1), Math.pow(10, num)).toString();
        return otp;
    }
    return generateOtp(num);
}

module.exports.createRide = async ({
    user,pickup, destination, vehicleType
})=>{
    if (!user || !pickup || !destination || !vehicleType) {
        throw new Error('All fields are required to create a ride.');
    }
    const fare = await getFare(pickup, destination);
    const ride = rideModel.create({
        user,
        pickup,
        destination,
        otp: getOtp(6),
        fare: fare[vehicleType]
    });

    return ride;
}

module.exports.confirmRide = async (rideId, captainId) => {
    if (!rideId) {
        throw new Error('Ride ID is required to confirm a ride.');
    }

    // Perform findOneAndUpdate with the captainId and return the updated ride.
    await rideModel.findOneAndUpdate(
        { _id: rideId },
        { status: 'accepted', captain: captainId },
        { new: true }
    );

    const ride = await rideModel.findOne({ 
        _id: rideId 
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found.');
    }

    return ride;
}

module.exports.startRide = async ({ rideId, otp, captain }) => {
    if (!rideId || !otp) {
        throw new Error('Ride ID, OTP are required to start a ride.');
    }

    const ride = await rideModel.findOne({ _id: rideId })
        .populate('user')
        .populate('captain')
        .select('+otp');

    if (!ride) {
        throw new Error('Ride not found.');
    }

    if (ride.status !== 'accepted') {
        console.log('Current ride status:', ride.status);
        throw new Error('Ride is not in accepted state.');
    }
    if (ride.otp !== otp) {
        throw new Error('Invalid OTP.');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    },{
        status:'ongoing'
    });

    sendMessageToSocketId(ride.user.socketId, {
        event: 'ride-started',
        data: ride
    });

    return ride;
}

module.exports.endRide = async ({rideId, captain}) => {
    if (!rideId) {
        throw new Error('Ride ID is required to end a ride.');
    }

    const ride = await rideModel.findOne({ 
        _id: rideId ,
        captain: captain._id
    }).populate('user').populate('captain').select('+otp');
    

    if(!ride){
        throw new Error('Ride not found.');
    }

    if (ride.status !== 'ongoing') {
        throw new Error('Ride is not in ongoing state.');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    },{
        status:'completed'
    });

    return ride;
}
