import { prisma } from "../prisma/client";

export const OpportunityService = {
	async createOpportunity(data) {
        return await prisma.opportunity.create({
			data,
			include: {
				Client: true,
				Inquiry: true,
			}
		});
    },

    async getOpportunityList(where?) {
        return await prisma.opportunity.findMany({
			where,
			orderBy: {
				createdAt: 'desc' as any,
			},
			include: {
				Client: true,
				Inquiry: true,
			}
		});
    },

	getOpportunity(id) {
		return prisma.opportunity.findFirst({
			where: {
				id,
			},
			include: {
				Client: true,
				Inquiry: true,
			}
		});
	},

	async updateOpportunity(id: string, data) {
		return await prisma.opportunity.update({
			where: {
				id,
			},
			data,
		});
	},

    async deleteOpportunity(id: string) {
        await prisma.opportunity.delete({
            where: {
                id,
            },
        });
    },
};
