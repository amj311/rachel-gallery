import { defineStore } from 'pinia'
import request from '@/services/request';
import { GoogleUploadService } from '@/services/googleUploadService';

export const useUploaderStore = defineStore('uploader', {
	state: () => ({
		isOpen: false,
		viewMode: 'modal',

		isGoogleReady: false,
		googleDriveInfo: {} as any,
		isUploading: false,
		photosToUpload: [] as any[],
	}),
	getters: {
		canClose(state) {
			return (state as any).uploadQueue.length === 0 && !this.isUploading;
		},
		finishedPhotos(state) {
			return state.photosToUpload.filter((photo) => photo.uploadStatus === 'complete');
		},
		errorPhotos(state) {
			return state.photosToUpload.filter((photo) => photo.uploadStatus === 'error');
		},
		uploadingPhotos(state) {
			return state.photosToUpload.filter((photo) => photo.uploadStatus === 'uploading');
		},
		uploadQueue(state) {
			return state.photosToUpload.filter((photo) => !photo.uploadStatus);
		},
		headerText(state) {
			if (state.isUploading) {
				return `Uploading... ${(this as any).finishedPhotos.length}/${state.photosToUpload.length}`;
			}
			if ((state as any).errorPhotos.length > 0) {
				return 'Upload failed';
			}
			if (state.photosToUpload.length > 0 && (this as any).uploadQueue.length === 0) {
				return 'Upload complete!';
			}
			return 'Upload Photos';
		},
		folderIsPublic(state) {
			return state.googleDriveInfo.targetFolder?.permissions?.some((p) => p.type === 'anyone');
		},
	},
	actions: {
		queueImages(images: any[]) {
			if (!images || images.length === 0) return;
			// TODO validate images?
			this.isOpen = true;
			this.viewMode = 'modal';
			this.photosToUpload.push(...images);

			this.startUploadLoop();
		},

		async checkGoogleStatus() {
			if (!GoogleUploadService.hasValidToken) {
				this.googleDriveInfo = {};
				this.isGoogleReady = false;
				await this.setupGoogle();
				return;
			}
		},

		async setupGoogle() {
			const token = await GoogleUploadService.getToken();
			if (token) {
				this.googleDriveInfo = await GoogleUploadService.driveInfo;
				this.isGoogleReady = true;
			}
		},


		async startUploadLoop() {
			if (this.isUploading) return;

			// run 5 upload workers
			for (let i = 0; i < 5; i++) {
				// stagger so we don't grab the same photo on race condition
				this._doNextUpload();
				await new Promise(resolve => setTimeout(resolve, 500));
			}
		},

		// async recurse until upload stack is empty
		async _doNextUpload() {
			await this.checkGoogleStatus();
			if (!this.isGoogleReady) {
				return;
			}
			// get next not-started photo
			const photo = (this as any).uploadQueue.find((photo) => !photo.uploadStatus);
			if (!photo) {
				return;
			}

			this.isUploading = true;

			try {
				photo.uploadStatus = "uploading";
				await new Promise(resolve => setTimeout(resolve, 5000));
				
				let googleRes;

				// If completely new photo, upload to google drive
				// Otherwise copy the existing photo
				if (photo.googleFileId) {
					googleRes = await GoogleUploadService.copyFile(photo.googleFileId);
				} else {
					googleRes = await GoogleUploadService.uploadImage(photo);
				}

				photo.googleFileId = googleRes.id;
				photo.googleOwnerEmail = this.googleDriveInfo.user.emailAddress;
	
				// save to db. If fails, delete from google
				try {
					const { data } = await request.post('admin/photo', photo);
					photo.id = data.data.id;
				}
				catch (error) {
					console.log("server save error, deleting from drive.....")
					await GoogleUploadService.deleteFile(googleRes.id);
					throw error;
				}
	
				// wrap up and continue
				photo.uploadStatus = "complete";
				photo.onUploadComplete?.call(null, photo);

				// free memory after time for google image to load
				setTimeout(() => URL.revokeObjectURL(photo.dataUrl), 3000);
			} catch (error) {
				console.error("upload failed", error, photo)
				photo.uploadStatus = "error";
			}
			
			this.isUploading = false;
			this._doNextUpload();
		},
		retryUploadPhoto(photo) {
			photo.uploadStatus = null;
			this.startUploadLoop();
		},
		removePhoto(photo) {
			let proceed = true;
			if (photo.uploadStatus !== 'complete') {
				proceed = confirm("This photo hasn't been uploaded yet. Are you sure you want to remove it?");
			}
			if (!proceed) return;

			URL.revokeObjectURL(photo.dataUrl); // free memory
			this.photosToUpload = this.photosToUpload.filter((p) => p !== photo);
		},
		toggleViewMode() {
			this.viewMode = this.viewMode === 'modal' ? 'drawer' : 'modal';
		},
		close() {
			if ((this as any).errorPhotos.length > 0) {
				if(!confirm("Some photos failed to upload. Do you want to discard them?")) return;
			}
			this.photosToUpload.forEach((photo)	=> URL.revokeObjectURL(photo.dataUrl)); // free memory
			this.photosToUpload = [];
			this.isOpen = false;
		}
	},
});
