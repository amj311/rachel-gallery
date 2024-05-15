import { Gallery } from "@prisma/client";
import { prisma } from "../prisma/client";
import { v4 as uuid } from 'uuid';

export const GalleryService = {
	async createGallery() {
        return await prisma.gallery.create({
			data: {
				id: uuid(),
				sections: {
					create: {
						name: 'Section 1',
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
			include: {
				coverPhoto: true,
				sections: {
					include: {
						photos: true
					}
				},
			}
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
				sections: {
					create: galleryData.sections.filter(s => !s.id).map(section => ({
						data: {
							name: section.name,
						}
					})),
					update: galleryData.sections.filter(s => s.id).map(section => ({
						where: { id: section.id },
						data: {
							name: section.name,
						}
					})),
					delete: galleryData.sections.filter(s => s.marked_for_deletion).map(section => ({
						where: { id: section.id },
					})),
				},
			},
			include: {
				coverPhoto: true,
				sections: {
					include: {
						photos: true
					}
				},
			}
        });
    },

    // async deleteGallery(id: string) {
    //     await prisma.gallery.delete({
    //         where: {
    //             id,
    //         },
    //     });
    // },

	async addPhotoToSection(gallerySectionId: string, photoData: any) {
		console.log("adding photo to section", gallerySectionId, photoData)
		return await prisma.photo.create({
			data: photoData
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
