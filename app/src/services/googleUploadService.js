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

	// async uploadImage(image) {
	// 	if (!this.driveInfo.targetFolderId) throw Error("no target folder");
	// 	if (!image?.blob) throw Error("no image blob");
	// 	const form = new FormData();
	// 	form.append('metadata', new Blob([JSON.stringify({ name: image.filename, parents: [this.driveInfo.targetFolderId] })], { type: 'application/json' }));
	// 	form.append('file', image.blob);
	// 	const { data } = await axios.post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&access_token=' + this.token.access_token, form);
	// 	return data;
	// },

	async uploadImage(image) {
			if (!this.driveInfo.targetFolderId) throw Error("no target folder");
			if (!image?.blob) throw Error("no image blob");
		const boundary = `drive_${crypto.randomUUID()}`;
		const metadata = {
			name: image.filename,
			mimeType: image.blob.type || "application/octet-stream",
			parents: [this.driveInfo.targetFolderId],
		};

		const body = new Blob([
			`--${boundary}\r\n`,
			"Content-Type: application/json; charset=UTF-8\r\n\r\n",
			JSON.stringify(metadata),
			`\r\n--${boundary}\r\n`,
			`Content-Type: ${metadata.mimeType}\r\n\r\n`,
			image.blob,
			`\r\n--${boundary}--`,
		]);

		const token = await this.getToken();

		const response = await fetch(
			"https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${token.access_token}`,
					"Content-Type": `multipart/related; boundary=${boundary}`,
				},
				body,
			}
		);

		if (!response.ok) {
			throw new Error(`Drive upload failed (${response.status}): ${await response.text()}`);
		}

		return response.json();
	},

	async updateImage(googleFileId, image) {
		if (!this.driveInfo.targetFolderId) throw Error("no target folder");
		if (!image?.blob) throw Error("no image blob");

		const url = `https://www.googleapis.com/upload/drive/v3/files/${googleFileId}`;

		// 3. The Body is simply the raw binary blob
		const body = image.blob;
		const token = await this.getToken();

		// 4. Make the PUT Request
		const response = await fetch(
			url,
			{
				// Using PUT is best practice for replacing the entire resource
				method: "PATCH", 
				headers: {
					Authorization: `Bearer ${token.access_token}`,
					// Content-Type must match the mime type of the uploaded file
					"Content-Type": image.blob.type || "application/octet-stream",
				},
				body,
			}
		);

		if (!response.ok) {
			throw new Error(`Drive update failed (${response.status}): ${await response.text()}`);
		}

		// Media uploads usually return an empty body or confirmation JSON
		return { message: "Image updated successfully." }; 
	},


	async copyFile(fileId) {
		const token = await this.getToken();
		const { data } = await axios.post('https://www.googleapis.com/drive/v3/files/' + fileId + '/copy?access_token=' + token.access_token, {
			parents: [this.driveInfo.targetFolderId]
		});
		return data;
	},

	async deleteFile(fileId) {
		const token = await this.getToken();
		await axios.patch('https://www.googleapis.com/drive/v3/files/' + fileId + '?access_token=' + token.access_token, { trashed: true });
	},

	async restoreFile(fileId) {
		const token = await this.getToken();
		await axios.patch('https://www.googleapis.com/drive/v3/files/' + fileId + '?access_token=' + token.access_token, { trashed: false });
	}
}
