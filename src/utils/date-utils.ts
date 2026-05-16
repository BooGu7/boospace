/** Calendar date in Asia/Ho_Chi_Minh (matches site locale); avoids UTC `toISOString` off-by-one. */
export function formatDateToYYYYMMDD(date: Date): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Ho_Chi_Minh",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
}

export function getCalendarYear(
	date: Date,
	timeZone = "Asia/Ho_Chi_Minh",
): number {
	return Number.parseInt(
		new Intl.DateTimeFormat("en", { timeZone, year: "numeric" }).format(
			date,
		),
		10,
	);
}
