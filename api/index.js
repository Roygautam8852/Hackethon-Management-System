const app = require("../server/app");
const connectDB = require("../server/config/db");

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (error) {
    console.error("Database connection error in Vercel function:", error);
    return res.status(500).json({
      success: false,
      message: "Database Connection Failed: " + error.message
    });
  }
  return app(req, res);
};
