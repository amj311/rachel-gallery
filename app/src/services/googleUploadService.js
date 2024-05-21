 import axios from "axios";

// 'google' provided from script tag in index.html
const uploadFolderName = '__rachel_gallery_photos__';


export const GoogleUploadService = {
	googleClient: null,
	driveInfo: null,
	onToken: null,

	initClient() {
		this.googleClient = (google).accounts.oauth2.initTokenClient({
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
			this.googleClient.requestAccessToken();
		});
	},

	async getDriveInfo() {
		if (this.driveInfo) return this.driveInfo;
		const { data: owner } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + this.token.access_token);
		const { data: drive } = await axios.get('https://www.googleapis.com/drive/v3/about?fields=storageQuota&access_token=' + this.token.access_token);
		const { data: folderSearch } = await axios.get(`https://www.googleapis.com/drive/v3/files?q=name+%3d+%27${uploadFolderName}%27+and+mimeType+%3d+%27application/vnd.google-apps.folder%27+and+trashed+%3d+false&access_token=` + this.token.access_token);
		this.driveInfo = {
			owner,
			storage: drive.storageQuota,
			targetFolder: folderSearch?.files?.[0],
		};
		return this.driveInfo;
	},

	async createTargetFolder() {
		if (!this.driveInfo) throw Error("Must load drive info first");
		if (this.driveInfo.targetFolder) throw Error("Target folder already exists");
		const { data } = await axios.post('https://www.googleapis.com/drive/v3/files/?access_token=' + this.token.access_token, {
			name: uploadFolderName,
			mimeType: 'application/vnd.google-apps.folder',
		});
		this.driveInfo.targetFolder = data;
	},

	async uploadImage(image) {
		if (!this.driveInfo?.targetFolder) throw Error("no target folder");
		if (!image?.blob) throw Error("no image blob");
		const form = new FormData();
		form.append('metadata', new Blob([JSON.stringify({ name: image.filename, parents: [this.driveInfo.targetFolder.id] })], { type: 'application/json' }));
		form.append('file', image.blob);
		// upload image
		const { data } = await axios.post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&access_token=' + this.token.access_token, form);
		console.log(data)
		const { data: file } = await axios.get('https://www.googleapis.com/drive/v3/files/' + data.id + '?&access_token=' + this.token.access_token);
		console.log(file)
		// make public
		// await axios.post('https://www.googleapis.com/upload/drive/v3/files/' + data.id + '/permissions?access_token=' + this.token.access_token, { value: 'default', role: 'reader', type: 'anyone' });
		return data;
	},

	async deleteFile(fileId) {
		await axios.patch('https://www.googleapis.com/drive/v3/files/' + fileId + '?access_token=' + this.token.access_token, { trashed: true });
	},

	async restoreFile(fileId) {
		await axios.patch('https://www.googleapis.com/drive/v3/files/' + fileId + '?access_token=' + this.token.access_token, { trashed: false });
	}
}
