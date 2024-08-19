import { prisma } from "../prisma/client";

export const ClientService = {
	async createClient(data) {
        return await prisma.client.create({
			data,
		});
    },

	async getClientWhere(where) {
		return await prisma.client.findFirst({
			where,
		});
	},

    async getClientList(where?) {
        return await prisma.client.findMany({
			where,
			orderBy: {
				name: 'asc' as any,
			},
		});
    },

	async updateClient(id: string, data) {
		return await prisma.client.update({
			where: {
				id,
			},
			data,
		});
	},

    async deleteClient(id: string) {
        await prisma.client.delete({
            where: {
                id,
            },
        });
    },
};
