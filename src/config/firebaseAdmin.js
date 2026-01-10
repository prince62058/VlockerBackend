const admin = require("firebase-admin");

// Check if environment variables are available (Production/Render)
if (process.env.FIREBASE_PRIVATE_KEY) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Handle newlines in env vars
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
} else {
  // Fallback to local file (Development)
  try {
    const fs = require("fs");
    const path = require("path");
    const serviceAccountPath = path.join(
      process.cwd(),
      "secrets",
      "serviceAccountKey.json"
    );

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, "utf8")
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      console.error(
        "Firebase Admin: Service account file not found and Env vars not set."
      );
    }
  } catch (error) {
    console.error("Firebase Admin Error:", error);
  }
}

module.exports = admin;
