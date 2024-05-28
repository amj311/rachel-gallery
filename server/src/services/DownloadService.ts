// import { Gallery } from "@prisma/client";
// import { prisma } from "../prisma/client";
// import { v4 as uuid } from 'uuid';
// import { GoogleDriveService } from "./GoogleDriveService";
// import sharp from "sharp";
// import JSZip from "jszip";

// export class DownloadService {
// 	private static readonly activeDownloads = new Map<string, DownloadJob>();
// 	constructor() {};

// 	static createDownload(galleryId: string, photoIds: string[], hiRes = false) {
// 		const job = new DownloadJob(galleryId, photoIds, hiRes);
// 		DownloadService.activeDownloads.set(job.id, job);
// 		return job;
// 	}

// 	static getDownload(id: string) {
// 		return DownloadService.activeDownloads.get(id);
// 	}

// 	static removeDownload(id: string) {
// 		DownloadService.activeDownloads.delete(id);
// 	}

// 	static async processPhoto(photo, hiRes) {
// 		const data = await GoogleDriveService.loadFile(photo?.googleFileId) as any;
// 		const array = await data.arrayBuffer();

// 		if (hiRes === 'true') {
// 			return Buffer.from(array);
// 		}
// 		else {
// 			return await sharp(array).resize({
// 				width: 1200,
// 				height: 1200,
// 				fit: 'inside',
// 			}).toBuffer();
// 		}
// 	}
// };

// class DownloadJob {
// 	readonly id: string;
// 	private cursor = 0;
// 	private status = 'pending';
// 	private photosToUpload: any[] = [];
// 	private readyPhotos: { photo: any, buffer: Buffer }[] = [];
// 	// private failedPhotos: { photo: any, error: any }[] = [];
// 	private error: any;
// 	private expires;

// 	constructor (
// 		readonly galleryId: string,
// 		readonly photoIds: string[],
// 		readonly hiRes: boolean,
// 	) {
// 		this.id = uuid();
// 	};

// 	public get progress() {
// 		return {
// 			status: this.status,
// 			readyPhotos: this.readyPhotos.length,
// 			totalPhotos: this.photosToUpload.length,
// 			error: this.error,
// 			expires: this.expires,
// 		}
// 	}

// 	public get photos() {
// 		return this.readyPhotos;
// 	}

// 	public async start() {
// 		if (this.status !== 'pending') {
// 			throw new Error('Job already started');
// 		}
// 		this.photosToUpload = await prisma.photo.findMany({
// 			where: {
// 				id: { in: this.photoIds },
// 			},
// 		});

// 		this.processNextPhoto();
// 	}

// 	private async processNextPhoto() {
// 		if (this.cursor >= this.photosToUpload.length) {
// 			this.onFinished();
// 			return;
// 		}

// 		try {
// 			this.status = 'processing';
// 			const photo = this.photosToUpload[this.cursor];
// 			const buffer = await DownloadService.processPhoto(photo, this.hiRes);
// 			this.readyPhotos.push({ photo, buffer });
// 			this.cursor++;
// 			this.processNextPhoto();	
// 		}
// 		catch (err) {
// 			this.status = 'error';
// 			this.error = err;
// 			this.scheduleRemoval();
// 		}
// 	}

// 	private onFinished() {
// 		this.status = 'finished';
// 		this.scheduleRemoval();
// 	}

// 	private scheduleRemoval() {
// 		const lifetime = 10 * 60 * 1000; // only keep download in memory for 10 minutes
// 		this.expires = Date.now() + lifetime;
// 		setTimeout(() => DownloadService.removeDownload(this.id), lifetime);
// 	}

// 	public async getZip() {
// 		const zip = new JSZip();
// 		this.readyPhotos.forEach(({photo, buffer}, i) => {
// 			zip.file(`${photo.filename}`, buffer);
// 		})
// 		return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
// 	}

// 	public async watchForFinish() {
// 		while (this.status !== 'finished' && this.status !== 'error') {
// 			await new Promise(resolve => setTimeout(resolve, 1000));
// 		}
// 	}
// }
