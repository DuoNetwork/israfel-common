import * as CST from './constants';
import Util from './Util';

test('isNumber() return true for numbers', () => {
	expect(Util.isNumber(5)).toBe(true);
	expect(Util.isNumber(5.0)).toBe(true);
});

test('isNumber() return true for empty string and null', () => {
	expect(Util.isNumber('')).toBe(true);
	expect(Util.isNumber(null)).toBe(true);
});

test('isNumber() return true for number strings', () => {
	expect(Util.isNumber('5')).toBe(true);
	expect(Util.isNumber('5.0')).toBe(true);
});

test('isNumber() return false for other strings', () => {
	expect(Util.isNumber('5.0s')).toBe(false);
	expect(Util.isNumber('test')).toBe(false);
	expect(Util.isNumber('NaN')).toBe(false);
});

test('isNumber() return false for undefined, infinity, NaN', () => {
	expect(Util.isNumber(undefined)).toBe(false);
	expect(Util.isNumber(Infinity)).toBe(false);
	expect(Util.isNumber(NaN)).toBe(false);
});

test('{}, null, undefined is empty', () => {
	expect(Util.isEmptyObject({})).toBe(true);
	expect(Util.isEmptyObject(null)).toBe(true);
	expect(Util.isEmptyObject(undefined)).toBe(true);
});

test('{test: true} is not empty', () => {
	expect(Util.isEmptyObject({ test: true })).toBe(false);
});

test('round', () => {
	expect(Util.round('12345')).toMatchSnapshot();
	expect(Util.round('12345.000')).toMatchSnapshot();
	expect(Util.round('12345.1234567')).toMatchSnapshot();
	expect(Util.round('12345.123456789')).toMatchSnapshot();
	expect(Util.round('0.123456789123456789')).toMatchSnapshot();
	expect(Util.round('12345.123456789123456789')).toMatchSnapshot();
});

test('safeWsSend', () => {
	const ws = {
		send: jest.fn()
	};
	expect(Util.safeWsSend(ws as any, 'message')).toBeTruthy();
	ws.send = jest.fn(() => {
		throw new Error('error');
	});
	expect(Util.safeWsSend(ws as any, 'message')).toBeFalsy();
});

test('getDates', () => {
	Util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	expect(Util.getDates(4, 1, 'days', 'YYYY-MM-DD')).toMatchSnapshot();
});

test('getExpiryTimeStamp', () => {
	Util.getUTCNowTimestamp = jest.fn(() => 1544519089000);
	expect(Util.getExpiryTimestamp(false)).toBe(1544601600000);
	expect(Util.getExpiryTimestamp(true)).toBe(1545984000000);
	Util.getUTCNowTimestamp = jest.fn(() => 1544493600000);
	expect(Util.getExpiryTimestamp(false)).toBe(1544515200000);
	Util.getUTCNowTimestamp = jest.fn(() => 1556668800000);
	expect(Util.getExpiryTimestamp(true)).toBe(1559289600000);
	Util.getUTCNowTimestamp = jest.fn(() => 1564617600000);
	expect(Util.getExpiryTimestamp(true)).toBe(1567152000000);
	Util.getUTCNowTimestamp = jest.fn(() => 1546041600000);
	expect(Util.getExpiryTimestamp(true)).toBe(1548403200000);
	Util.getUTCNowTimestamp = jest.fn(() => 1546214400000);
	expect(Util.getExpiryTimestamp(true)).toBe(1548403200000);
});

test('sleep', async () => {
	global.setTimeout = jest.fn(resolve => resolve()) as any;
	await Util.sleep(1);
	expect((global.setTimeout as jest.Mock).mock.calls).toMatchSnapshot();
});

test('formatFixedNumber', () => {
	expect(Util.formatFixedNumber(123.456789, 0)).toBe('123.456789');
	expect(Util.formatFixedNumber(123.456789, 0.5)).toBe('123.5');
});

test('log debug', () => {
	Util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	console.log = jest.fn();

	Util.logLevel = CST.LOG_DEBUG;
	Util.logError('error');
	Util.logInfo('info');
	Util.logDebug('debug');
	expect((console.log as jest.Mock).mock.calls).toMatchSnapshot();
});

test('log info', () => {
	Util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	console.log = jest.fn();

	Util.logLevel = CST.LOG_INFO;
	Util.logError('error');
	Util.logInfo('info');
	Util.logDebug('debug');
	expect((console.log as jest.Mock).mock.calls).toMatchSnapshot();
});

test('log error', () => {
	Util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	console.log = jest.fn();

	Util.logLevel = CST.LOG_ERROR;
	Util.logError('error');
	Util.logInfo('info');
	Util.logDebug('debug');
	expect((console.log as jest.Mock).mock.calls).toMatchSnapshot();
});
