/**
 * Resolutions by shortest edge with descriptions.
 * Shortest edge chosen to guarantee at least that much.
 */

export enum RESOLUTION {
	'x1024' = 1024,
	'x2400' = 2400,
	'x4800' = 4800,
	'x9000' = 9000,
}

export const Resolutions = {
	[RESOLUTION.x1024]: {
		size: RESOLUTION.x1024,
		bestFor: 'web and social media',
	},
	[RESOLUTION.x2400]: {
		size: RESOLUTION.x2400,
		bestFor: 'album printing up to 8x12',
	},
	[RESOLUTION.x4800]: {
		size: RESOLUTION.x4800,
		bestFor: 'medium canvas prints up to 16x24',
	},
	[RESOLUTION.x9000]: {
		size: RESOLUTION.x9000,
		bestFor: 'large canvas prints up to 30x40',
	},
} as const;