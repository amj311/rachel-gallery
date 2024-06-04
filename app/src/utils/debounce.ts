export default function debounce(func: (...args: any[]) => void, wait: number, beforeDebounce?: (...args: any[]) => any) {
	let timeout: ReturnType<typeof setTimeout> | null = null

	return (...args: any[]) => {
		let ignore;
		let cancel;
	
		if (beforeDebounce) {
			const flags = beforeDebounce(...args) || {};
			({cancel, ignore} = flags);
		}

		// If ignore, don't reset the debounce
		if (ignore) {
			return;
		}

		if (timeout) {
			clearTimeout(timeout);
		}

		// if cancel, don't run the final function
		if (!cancel) timeout = setTimeout(func, wait);
	};
}
