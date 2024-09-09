import axios from "axios";
import request from "./request";

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

	async uploadImage(image) {
		if (!this.driveInfo.targetFolderId) throw Error("no target folder");
		if (!image?.blob) throw Error("no image blob");
		const form = new FormData();
		form.append('metadata', new Blob([JSON.stringify({ name: image.filename, parents: [this.driveInfo.targetFolderId] })], { type: 'application/json' }));
		form.append('file', image.blob);
		const { data } = await axios.post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&access_token=' + this.token.access_token, form);
		return data;
	},

	async copyFile(fileId) {
		const { data } = await axios.post('https://www.googleapis.com/drive/v3/files/' + fileId + '/copy?access_token=' + this.token.access_token, {
			parents: [this.driveInfo.targetFolderId]
		});
		return data;
	},

	async deleteFile(fileId) {
		await axios.patch('https://www.googleapis.com/drive/v3/files/' + fileId + '?access_token=' + this.token.access_token, { trashed: true });
	},

	async restoreFile(fileId) {
		await axios.patch('https://www.googleapis.com/drive/v3/files/' + fileId + '?access_token=' + this.token.access_token, { trashed: false });
	}
}
