import { User } from "@prisma/client";
import { prisma } from "../prisma/client";
import { google } from 'googleapis';
import { JWT } from "googleapis-common";

const drive = google.drive('v3');

export const GoogleDriveService = {
	_client: <JWT | null>null,

	async _getClient() {
		if (this._client?.gtoken?.expiresAt && !(Date.now() > this._client.gtoken.expiresAt)) {
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
			//authenticate request
			await jwtClient.authorize();
			this._client = jwtClient;
			return jwtClient;
		}
		catch (error: any) {
			console.error(error);
			throw Error("Could not connect to google")
		}
	},

	async _getTracksFromFolder(folderId) {
		try {
			drive.files.create
			const { data } = await drive.files.list({
				auth: await this._getClient(),
				supportsAllDrives: true,
				includeItemsFromAllDrives: true,
				fields: "files(name, id, mimeType, parents, modifiedTime)",
				q: `
						'${folderId}' in parents
						and mimeType = 'audio/mpeg'
					`
			})
			return data.files;
		}
		catch(error) {
			console.error(error);
			throw Error("Could not load tracks!")
		}
	},


	async getInductionTracks() {
		const JOURNEY_FOLDER_ID = '1LfmqrlbWtDVE_3OjhlpLVWUuI8OiK2NN';
		return await this._getTracksFromFolder(JOURNEY_FOLDER_ID);
	},

	async getDeepenerTracks() {
		const JOURNEY_FOLDER_ID = '1CxgVMvsqaxZNPap5NdjA20y8no-TMqAp';
		return await this._getTracksFromFolder(JOURNEY_FOLDER_ID);
	},

	async getJourneyTracks() {
		const JOURNEY_FOLDER_ID = '1Je-Ht4jcwlyrUMomyymiHY_lIcvZjTBA';
		return await this._getTracksFromFolder(JOURNEY_FOLDER_ID);
	},

	async getEndingTracks() {
		const JOURNEY_FOLDER_ID = '1yKViBZ5WiogZoPWQj17hkTDsxQQpjDkx';
		return await this._getTracksFromFolder(JOURNEY_FOLDER_ID);
	},

	async getBacktrackTracks() {
		const JOURNEY_FOLDER_ID = '125ICoNSqJ78qxPbuvEVR8UR-al8LSetR';
		return await this._getTracksFromFolder(JOURNEY_FOLDER_ID);
	},
};
