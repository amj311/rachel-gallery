import { prisma } from "../prisma/client";
import { v4 as uuid } from 'uuid';
import { GoogleDriveService } from "./GoogleDriveService";

export const PhotoService = {
	async addPhotoToSection(photoData: any) {
		let order = photoData.order;
		if (!order && photoData.gallerySectionId) {
			order = await prisma.photo.count({ where: { gallerySectionId: photoData.gallerySectionId } });
		}
		else if (!order && photoData.portfolioSectionId) {
			order = await prisma.photo.count({ where: { portfolioSectionId: photoData.portfolioSectionId } });
		}
		return await prisma.photo.create({
			data: {
				...photoData,
				order,
			},
		});
	},


	// async downloadPhoto(id: string) {
	// 	const photo = await prisma.photo.findUnique({
	// 		where: {
	// 			id,
	// 		},
	// 	});

	// 	return await GoogleDriveService.loadFile(photo?.googleFileId);
	// },

	async deletePhoto(id: string) {
		// load google file id
		const photo = await prisma.photo.findUnique({
			where: {
				id,
			},
		});
		// TODO authenticate as correct user-
		await GoogleDriveService.deleteFile(photo!.googleFileId, photo!.googleOwnerEmail);
		await prisma.photo.delete({
			where: {
				id,
			}
		})
	},
};
