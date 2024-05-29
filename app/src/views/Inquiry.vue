<script setup lang="ts">
import NavBar from '@/components/NavBar.vue';
import UserMenu from '@/components/UserMenu.vue';
import { useUserStore } from '@/stores/user.store';
import Calendar from 'primevue/calendar';
import Editor from 'primevue/editor';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import { computed, reactive } from 'vue';
import { RouterLink, RouterView } from 'vue-router';

const userStore = useUserStore();

const inquiry = reactive({
	name: '',
	email: '',
	phone: '',
	message: '',
    occasion: '',
    location: '',
    date: null,
    peopleQty: null,
});

</script>

<template>
	<div>
		<h1>Let's capture your special moments together!</h1>

		<div class="flex flex-column gap-3">
			<div>
				<h3>Tell me about yourself</h3>
				<div class="row-grid">
					<div><label>Name</label></div>
					<div><InputText v-model="inquiry.name" placeholder="Name" /></div>

					<div><label>Email</label></div>
					<div><InputText v-model="inquiry.email" placeholder="Email" /></div>

					<div><label>Phone</label></div>
					<div><InputText v-model="inquiry.phone" placeholder="Phone" /></div>
				</div>
			</div>

			<div>
				<h3>How can I help?</h3>
				<div>
					<Editor v-model="inquiry.message">
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
				<div class="flex flex-wrap gap-5">
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
		</div>
	</div>
</template>

<style scoped>
h1 {
	font-family: 'serif';
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
		min-width: 8em;
		min-height: 2.5em;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
}

:deep(strong) {
	font-weight: bold;
}
</style>