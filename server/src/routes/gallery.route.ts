import { Gallery, User } from "@prisma/client";
import { GalleryService } from "../services/GalleryService";
import { prisma } from "../prisma/client";
import { GoogleDriveService } from "../services/GoogleDriveService";
import { Readable } from "stream";
import sharp from "sharp";
import JSZip from "jszip";

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

			if (gallery.clientEmail === request.sessionUser?.email) {
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


	// for downloading photos
	route.get('/:galleryId/download', async (request, reply) => {
		console.log("DOING DOWNLOAD!!!")
		const { galleryId } = request.params;
		const { hiRes, photoIds } = request.query;
		const ids = photoIds?.split(',') || [];

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
				message: 'You do not have permission to download this gallery'
			}
		}

		if (ids.length) {
			const photos = await prisma.photo.findMany({
				where: {
					id: { in: ids },
				},
			});

			const buffers = await Promise.all(photos.map(async (photo) => {
				const data = await GoogleDriveService.loadFile(photo?.googleFileId) as any;
				const array = await data.arrayBuffer();

				if (hiRes === 'true') {
					return Buffer.from(array);
				}
				else {
					return await sharp(array).resize({
						width: 1200,
						height: 1200,
						fit: 'inside',
					}).toBuffer();
				}
			}));

			let finalBuffer: Buffer;
			const isMultiple = buffers.length > 1;

			if (isMultiple) {
				const zip = new JSZip();
				buffers.forEach((buffer, i) => {
					zip.file(`${photos[i].filename}`, buffer);					
				})
				const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
				finalBuffer = buffer;
			}
			else {
				finalBuffer = buffers[0];
			}

			reply.header('Content-Disposition', 'attachment; filename=' + (isMultiple ? `${gallery.name}.zip` : photos[0].filename));
			reply.header('Content-Length', finalBuffer.length);
			reply.type(isMultiple ? 'application/zip' : 'image/jpeg');
			return reply.send(finalBuffer);
		}

		return {
			success: true,
		}
	})

	done();
}