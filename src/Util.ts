import moment, { DurationInputArg2 } from 'moment';
import WebSocket from 'ws';
import * as CST from './constants';

export class Util {
	public static logLevel: string = CST.LOG_INFO;

	public static logInfo(text: any): void {
		this.log(text, CST.LOG_INFO);
	}

	public static logDebug(text: any): void {
		this.log(text, CST.LOG_DEBUG);
	}

	public static logError(text: any): void {
		this.log(text, CST.LOG_ERROR);
	}

	private static log(text: any, level: string) {
		if (CST.LOG_RANKING[this.logLevel] >= CST.LOG_RANKING[level])
			console.log(
				`${moment.utc(Util.getUTCNowTimestamp()).format('DD HH:mm:ss.SSS')} [${level}]: ` +
					text
			);
	}

	public static isNumber(input: any): boolean {
		const num = Number(input);
		return isFinite(num) && !isNaN(num);
	}

	public static isEmptyObject(obj: object | undefined | null): boolean {
		if (!obj) return true;

		for (const prop in obj) if (obj.hasOwnProperty(prop)) return false;

		return true;
	}

	public static getUTCNowTimestamp() {
		return moment().valueOf();
	}

	public static round(num: string | number) {
		return +(Math.round((num + 'e+8') as any) + 'e-8');
	}

	public static safeWsSend(ws: WebSocket, message: string) {
		try {
			ws.send(message);
			return true;
		} catch (error) {
			this.logError(error);
			return false;
		}
	}

	public static sleep(ms: number) {
		return new Promise(resolve => {
			global.setTimeout(resolve, ms);
		});
	}

	public static clone(obj: object) {
		return JSON.parse(JSON.stringify(obj));
	}

	public static getDates(
		length: number,
		step: number,
		stepSize: DurationInputArg2,
		format: string
	) {
		const dates: string[] = [];
		const date = moment.utc(this.getUTCNowTimestamp());
		for (let i = 0; i < length; i++) {
			dates.push(date.format(format));
			date.subtract(step, stepSize);
		}
		dates.sort((a, b) => a.localeCompare(b));

		return dates;
	}

	public static getWeekExpiry(timestamp: number) {
		const dateObj = moment.utc(timestamp).startOf('day');
		const day = dateObj.day();
		if (day === 6) dateObj.add(6, 'day');
		else dateObj.add(5 - day, 'day');

		dateObj.add(8, 'hour');

		return dateObj.valueOf();
	}

	public static getDayExpiry(timestamp: number) {
		const dateObj = moment.utc(timestamp).startOf('day');
		dateObj.add(8, 'hour');

		return dateObj.valueOf();
	}

	public static getExpiryTimestamp(isWeek: boolean) {
		const now = this.getUTCNowTimestamp();
		if (isWeek) {
			const thisWeekExpiry = this.getWeekExpiry(now);
			if (now > thisWeekExpiry - 4 * 3600000) return thisWeekExpiry + 7 * 86400000;
			return thisWeekExpiry;
		} else {
			const todayExpiry = this.getDayExpiry(now);
			if (now > todayExpiry - 4 * 3600000) return todayExpiry + 24 * 3600000;
			return todayExpiry;
		}
	}

	public static formatFixedNumber(num: number, precision: number) {
		const decimal = precision && precision < 1 ? (precision + '').length - 2 : 0;
		const roundedNumber = Math.round(num / precision) * precision;
		return precision ? roundedNumber.toFixed(decimal) : num + '';
	}
}

export default Util;
