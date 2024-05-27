import { createReadStream } from "fs";
import path from "path";

export default (route, _, done) => {
	route.get('/signin', async (request, reply) => {
		reply.type('text/html').send(/*html*/ `
			<html>
				<head>
					<title>Sign in</title>
					<script>
						let googleClient = null;
						function initClient() {
							console.log('initClient')
							googleClient = (google).accounts.oauth2.initTokenClient({
								client_id: '611544680661-1mo4l472al753pt9j6m0n61cb5ktfdi9.apps.googleusercontent.com',
								scope: 'https://www.googleapis.com/auth/drive',
								prompt: '',
								redirect_uri: 'http://localhost:3000/googleToken/signin',
								callback: (tokenResponse) => {
									tokenResponse.expires_at = Date.now() + tokenResponse.expires_in * 1000;
									localStorage.setItem('googleDriveToken', JSON.stringify(tokenResponse));
									this.onToken?.call(null, tokenResponse);
								},
							});
						};
						function signin() {
							googleClient.requestAccessToken();
						}
					</script>
					<script src="https://accounts.google.com/gsi/client" onload="initClient()"></script>
					</head>
				<body>
					<h1>Sign in</h1>
					<button id="signin" onclick="signin()">Sign in</button>
				</body>
			</html>
		`);
	});

    done();
}
