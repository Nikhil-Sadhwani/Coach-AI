
import mongoose from "mongoose";

let connectionPromise = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing from backend environment variables."
    );
  }

  // Reuse an established connection in a warm serverless instance.
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Reuse an ongoing connection attempt.
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then((connection) => {
        console.log("MongoDB connected successfully");
        return connection;
      })
      .catch((error) => {
        connectionPromise = null;

        console.error(
          "MongoDB connection failed:",
          error.message
        );

        throw error;
      });
  }

  return connectionPromise;
};

export default connectDB;
