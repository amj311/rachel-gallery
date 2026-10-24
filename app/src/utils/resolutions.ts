/**
 * Resolutions by shortest edge with descriptions.
 * Shortest edge chosen to guarantee at least that much.
 */

export enum RESOLUTION {
	'x800' = 800,
	'x1200' = 1200,
	'x2400' = 2400,
	'x3600' = 3600,
	'x9000' = 9000,
}

export const Resolutions = {
	[RESOLUTION.x800]: {
		bestFor: 'web and social media',
	},
	[RESOLUTION.x1200]: {
		bestFor: 'device wallpapers and prints up to 4x12',
	},
	[RESOLUTION.x2400]: {
		bestFor: 'prints up to 8x24',
	},
	[RESOLUTION.x3600]: {
		bestFor: 'prints up to 12x36',
	},
	[RESOLUTION.x9000]: {
		bestFor: 'prints up to 30x45',
	},
} as const;