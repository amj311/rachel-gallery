import * as dotenv from "dotenv"
dotenv.config({
	// path: '../.env'
})

import adminRoute from "./routes/admin.route";
import userRoute from "./routes/user.route";
import galleryRoute from "./routes/gallery.route";

import Fastify from "fastify";
import firebaseAuthMiddleware, { firebaseConfig } from "./services/FirebaseService";
import path from "path";
import { createReadStream } from "fs";

const app = Fastify({
	logger: false
});
app.register(require('@fastify/cors'));

app.addHook("onResponse", (request, reply) => {
	console.log(request.method, request.url, reply.statusCode)
});

app.get('/api/firebase-config', () => {
	return {
		data: firebaseConfig
	}
});

// public routes
app.register(galleryRoute, { prefix: '/api/gallery' });


// protected routes
app.register((fastify, _, done) => {
	fastify.addHook('preValidation', firebaseAuthMiddleware);
	fastify.register(userRoute, { prefix: '/user' });
	fastify.register(adminRoute, { prefix: '/admin' });
	done();
}, { prefix: '/api' });


// Serving the static app
// app.register(require('@fastify/static'), {
// 	root: path.join(__dirname, '../dist'),
// });
// app.setNotFoundHandler((req, reply) => {
// 	const stream = createReadStream(path.join(__dirname, '../dist') + '/index.html');
// 	reply.type('text/html').send(stream)
// })

app.setErrorHandler((error: any, request, reply) => {
	console.error(`❌ ${request.method} ${request.url}:`)
	console.error(error)
	// if (error.isApiError) {
	// 	throw error;
	// }
	return reply.code(500).send({
		success: false,
		message: "Unknown error"
	});
});

// Run the server!
(async () => {
	try {
		const port = Number(process.env.PORT || 5000);
		const host = ("RENDER" in process.env) ? `0.0.0.0` : `localhost`;
		await app.listen({ port, host })
		console.log('Server started on ' + port)
	} catch (err) {
		console.error(err)
		process.exit(1)
	}	
})();
