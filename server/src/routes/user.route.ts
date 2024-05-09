import { User } from "@prisma/client";
import { UserService } from "../services/UserService";

export default (fastify, _, done) => {

    fastify.get('/session', async (request, reply) => {
        return {
            success: true,
            data: request.sessionUser,
        }
    });

	fastify.post('/create-account', async (request, reply) => {
		const data = request.body as Omit<User, 'user_id'>;
		const user = await UserService.createUser(data);
		return {
			success: true,
			data: user
		}
	})

    done();
}