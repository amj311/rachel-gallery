<script setup lang="ts">
import { useUserStore } from '@/stores/user.store';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Editor from 'primevue/editor';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import { computed, reactive, ref } from 'vue';
import request from '@/services/request';
import { useToast } from 'primevue/usetoast';

const userStore = useUserStore();
const toast = useToast();

const inquiry = reactive({
	name: '',
	email: userStore.currentUser?.email || '',
	phone: '',
	message: '',
    occasion: '',
    location: '',
    date: null,
    peopleQty: null,
});

const errors = reactive({
	name: false,
	email: false,
	phone: false,
	message: false,
	occasion: false,
	location: false,
	date: false,
	peopleQty: false,
});

const hasSentInquiry = ref(false);
const isSending = ref(false);

function validate() {
	errors.name = !inquiry.name;
	errors.email = !inquiry.email;
	errors.message = !inquiry.message;
}

const canSubmit = computed(() => {
	return !errors.name && !errors.email && !errors.message;
})

async function sendInquiry() {
	try {
		validate();
		if (!canSubmit.value) return;
		isSending.value = true;
		await request.post('inquiry', inquiry);
		hasSentInquiry.value = true;
	}
	catch (error) {
		console.error(error);
		toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to send inquiry.', life: 3000 });
	}
	finally {
		isSending.value = false;
	}
}

</script>

<template>
	<div v-if="!hasSentInquiry">
		<h1>Let's capture your special moments together!</h1>

		<div class="flex flex-column gap-3">
			<div>
				<h3>Tell me about yourself</h3>
				<div class="row-grid">
					<div><label>Name *</label></div>
					<div><InputText v-model="inquiry.name" placeholder="Name" :invalid="errors.name" @input="() => errors.name && validate()" /></div>

					<div><label>Email *</label></div>
					<div><InputText v-model="inquiry.email" placeholder="Email" :invalid="errors.email" @input="() => errors.email && validate()" /></div>

					<div><label>Phone</label></div>
					<div><InputText v-model="inquiry.phone" placeholder="Phone" /></div>
				</div>
			</div>

			<div>
				<h3>How can I help?</h3>
				<div>
					<Editor v-model="inquiry.message" editorStyle="min-height: 6rem" :class="{ 'invalid': errors.message }" @text-change="() => errors.message && validate()">
						<template v-slot:toolbar>
							<span class="ql-formats">
								<button class="ql-bold"></button>
								<button class="ql-italic"></button>
								<button class="ql-underline"></button>
							</span>
							<span class="ql-formats">
								<button class="ql-list" value="ordered"></button>
								<button class="ql-list" value="bullet"></button>
							</span>
							<span class="ql-formats">
								<button class="ql-link"></button>
								<button class="ql-image"></button>
							</span>
						</template>
					</Editor>
				</div>
			</div>

			<div>
				<h3>Additional helpful details</h3>
				<div class="flex flex-wrap column-gap-5 row-gap-2">
					<div class="row-grid">
						<label>Date</label>
						<Calendar v-model="inquiry.date" :minDate="new Date()" />
						<label>Number of people</label>
						<InputNumber v-model="inquiry.peopleQty" :min="1" />
					</div>
					<div class="row-grid">
						<label>Occasion</label>
						<InputText v-model="inquiry.occasion" />
						<label>Location</label>
						<InputText v-model="inquiry.location" />
					</div>
				</div>
			</div>
			
			<div class="mt-6">
				<Button label="Send" @click="sendInquiry" :loading="isSending" />
			</div>
		</div>
	</div>
	<div v-else>
		<h1>Thank you!</h1>
	</div>
</template>

<style scoped>
h1 {
	font-family: 'serif';
	font-size: 1.8em;
	margin: 2rem 0 2rem;
}
h3 {
	font-family: 'serif';
	margin: 1em 0;
}

.row-grid {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: .5em 1em;
	align-items: start;

	&> :nth-child(2n - 1) {
		min-width: 8.5em;
		min-height: 2.5em;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
}

:deep(strong) {
	font-weight: bold;
}
:deep(.ql-editor li[data-list="bullet"]::before) {
    content: '\2022';
}

.invalid :deep(.p-editor-content) {
    border: 1px solid #f87171 !important;
}
</style>