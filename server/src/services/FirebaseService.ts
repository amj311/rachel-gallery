import { UserService } from "./UserService";

const admin = require('firebase-admin');

export const firebaseConfig = {
	apiKey: process.env.FB_API_KEY,
	authDomain: process.env.FB_AUTH_DOMAIN,
	databaseURL: process.env.FB_DB_URL,
	projectId: process.env.FB_PROJECT_ID,
	storageBucket: process.env.FB_STORAGE_BUCKET,
	messagingSenderId: process.env.FB_MESSAGING_SENDER_ID,
	appId: process.env.FB_APP_ID,
};

// Initialize the Firebase Admin SDK
admin.initializeApp(firebaseConfig);

// Middleware to check if the request has a valid Firebase user session
export const firebaseAuthMiddleware = async (request, reply) => {
    try {
        const authToken = request.headers.authorization;
		if (!authToken) {
			// Send 401 for no auth
			reply.status(401).send();
		}
        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(authToken);
        const uid = decodedToken.uid;

        request.sessionUid = uid;
		if (request.url === '/api/user/create-account') {
			return;
		}

        // Attach the user ID to the request object
		const user = await UserService.getUserByAuthId(uid);
		if (!user) {
			// Send 403 for auth but no account
			reply.status(403).send();
		}
        request.sessionUser = user;
    }
	catch (error) {
        // Return an error response if the Firebase user session is not valid
		console.error(error)
		reply.status(500).send();
    }
};

export default firebaseAuthMiddleware;