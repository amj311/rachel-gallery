import { prisma } from "../prisma/client";
import { v4 as uuid } from 'uuid';
import { GoogleDriveService } from "./GoogleDriveService";

const orderAndInclude = {
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
};

export const PortfolioService = {
	async getPortfolio() {
		const sections = await prisma.portfolioSection.findMany({
			...orderAndInclude,
		});
		return {
			sections,
		}
	},

    async updatePortfolio(portfolioData) {
		console.log(portfolioData)
		for (const section of portfolioData.sections) {
			await prisma.portfolioSection.update({
				where: {
					id: section.id,
				},
				data: {
					name: section.name,
					type: section.type,
					order: section.order,
					attributes: section.attributes,
					anchorText: section.anchorText,
					photos: {
						update: section.photos.map((photo: any) => ({
							where: {
								id: photo.id,
							},
							data: {
								order: photo.order,
							}
						}))
					}
				},
			});
		}
        
    },

	async createNewSection(type: string) {
		const order = (await prisma.portfolioSection.count());
		return await prisma.portfolioSection.create({
			data: {
				type,
				name: 'New Section',
				order,
			},
			include: {
				photos: true,
			}
		});
	},

	async addPhotoToSection(portfolioSectionId: string, photoData: any) {
		const order = (await prisma.photo.count({ where: { portfolioSectionId } }));
		return await prisma.photo.create({
			data: {
				...photoData,
				order,
			},
		});
	},

	async deletePhoto(id: string) {
		// load google file id
		const photo = await prisma.photo.findUnique({
			where: {
				id,
			},
		});
		// TODO authenticate as correct user
		await GoogleDriveService.deleteFile(photo!.googleFileId, photo!.googleOwnerEmail);
		await prisma.photo.delete({
			where: {
				id,
			}
		})
	},

	async deleteSection(id: string) {
		// delete all photos in section from google
		const photos = await prisma.photo.findMany({
			where: {
				portfolioSectionId: id,
			},
		});
		for (const photo of photos) {
			// TODO authenticate as correct user
			await GoogleDriveService.deleteFile(photo!.googleFileId, photo!.googleOwnerEmail);
		}
		await prisma.portfolioSection.delete({
			where: {
				id,
			}
		})
	},
};
