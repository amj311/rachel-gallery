<script setup lang="ts">
import { defineComponent, onMounted, reactive, watch } from 'vue';
import TextColumn from './TextColumn.vue';
import { computed } from 'vue';
import { useAppStore } from '@/stores/app.store';
import PhotoColumn from './PhotoColumn.vue';
import RefOpener from '@/components/RefOpener.vue';
import OverlayPanel from 'primevue/overlaypanel';
import Button from 'primevue/button';

const row = defineModel<any>();

const props = defineProps<{
	editMode?: boolean,
	// maxColumns: number,
	canAddColumns?: Array<any>,
	photoManager: any;
}>();

const state = reactive({
	isSkinny: false,
	draggingEl: null as any,
	draggingColLeft: null as any,
	draggingColRight: null as any,
	columnRefs: {} as any,
});

onMounted(() => {
	computeSkinny();
})
watch(computed(() => useAppStore().emulateWindowResize), () => {
	computeSkinny();
})

function computeSkinny() {
	const gridEl = document.getElementById(GRID_ID)!;
	state.isSkinny = gridEl!.clientWidth < 600;
}


const GRID_ID = 'grid_' + Math.random().toString(36).substring(7);
const GRID_COLS = 12;
const MAX_COLS = 3;

const columns = {
	text: {
		type: 'text',
		label: 'Text',
		icon: 'pi pi-align-left',
		component: TextColumn,
	},
	'photo-frame': {
		type: 'photo-frame',
		label: 'Photo Frame',
		icon: 'pi pi-image',
		component: PhotoColumn,
	},
};

const AddColButton = defineComponent({
	name: 'AddColButton',
	props: ['options'],
	data: () => ({
		columns,
	}),
	template: /*html*/`
		<div class="add-col-button">
			<div v-for="(opt, i) in options" class="add-col-option flex align-items-center cursor-pointer" :key="i" @click="$emit('selected', opt)">
				<i :class="columns[opt].icon" />&nbsp;&nbsp;{{ columns[opt].label }}
			</div>
		</div>
	`,
})

function addColumn(option: string, position: 'left' | 'right') {
	let adjacentCol;
	if (position === 'left') {
		adjacentCol = row.value.columns[0];
	} else {
		adjacentCol = row.value.columns[row.value.columns.length - 1];
	}

	if (!adjacentCol.span) {
		adjacentCol.span = GRID_COLS;
	}

	const newCol = {
		id: Math.random().toString(36).substring(7),
		type: option,
		span: Math.floor(adjacentCol.span / 2),
	};

	adjacentCol.span = adjacentCol.span - newCol.span;

	if (position === 'left') {
		row.value.columns.unshift(newCol);
	} else {
		row.value.columns.push(newCol);
	}
}

function removeColumn(col: any) {
	let colIdx = row.value.columns.indexOf(col);
	let adjacentCol = row.value.columns[colIdx + 1] || row.value.columns[colIdx - 1];
	if (adjacentCol) {
		adjacentCol.span = adjacentCol.span + col.span;
	}
	row.value.columns.splice(colIdx, 1);
}

const gridGap = '2rem';

function setupDragEvents(event, colLeft, colRight) {
	event.stopPropagation();
	event.preventDefault();
	state.draggingEl = event.target;
	const gridEl = document.getElementById(GRID_ID)!;
	gridEl.classList.add('dragging');
	state.draggingEl.classList.add('dragging');
	state.draggingColLeft = colLeft;
	state.draggingColRight = colRight;
	window.addEventListener('mousemove', onDrag);
	window.addEventListener('mouseup', clearDragEvents);
}
function clearDragEvents(event) {
	event.stopPropagation();
	event.preventDefault();
	window.removeEventListener('mousemove', onDrag);
	window.removeEventListener('mouseup', clearDragEvents);
	const gridEl = document.getElementById(GRID_ID)!;
	gridEl.classList.remove('dragging');
	state.draggingEl.classList.remove('dragging');
	state.draggingEl = null;
	state.draggingColLeft = null;
	state.draggingColRight = null;
}
function onDrag(event) {
	event.stopPropagation();
	event.preventDefault();

	const gridEl = document.getElementById(GRID_ID);
	const delta = event.clientX - state.draggingEl.parentNode.getBoundingClientRect().left;
	const dragThreshold = (gridEl!.getBoundingClientRect().width / GRID_COLS);

	if (delta > dragThreshold) {
		adjustColSpan(1);
	}
	if (delta < -dragThreshold) {
		adjustColSpan(-1);
	}
}
function adjustColSpan(delta) {
	const minCols = 2;
	if (delta < 0 && state.draggingColLeft.span + delta < minCols) return;
	if (delta > 0 && state.draggingColRight.span - delta < minCols) return;
	state.draggingColLeft.span += delta;
	state.draggingColRight.span -= delta;
}
</script>

<template>
	<div class="text-row">
		<div v-if="editMode && props.canAddColumns?.length && row.columns.length < MAX_COLS" class="add-col left">
			<RefOpener closeOnClick :component="OverlayPanel">
				<template #trigger><Button text size="small"><template #icon><span class="material-symbols-outlined">add_column_left</span></template></Button></template>
				<template #ref><AddColButton :options="props.canAddColumns" @selected="(option) => addColumn(option, 'left')" /></template>
			</RefOpener>
		</div>

		<div :id="GRID_ID" class="col-grid" :class="{ 'skinny': state.isSkinny }" :style="{ 'grid-gap': gridGap }">
			<div v-for="(col, i) in row.columns" class="col-cell" :key="col.id" :style="{ 'grid-column': `span ${col.span || GRID_COLS}` }">
				<div v-if="i > 0 && editMode && !state.isSkinny" class="col-adjuster" :style="{ 'width': `${gridGap}` }" @mousedown="(event) => setupDragEvents(event, row.columns[i - 1], col)">
					<div class="col-adjuster-border"></div>
					<div class="col-adjuster-handle"><i class="pi pi-ellipsis-v text-xs pointer-events-none" /></div>
				</div>
				<div class="col-content">
					<component :ref="(el) => state.columnRefs[col.id] = el" :is="columns[col.type].component" v-model="row.columns[i]" :editMode="props.editMode" :photoManager="props.photoManager" @remove="() => removeColumn(col)" />
				</div>
			</div>
		</div>

		<div v-if="editMode && props.canAddColumns?.length && row.columns.length < MAX_COLS" class="add-col right">
			<RefOpener closeOnClick :component="OverlayPanel">
				<template #trigger><Button text size="small"><template #icon><span class="material-symbols-outlined">add_column_right</span></template></Button></template>
				<template #ref><AddColButton :options="props.canAddColumns" @selected="(option) => addColumn(option, 'right')" /></template>
			</RefOpener>
		</div>
	</div>
</template>

<style scoped lang="scss">

.text-row {
	display: flex;
	flex-direction: row;
}

.add-col {
    display: flex;
    align-items: center;
    opacity: 0;
	transition: 300ms ease;
	width: 3rem;
	justify-content: center;

	&.left {
		margin-left: -3rem;
	}
	&.right {
		margin-right: -3rem;
	}

	&:hover {
		width: 5rem;
		opacity: 1;
	}
}

.col-grid {
	display: grid;
	grid-template-columns: repeat(12, 1fr);
	grid-template-rows: auto;
	flex-grow: 1;

	&.skinny {
		display: flex;
		flex-direction: column;

		.col-adjuster {
			display: none !important;
		}
	}

	.col-cell {
		align-content: center;
		position: relative;

		&:hover {
			+ .col-cell .col-adjuster, .col-adjuster {
				display: block;
			}
		}

		.col-content {
			width: 100%;
			height: 100%;
		}

		.col-adjuster {
			position: absolute;
			top: 0;
			bottom: 0;
			left: 0;
			translate: -100% 0;
			display: none;

			.col-adjuster-border {
				position: absolute;
				top: 0;
				bottom: 0;
				left: 50%;
				translate: -50% 0;
				width: 1px;
				background: #dde4ee;
			}

			.col-adjuster-handle {
				position: absolute;
				top: 50%;
				left: 50%;
				translate: -50% -50%;
				padding: 2px;
				background: #fff;
				border: 1px solid #dde4ee;
				border-radius: 5px;
				cursor: ew-resize;
				user-select: none;
			}
		}
	}


	&.dragging {
		cursor: grabbing;

		.col-content {
			pointer-events: none;
		}

		.col-adjuster-handle.dragging {
			background: #f6f8fb !important;
		}
	}
}
</style>