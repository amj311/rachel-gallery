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
			visibility: { in: ['public', 'published'] },
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


	// client requests higher resolution for a photo
	route.post('/:galleryId/requestRes', async (request, reply) => {
		const { galleryId } = request.params;

		const gallery = await GalleryService.getGallerySimple(galleryId);

		if (!gallery) {
			reply.code(404);
			return {
				success: false,
				message: 'Gallery not found'
			}
		}

		if (!request.sessionUser?.isAdmin && gallery.clientEmail !== request.sessionUser?.email) {
			reply.code(403);
			return {
				success: false,
				message: 'You do not have permission to edit this gallery'
			}
		}

		const {
			photoIds,
			res,
		} = request.body;
		if (!Array.isArray(photoIds)) throw new Error();
		if (!res || typeof res !== 'number') throw new Error();

		await GalleryService.requestResolution(galleryId, photoIds, res, request.sessionUser.id);
		// TODO email photographer
		
		reply.code(200);
	})




	// client favorites a photo
	route.post('/:galleryId/favorites', async (request, reply) => {
		const { galleryId } = request.params;
		const photoIds = request.body;

		if (!Array.isArray(photoIds)) {
			throw new Error("must provide array of photo ids")
		}

		const gallery = await GalleryService.getGallerySimple(galleryId);

		if (!gallery) {
			reply.code(404);
			return {
				success: false,
				message: 'Gallery not found'
			}
		}

		await GalleryService.setUserFavorites(galleryId, request.sessionUser.id, photoIds);
		
		reply.code(200);
	})

	route.get('/:galleryId/favorites', async (request, reply) => {
		const { galleryId } = request.params;
		const gallery = await GalleryService.getGallerySimple(galleryId);

		if (!gallery) {
			reply.code(404);
			return {
				success: false,
				message: 'Gallery not found'
			}
		}

		const photoIds = await GalleryService.getUserFavorites(galleryId, request.sessionUser.id);
		
		return {
			data: photoIds || [],
		};
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


	route.get('/download/photo-google/:googleFileId/:sz', async (request, reply) => {
		const { googleFileId, sz } = request.params;
		// sz should be wX or hX
		if (!sz || !(sz.startsWith('w') || sz.startsWith('h'))) throw new Error("invalid size parameter");

		const response = await axios.get(`https://lh3.googleusercontent.com/d/${googleFileId}=${sz}`,  { responseType: 'arraybuffer' })
		return {
			success: true,
			data: response.data,
		}
	})



	route.get('/thumb/photo-google/:googleFileId/:sz', async (request, reply) => {
		// const { googleFileId, sz } = request.params;
		// // sz should be wX or hX
		// if (!sz || !(sz.startsWith('w') || sz.startsWith('h'))) throw new Error("invalid size parameter");

		// reply.redirect(`https://lh3.googleusercontent.com/d/${googleFileId}=${sz}`)

		// 1. Use a Buffer for reliable handling of binary data
		// Ensure you have the necessary variables for the request
		const { googleFileId, sz } = request.params;
		// sz should be wX or hX
		if (!sz || !(sz.startsWith('w') || sz.startsWith('h'))) throw new Error("invalid size parameter");

		try {
			// Axios fetches the data as an ArrayBuffer
			const response = await axios.get(
				`https://lh3.googleusercontent.com/d/${googleFileId}=${sz}`,
				{ responseType: 'arraybuffer' }
			);

			// 2. Convert the ArrayBuffer to a Node.js Buffer
			// This is crucial for reliable binary streaming in Node.js
			const imageBuffer = Buffer.from(response.data);

			// ==================================================================
			// 3. SETTING THE HEADERS (This is the most important step)
			// ==================================================================

			// Get MIME Type: You need a way to determine the actual MIME type (e.g., image/jpeg, image/png). 
			// A robust solution would use a library like 'file-type' on the imageBuffer.
			// For this example, we assume a common format (JPEG).
			const mimeType = 'image/jpeg'; 
			
			// Set the headers that tell the browser how to handle the data stream
			reply.header('Content-Type', mimeType);
			reply.header('Content-Length', imageBuffer.length);
			// Optional: Add Cache control headers
			reply.header('Cache-Control', 'public, max-age=3600');


			// 4. STREAMING THE DATA
			// Instead of returning an object, we return the Buffer directly. 
			// Fastify/Koas recognizes that a Buffer being returned is raw binary data 
			// and sends it without attempting JSON serialization.
			return imageBuffer;

		} catch (error) {
			// Handle errors, e.g., file not found or bad network request
			reply.status(404).send({ error: 'Image not found or inaccessible.' });
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