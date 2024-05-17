import { Gallery, User } from "@prisma/client";
import { GalleryService } from "../services/GalleryService";

export default (fastify, _, done) => {

	// public route for pulling up galleries
	fastify.get('/:galleryIdOrSlug', async (request, reply) => {
		console.log(request.sessionUser)
		const { galleryIdOrSlug } = request.params;

		let canView = request.sessionUser?.isAdmin;
		let gallery;

		if (!canView) {
			gallery = await GalleryService.getGallerySimple(galleryIdOrSlug);
			canView = gallery?.visibility === 'public' || gallery?.clientEmail === request.sessionUser?.email;
		}
		if (canView) {
			gallery = await GalleryService.getGalleryFull(galleryIdOrSlug)
		};

		if (gallery.visibility === 'archived') {
			canView = false;
			gallery = null;
		}

		return {
			success: true,
			data: gallery,
			canView,
		}
	})

    done();
}