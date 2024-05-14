import { Gallery, User } from "@prisma/client";
import { UserService } from "../services/UserService";
import { GalleryService } from "../services/GalleryService";

export default (route, _, done) => {
	// Validate user is admin
	route.addHook('preValidation', (request, reply, done) => {
		if (!request.sessionUser?.isAdmin) {
			reply.status(403).send();
		}
		done();
	});




	route.get('/users', async (request, reply) => {
		const data = await UserService.getAllUsers();
		return {
			success: true,
			data: data,
		}
	});

	route.put('/users/:user_id', async (request, reply) => {
		const {
			givenName,
			familyName,
			isAdmin,
		} = request.body;		
		const { user_id } = request.params;
		const userData = await UserService.updateUser(user_id, {
			givenName,
			familyName,
			isAdmin,
		});
		return {
			success: true,
			data: userData,
		}
	});




	// Create a new gallery
	route.post('/gallery', async (request, reply) => {
		// const data = request.body as Omit<Gallery, 'id'>;
		const user = await GalleryService.createGallery();
		return {
			success: true,
			data: user
		}
	})

	// Update an existing gallery
	route.put('/gallery/:galleryId', async (request, reply) => {
		const { galleryId } = request.params;
		const data = request.body;
		const gallery = await GalleryService.updateGallery(galleryId, data);
		return {
			success: true,
			data: gallery
		}
	})


	// Upload a photo to a gallery section
	route.post('/photo', async (request, reply) => {
		const { galleryId } = request.params;
		const {
			filename,
			size,
			width,
			height,
			type,
			googleFileId,
			googleOwnerEmail,
			gallerySectionId,
		} = request.body;
		const photo = await GalleryService.addPhotoToSection(galleryId, {
			filename,
			size,
			width,
			height,
			type,
			googleFileId,
			googleOwnerEmail,
			gallerySectionId,
		});
		return {
			success: true,
			data: photo
		}
	})

	route.delete('/photo/:id', async (request, reply) => {
		const { id } = request.params;
		console.log("deleting photo", id)
		await GalleryService.deletePhoto(id);
		return {
			success: true,
		}
	})


    done();
}
