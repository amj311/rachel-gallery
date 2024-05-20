import { Gallery } from "@prisma/client";
import { prisma } from "../prisma/client";
import { v4 as uuid } from 'uuid';
import { GoogleDriveService } from "./GoogleDriveService";

const fullGalleryInclusion = {
	coverPhoto: true,
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
				}
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

	async deletePhoto(id: string) {
		await prisma.photo.delete({
			where: {
				id,
			}
		})
	},


	async downloadPhoto(id: string, hiRes = false) {
		const photo = await prisma.photo.findUnique({
			where: {
				id,
			},
		});

		const data = await GoogleDriveService.loadFile(photo?.googleFileId);
		console.log(data);
	}
};
