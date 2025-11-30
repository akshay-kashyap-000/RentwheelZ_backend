const dotenv = require('dotenv');   
dotenv.config();
const express = require('express');
const cors = require('cors');
const app = express();
const cookieParser = require('cookie-parser');
const connectToDb = require('./db/db');
const userRoutes = require('./routes/user.routes');
const captainRoutes = require('./routes/captain.routes');
const mapRoutes = require('./routes/maps.routes');
const rideRoutes = require('./routes/ride.routes');
const cors = require('cors');
connectToDb();

app.use(cors({
    // allow both Vite (5173) and CRA (3000) dev servers during development
    origin:["http://localhost:5173", "http://localhost:3000"], //$ defines the allowed origins
    credentials:true, //$ to allow cookies to be sent to frontend along with requests
    methods:["GET","POST","PATCH","DELETE"] //$ allowed methods
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use('/users', userRoutes);
app.use('/captains', captainRoutes);
app.use('/maps', mapRoutes);
app.use('/ride', rideRoutes);

module.exports = app;