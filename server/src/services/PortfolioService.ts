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

export const PortfolioService = {
	async getPortfolio() {
		const sections = await prisma.portfolioSection.findMany({
			include: {
				photos: true,
			},
			orderBy: {
				order: 'asc' as any,
			}
		});
		return {
			sections,
		}
	},

    async updateSection(id: string, galleryData) {
		for (const section of galleryData.sections) {
			if (section.photosMovedIn) {
				for (const photoId of galleryData.sections[0].photosMovedIn) {
					await prisma.portfolioSection.update({
						where: {
							id:  section.id
						},
						data: {
							photos: {
								connect: {
									id: photoId,
								}
							}
						}
					})
				}
			}
		}
        return await prisma.gallery.update({
            where: {
                id,
            },
            data: {
				name: galleryData.name,
				slug: galleryData.slug,
				clientEmail: galleryData.clientEmail,
				clientName: galleryData.clientName,
				clientId: galleryData.clientId,
				date: galleryData.date ? new Date(galleryData.date).toISOString() : undefined,
				isPublished: galleryData.isPublished,
				coverStyle: galleryData.coverStyle,
				coverPhotoId: galleryData.coverPhotoId,
				coverSettings: galleryData.coverSettings || undefined,
				visibility: galleryData.visibility,
				shareMode: galleryData.shareMode,
				shareCode: galleryData.shareCode,
				clientCanShare: galleryData.clientCanShare,
				shareEmails: galleryData.shareEmails || undefined,

				sections: {
					create: galleryData.sections?.filter(s => !s.id).map(section => ({
						data: {
							name: section.name,
							order: section.order,
						}
					})),
					update: galleryData.sections?.filter(s => s.id).map(section => ({
						where: { id: section.id },
						data: {
							name: section.name,
							order: section.order,

							photos: {
								update: (section.photosMovedIn?.length || section.photosMovedOut?.length) ? section.photos?.map(photo => ({
									where: { id: photo.id },
									data: {
										order: photo.order,
									}
								})) : undefined,
								// connect: section.photosMovedIn?.map(id => ({ id })),
								// disconnect: section.photosMovedOut?.map(id => ({ id }))
							},
						},
					})),
					delete: galleryData.sections?.filter(s => s.marked_for_deletion).map(section => ({
						id: section.id,
					})),
				},
			},
			include: fullGalleryInclusion,
        });
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
