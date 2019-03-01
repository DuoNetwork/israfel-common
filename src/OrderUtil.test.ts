// fix for @ledgerhq/hw-transport-u2f 4.28.0
import '@babel/polyfill';
import * as CST from './constants';
import OrderUtil from './OrderUtil';
import Util from './Util';
import Web3Util from './Web3Util';

test('isExpired', () => {
	Util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	expect(OrderUtil.isExpired(1234567890 + 180001)).toBeFalsy();
	expect(OrderUtil.isExpired(1234567890 + 180000)).toBeTruthy();
	expect(OrderUtil.isExpired(1234567890 + 179999)).toBeTruthy();
});

const signedOrder = {
	senderAddress: 'senderAddress',
	makerAddress: 'makerAddress',
	takerAddress: 'takerAddress',
	makerFee: '0',
	takerFee: '0',
	makerAssetAmount: '123000000000000000000',
	takerAssetAmount: '456000000000000000000',
	makerAssetData: 'makerAssetData',
	takerAssetData: 'takerAssetData',
	salt: '789',
	exchangeAddress: 'exchangeAddress',
	feeRecipientAddress: 'feeRecipientAddress',
	expirationTimeSeconds: '1234567890',
	signature: 'signature'
};

test('parseSignedOrder', () => expect(OrderUtil.parseSignedOrder(signedOrder)).toMatchSnapshot());

test('constructNewLiveOrder bid', () => {
	Util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	Web3Util.getSideFromSignedOrder = jest.fn(() => CST.DB_BID);
	const liveOrder = OrderUtil.constructNewLiveOrder(
		signedOrder,
		{
			custodian: 'custodian',
			address: 'takerAddress',
			code: 'takerCode',
			denomination: 1,
			precisions: {
				makerCode: 0.000005
			},
			feeSchedules: {
				makerCode: {
					rate: 0,
					minimum: 1
				}
			}
		},
		'takerCode|makerCode',
		'0xOrderHash'
	);
	const userOrder = OrderUtil.constructUserOrder(
		liveOrder,
		'type',
		'status',
		'updatedBy',
		true,
		'txHash'
	);
	expect(liveOrder).toMatchSnapshot();
	expect(userOrder).toMatchSnapshot();
});

test('constructNewLiveOrder ask', () => {
	Util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	Web3Util.getSideFromSignedOrder = jest.fn(() => CST.DB_ASK);
	const liveOrder = OrderUtil.constructNewLiveOrder(
		signedOrder,
		{
			custodian: 'custodian',
			address: 'makerAddress',
			code: 'makerCode',
			denomination: 1,
			precisions: {
				takerCode: 0.000005
			},
			feeSchedules: {
				takerCode: {
					rate: 0,
					minimum: 1
				}
			}
		},
		'makerCode|takerCode',
		'0xOrderHash'
	);
	const userOrder = OrderUtil.constructUserOrder(
		liveOrder,
		'type',
		'status',
		'updatedBy',
		true,
		'txHash'
	);
	expect(liveOrder).toMatchSnapshot();
	expect(userOrder).toMatchSnapshot();
});

test('getPriceBeforeFee bid flat', () => {
	expect(
		OrderUtil.getPriceBeforeFee(
			123,
			456,
			{
				rate: 0,
				minimum: 1
			},
			true
		)
	).toMatchSnapshot();
});

test('getPriceBeforeFee ask flat', () => {
	expect(
		OrderUtil.getPriceBeforeFee(
			123,
			456,
			{
				rate: 0,
				minimum: 1
			},
			false
		)
	).toMatchSnapshot();
});

test('getPriceBeforeFee bid ratio', () => {
	expect(
		OrderUtil.getPriceBeforeFee(
			123,
			456,
			{
				rate: 0.01,
				minimum: 1
			},
			true
		)
	).toMatchSnapshot();
});

test('getPriceBeforeFee ask ratio', () => {
	expect(
		OrderUtil.getPriceBeforeFee(
			123,
			456,
			{
				rate: 0.01,
				minimum: 1
			},
			false
		)
	).toMatchSnapshot();
});

test('getPriceBeforeFee bid base flat', () => {
	expect(
		OrderUtil.getPriceBeforeFee(
			123,
			456,
			{
				asset: 'asset',
				rate: 0,
				minimum: 1
			},
			true
		)
	).toMatchSnapshot();
});

test('getPriceBeforeFee ask base flat', () => {
	expect(
		OrderUtil.getPriceBeforeFee(
			123,
			456,
			{
				asset: 'asset',
				rate: 0,
				minimum: 1
			},
			false
		)
	).toMatchSnapshot();
});

test('getPriceBeforeFee bid base ratio', () => {
	expect(
		OrderUtil.getPriceBeforeFee(
			123,
			456,
			{
				asset: 'asset',
				rate: 0.01,
				minimum: 1
			},
			true
		)
	).toMatchSnapshot();
});

test('getPriceBeforeFee ask base ratio', () => {
	expect(
		OrderUtil.getPriceBeforeFee(
			123,
			456,
			{
				asset: 'asset',
				rate: 0.01,
				minimum: 1
			},
			false
		)
	).toMatchSnapshot();
});

test('getAmountAfterFee bid flat', () => {
	expect(
		OrderUtil.getAmountAfterFee(
			100,
			0.01,
			{
				rate: 0,
				minimum: 1
			},
			true
		)
	).toMatchSnapshot();
});

test('getAmountAfterFee bid ratio', () => {
	expect(
		OrderUtil.getAmountAfterFee(
			100,
			0.01,
			{
				rate: 0.01,
				minimum: 1
			},
			true
		)
	).toMatchSnapshot();
});

test('getAmountAfterFee ask flat', () => {
	expect(
		OrderUtil.getAmountAfterFee(
			100,
			0.01,
			{
				rate: 0,
				minimum: 1
			},
			false
		)
	).toMatchSnapshot();
});

test('getAmountAfterFee ask ratio', () => {
	expect(
		OrderUtil.getAmountAfterFee(
			100,
			0.01,
			{
				rate: 0.01,
				minimum: 1
			},
			false
		)
	).toMatchSnapshot();
});

test('getAmountAfterFee bid base flat', () => {
	expect(
		OrderUtil.getAmountAfterFee(
			100,
			0.01,
			{
				asset: 'asset',
				rate: 0,
				minimum: 0.01
			},
			true
		)
	).toMatchSnapshot();
});

test('getAmountAfterFee bid base ratio', () => {
	expect(
		OrderUtil.getAmountAfterFee(
			150,
			0.01,
			{
				asset: 'asset',
				rate: 0.01,
				minimum: 0.01
			},
			true
		)
	).toMatchSnapshot();
});

test('getAmountAfterFee ask base flat', () => {
	expect(
		OrderUtil.getAmountAfterFee(
			150,
			0.01,
			{
				asset: 'asset',
				rate: 0,
				minimum: 0.01
			},
			false
		)
	).toMatchSnapshot();
});

test('getAmountAfterFee ask base ratio', () => {
	expect(
		OrderUtil.getAmountAfterFee(
			150,
			0.01,
			{
				asset: 'asset',
				rate: 0.01,
				minimum: 0.01
			},
			false
		)
	).toMatchSnapshot();
});

test('validateOrder passed token maturity', async () => {
	Util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	expect(
		await OrderUtil.validateOrder(
			{} as any,
			'code1|code2',
			{
				maturity: 1234567890 + 180000
			} as any,
			{} as any
		)
	).toBe(CST.WS_MATURED_TOKEN);
});

test('validateOrder passed order expiry', async () => {
	Util.getUTCNowTimestamp = jest.fn(() => 1234567890000 - 180000);
	expect(await OrderUtil.validateOrder({} as any, 'code1|code2', {} as any, signedOrder)).toBe(
		CST.WS_INVALID_EXP
	);
});

test('validateOrder invalid 0x order', async () => {
	Util.getUTCNowTimestamp = jest.fn(() => 123456789);
	const validateOrder = jest.fn(() => Promise.resolve(''));
	// getExpiryTimestamp
	expect(
		await OrderUtil.validateOrder(
			{
				validateOrder: validateOrder
			} as any,
			'code1|code2',
			{} as any,
			signedOrder
		)
	).toBe(CST.WS_INVALID_ORDER);
	expect(validateOrder).toBeCalled();
});

test('validateOrder invalid amount', async () => {
	Util.getUTCNowTimestamp = jest.fn(() => 123456789);
	const validateOrder = jest.fn(() => Promise.resolve('0xOrderHash'));
	OrderUtil.constructNewLiveOrder = jest.fn(
		() =>
			({
				amount: 1.1
			} as any)
	);
	expect(
		await OrderUtil.validateOrder(
			{
				validateOrder: validateOrder
			} as any,
			'code1|code2',
			{
				denomination: 1
			} as any,
			signedOrder
		)
	).toBe(CST.WS_INVALID_AMT);
	expect(
		await OrderUtil.validateOrder(
			{
				validateOrder: validateOrder
			} as any,
			'code1|code2',
			{
				denomination: 2.2
			} as any,
			signedOrder
		)
	).toBe(CST.WS_INVALID_AMT);
	expect(validateOrder).toBeCalled();
	expect(OrderUtil.constructNewLiveOrder as jest.Mock).toBeCalled();
});

test('validateOrder invalid price', async () => {
	Util.getUTCNowTimestamp = jest.fn(() => 123456789);
	const validateOrder = jest.fn(() => Promise.resolve('0xOrderHash'));
	OrderUtil.constructNewLiveOrder = jest.fn(
		() =>
			({
				amount: 1,
				price: 0.00055
			} as any)
	);
	expect(
		await OrderUtil.validateOrder(
			{
				validateOrder: validateOrder
			} as any,
			'code1|code2',
			{
				denomination: 1,
				precisions: {
					code2: 0.0005
				}
			} as any,
			signedOrder
		)
	).toBe(CST.WS_INVALID_PX);
	expect(
		await OrderUtil.validateOrder(
			{
				validateOrder: validateOrder
			} as any,
			'code1|code2',
			{
				denomination: 1,
				precisions: {
					code2: 0.001
				}
			} as any,
			signedOrder
		)
	).toBe(CST.WS_INVALID_PX);
	expect(validateOrder).toBeCalled();
	expect(OrderUtil.constructNewLiveOrder as jest.Mock).toBeCalled();
});

test('validateOrder invalid expiry', async () => {
	Util.getUTCNowTimestamp = jest.fn(() => 123456789);
	const validateOrder = jest.fn(() => Promise.resolve('0xOrderHash'));
	OrderUtil.constructNewLiveOrder = jest.fn(
		() =>
			({
				amount: 10,
				price: 0.005
			} as any)
	);
	expect(
		await OrderUtil.validateOrder(
			{
				validateOrder: validateOrder
			} as any,
			'code1|code2',
			{
				denomination: 1,
				precisions: {
					code2: 0.0005
				}
			} as any,
			signedOrder
		)
	).toBe(CST.WS_INVALID_EXP);
	expect(validateOrder).toBeCalled();
	expect(OrderUtil.constructNewLiveOrder as jest.Mock).toBeCalled();
});

test('validateOrder', async () => {
	Util.getUTCNowTimestamp = jest.fn(() => 123456789);
	const validateOrder = jest.fn(() => Promise.resolve('0xOrderHash'));
	Util.getExpiryTimestamp = jest.fn(() => 133456789);
	signedOrder.expirationTimeSeconds = Math.ceil(133456789 / 1000) + '';
	OrderUtil.constructNewLiveOrder = jest.fn(
		() =>
			({
				amount: 10.0,
				price: 0.005
			} as any)
	);
	expect(
		await OrderUtil.validateOrder(
			{
				validateOrder: validateOrder
			} as any,
			'code1|code2',
			{
				denomination: 1,
				precisions: {
					code2: 0.0005
				}
			} as any,
			signedOrder
		)
	).toBe('0xOrderHash');
	expect(validateOrder).toBeCalled();
	expect(OrderUtil.constructNewLiveOrder as jest.Mock).toBeCalled();
});
