import { Gallery, User } from "@prisma/client";
import { InquiryService } from "../services/InquiryService";

export default (route, _, done) => {

	// public route for creating inquiries
	route.post('/inquiry', async (request, reply) => {
		const data = request.body;
		const inquiry = await InquiryService.createInquiry(data);
		return {
			success: true,
			data: inquiry
		}
	})

	done();
}