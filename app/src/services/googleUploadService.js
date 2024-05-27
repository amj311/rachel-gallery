 import axios from "axios";
 import request from "./request";

// 'google' provided from script tag in index.html
// const uploadFolderName = '__rachel_gallery_photos__';
const targetFolderId = '14mYn4ieKb19hoUHmg7o0-mBuKWEqyR17';


export const GoogleUploadService = {
	googleClient: null,
	driveInfo: null,
	token: null,

	get hasValidToken() {
		return Boolean(this.token?.expires_at > (Date.now() + 1000 * 60 * 5)); // 5 minutes before expiration
	},

	async getToken() {
		if (this.hasValidToken) {
			return this.token;
		}

		const { data } = await request.get('admin/token');

		data.token.expires_at = Date.now() + data.token.expires_in * 1000;
		this.token = data.token;
		this.driveInfo = data.driveInfo;
		return data.token;
	},

	reset() {
		localStorage.removeItem('googleDriveToken');
		this.driveInfo = null;
		this.onToken = null;
		this.googleClient = null;
	},

	// async getDriveInfo() {
	// 	if (this.driveInfo) return this.driveInfo;
	// 	const { data: owner } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + this.token.access_token);
	// 	const { data: drive } = await axios.get('https://www.googleapis.com/drive/v3/about?fields=storageQuota&access_token=' + this.token.access_token);
	// 	const { data: folderSearch } = await axios.get(`https://www.googleapis.com/drive/v3/files?q=name+%3d+%27${uploadFolderName}%27+and+mimeType+%3d+%27application/vnd.google-apps.folder%27+and+trashed+%3d+false&access_token=` + this.token.access_token);
	// 	this.driveInfo = {
	// 		owner,
	// 		storage: drive.storageQuota,
	// 		targetFolder: folderSearch?.files?.[0],
	// 	};
	// 	if (this.driveInfo.targetFolder) {
	// 		const { data: folderPermission } = await axios.get(`https://www.googleapis.com/drive/v3/files/${targetFolderId}/permissions`, {
	// 			params: { access_token: this.token.access_token},
	// 		});
	// 		this.driveInfo.targetFolder.permissions = folderPermission.permissions;
	// 	}
	// 	return this.driveInfo;
	// },

	// async createTargetFolder() {
	// 	if (!this.driveInfo) throw Error("Must load drive info first");
	// 	if (this.driveInfo.targetFolder) throw Error("Target folder already exists");
	// 	const { data } = await axios.post('https://www.googleapis.com/drive/v3/files/?access_token=' + this.token.access_token, {
	// 		name: uploadFolderName,
	// 		mimeType: 'application/vnd.google-apps.folder',
	// 	});
	// 	this.driveInfo.targetFolder = data;
	// },

	async uploadImage(image) {
		if (!targetFolderId) throw Error("no target folder");
		if (!image?.blob) throw Error("no image blob");
		const form = new FormData();
		form.append('metadata', new Blob([JSON.stringify({ name: image.filename, parents: [targetFolderId] })], { type: 'application/json' }));
		form.append('file', image.blob);
		const { data } = await axios.post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&access_token=' + this.token.access_token, form);
		return data;
	},

	async deleteFile(fileId) {
		await axios.patch('https://www.googleapis.com/drive/v3/files/' + fileId + '?access_token=' + this.token.access_token, { trashed: true });
	},

	async restoreFile(fileId) {
		await axios.patch('https://www.googleapis.com/drive/v3/files/' + fileId + '?access_token=' + this.token.access_token, { trashed: false });
	}
}
