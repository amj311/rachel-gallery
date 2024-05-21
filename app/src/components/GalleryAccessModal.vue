<script setup lang="ts">
import { reactive, computed } from 'vue';
import Button from 'primevue/button';
import { useUserStore } from '@/stores/user.store';
import RadioButton from 'primevue/radiobutton';
import request from '@/services/request';
import { useToast } from 'primevue/usetoast';
import Checkbox from 'primevue/checkbox';
import InputText from 'primevue/inputtext';

const toast = useToast();
const userStore = useUserStore();
const isAdmin = computed(() => {
	return userStore.currentUser?.isAdmin;
})

const gallery = defineModel<any>();

const state = reactive({
	settings: {
		clientCanShare: gallery.value!.clientCanShare,
		shareMode: gallery.value!.shareMode,
		shareCode: gallery.value!.shareCode || generateCode(),
		shareEmails: gallery.value!.shareEmails,
	},
	isSaving: false,
	newEmail: '',
});

const emit = defineEmits(['close']);

function generateCode() {
	let result = '';
	const characters = '0123456789';
	for (let i = 0; i < 6; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
}

async function copyLink() {
	await navigator.clipboard.writeText(window.location.origin + '/' + (gallery.value!.slug || gallery.value!.id));
	toast.add({
		severity: 'success',
		summary: `Copied link to clipboard`,
		life: 3000,
	});
}


async function copyCode() {
	await navigator.clipboard.writeText(state.settings.shareCode);
	toast.add({
		severity: 'success',
		summary: `Copied code to clipboard`,
		life: 3000,
	});
}

function addEmail() {
	const email = state.newEmail;
	// validate email
	// email regex
	if (!email.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
		toast.add({
			severity: 'error',
			summary: `Invalid email`,
			life: 3000,
		})
		return;
	}
	if (state.settings.shareEmails.includes(email)) {
		state.newEmail = '';
		return;
	}
	state.settings.shareEmails.push(email);
	state.newEmail = '';
}

async function save() {
	try {
		state.isSaving = true;
		const { data } = await request.put('gallery/' + gallery.value!.id + '/share', state.settings);
		state.isSaving = false;
		if (data.success) {
			gallery.value!.clientCanShare = state.settings.clientCanShare;
			gallery.value!.shareMode = state.settings.shareMode;
			gallery.value!.shareCode = state.settings.shareCode;
			gallery.value!.shareEmails = state.settings.shareEmails;
		}
		toast.add({
			severity: 'success',
			summary: `Updated share settings`,
			life: 3000,
		})
		emit('close');
	}
	catch (e) {
		console.log(e);
		toast.add({
			severity: 'error',
			summary: `Failed to update share settings`,
			life: 3000,
		})
	}
	finally {
		state.isSaving = false;
	}
}

</script>


<template>
	<div class="share-modal modal">
		<div class="flex align-items-center mb-2">
			<h3>Share Gallery</h3>
			<div class="flex-grow-1"></div>
			<Button icon="pi pi-times" text @click="$emit('close')" />
		</div>

		<div class="modal-body">
			<div v-if="isAdmin" class="my-3 ml-3 flex align-items-center">
				<Checkbox v-model="state.settings.clientCanShare" binary inputId="clientCanShare" />
				<label for="clientCanShare" class="ml-2">Allow client to share this gallery</label>
			</div>
			<Button class="w-full gap-2" text @click="state.settings.shareMode = 'invite'">
				<RadioButton v-model="state.settings.shareMode" inputId="ingredient1" name="shareMode" value="invite" />
				Invite by email
			</Button>
			<div class="ml-5 option-body" :class="{ open: state.settings.shareMode === 'invite' }">
				<p>Invite people to view this gallery by email. They will be required to log in.</p>
				
				<div class="my-3">
					<div v-for="email in state.settings.shareEmails" :key="email" class="flex align-items-center gap-2">
						{{ email }}
						<i class="button pi pi-times" @click="state.settings.shareEmails = state.settings.shareEmails.filter(e => e !== email)"></i>
					</div>
				</div>
				<div class="flex align-items-center gap-2">
					<InputText v-model="state.newEmail" class="w-full" placeholder="email@example.com" @keydown.enter="addEmail" />
					<Button text icon="pi pi-plus" @click="addEmail" />
				</div>
			</div>

			<Button class="w-full gap-2" text @click="state.settings.shareMode = 'code'">
				<RadioButton v-model="state.settings.shareMode" inputId="ingredient2" name="shareMode" value="code" />
				Access code
			</Button>
			<div class="ml-5 option-body" :class="{ open: state.settings.shareMode === 'code' }">
				Share this code to let people view this gallery:
				<div class="flex align-items-center gap-2">
					<h1>{{ state.settings.shareCode }}</h1>
					<div>
						<i class="button pi pi-copy" @click="copyCode"></i>
						<i class="button pi pi-replay" @click="state.settings.shareCode = generateCode()"></i>
					</div>
				</div>
			</div>

			<Button class="w-full gap-2" text @click="state.settings.shareMode = 'public'">
				<RadioButton v-model="state.settings.shareMode" inputId="ingredient3" name="shareMode" value="public" />
				Public
			</Button>
			<div class="ml-5 option-body" :class="{ open: state.settings.shareMode === 'public' }">
				Anyone with the link can view this gallery
			</div>

		</div>

		<div class="flex align-items-center gap-2 mt-3">
			<Button text class="gap-2" icon="pi pi-link" label="Copy link" @click="copyLink"></Button>
			<div class="flex-grow-1"></div>
			<Button text label="Cancel" @click="$emit('close')" />
			<Button label="Save" class="gap-2" :loading="state.isSaving" @click="save" />
		</div>
	</div>
</template>

<style scoped lang="scss">
.share-modal {
	width: 500px;
}
.modal-body {
	max-height: 60vh;
	overflow-x: hidden;
	overflow-y: auto;
}
.option-body {
	max-height: 0px;
	padding: 0;
	overflow: hidden;

	&.open {
		max-height: 60vh;
		padding: .5em 1em 2em;
	}
}

i.button {
	cursor: pointer;
	padding: .25em;

	&:hover {
		background-color: #eee;
		border-radius: .25em;
	}
}
</style>