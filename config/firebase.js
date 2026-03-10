// src/config/firebase.js
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let app;

if (!admin.apps.length) {
  // Option A: Use service account JSON file
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const resolvedPath = path.isAbsolute(serviceAccountPath)
      ? serviceAccountPath
      : path.resolve(process.cwd(), serviceAccountPath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(
        `Firebase service account file not found at ${resolvedPath}.\n` +
        'Set FIREBASE_SERVICE_ACCOUNT_PATH in your .env, or set FIREBASE_PROJECT_ID/FIREBASE_PRIVATE_KEY/FIREBASE_CLIENT_EMAIL instead.'
      );
    }

    const serviceAccount = require(resolvedPath);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  // Option B: Use env vars directly
  else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } else {
    throw new Error(
      'Firebase credentials are not configured.\n' +
      'Either set FIREBASE_SERVICE_ACCOUNT_PATH to a valid service account JSON file, or set FIREBASE_PROJECT_ID/FIREBASE_PRIVATE_KEY/FIREBASE_CLIENT_EMAIL in your environment.'
    );
  }
}

const db   = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
