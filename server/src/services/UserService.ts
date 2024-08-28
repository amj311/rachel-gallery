import { User } from "@prisma/client";
import { prisma } from "../prisma/client";

export const UserService = {
	async getUserByAuthId(authId: string) {
		return await prisma.user.findFirst({ where: { auth_id: authId } });
	},

	async createUser(userData: Omit<User, 'id'>) {
        return await prisma.user.create({
            data: userData,
        })
    },

    async getAllUsers() {
        return await prisma.user.findMany({
			orderBy: {
				givenName: 'asc',
			}
		});
    },

    async getUserById(id: string) {
        return await prisma.user.findUnique({
            where: {
                id,
            },
        });
    },

	async isUserClient(id: string, email?: string) {
		if (!email) {
			const user = await prisma.user.findUnique({
				where: {
					id
				},
				select: {
					email: true
				}
			})
			email = user?.email;
		}
		const client = await prisma.client.findFirst({
			where: {
				email,
			},
		});
		return Boolean(client);
	},

    async updateUser(id: string, userData: Partial<User>) {
        return await prisma.user.update({
            where: {
                id,
            },
            data: userData,
        });
    },

    // async deleteUser(id: string) {
    //     await prisma.user.delete({
    //         where: {
    //             id,
    //         },
    //     });
    // },
};
