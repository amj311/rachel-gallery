import { prisma } from "../prisma/client";

export const InquiryService = {
	async createInquiry(data) {
        return await prisma.inquiry.create({
			data,
		});
    },

    async getInquiryList(where?) {
        return await prisma.inquiry.findMany({
			where,
			orderBy: {
				created_at: 'desc' as any,
			},
		});
    },

	async updateInquiry(id: string, data) {
		return await prisma.inquiry.update({
			where: {
				id,
			},
			data,
		});
	},

    async deleteInquiry(id: string) {
        await prisma.inquiry.delete({
            where: {
                id,
            },
        });
    },
};
