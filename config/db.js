const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 10, 
            minPoolSize: 5,  
        });

        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); 
    } 
};

// Event Listeners for Connection
mongoose.connection.on("connected", () => {
    console.log(" MongoDB connection established");
});

mongoose.connection.on("error", (err) => {
    console.error(" MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
    console.warn(" MongoDB disconnected! Reconnecting...");
    connectDB();
});

module.exports = connectDB;
