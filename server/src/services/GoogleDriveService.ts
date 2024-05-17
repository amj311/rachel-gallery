import { User } from "@prisma/client";
import { prisma } from "../prisma/client";
import { drive_v3, google } from 'googleapis';
import { JWT } from "googleapis-common";

export const GoogleDriveService = {
	_token: <JWT | null>null,
	_client: <drive_v3.Drive | null>null,

	async _getClient() {
		if (this._token?.gtoken?.expiresAt && !(Date.now() > this._token.gtoken.expiresAt)) {
			return this._client;
		}
		try {
			// configure a JWT auth client
			const jwtClient = new google.auth.JWT(
				process.env.GOOGLE_CLIENT_EMAIL,
				undefined,
				process.env.GOOGLE_CLIENT_PRIVATE_KEY,
				['https://www.googleapis.com/auth/drive'],
			);

			console.log('jwtClient', jwtClient)
			//authenticate request
			await jwtClient.authorize();
			this._token = jwtClient;
			this._client = google.drive({ version: 'v3', auth: jwtClient });
			return this._client;
		}
		catch (error: any) {
			console.error(error);
			throw Error("Could not connect to google")
		}
	},

	

	async loadFile(googleFileId) {
		try {
			const drive = await this._getClient();
			const file = await drive!.files.get({
				fileId: googleFileId,
      			alt: 'media',
			});
			console.log(file);
			return file.data;
		}
		catch(error) {
			console.error(error);
			throw Error("Could not load file!")
		}
	},
};
