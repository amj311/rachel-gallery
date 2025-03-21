import { UserService } from "../services/UserService";
import { GalleryService } from "../services/GalleryService";
import { GoogleDriveService } from "../services/GoogleDriveService";
import { InquiryService } from "../services/InquiryService";
import { ClientService } from "../services/ClientService";
import { OpportunityService } from "../services/OpportunityService";
import { PortfolioService } from "../services/PortfolioService";

export default (route, _, done) => {
	// Validate user is admin
	route.addHook('preValidation', (request, reply, done) => {
		if (!request.sessionUser?.isAdmin) {
			reply.status(403).send();
		}
		done();
	});



	/**
	 * GOOGLE DRIVE
	 */

	route.get('/token' , async (request, reply) => {
		const driveData = await GoogleDriveService.loadDriveInfo();
		// const userInfo = await GoogleDriveService.getUserInfo();
		return {
			success: true,
			token: GoogleDriveService._token?.gtoken?.rawToken,
			driveInfo: driveData,
		};
	})

	route.get('/storage', async (request, reply) => {
		const pagination = {
			pageSize: request.query?.pageSize || 100,
			nextPageToken: request.query?.nextPageToken || undefined,
		};
		const filters = {}; // TODO
		const driveData = await GoogleDriveService.getAllPhotos(pagination, filters);
		return {
			success: true,
			data: driveData
		}
	})


	/**
	 * USERS
	 */

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



	/**
	 * GALLERIES
	 */

	// list all galleries
	route.get('/gallery', async (request, reply) => {
		console.log(request.sessionUser)
		// const data = request.body as Omit<Gallery, 'id'>;
		const list = await GalleryService.getGalleryList();
		return {
			success: true,
			data: list
		}
	})

	route.post('/gallery', async (request, reply) => {
		// const data = request.body as Omit<Gallery, 'id'>;
		const gallery = await GalleryService.createGallery();
		return {
			success: true,
			data: gallery
		}
	})


	// Delete a gallery
	route.delete('/gallery/:galleryId', async (request, reply) => {
		const { galleryId } = request.params;
		await GalleryService.deleteGallery(galleryId);
		return {
			success: true,
		}
	})

	// Get admin gallery view
	route.get('/gallery/:galleryId', async (request, reply) => {
		const { galleryId } = request.params;
		const gallery = await GalleryService.getGalleryFull(galleryId);
		return {
			success: true,
			data: gallery
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

	// Create a new section for a gallery
	route.post('/gallery/:galleryId/section', async (request, reply) => {
		const { galleryId } = request.params;
		// const data = request.body;
		const section = await GalleryService.createNewGallerySection(galleryId);
		return {
			success: true,
			data: section
		}
	})

	// Delete a gallery section
	route.delete('/gallery/:galleryId/section/:sectionId', async (request, reply) => {
		const { sectionId } = request.params;
		await GalleryService.deleteSection(sectionId);
		return {
			success: true,
		}
	})

	/** PHOTOS */

	// Upload a photo to a gallery section
	route.post('/photo', async (request, reply) => {
		const { galleryId } = request.params;
		const {
			filename,
			size,
			width,
			height,
			type,
			order,
			googleFileId,
			googleOwnerEmail,
			gallerySectionId,
			portfolioSectionId,
		} = request.body;
		const photo = await GalleryService.addPhotoToSection(galleryId, {
			filename,
			size,
			width,
			height,
			order,
			type,
			googleFileId,
			googleOwnerEmail,
			gallerySectionId,
			portfolioSectionId,
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


	// INQUIRIES

	route.get('/inquiries', async (request, reply) => {
		const data = await InquiryService.getInquiryList();
		return {
			success: true,
			data: data
		}
	})

	route.put('/inquiry/:id', async (request, reply) => {
		const { id } = request.params;
		const data = request.body;
		const inquiry = await InquiryService.updateInquiry(id, data);
		return {
			success: true,
			data: inquiry
		}
	})

	route.delete('/inquiry/:id', async (request, reply) => {
		const { id } = request.params;
		await InquiryService.deleteInquiry(id);
		return {
			success: true,
		}
	})

	route.put('/inquiry/:inquiryId/accept', async (request, reply) => {
		const { inquiryId } = request.params;
		const inquiry = await InquiryService.getInquiry(inquiryId);

		if (!inquiry) {
			throw Error("No such inquiry: " + inquiryId);
		}

		let client = await ClientService.getClientWhere({ email: inquiry.email });
		if (!client) {
			client = await ClientService.createClient({
				name: inquiry.name,
				email: inquiry.email,
				phone: inquiry.phone,
			})
		}

		const opportunity = await OpportunityService.createOpportunity({
			clientId: client.id,
			inquiryId: inquiry.id,
			occasion: inquiry.occasion,
			location: inquiry.location,
			date: inquiry.date,
			peopleQty: inquiry.peopleQty,
		})

		return {
			success: true,
			data: opportunity
		}
	})




	// OPPORTUNITIES

	route.get('/opportunities', async (request, reply) => {
		const data = await OpportunityService.getOpportunityList();
		return {
			success: true,
			data: data
		}
	})

	route.get('/opportunity/:id', async (request, reply) => {
		const { id } = request.params;
		const data = await OpportunityService.getOpportunity(id);
		return {
			success: true,
			data: data
		}
	})

	route.put('/opportunity/:id', async (request, reply) => {
		const { id } = request.params;
		const data = request.body;
		const opportunity = await OpportunityService.updateOpportunity(id, data);
		return {
			success: true,
			data: opportunity
		}
	})

	route.delete('/opportunity/:id', async (request, reply) => {
		const { id } = request.params;
		await OpportunityService.deleteOpportunity(id);
		return {
			success: true,
		}
	})


	// CRUD for clients
	route.get('/clients', async (request, reply) => {
		const data = await ClientService.getClientList();
		return {
			success: true,
			data: data
		}
	})

	route.post('/client', async (request, reply) => {
		const data = request.body;
		const client = await ClientService.createClient(data);
		return {
			success: true,
			data: client
		}
	})

	route.put('/client/:id', async (request, reply) => {
		const { id } = request.params;
		const data = request.body;
		const client = await ClientService.updateClient(id, data);
		return {
			success: true,
			data: client
		}
	})

	route.delete('/client/:id', async (request, reply) => {
		const { id } = request.params;
		await ClientService.deleteClient(id);
		return {
			success: true,
		}
	})


	// PORTFOLIO
	route.put('/portfolio', async (request, reply) => {
		const data = request.body;
		await PortfolioService.updatePortfolio(data);
		return {
			success: true,
		}
	})

	route.post('/portfolio/section', async (request, reply) => {
		const { type } = request.body;
		const section = await PortfolioService.createNewSection(type);
		return {
			success: true,
			data: section
		}
	})

	route.delete('/portfolio/section/:id', async (request, reply) => {
		const { id } = request.params;
		await PortfolioService.deleteSection(id);
		return {
			success: true,
		}
	})

    done();
}
