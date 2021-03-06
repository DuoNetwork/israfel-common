import { SignedOrder } from '0x.js';
import { IAcceptedPrice, IPrice } from '@finbook/duo-market-data';

export enum Wallet {
	None,
	Local,
	MetaMask,
	Ledger
}

export interface ILiveOrder {
	account: string;
	pair: string;
	orderHash: string;
	price: number;
	amount: number;
	balance: number;
	matching: number;
	fill: number;
	side: string;
	expiry: number;
	createdAt: number;
	updatedAt?: number;
	initialSequence: number;
	currentSequence: number;
	fee: number;
	feeAsset: string;
}

export interface IUserOrder extends ILiveOrder {
	type: string;
	status: string;
	updatedBy: string;
	processed: boolean;
	transactionHash?: string;
}

export interface IRawOrder {
	pair: string;
	orderHash: string;
	signedOrder: IStringSignedOrder | SignedOrder;
	createdAt?: number;
	updatedAt?: number;
}

export interface IStringSignedOrder {
	senderAddress: string;
	makerAddress: string;
	takerAddress: string;
	makerFee: string;
	takerFee: string;
	makerAssetAmount: string;
	takerAssetAmount: string;
	makerAssetData: string;
	takerAssetData: string;
	salt: string;
	exchangeAddress: string;
	feeRecipientAddress: string;
	expirationTimeSeconds: string;
	signature: string;
}

export interface IOrderBook {
	bids: IOrderBookLevel[];
	asks: IOrderBookLevel[];
}

export interface IOrderBookSnapshot {
	version: number;
	pair: string;
	bids: IOrderBookSnapshotLevel[];
	asks: IOrderBookSnapshotLevel[];
}

export interface IOrderBookLevel {
	orderHash: string;
	price: number;
	balance: number;
	initialSequence: number;
}

export interface IOrderBookSnapshotLevel {
	price: number;
	balance: number;
	count: number;
}

export interface IOrderBookLevelUpdate {
	price: number;
	change: number;
	count: number;
	side: string;
}

export interface IOrderBookSnapshotUpdate {
	pair: string;
	updates: IOrderBookLevelUpdate[];
	prevVersion: number;
	version: number;
}

export interface IWsRequest {
	method: string;
	channel: string;
	pair: string;
}

export interface IWsResponse {
	status: string;
	method: string;
	channel: string;
	pair: string;
}

export interface IWsOrderHistoryRequest extends IWsRequest {
	account: string;
}

export interface IWsAddOrderRequest extends IWsRequest {
	orderHash: string;
	order: IStringSignedOrder | SignedOrder;
}

export interface IWsTerminateOrderRequest extends IWsRequest {
	orderHashes: string[];
	signature: string;
}

export interface IWsOrderResponse extends IWsResponse {
	orderHash: string;
}

export interface IWsUserOrderResponse extends IWsOrderResponse {
	userOrder: IUserOrder;
}

export interface IWsTradeResponse extends IWsResponse {
	trades: ITrade[];
}

export interface IWsOrderBookResponse extends IWsResponse {
	orderBookSnapshot: IOrderBookSnapshot;
}

export interface IWsOrderBookUpdateResponse extends IWsResponse {
	orderBookUpdate: IOrderBookSnapshotUpdate;
}

export interface IWsOrderHistoryResponse extends IWsResponse {
	orderHistory: IUserOrder[];
}

export interface IWsInfoResponse extends IWsResponse {
	acceptedPrices: { [custodian: string]: IAcceptedPrice[] };
	exchangePrices: { [source: string]: IPrice[] };
	tokens: IToken[];
	processStatus: IStatus[];
}

export interface IStatus {
	hostname: string;
	updatedAt: number;
	pair: string;
	tool: string;
	count?: number;
}

export interface IToken {
	custodian: string;
	address: string;
	code: string;
	denomination: number;
	precisions: {
		[key: string]: number;
	};
	feeSchedules: {
		[key: string]: IFeeSchedule;
	};
	maturity?: number;
}

export interface IFeeSchedule {
	asset?: string;
	rate: number;
	minimum: number;
}

export interface IAccount {
	address: string;
	privateKey: string;
}

export interface ITrade {
	pair: string;
	transactionHash: string;
	taker: {
		orderHash: string;
		address: string;
		side: string;
		price: number;
		amount: number;
		fee: number;
	};
	maker: {
		orderHash: string;
		price: number;
		amount: number;
		fee: number;
	};
	feeAsset: string;
	timestamp: number;
}
