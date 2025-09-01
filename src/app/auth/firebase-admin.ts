import admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

function initializeAdminApp() {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountString) {
        console.warn("FIREBASE_SERVICE_ACCOUNT is not set. Firebase Admin SDK will not be initialized. Admin features will be disabled.");
        return null;
    }

    try {
        const serviceAccount = JSON.parse(Buffer.from(serviceAccountString, 'base64').toString('utf8'));
        
        if (admin.apps.length === 0) {
            console.log("Initializing Firebase Admin SDK...");
            adminApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } else {
            adminApp = admin.app();
        }
        return adminApp;

    } catch (error) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT or initializing Firebase Admin SDK:", error);
        return null;
    }
}

export function getAdminApp() {
    if (!adminApp) {
        initializeAdminApp();
    }
    if (!adminApp) {
        throw new Error("Firebase Admin SDK is not initialized. Ensure FIREBASE_SERVICE_ACCOUNT is set correctly.");
    }
    return adminApp;
}
