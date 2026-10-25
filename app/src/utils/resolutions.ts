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
		bestFor: 'small prints, around 8in',
	},
	[RESOLUTION.x4800]: {
		size: RESOLUTION.x4800,
		bestFor: 'medium prints, around 16in',
	},
	[RESOLUTION.x9000]: {
		size: RESOLUTION.x9000,
		bestFor: 'large prints, around 30in',
	},
} as const;