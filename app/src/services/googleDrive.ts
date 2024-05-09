import axios from "axios";

// 'google' provided from script tag in index.html

// TODO determine upload folder
const testFolderId = '1emrqAh2n3tZBVLVFqdv1Mt_jzTgXsIQS';

export const GoogleDriveService = {
	googleClient: null,
	driveInfo: null,
	onToken: null,

	initClient() {
		this.googleClient = google.accounts.oauth2.initTokenClient({
			client_id: '611544680661-1mo4l472al753pt9j6m0n61cb5ktfdi9.apps.googleusercontent.com',
			scope: 'https://www.googleapis.com/auth/drive',
			callback: (tokenResponse) => {
				console.log("token response");
				console.log(tokenResponse);
				tokenResponse.expires_at = Date.now() + tokenResponse.expires_in * 1000;
				localStorage.setItem('googleDriveToken', JSON.stringify(tokenResponse));
				this.onToken?.call(null, tokenResponse);
			},
		});
	},

	get token() {
		return JSON.parse(localStorage.getItem('googleDriveToken') || 'null');
	},

	get hasValidToken() {
		return Boolean(this.token?.expires_at > (Date.now() + 1000 * 60 * 5)); // 5 minutes before expiration
	},

	getToken() {
		if (!this.googleClient) {
			this.initClient();
		}
		if (this.hasValidToken) {
			return this.token;
		}
		return new Promise((res) => {
			this.onToken = res;
			this.driveInfo = null;
			this.googleClient!.requestAccessToken();
		});
	},

	async getDriveInfo() {
		if (this.driveInfo) return this.driveInfo;
		const { data: owner } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + this.token.access_token);
		const { data: drive } = await axios.get('https://www.googleapis.com/drive/v3/about?fields=storageQuota&access_token=' + this.token.access_token);
		this.driveInfo = {
			owner,
			storage: drive.storageQuota,
		};
		return this.driveInfo;
	},

	async uploadImage(image) {
		if (!image?.blob) return;
		const form = new FormData();
		form.append('metadata', new Blob([JSON.stringify({name: image.filename, parents: [testFolderId]})], {type: 'application/json'}));
		form.append('file', image.blob);
		const { data } = await axios.post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&access_token=' + this.token.access_token, form);
		console.log(data)
		return data;
	},

	async deleteFile(fileId) {
		await axios.patch('https://www.googleapis.com/drive/v3/files/' + fileId + '?access_token=' + this.token.access_token, { trashed: true });
	},
	
	async restoreFile(fileId) {
		await axios.patch('https://www.googleapis.com/drive/v3/files/' + fileId + '?access_token=' + this.token.access_token, { trashed: false });
	}
}
