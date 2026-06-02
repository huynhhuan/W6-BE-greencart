import mongoose from "mongoose";

const buildMongoUri = () => {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || "greencart";

  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  if (uri.includes("?")) {
    return uri;
  }

  return `${uri.replace(/\/$/, "")}/${dbName}`;
};

const buildMongoOptions = () => {
  const options = {};

  if (process.env.MONGODB_TLS === "true") {
    options.tls = true;
  }

  if (process.env.MONGODB_TLS_CA_FILE) {
    options.tlsCAFile = process.env.MONGODB_TLS_CA_FILE;
  }

  if (process.env.MONGODB_REPLICA_SET) {
    options.replicaSet = process.env.MONGODB_REPLICA_SET;
  }

  if (process.env.MONGODB_READ_PREFERENCE) {
    options.readPreference = process.env.MONGODB_READ_PREFERENCE;
  }

  if (process.env.MONGODB_RETRY_WRITES) {
    options.retryWrites = process.env.MONGODB_RETRY_WRITES === "true";
  }

  return options;
};

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () =>
      console.log("Database Connected")
    );
    await mongoose.connect(buildMongoUri(), buildMongoOptions());
  } catch (error) {
    console.error(error.message);
  }
};

export default connectDB;
