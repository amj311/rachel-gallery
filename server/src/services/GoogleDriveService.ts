import { google } from 'googleapis';
import { JWT } from "googleapis-common";
import { prisma } from '../prisma/client';

const accounts = require(process.env.ACCOUNTS_PATH!);
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

	async _getEmailToken(email?: string) {
		if (!email || email === currentEmail) {
			return this._getMainToken();
		}
		return await this._getToken(email);
	},

	async getDrive(ownerEmail?: string) {
		return google.drive({ version: 'v3', auth: await this._getEmailToken(ownerEmail) });
	},

	async loadDriveInfo() {
		try {
			const drive = await this.getDrive();
			const { data } = await drive!.about.get({
				fields: 'storageQuota, user',
			});
			return {
				...data,
				targetFolderId: process.env.GOOGLE_DRIVE_TARGET_FOLDER_ID!,
			};
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
			const drive = await this.getDrive(owner);
			await drive!.files.delete({
				fileId: googleFileId,
			});
		}
		catch(error) {
			console.error(error);
			throw Error("Could not delete file!")
		}
	},

	async getAllPhotos(pagination, filters = {}) {
		const drive = await this.getDrive();
		const newPage: any[] = [];
		const pageSize = Number(pagination.pageSize) || 100;
		let isDone = false;
		let nextPageToken = pagination.nextPageToken;

		let numLoops = 0;
		const maxLoops = 100;
		while(!isDone) {
			if (numLoops > maxLoops) {
				throw Error("Too many loops");
			}
			numLoops++;

			const { data } = await drive!.files.list({
				pageSize,
				pageToken: nextPageToken,
				q: 'mimeType contains "image/" and trashed = false',
				fields: 'nextPageToken, files(id, name, mimeType, quotaBytesUsed, createdTime, modifiedTime, owners, parents, webViewLink)',
			});
			nextPageToken = data.nextPageToken;

			if (!data.files) {
				console.warn('Drive did not return files');
				break;
			}

			// Get data from our db
			const dbPhotos = await prisma.photo.findMany({
				where: {
					googleFileId: {
						in: data.files.map((file) => file.id || ''),
					},
				},
				include: {
					Gallery: {
						select: {
							name: true,
							id: true,
						}
					},
					GallerySection: {
						include: {
							Gallery: {
								select: {
									name: true,
									id: true,
								}
							},
						}
					},
					PortfolioSection: {
						select: {
							name: true,
							id: true,
						}
					}
				},
			});

			// Join with map
			const compositePhotos: any[] = [];
			const photoMap = new Map(dbPhotos.map((photo) => [photo.googleFileId, photo]));
			for (const file of data.files || []) {
				const dbPhoto = photoMap.get(file.id || '');
				compositePhotos.push({
					googleFileId: file.id,
					googleFile: file,
					dbPhoto,
				})
			}

			// TODO add filtering

			newPage.push(...compositePhotos);

			if (newPage.length >= pageSize || !nextPageToken) {
				isDone = true;
			}
		}

		return {
			files: newPage,
			nextPageToken,
		};
	}
};
