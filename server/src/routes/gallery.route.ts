import { Gallery, User } from "@prisma/client";
import { GalleryService } from "../services/GalleryService";

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

		if (!loadData) {
			gallery = await GalleryService.getGallerySimple(galleryIdOrSlug);
		}
		if (loadData) {
		};

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

    done();
}