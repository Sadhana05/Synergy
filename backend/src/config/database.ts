import { Db, MongoClient, MongoClientOptions } from "mongodb";
import { logger } from "../utils/logger";

const isDev = process.env.NODE_ENV !== "production";
const atlasMongoUri = "mongodb+srv://synergy:synergy@synergy.r8btvlg.mongodb.net/?appName=synergy";
const defaultMongoUri = isDev ? "mongodb+srv://synergy:synergy@synergy.r8btvlg.mongodb.net/?appName=synergy" : atlasMongoUri;
const mongoUri = process.env.MONGODB_URI || defaultMongoUri;
const mongoDbName = process.env.MONGODB_DB_NAME || "synergy";
const localMongoUri = "mongodb+srv://synergy:synergy@synergy.r8btvlg.mongodb.net/?appName=synergy";
const allowInsecureTlsInDev = process.env.MONGODB_TLS_ALLOW_INVALID_CERTS === "true";
const forceIpv4 = process.env.MONGODB_FORCE_IPV4 === "true";

let client: MongoClient | null = null;
let db: Db | null = null;

const getMongoClient = (uri: string): MongoClient => {
  const options: MongoClientOptions = {
    serverSelectionTimeoutMS: 30000, // Increased from 15000
    connectTimeoutMS: 20000, // Increased from 10000
    socketTimeoutMS: 45000, // Increased from 30000
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    ...(allowInsecureTlsInDev ? { tlsAllowInvalidCertificates: true, tlsInsecure: true } : {}),
    ...(forceIpv4 ? { family: 4 } : {}),
  };

  return new MongoClient(uri, options);
};

const sanitizeMongoUri = (uri: string): string => {
  return uri.replace(/:\/\/([^:@/]+):([^@/]+)@/, "://$1:***@");
};

export const connectDatabase = async (): Promise<void> => {
  if (db) {
    return;
  }

  const isDev = process.env.NODE_ENV !== "production";
  const shouldTryLocalFallback = isDev && mongoUri.startsWith("mongodb+srv://") && !mongoUri.includes("127.0.0.1");

  try {
    logger.info(`Connecting to MongoDB: ${sanitizeMongoUri(mongoUri)}/${mongoDbName}`);
    client = getMongoClient(mongoUri);
    await client.connect();
    db = client.db(mongoDbName);
    await db.command({ ping: 1 });
    logger.info(`MongoDB connection established: ${sanitizeMongoUri(mongoUri)}/${mongoDbName}`);
  } catch (error) {
    if (shouldTryLocalFallback) {
      logger.info("MongoDB Atlas connection failed in development; trying local MongoDB fallback", {
        sourceUri: sanitizeMongoUri(mongoUri),
        fallbackUri: localMongoUri,
      });

      try {
        client = getMongoClient(localMongoUri);
        await client.connect();
        db = client.db(mongoDbName);
        await db.command({ ping: 1 });
        logger.info(`MongoDB local fallback connection established: ${localMongoUri}/${mongoDbName}`);
        return;
      } catch (fallbackError) {
        logger.error("Local MongoDB fallback failed", {
          error: fallbackError,
          fallbackUri: localMongoUri,
          mongoDbName,
        });
      }
    }

    logger.error("Unable to connect to MongoDB", {
      error,
      mongoUri: sanitizeMongoUri(mongoUri),
      mongoDbName,
      hint: "If Atlas TLS fails in your network, use local MongoDB (mongodb+srv://synergy:synergy@synergy.r8btvlg.mongodb.net/?appName=synergy) or set MONGODB_TLS_ALLOW_INVALID_CERTS=true for development only.",
    });
    throw error;
  }
};

export const getDb = (): Db => {
  if (!db) {
    throw new Error("MongoDB is not connected. Call connectDatabase() first.");
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info("MongoDB connection closed");
  }
};
