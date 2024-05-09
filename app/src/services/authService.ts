import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect, type Auth, signInWithCredential } from 'firebase/auth';
// import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

let firebaseApp: FirebaseApp;
let auth: Auth;

// const isWeb = [':8100', ':3000', '.com'].some((str)=> document.location.href.includes(str));

export const AuthService = {
	isInitialized: false,
	info: [''],
	onLogInOrOut: (authUser) => {},
	
	async setupAuth(config) {
		if (this.isInitialized) {
			return;
		}
		this.info.push('started setup')
		firebaseApp = initializeApp(config);
		auth = getAuth(firebaseApp);
		auth.useDeviceLanguage();
	
		onAuthStateChanged(auth, (authUser) => {
			this.onLogInOrOut?.call(null, authUser);
			this.isInitialized = true;
		});
		this.info.push('finished setup')
	},

	get authUser() {
		return auth?.currentUser;
	},

	async getToken() {
		return await auth?.currentUser?.getIdToken();
	},

	async createEmailUser(email, password) {
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;
			return user;
		} catch (error: any) {
			console.log('createEmailUser error', error)
			throw new Error(error.message);
		}
	},

	async signInWithEmail(email, password) {
		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;
			return user;
		} catch (error: any) {
			console.log('signInWithEmail error', error)
			throw new Error(error.message);
		}
	},

	async signInWithGoogle() {
		try {
			// if (isWeb) {
				this.info.push('google signin with redirect')
				const provider = new GoogleAuthProvider();
				const userCredential:any = await signInWithRedirect(auth, provider);
				const user = userCredential.user;
				return user;				
			// }
			// else {
			// 	this.info.push('google signin with credential')
			// 	let googleUser = await GoogleAuth.signIn();
			// 	const googleCredential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
			// 	const userCredential:any = await signInWithCredential(auth, googleCredential);
			// 	const user = userCredential.user;
			// 	return user;
			// }
			
		} catch (error: any) {
			console.log('signInWithGoogle error', error)
			throw new Error(error.message);
		}
	},

	async signOut() {
		try {
			await signOut(auth);
		} catch (error: any) {
			throw new Error(error.message);
		}
	},
}
