import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectDB = async () => {
  try {
    const options = {};

    // Amazon DocumentDB requires TLS with the AWS CA bundle
    if (process.env.DOCUMENTDB_TLS === "true") {
      const caPath = process.env.DOCUMENTDB_CA_PATH || path.join(__dirname, "..", "global-bundle.pem");
      if (fs.existsSync(caPath)) {
        options.tls = true;
        options.tlsCAFile = caPath;
        options.retryWrites = false; // DocumentDB doesn't support retryWrites
        console.log("🔒 TLS enabled for Amazon DocumentDB");
      } else {
        console.warn(`⚠️  DocumentDB CA bundle not found at ${caPath} — connecting without TLS`);
      }
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    console.log(`MongoDB/DocumentDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
