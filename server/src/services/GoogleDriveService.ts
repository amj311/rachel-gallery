import { google } from 'googleapis';
import { JWT } from "googleapis-common";

const accounts = require('../../' + process.env.ACCOUNTS_PATH!);
const currentEmail = accounts.current;

export const GoogleDriveService = {
	_token: <JWT | null>null,

	async _getToken(email) {
		try {
			// configure a JWT auth client
			const jwtClient = new google.auth.JWT(
				email,
				undefined,
				accounts[email],
				['https://www.googleapis.com/auth/drive'],
			);

			//authenticate request
			await jwtClient.authorize();
			return jwtClient;
		}
		catch (error: any) {
			console.error(error);
			throw Error("Could not connect to account: " + email);
		}
	},

	async _getMainToken() {
		if (this._token?.gtoken?.expiresAt && !(Date.now() > this._token.gtoken.expiresAt)) {
			return this._token;
		}
		this._token = await this._getToken(currentEmail);
		return this._token;
	},

	async getDrive() {
		return google.drive({ version: 'v3', auth: await this._getMainToken() });
	},

	async loadDriveInfo() {
		try {
			const drive = await this.getDrive();
			const { data } = await drive!.about.get({
				fields: 'storageQuota, user',
			});
			return data;
		}
		catch(error) {
			console.error(error);
			throw Error("Could not load drive info!")
		}
	},

	// async loadFile(googleFileId) {
	// 	try {
	// 		const drive = await this.getDrive();
	// 		const file = await drive!.files.get({
	// 			fileId: googleFileId,
    //   			alt: 'media',
	// 		});
	// 		return file.data;
	// 	}
	// 	catch(error) {
	// 		console.error(error);
	// 		throw Error("Could not load file!")
	// 	}
	// },

	async deleteFile(googleFileId, owner) {
		if (!accounts[owner]) throw Error("No such account: " + owner);
		try {
			const drive = await this.getDrive();
			await drive!.files.delete({
				fileId: googleFileId,
			});
		}
		catch(error) {
			console.error(error);
			throw Error("Could not delete file!")
		}
	},
};
