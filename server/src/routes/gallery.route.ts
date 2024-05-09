import { Gallery, User } from "@prisma/client";
import { GalleryService } from "../services/GalleryService";

export default (fastify, _, done) => {
	fastify.get('/:galleryId', async (request, reply) => {
		const { galleryId } = request.params;
		const gallery = await GalleryService.getGalleryFull(galleryId);
		return {
			success: true,
			data: gallery
		}
	})

    done();
}