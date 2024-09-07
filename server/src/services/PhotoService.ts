import { prisma } from "../prisma/client";
import { v4 as uuid } from 'uuid';
import { GoogleDriveService } from "./GoogleDriveService";

const fullGalleryInclusion = {
	coverPhoto: true,
	Client: true,
	Opportunity: true,
	sections: {
		include: {
			photos: {
				orderBy: {
					order: 'asc' as any,
				}
			}
		},
		orderBy: {
			order: 'asc' as any,
		}
	},
};

export const PhotoService = {
	async addPhotoToSection(photoData: any) {
		let order;
		if (photoData.gallerySectionId) {
			order = await prisma.photo.count({ where: { gallerySectionId: photoData.gallerySectionId } });
		}
		else {
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
