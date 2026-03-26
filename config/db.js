const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log("DB already connected");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
    });

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
  }
};

process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});

// Event Listeners for Connection
mongoose.connection.on("connected", () => {
  console.log(" MongoDB connection established");
});

mongoose.connection.on("error", (err) => {
  console.error(" MongoDB connection error:", err);
});

module.exports = connectDB;
