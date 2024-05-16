import { Gallery } from "@prisma/client";
import { prisma } from "../prisma/client";
import { v4 as uuid } from 'uuid';

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

    async getGalleryList() {
        return await prisma.gallery.findMany({
			// orderBy: {
			// 	givenName: 'asc',
			// }
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
				sections: {
					create: galleryData.sections.filter(s => !s.id).map(section => ({
						data: {
							name: section.name,
							order: section.order,
						}
					})),
					update: galleryData.sections.filter(s => s.id).map(section => ({
						where: { id: section.id },
						data: {
							name: section.name,
							order: section.order,
						}
					})),
					delete: galleryData.sections.filter(s => s.marked_for_deletion).map(section => ({
						where: { id: section.id },
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
	}
};
