type RoundRobinOptions<T, R> = {
	maxRunners?: number,
	breakOnRowError?: boolean,
	onProgress?: (progress: RoundRobinProgress<T, R>) => void | boolean,
}

type RoundRobinProgress<T, R> = {
	total: number,
	completed: number,
	latest: RoundRobinRowResult<T, R>,
}

type RoundRobinRowResult<T, R> = {
	success: boolean,
	result?: R,
	row: T,
	error?: any,
}

export default async function roundRobinAsync<T = any, R = any>(rows: T[], action: (row: T) => Promise<R>, options?: RoundRobinOptions<T, R>): Promise<RoundRobinRowResult<T, R>[]> {
	return new Promise((resolve, reject) => {
		const maxRunners = Math.min(options?.maxRunners || 10, rows.length);
		const runners = new Map<number, boolean>();

		let fatalError: any;
		let completed = 0;

		// Preserve row order
		const rowsToDo = rows.map((row, i) => ({ row, i }));
		const results: RoundRobinRowResult<T, R>[] = rows.map((row) => ({
			success: false,
			row,
			result: undefined,
			error: undefined,
		}));

		// Create the runners
		for (let i = 0; i < maxRunners; i++) {
			runners.set(i, false);
		}

		// Kickoff the runners
		for (const id of runners.keys()) {
			try {
				doRunner(id).catch(err => { throw err; });
			} catch (err) {
				fatalError = err;
				reject(err);
				break;
			}
		}

		async function doRunner(id) {
			// Run
			while (rowsToDo.length > 0 && !fatalError) {
				const { row, i } = rowsToDo.shift()!;
				let rowResult;
				let error;
				try {
					rowResult = await action(row);
				} catch (err) {
					error = err;
					if (options?.breakOnRowError) {
						fatalError = err;
					}
				}
				const result = {
					success: !error,
					row,
					result: rowResult,
					error,
				};
				results[i] = result;
				completed++;

				if (options?.onProgress) {
					const shouldExit = options.onProgress({
						total: rows.length,
						completed,
						latest: result,
					});
					if (shouldExit) {
						fatalError = new Error('Exit was requested by onProgress callback');
					}
				}
			}

			// Report completion
			runners.set(id, true);
			checkCompletion();
		}


		async function checkCompletion() {
			const notFinished = Array.from(runners.values()).some(finished => !finished);
			if (!notFinished) {
				if (fatalError) {
					reject(fatalError);
				} else {
					resolve(results);
				}
			}
		}
	});
}