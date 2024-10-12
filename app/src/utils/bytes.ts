export const bytesToGB = (bytes: number) => {
	return bytes / 1024 / 1024 / 1024;
}
export const bytesToMB = (bytes: number) => {
	return bytes / 1024 / 1024;
}
export const formatBytes = (bytes) => {
	let number = Number(bytes);
	let unit = 'MB';
	number = bytesToMB(number);
	if (number > 1999) {
		number = bytesToGB(bytes);
		unit = 'GB';
	}
	return number.toFixed(number % 1 === 0 ? 0 : 1) + unit;
};
