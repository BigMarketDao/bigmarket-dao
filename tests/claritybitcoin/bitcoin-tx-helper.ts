import { ripemd160 } from '@noble/hashes/ripemd160';
import { sha256 } from '@noble/hashes/sha256';
import { concatBytes } from '@noble/hashes/utils';
import * as secp256k1 from '@noble/secp256k1';
import { hex } from '@scure/base';
import * as btc from '@scure/btc-signer';
import { Signer } from '@scure/btc-signer/transaction.js';
import { base58CheckEncode } from '@stacks/encryption';
import { Cl } from '@stacks/transactions';

export const btcAddress = 'bcrt1q3tj2fr9scwmcw3rq5m6jslva65f2rqjxfrjz47';
export const REGTEST_NETWORK: typeof btc.NETWORK = {
	bech32: 'bcrt',
	pubKeyHash: 0x6f,
	scriptHash: 0xc4,
	wif: 0xc4
};

export function getWif(version: string) {
	// Stacks private key (remove last byte "01" if it exists)
	const stacksPrivKeyHex = '36eab9c1c3f1694c696ee00c24f5add52d6edd48ffa494eb04e5bb1dfc5d9e70';

	// Convert hex private key to Uint8Array
	const privKeyBytes = hex.decode(stacksPrivKeyHex);

	// Ensure the key is 32 bytes (remove extra bytes if needed)
	if (privKeyBytes.length !== 32) {
		throw new Error('Invalid private key length. It must be 32 bytes.');
	}

	// Bitcoin WIF Regtest prefix (0xEF for regtest/testnet)
	const versionByte = 0xef;

	// Append WIF compression flag (0x01 for compressed keys)
	const compressedKey = concatBytes(privKeyBytes, hex.decode('01'));

	// Encode to WIF format using Base58Check
	const wifKey = base58CheckEncode(1, compressedKey);

	//silence: console.log('Bitcoin Regtest WIF Private Key:', wifKey);
}

export function buildMockBitcoinSegwitTransaction(): btc.Transaction {
	const transaction = new btc.Transaction({
		allowUnknownInputs: true,
		allowUnknownOutputs: true
	});
	const data = Cl.serialize(
		Cl.tuple({
			o: Cl.uint(20),
			i: Cl.uint(0),
			p: Cl.principal('ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5')
		})
	);
	const encodedData = data;
	//silence: console.log('buildMockBitcoinSegwitTransaction: encodedData: ' + encodedData);
	transaction.addOutput({
		script: btc.Script.encode(['RETURN', hex.decode(encodedData)]),
		amount: BigInt(0)
	});

	transaction.addOutputAddress('bcrt1qzl0qaqlhkn5tss0xmaywsm6klgvlxrzvgydph3', BigInt(50000), REGTEST_NETWORK); // ✅ Market wallet address (SegWit)

	const privateKey: Signer = secp256k1.utils.randomPrivateKey();
	const publicKey = secp256k1.getPublicKey(privateKey, true); // ✅ Derive compressed public key
	const pubKeyHash = ripemd160(sha256(publicKey));
	const scriptPubKey = hex.encode(new Uint8Array([0x00, 0x14, ...pubKeyHash]));
	const utxo = {
		txid: '7ec19cf11e4f7686aea09273ab01f7584953dad9fc9a57ef8c39ecfb9f71216f',
		vout: 0,
		scriptPubKey: scriptPubKey, // P2WPKH
		value: 100000 // 100,000 sats
	};
	transaction.addInput({
		txid: utxo.txid,
		index: utxo.vout,
		witnessUtxo: {
			script: hex.decode(utxo.scriptPubKey),
			amount: BigInt(utxo.value)
		},
		//publicKey: hex.encode(publicKey), // ✅ Include public key for signing
		sequence: 0xffffffff
	});

	transaction.signIdx(privateKey, 0);
	transaction.finalize();
	//silence: console.log('buildMockBitcoinSegwitTransaction: signed: ' + hex.encode(transaction.toBytes(true, true)));

	return transaction;
}

export function buildMockBitcoinLegacyTransaction(): btc.Transaction {
	// Define a simple UTXO (mocked)
	const utxo = {
		txid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
		vout: 0,
		scriptPubKey: '76a914abcdef1234567890abcdef1234567890abcdef1234567890ac', // P2PKH
		value: 100000 // 100,000 sats
	};
	const transaction = new btc.Transaction({
		allowUnknownInputs: true,
		allowUnknownOutputs: true
	});
	transaction.addInput({
		txid: utxo.txid,
		index: utxo.vout,
		sequence: 0xffffffff
	});
	const data = Cl.serialize(Cl.tuple({ o: Cl.uint(2), i: Cl.uint(4), p: Cl.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM') }));

	transaction.addOutput({
		script: btc.Script.encode(['RETURN', hex.decode(data)]), // OP_RETURN Data
		amount: BigInt(0)
	});
	transaction.addOutputAddress(btcAddress, BigInt(50000), REGTEST_NETWORK); // Market wallet
	return transaction; //hex.encode(transaction.toBytes(true, false));
}

function getVersionAsType(version: string) {
	if (version === '0x00') return 'pkh';
	else if (version === '0x01') return 'sh';
	else if (version === '0x04') return 'wpkh';
	else if (version === '0x05') return 'wsh';
	else if (version === '0x06') return 'tr';
}
const ADDRESS_VERSION_P2PKH = new Uint8Array([0]);
const ADDRESS_VERSION_P2SH = new Uint8Array([1]);
const ADDRESS_VERSION_P2WPKH = new Uint8Array([2]);
const ADDRESS_VERSION_P2WSH = new Uint8Array([3]);
const ADDRESS_VERSION_NATIVE_P2WPKH = new Uint8Array([4]);
const ADDRESS_VERSION_NATIVE_P2WSH = new Uint8Array([5]);
const ADDRESS_VERSION_NATIVE_P2TR = new Uint8Array([6]);

export function getAddressFromHashBytes(netowrk: string, hashBytes: string, version: string) {
	const net = netowrk === 'testnet' ? btc.TEST_NETWORK : btc.NETWORK;
	if (!version.startsWith('0x')) version = '0x' + version;
	if (!hashBytes.startsWith('0x')) hashBytes = '0x' + hashBytes;
	let btcAddr: string | undefined;
	try {
		const txType = getVersionAsType(version);
		let outType: any;
		if (txType === 'tr') {
			outType = {
				type: getVersionAsType(version),
				pubkey: hex.decode(hashBytes.split('x')[1])
			};
		} else {
			outType = {
				type: getVersionAsType(version),
				hash: hex.decode(hashBytes.split('x')[1])
			};
		}
		const addr: any = btc.Address(net);
		btcAddr = addr.encode(outType);
		return btcAddr;
	} catch (err: any) {
		btcAddr = err.message;
		console.error('getAddressFromHashBytes: version:hashBytes: ' + version + ':' + hashBytes);
	}
	return btcAddr;
}

export function getHashBytesFromAddress(netowrk: string, address: string): { version: string; hashBytes: string } | undefined {
	const net = netowrk === 'testnet' ? btc.TEST_NETWORK : btc.NETWORK;
	let outScript: any;
	try {
		const addr: any = btc.Address(net);
		//const outScript = btc.OutScript.encode(addr.decode(address));
		const s = btc.OutScript.encode(addr.decode(address));
		const outScript = btc.OutScript.decode(s);
		if (outScript.type === 'ms') {
			return;
		} else if (outScript.type === 'pkh') {
			return {
				version: hex.encode(ADDRESS_VERSION_P2PKH),
				hashBytes: hex.encode(outScript.hash)
			};
		} else if (outScript.type === 'sh') {
			return {
				version: hex.encode(ADDRESS_VERSION_P2SH),
				hashBytes: hex.encode(outScript.hash)
			};
		} else if (outScript.type === 'wpkh') {
			return {
				version: hex.encode(ADDRESS_VERSION_NATIVE_P2WPKH),
				hashBytes: hex.encode(outScript.hash)
			};
		} else if (outScript.type === 'wsh') {
			return {
				version: hex.encode(ADDRESS_VERSION_NATIVE_P2WSH),
				hashBytes: hex.encode(outScript.hash)
			};
		} else if (outScript.type === 'tr') {
			return {
				version: hex.encode(ADDRESS_VERSION_NATIVE_P2TR),
				hashBytes: hex.encode(outScript.pubkey)
			};
		}
		return;
	} catch (err: any) {
		console.error('getPartialStackedByCycle: ' + outScript);
	}
	return;
}
