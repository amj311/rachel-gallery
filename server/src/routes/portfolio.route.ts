import { PortfolioService } from "../services/PortfolioService";

export default (route, _, done) => {

	// public route for creating inquiries
	route.get('/', async (request, reply) => {
		const data = await PortfolioService.getPortfolio();
		return {
			success: true,
			data,
		}
	})

	done();
}