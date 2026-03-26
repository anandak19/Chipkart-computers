const app = require("./app");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const startServer = async () => {
  try {
    await connectDB();

    app.listen(process.env.PORT, "0.0.0.0", () => {
      console.log(`server running at port:${process.env.PORT}`);
    });

  } catch (err) {
    console.error("Startup error:", err);
  }
};

startServer();