import { FOOTER } from "@shared/email_templates";
import { MailtrapClient, type Address } from "mailtrap";
const TOKEN = process.env.MAILTRAP_API_TOKEN || '';

const client = new MailtrapClient({
  token: TOKEN,
});

const addresses = {
	photographer: {
		email: process.env.PHOTOGRAPHER_SEND_FROM_EMAIL || '',
		name: process.env.PHOTOGRAPHER_SEND_FROM_NAME || '',
	},
	system: {
		email: process.env.SYSTEM_SEND_FROM_EMAIL || '',
		name: process.env.SYSTEM_SEND_FROM_NAME || '',
	}
} as const;

const recipients = [
  {
    email: "simplyoliveapps+email@gmail.com",
  }
];

type EmailToFrom = {
	from: 'photographer' | 'system',
	toPhotographer?: boolean,
	to?: Array<Address>,
}

type EmailContent = {
	// template?: Template,
	subject: string,
	text: string,
	html?: string,
}

type EmailConfig = EmailToFrom & EmailContent;

async function sendEmail(props: EmailConfig) {
	let recipients = props.toPhotographer ? [addresses.photographer] : props.to;
	if (!recipients) {
		throw new Error("No recipients")
	}

	try {
		const res =	await client.send({
			from: addresses[props.from],
			to: recipients,
			subject: props.subject,
			text: props.text,
			html: props.html,
		})
		console.log(res);
	}
	catch (e) {
		console.error(e);
		throw new Error("Email sending failed")
	}
}

export const EmailService = {
	sendEmail,
	emailPhotographer(config: EmailContent) {
		return sendEmail({
			from: 'system',
			toPhotographer: true,
			...config,
		})
	}
}