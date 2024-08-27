import { User } from "@prisma/client";
import { UserService } from "../services/UserService";

export default (fastify, _, done) => {

    fastify.get('/session', async (request, reply) => {
        return {
            success: true,
            data: request.sessionUser || null,
        }
    });

	// Update current user
	fastify.put('/self', async (request, reply) => {
		const data = request.body as { givenName, familyName };
		const user = await UserService.updateUser(request.sessionUser.id, data);
		return {
			success: true,
			data: user
		}
	})

    done();
}