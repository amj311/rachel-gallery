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
			return;
		}

        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(authToken);
        const uid = decodedToken.uid;

        // Find existing user by auth id
		let user = await UserService.getUserByAuthId(uid);

		// Assume this is a new SSO login and create new user
		if (!user) {
			console.log(decodedToken);
			const names = decodedToken.name.split(' ');
			const userData = {
				auth_id: uid,
				email: decodedToken.email,
				givenName: names.shift(),
				familyName: names.pop() || '',
				isAdmin: false,
			};
			user = await UserService.createUser(userData);
		}

        request.sessionUid = uid;
		request.sessionUser = user;
    }
	catch (error) {
        // Return an error response if the Firebase user session is not valid
		console.error(error)
		reply.status(500).send();
    }
};

export default firebaseAuthMiddleware;