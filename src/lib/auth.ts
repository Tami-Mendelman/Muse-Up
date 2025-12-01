import * as admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.AUTH_PROJECT_ID,
            clientEmail: process.env.AUTH_CLIENT_EMAIL,
            privateKey: process.env.AUTH_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    });
}

export async function verifyToken(token: string) {
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        return decoded;
    } catch (err) {
        return null;
    }
}
