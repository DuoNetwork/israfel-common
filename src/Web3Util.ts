import {
	assetDataUtils,
	BigNumber,
	BlockParamLiteral,
	ContractAddresses,
	ContractWrappers,
	generatePseudoRandomSalt,
	Order,
	orderHashUtils,
	OrderTransactionOpts,
	RPCSubprovider,
	signatureUtils,
	SignedOrder,
	Web3ProviderEngine
} from '0x.js';
import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses';
import { schemas, SchemaValidator } from '@0x/json-schemas';
import { MetamaskSubprovider, MnemonicWalletSubprovider } from '@0x/subproviders';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as CST from './constants';
import { IAccount, IRawOrder, IStringSignedOrder, IToken, Wallet } from './types';
import Util from './Util';

const Web3Eth = require('web3-eth');
const Web3Accounts = require('web3-eth-accounts');
const Web3Personal = require('web3-eth-personal');
const Web3Utils = require('web3-utils');
const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');

export class Web3Util {
	public contractWrappers: ContractWrappers;
	public web3Wrapper: Web3Wrapper;
	public wallet: Wallet = Wallet.None;
	public accountIndex: number = 0;
	public networkId: number = CST.NETWORK_ID_KOVAN;
	public tokens: IToken[] = [];
	public rawMetamaskProvider: any = null;
	private web3Eth: any = null;
	public web3Accounts: any = null;
	public web3Personal: any = null;
	public contractAddresses: ContractAddresses;
	public readonly relayerAddress: string;

	constructor(window: any, providerUrl: string, mnemonic: string, live: boolean) {
		this.networkId = live ? CST.NETWORK_ID_MAIN : CST.NETWORK_ID_KOVAN;
		if (window && (window.ethereum || window.web3)) {
			this.rawMetamaskProvider = window.ethereum || window.web3.currentProvider;
			this.web3Wrapper = new Web3Wrapper(new MetamaskSubprovider(this.rawMetamaskProvider));
			this.web3Personal = new Web3Personal(this.rawMetamaskProvider);
			this.wallet = Wallet.MetaMask;
		} else {
			const pe = new Web3ProviderEngine();
			if (mnemonic) {
				const mnemonicWallet = new MnemonicWalletSubprovider({
					mnemonic: mnemonic,
					baseDerivationPath: CST.BASE_DERIVATION_PATH
				});
				pe.addProvider(mnemonicWallet);
				this.web3Eth = new Web3Eth(providerUrl);
			}
			pe.addProvider(new RPCSubprovider(providerUrl));
			pe.start();
			this.web3Wrapper = new Web3Wrapper(pe);
			this.web3Accounts = new Web3Accounts(this.web3Wrapper.getProvider());
			this.web3Personal = new Web3Personal(this.web3Wrapper.getProvider());
			this.wallet =
				providerUrl === CST.PROVIDER_LOCAL || mnemonic ? Wallet.Local : Wallet.None;
		}

		this.contractWrappers = new ContractWrappers(this.web3Wrapper.getProvider(), {
			networkId: this.networkId
		});

		this.contractAddresses = getContractAddressesForNetworkOrThrow(this.networkId);
		this.relayerAddress = live ? CST.RELAYER_ADDR_MAIN : CST.RELAYER_ADDR_KOVAN;
	}

	public getTokenByCode(code: string) {
		return this.tokens.find(t => t.code === code);
	}

	public getProvider() {
		return this.web3Wrapper.getProvider();
	}

	public getTransactionCount(addr: string) {
		return this.web3Eth.getTransactionCount(addr);
	}

	public getGasPrice() {
		return this.web3Eth.getGasPrice();
	}

	public async getAvailableAddresses(): Promise<string[]> {
		return await this.web3Wrapper.getAvailableAddressesAsync();
	}

	public matchOrders(
		leftOrder: SignedOrder,
		rightOrder: SignedOrder,
		senderAddr: string,
		txOption?: OrderTransactionOpts
	) {
		return this.contractWrappers.exchange.matchOrdersAsync(
			leftOrder,
			rightOrder,
			senderAddr,
			txOption || {}
		);
	}

	public getFilledTakerAssetAmount(orderHash: string) {
		return this.contractWrappers.exchange.getFilledTakerAssetAmountAsync(orderHash, {
			defaultBlock: BlockParamLiteral.Latest
		});
	}

	public web3PersonalSign(account: string, message: string): Promise<string> {
		if (this.wallet === Wallet.None) return Promise.reject('canot sign');
		return this.web3Personal.sign(message, account);
	}

	public web3AccountsRecover(message: string, signature: string): string {
		if (!this.web3Accounts) return '';
		return this.web3Accounts.recover(message, signature);
	}

	public setTokens(tokens: IToken[]) {
		this.tokens = JSON.parse(JSON.stringify(tokens));
	}

	public onWeb3AccountUpdate(onUpdate: (addr: string, network: number) => any) {
		if (this.wallet !== Wallet.MetaMask) return;

		const store = this.rawMetamaskProvider.publicConfigStore;
		if (store)
			store.on('update', () => {
				if (
					this.wallet === Wallet.MetaMask &&
					store.getState().selectedAddress &&
					store.getState().networkVersion
				)
					onUpdate(
						store.getState().selectedAddress,
						Number(store.getState().networkVersion)
					);
			});
	}

	public async getCurrentAddress(): Promise<string> {
		const accounts = await this.web3Wrapper.getAvailableAddressesAsync();
		return accounts[this.accountIndex] || CST.DUMMY_ADDR;
	}

	public getCurrentNetwork(): Promise<number> {
		return this.web3Wrapper.getNetworkIdAsync();
	}

	public static createRawOrderWithoutSalt(
		userAddr: string,
		relayerAddr: string,
		makerAssetAddr: string,
		takerAssetAddr: string,
		makerAmt: BigNumber,
		takerAmt: BigNumber,
		expInSeconds: number,
		exchangeAddr: string
	): Order {
		return {
			senderAddress: CST.DUMMY_ADDR,
			makerAddress: userAddr.toLowerCase(),
			takerAddress: CST.DUMMY_ADDR,
			makerFee: new BigNumber(0),
			takerFee: new BigNumber(0),
			makerAssetAmount: Web3Wrapper.toBaseUnitAmount(makerAmt, 18),
			takerAssetAmount: Web3Wrapper.toBaseUnitAmount(takerAmt, 18),
			makerAssetData: assetDataUtils.encodeERC20AssetData(makerAssetAddr),
			takerAssetData: assetDataUtils.encodeERC20AssetData(takerAssetAddr),
			salt: new BigNumber(0),
			exchangeAddress: exchangeAddr.toLowerCase(),
			feeRecipientAddress: relayerAddr.toLowerCase(),
			expirationTimeSeconds: new BigNumber(expInSeconds)
		};
	}

	public async createRawOrder(
		pair: string,
		userAddr: string,
		makerAssetAddr: string,
		takerAssetAddr: string,
		makerAmt: BigNumber,
		takerAmt: BigNumber,
		expInSeconds: number
	): Promise<IRawOrder> {
		if (this.wallet !== Wallet.MetaMask && this.wallet !== Wallet.Local)
			throw new Error('cannot sign');
		const order = Web3Util.createRawOrderWithoutSalt(
			userAddr,
			this.relayerAddress,
			makerAssetAddr,
			takerAssetAddr,
			makerAmt,
			takerAmt,
			expInSeconds,
			this.contractWrappers.exchange.address
		);
		order.salt = generatePseudoRandomSalt();

		const orderHash = orderHashUtils.getOrderHashHex(order);
		const signedOrder = await signatureUtils.ecSignOrderAsync(
			this.web3Wrapper.getProvider(),
			order,
			order.makerAddress
		);
		return {
			pair: pair,
			orderHash: orderHash,
			signedOrder: signedOrder
		};
	}

	public static stringToBN = (value: string): BigNumber => {
		return new BigNumber(value);
	};

	public static fromWei = (value: BigNumber | string | number): number => {
		return Number(Web3Wrapper.toUnitAmount(new BigNumber(value), 18).valueOf());
	};

	public static toWei = (value: BigNumber | string): number => {
		return Number(Web3Wrapper.toWei(new BigNumber(value)).valueOf());
	};

	public static getSideFromSignedOrder(
		order: SignedOrder | IStringSignedOrder,
		token: IToken
	): string {
		const takerAssetAddress = assetDataUtils
			.decodeERC20AssetData(order.takerAssetData)
			.tokenAddress.toLowerCase();
		return takerAssetAddress === token.address ? CST.DB_BID : CST.DB_ASK;
	}

	public async validateOrder(signedOrder: SignedOrder): Promise<string> {
		const { orderSchema } = schemas;
		const { signature, ...order } = signedOrder;
		const validator = new SchemaValidator();
		if (!validator.validate(order, orderSchema).valid) {
			Util.logDebug('invalid schema ' + JSON.stringify(signedOrder));
			return '';
		}

		const orderHash = orderHashUtils.getOrderHashHex(order);
		const isValidSig = await signatureUtils.isValidSignatureAsync(
			this.web3Wrapper.getProvider(),
			orderHash,
			signature,
			order.makerAddress
		);
		if (!isValidSig) {
			Util.logDebug('invalid signature ' + orderHash);
			return '';
		}

		return orderHash;
	}

	public getTokenAddressFromCode(code: string): string {
		if (code === CST.TOKEN_WETH) return this.contractAddresses.etherToken;

		const token = this.getTokenByCode(code);
		return token ? token.address : '';
	}

	public setUnlimitedTokenAllowance(code: string, account: string, spender?: string) {
		const tokenAddress = this.getTokenAddressFromCode(code);
		if (tokenAddress)
			if (spender)
				return this.contractWrappers.erc20Token.setUnlimitedAllowanceAsync(
					tokenAddress,
					account,
					spender
				);
			else
				return this.contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(
					tokenAddress,
					account
				);
		return Promise.reject('no tokenAddress');
	}

	public async getTokenAllowance(code: string, ownerAddr: string, spender?: string) {
		const tokenAddress = this.getTokenAddressFromCode(code);

		if (tokenAddress)
			if (spender)
				return Web3Util.fromWei(
					await this.contractWrappers.erc20Token.getAllowanceAsync(
						tokenAddress,
						ownerAddr.toLowerCase(),
						spender
					)
				);
			else
				return Web3Util.fromWei(
					await this.contractWrappers.erc20Token.getProxyAllowanceAsync(
						tokenAddress,
						ownerAddr.toLowerCase()
					)
				);
		return 0;
	}

	public async getEthBalance(address: string) {
		return Web3Util.fromWei(await this.web3Wrapper.getBalanceInWeiAsync(address));
	}

	public async getTokenBalance(code: string, address: string) {
		const tokenAddress = this.getTokenAddressFromCode(code);
		if (tokenAddress)
			return Web3Util.fromWei(
				await this.contractWrappers.erc20Token.getBalanceAsync(tokenAddress, address)
			);
		return 0;
	}

	public async wrapEther(amount: number, address: string) {
		return this.contractWrappers.etherToken.depositAsync(
			this.contractAddresses.etherToken,
			Web3Wrapper.toWei(new BigNumber(amount)),
			address
		);
	}

	public async unwrapEther(amount: number, address: string) {
		return this.contractWrappers.etherToken.withdrawAsync(
			this.contractAddresses.etherToken,
			Web3Wrapper.toWei(new BigNumber(amount)),
			address
		);
	}

	public async validateOrderFillable(signedOrder: SignedOrder): Promise<boolean> {
		try {
			await this.contractWrappers.exchange.validateOrderFillableOrThrowAsync(
				signedOrder
				// 	, {
				// 	expectedFillTakerTokenAmount: new BigNumber(0)
				// }
			);
			return true;
		} catch (err) {
			Util.logDebug('invalid order');
			Util.logDebug(JSON.stringify(err));
			return false;
		}
	}

	public async isValidPair(pair: string) {
		try {
			const codes = pair.split('|');
			if (codes.length !== 2) return false;
			const token1 = this.getTokenByCode(codes[0]);
			if (!token1) return false;
			if (
				!token1.precisions[codes[1]] ||
				!token1.feeSchedules[codes[1]] ||
				(token1.maturity && token1.maturity < Util.getUTCNowTimestamp())
			)
				return false;

			return true;
		} catch (err) {
			Util.logDebug(err);
			return false;
		}
	}

	public async awaitTransactionSuccessAsync(
		txHash: string,
		pollingIntervalMs?: number,
		timeoutMs?: number
	) {
		return this.web3Wrapper.awaitTransactionSuccessAsync(txHash, pollingIntervalMs, timeoutMs);
	}

	public static isValidAddress(address: string) {
		return address !== CST.DUMMY_ADDR && Web3Wrapper.isAddress(address);
	}

	public getTransactionReceipt(txHash: string) {
		return this.web3Wrapper.getTransactionReceiptIfExistsAsync(txHash);
	}

	public static toChecksumAddress(address: string): string {
		return Web3Utils.toChecksumAddress(address);
	}

	public async tokenTransfer(
		code: string,
		fromAddress: string,
		toAddress: string,
		senderAddress: string,
		amount: number
	) {
		const tokenAddress = this.getTokenAddressFromCode(code);
		const amountInWei = Web3Wrapper.toBaseUnitAmount(new BigNumber(amount), 18);
		if (senderAddress === fromAddress)
			return this.contractWrappers.erc20Token.transferAsync(
				tokenAddress,
				fromAddress,
				toAddress,
				amountInWei
			);
		else
			return this.contractWrappers.erc20Token.transferFromAsync(
				tokenAddress,
				fromAddress,
				toAddress,
				senderAddress,
				amountInWei
			);
	}

	public static getAccountFromMnemonic(mnemonic: string, index: number): IAccount {
		const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
		const wallet = hdwallet
			.derivePath('m/' + CST.BASE_DERIVATION_PATH + '/' + index)
			.getWallet();
		const address = '0x' + wallet.getAddress().toString('hex');
		const privateKey = wallet.getPrivateKey().toString('hex');
		return {
			address: address,
			privateKey: privateKey
		};
	}
}

export default Web3Util;
