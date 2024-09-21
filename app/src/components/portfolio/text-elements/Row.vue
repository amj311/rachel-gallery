<script setup lang="ts">
import { defineComponent, reactive } from 'vue';
import TextColumn from './TextColumn.vue';

const row = defineModel<any>();

const props = defineProps<{
	editMode?: boolean,
	// maxColumns: number,
	canAddColumns?: Array<any>,
}>();

const state = reactive({
	draggingEl: null as any,
	draggingColLeft: null as any,
	draggingColRight: null as any,
});

const GRID_ID = 'grid_' + Math.random().toString(36).substring(7);
const GRID_COLS = 12;
const MAX_COLS = 3;

const columns = {
	text: {
		type: 'text',
		label: 'Text',
		icon: 'notes',
		component: TextColumn,
	}
}

const AddColButton = defineComponent({
	name: 'AddColButton',
	props: ['options'],
	template: /*html*/`
		<div class="add-col-button">
			<div v-for="(opt, i) in options" class="add-col-option" :key="i" @click="$emit('selected', opt)">{{ opt }}</div>
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
		<div v-if="editMode && props.canAddColumns?.length && row.columns.length < MAX_COLS" class="add-col">
			<AddColButton :options="props.canAddColumns" @selected="(option) => addColumn(option, 'left')" />
		</div>

		<div :id="GRID_ID" class="col-grid" :style="{ 'grid-gap': gridGap }">
			<div v-for="(col, i) in row.columns" class="col-cell" :key="col.id" :style="{ 'grid-column': `span ${col.span || GRID_COLS}` }">
				<div v-if="i > 0 && editMode" class="col-adjuster" :style="{ 'width': `${gridGap}` }" @mousedown="(event) => setupDragEvents(event, row.columns[i - 1], col)">
					<div class="col-adjuster-border"></div>
					<div class="col-adjuster-handle"><i class="pi pi-ellipsis-v text-xs pointer-events-none" /></div>
				</div>
				<div class="col-content"><component :is="columns[col.type].component" v-model="row.columns[i]" :editMode="props.editMode" /></div>
			</div>
		</div>

		<div v-if="editMode && props.canAddColumns?.length && row.columns.length < MAX_COLS" class="add-col">
			<AddColButton :options="props.canAddColumns" @selected="(option) => addColumn(option, 'right')" />
		</div>
	</div>
</template>

<style scoped lang="scss">

.text-row {
	display: flex;
	flex-direction: row;
}

.col-grid {
	display: grid;
	grid-template-columns: repeat(12, 1fr);
	grid-template-rows: auto;
	flex-grow: 1;

	.col-cell {
		align-content: center;
		position: relative;
		grid-column: 12;


		&:hover {
			+ .col-cell .col-adjuster, .col-adjuster {
				display: block;
			}
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