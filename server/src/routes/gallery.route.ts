import { Gallery, User } from "@prisma/client";
import { GalleryService } from "../services/GalleryService";
import { prisma } from "../prisma/client";
import { GoogleDriveService } from "../services/GoogleDriveService";
import { Readable } from "stream";
import sharp from "sharp";
import JSZip from "jszip";
// import { DownloadService } from "../services/DownloadService";
import axios from "axios";
import { UserService } from "../services/UserService";

export default (route, _, done) => {

	// public route for pulling up galleries
	route.get('/:galleryIdOrSlug', async (request, reply) => {
		const { galleryIdOrSlug } = request.params;
		const { code } = request.query;

		let loadData = request.sessionUser?.isAdmin;
		let gallery;
		let viewAuth = {
			hasCorrectCode: false,
			isAllowedEmail: false,
		};

		gallery = await GalleryService.getGallerySimple(galleryIdOrSlug);

		if (gallery.visibility === 'public') {
			loadData = true;
		}
		if (gallery.visibility === 'published') {
			if (gallery.shareMode === 'public') {
				loadData = true;
			}
			if (gallery.shareMode === 'code') {
				if (code && code === gallery.shareCode) {
					loadData = true;
					viewAuth.hasCorrectCode = true;
				}
			}
			if (gallery.shareMode === 'invite') {
				if (gallery.shareEmails.includes(request.sessionUser?.email)) {
					loadData = true;
					viewAuth.isAllowedEmail = true;
				}
			}

			if (gallery.Client.email === request.sessionUser?.email) {
				loadData = true;
				viewAuth.isAllowedEmail = true;
			}
		}


		if (loadData) {
			gallery = await GalleryService.getGalleryFull(galleryIdOrSlug);
		}

		return {
			success: true,
			data: gallery,
			viewAuth,
		}
	})


	// public route for pulling galleries a user has access to
	route.get('/user/:userId', async (request, reply) => {
		const { userId } = request.params;

		const user = await UserService.getUserById(userId);
		if (!user) {
			throw Error('User not found');
		}

		const galleries = await GalleryService.getGalleryList({
			OR: [
				{
					shareEmails: {
						has: user.email,
					},
				},
				{
					Client: {
						email: user.email
					}
				},
			],
		});

		return {
			success: true,
			data: galleries
		}
	})

	// admins and clients can manage share settings
	route.put('/:galleryId/share', async (request, reply) => {
		const { galleryId } = request.params;

		const gallery = await GalleryService.getGallerySimple(galleryId);

		if (!gallery) {
			return {
				success: false,
				message: 'Gallery not found'
			}
		}

		if (!request.sessionUser?.isAdmin && gallery.clientEmail !== request.sessionUser?.email) {
			return {
				success: false,
				message: 'You do not have permission to edit this gallery'
			}
		}

		const {
			shareMode,
			shareCode,
			shareEmails,
			clientCanShare,
		} = request.body;
		await GalleryService.updateGallery(galleryId, {
			shareMode,
			shareCode,
			shareEmails,
			clientCanShare,
		});
		return {
			success: true,
		}
	})


	// // load image data for zipping on frontend
	// // Minimizes memory usage on server
	// route.get('/:galleryId/photo/:photoId', async (request, reply) => {
	// 	const { galleryId, photoId } = request.params;

	// 	const gallery = await GalleryService.getGallerySimple(galleryId);
	// 	if (!gallery) {
	// 		return {
	// 			success: false,
	// 			message: 'Gallery not found'
	// 		}
	// 	}

	// 	if (!request.sessionUser?.isAdmin && gallery.clientEmail !== request.sessionUser?.email) {
	// 		return {
	// 			success: false,
	// 			message: 'You do not have permission to download this gallery'
	// 		}
	// 	}
		
	// 	let file = await GalleryService.downloadPhoto(photoId) as any;
	// 	let arrayBuffer = await file.arrayBuffer();


	// 	// console.log(arrayBuffer.length);
	// 	// console.log(arrayBuffer.slice(0, 10));

	// 	const stringFile = new TextDecoder().decode(arrayBuffer);
	// 	// console.log(stringFile.substring(0, 50));
	// 	// console.log(stringFile.length);


	// 	const newarrayBuffer = new TextEncoder().encode(stringFile); // is this exact inverse of decode???
	// 	// console.log(newarrayBuffer);

	// 	return {
	// 		success: true,
	// 		data: Buffer.from(arrayBuffer),
	// 	}
	// })


	route.get('/:galleryId/photo-google/:googleFileId/:width', async (request, reply) => {
		const { googleFileId, width } = request.params;
		const response = await axios.get(`https://drive.google.com/thumbnail?id=${googleFileId}&sz=w${width}`,  { responseType: 'arraybuffer' })
		return {
			success: true,
			data: response.data,
		}
	})

	// // Begin a download job. Returns a job id for tracking
	// route.post('/:galleryId/download', async (request, reply) => {
	// 	const { galleryId } = request.params;
	// 	const { hiRes, photoIds } = request.body;

	// 	const gallery = await GalleryService.getGallerySimple(galleryId);

	// 	if (!gallery) {
	// 		return {
	// 			success: false,
	// 			message: 'Gallery not found'
	// 		}
	// 	}

	// 	if (!request.sessionUser?.isAdmin && gallery.clientEmail !== request.sessionUser?.email) {
	// 		return {
	// 			success: false,
	// 			message: 'You do not have permission to download this gallery'
	// 		}
	// 	}

	// 	if (!photoIds.length) {
	// 		return {
	// 			success: false,
	// 			message: 'No photos selected'
	// 		}
	// 	}

	// 	const photos = await prisma.photo.findMany({
	// 		where: {
	// 			id: { in: photoIds },
	// 		},
	// 	});

	// 	const job = DownloadService.createDownload(galleryId, photoIds, hiRes);
	// 	job.start();

	// 	if (photoIds.length === 1) {
	// 		await job.watchForFinish();
	// 	}

	// 	return {
	// 		success: true,
	// 		data: {
	// 			jobId: job.id,
	// 			progress: job.progress,
	// 		}
	// 	}
	// })


	// route.get('/:galleryId/download-status/:jobId', async (request, reply) => {
	// 	const { jobId } = request.params;

	// 	const job = DownloadService.getDownload(jobId);
	// 	if (!job) {
	// 		return {
	// 			success: false,
	// 			message: 'Job not found'
	// 		}
	// 	}
	// 	return {
	// 		success: true,
	// 		data: {
	// 			jobId: job.id,
	// 			progress: job.progress,
	// 		}
	// 	}
	// })


	// route.get('/:galleryId/download/:jobId', async (request, reply) => {
	// 	const { galleryId, jobId } = request.params;

	// 	const gallery = await GalleryService.getGallerySimple(galleryId);

	// 	const job = DownloadService.getDownload(jobId);
	// 	if (!job) {
	// 		return {
	// 			success: false,
	// 			message: 'Job not found'
	// 		}
	// 	}

	// 	if (job.progress.status !== 'finished') {
	// 		return {
	// 			success: false,
	// 			message: 'Job not ready'
	// 		}
	// 	}

	// 	DownloadService.removeDownload(jobId);

	// 	const isMultiple = job.progress.readyPhotos > 1;
	// 	let finalBuffer = isMultiple ? (await job.getZip()) : job.photos[0].buffer;

	// 	reply.header('Content-Disposition', 'attachment; filename=' + (isMultiple ? `${gallery!.name}.zip` : job.photos[0].photo.filename));
	// 	reply.header('Content-Length', finalBuffer.length);
	// 	reply.type(isMultiple ? 'application/zip' : 'image/jpeg');
	// 	return reply.send(finalBuffer);
	// })

	done();
}