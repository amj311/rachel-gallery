import { Gallery } from "@prisma/client";
import { prisma } from "../prisma/client";
import { v4 as uuid } from 'uuid';

export const GalleryService = {
	async createGallery() {
        return await prisma.gallery.create({
			data: {
				id: uuid(),
				Sections: {
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

    async getGalleryFull(id: string) {
        return await prisma.gallery.findUnique({
            where: {
                id,
            },
			include: {
				coverPhoto: true,
				Sections: {
					include: {
						photos: true
					}
				},
			}
        });
    },

    async updateGallery(id: string, galleryData: Partial<Gallery>) {
        return await prisma.gallery.update({
            where: {
                id,
            },
            data: galleryData,
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
