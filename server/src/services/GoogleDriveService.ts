import { User } from "@prisma/client";
import { prisma } from "../prisma/client";
import { drive_v3, google } from 'googleapis';
import { JWT } from "googleapis-common";

export const GoogleDriveService = {
	_token: <JWT | null>null,

	async _getToken() {
		if (this._token?.gtoken?.expiresAt && !(Date.now() > this._token.gtoken.expiresAt)) {
			return this._token;
		}
		try {
			// configure a JWT auth client
			const jwtClient = new google.auth.JWT(
				process.env.GOOGLE_CLIENT_EMAIL,
				undefined,
				process.env.GOOGLE_CLIENT_PRIVATE_KEY,
				['https://www.googleapis.com/auth/drive'],
			);

			//authenticate request
			await jwtClient.authorize();

			this._token = jwtClient;
			return jwtClient;
		}
		catch (error: any) {
			console.error(error);
			throw Error("Could not connect to google")
		}
	},

	async getDrive() {
		return google.drive({ version: 'v3', auth: await this._getToken() });
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

	

	async loadFile(googleFileId) {
		try {
			const drive = await this.getDrive();
			const file = await drive!.files.get({
				fileId: googleFileId,
      			alt: 'media',
			});
			return file.data;
		}
		catch(error) {
			console.error(error);
			throw Error("Could not load file!")
		}
	},

	async deleteFile(googleFileId) {
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
