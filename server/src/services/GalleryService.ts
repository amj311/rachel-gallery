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

export const GalleryService = {
	async createGallery() {
        return await prisma.gallery.create({
			data: {
				id: uuid(),
				name: 'New Gallery',
				sections: {
					create: {
						name: 'Section 1',
						order: 0,
					}
				},
			}
		});
    },

    async getGalleryList(where?) {
        return await prisma.gallery.findMany({
			where,
			orderBy: {
				date: 'desc' as any,
			},
			include: {
				coverPhoto: true,
				Client: true,
				sections: {
					select: {
						_count: {
							select: {
								photos: true,
							}
						}
					}
				}
			},
		});
    },


    async getGallerySimple(idOrSlug: string) {
        return await prisma.gallery.findFirst({
            where: {
                OR: [ { id: idOrSlug }, { slug: idOrSlug } ],
            },
			include: {
				coverPhoto: true,
				Client: true,
			}
        });
    },

    async getGalleryFull(idOrSlug: string) {
        return await prisma.gallery.findFirst({
            where: {
                OR: [ { id: idOrSlug }, { slug: idOrSlug } ],
            },
			include: fullGalleryInclusion,
        });
    },

    async updateGallery(id: string, galleryData) {
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
						}
					})),
					delete: galleryData.sections?.filter(s => s.marked_for_deletion).map(section => ({
						id: section.id,
					})),
				},
			},
			include: fullGalleryInclusion,
        });
    },

    // async deleteGallery(id: string) {
    //     await prisma.gallery.delete({
    //         where: {
    //             id,
    //         },
    //     });
    // },

	async createNewGallerySection(galleryId: string) {
		const order = (await prisma.gallerySection.count({ where: { galleryId } }));
		return await prisma.gallerySection.create({
			data: {
				galleryId,
				name: 'New Section',
				order,
			},
			include: {
				photos: true,
			}
		});
	},

	async addPhotoToSection(gallerySectionId: string, photoData: any) {
		const order = (await prisma.photo.count({ where: { gallerySectionId } }));
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
				gallerySectionId: id,
			},
		});
		for (const photo of photos) {
			// TODO authenticate as correct user
			await GoogleDriveService.deleteFile(photo!.googleFileId, photo!.googleOwnerEmail);
		}
		await prisma.gallerySection.delete({
			where: {
				id,
			}
		})
	},
};
