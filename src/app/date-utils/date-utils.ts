export function datesLessEquals(date1: Date, date2: Date) {
	return date1 < date2 || datesEquals(date1, date2);
}

export function datesEquals(date1: Date, date2: Date): boolean {
	const firstDate = structuredClone(date1);
	const secondDate = structuredClone(date2);
	firstDate.setHours(0, 0, 0, 0);
	secondDate.setHours(0, 0, 0, 0);
	return firstDate.getTime() === secondDate.getTime();
}

export function compareTime(date1: Date, date2: Date) {
	const firstDate = structuredClone(date1);
	const secondDate = structuredClone(date1);
	secondDate.setHours(date2.getHours(), date2.getMinutes(), date2.getSeconds(), date2.getMilliseconds());
	return firstDate.getTime() - secondDate.getTime();
}

export function timeGreater(date1: Date, date2: Date): boolean {
	return compareTime(date1, date2) > 0;
}
