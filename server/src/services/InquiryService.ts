import { prisma } from "../prisma/client";

export const InquiryService = {
	async createInquiry(data) {
        return await prisma.inquiry.create({
			data,
		});
    },

	async getInquiry(id) {
		return await prisma.inquiry.findFirst({
			where: {
				id,
			},
			include: {
				Opportunity: true,
			}
		});
	},

    async getInquiryList(where?) {
        return await prisma.inquiry.findMany({
			where,
			orderBy: {
				createdAt: 'desc' as any,
			},
			include: {
				Opportunity: true,
			}
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
