import { Gallery, User } from "@prisma/client";
import { GalleryService } from "../services/GalleryService";

export default (fastify, _, done) => {
	fastify.get('/:galleryIdOrSlug', async (request, reply) => {
		const { galleryIdOrSlug } = request.params;
		const gallery = await GalleryService.getGalleryFull(galleryIdOrSlug);
		return {
			success: true,
			data: gallery
		}
	})

    done();
}