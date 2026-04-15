import { Cl } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { constructDao, deployer, metadataHash } from '../dao_helpers';
import { getWif } from './bitcoin-tx-helper';

const proofData = {
	height: 21731,
	wtx: '02000000011057465eb81967f7ef9360eb89d5323b7acdaf4e5f7e07e532a170c1fcaf96b600000000000000000002e803000000000000160014a889b37ce58d58cfe541089cf9697670a2df01d547190000000000001600142c9fad3e438b0ffc82e352c2b661cf92c7489e6f00000000',
	header: '00000020169930171a7024ad0bbf104459b9ea0d753b002d52225a4133f3c8b9a1f700070e59fd6f24fc5c24d069a9adb94f87a54af39ce408fa0b924be343e18f2b120b3960c867ffff7f2004000000',
	txIndex: 2,
	treeDepth: 2,
	wproof: ['5607484b90f7d6086da91e9897b01fab6c2915b275b9362b6339c48c2e3442af', '1031787c96b27c780e567baf561ceb855e942592209e91122c839f68bcfaf098'],
	witnessMerkleRoot: '0b122b8fe143e34b920bfa08e49cf34aa5874fb9ada969d0245cfc246ffd590e',
	witnessReservedValue: 'aa21a9edfc088350b9afa9f0a722d920',
	ctx: '02000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0402e35400ffffffff0219540000000000001976a91496b1993849d2abc9c04b2ba16e0ceae36d69cbdd88ac0000000000000000266a24aa21a9edfc088350b9afa9f0a722d92082fe8bb0b8626193e9107dc77633ceb37f5c2d5800000000',
	cproof: ['a302e10499504bc0e92d0f15315ed5da27a35f3cfa191ee2cfd486fc488ba0aa']
};
async function createCategoricalBitcoinMarket(marketId: number, creator?: string) {
	getWif('');
	await constructDao(simnet);
	let response = simnet.callPublicFn(
		'bme023-0-market-bitcoin',
		'create-market',
		[
			Cl.list([Cl.stringAscii('lion'), Cl.stringAscii('tiger'), Cl.stringAscii('cheetah')]),
			Cl.none(),
			Cl.bufferFromHex(metadataHash()),
			Cl.list([]),
			Cl.principal(`${deployer}.bme022-0-market-gating`)
		],
		creator ? creator : deployer
	);
	expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
}
async function predictCategory(user: string, marketId: number, category: string, amount: number, code: number) {
	const height = simnet.blockHeight;
	// (wtx (buff 4096))
	// (header (buff 80))
	// (tx-index uint)
	// (tree-depth uint)
	// (wproof (list 14 (buff 32)))
	// (witness-merkle-root (buff 32))
	// (witness-reserved-value (buff 32))
	// (ctx (buff 1024))
	// (cproof (list 14 (buff 32))))
	const functionArgs = [Cl.uint(marketId), Cl.uint(amount), Cl.stringAscii(category)];
	let response = simnet.callPublicFn('bme023-0-market-bitcoin', 'predict-category', functionArgs, user);
	expect(response.result).toEqual(Cl.ok(Cl.uint(code)));
	return response;
}

describe('clarity bitcoin', () => {
	it('check parse random mempool segwit', async () => {
		const txid = '7ec19cf11e4f7686aea09273ab01f7584953dad9fc9a57ef8c39ecfb9f71216f';
		const txHex =
			'02000000000101690229f4efc7902ab27dd94b3c114abca8ac46fde629f7a276c1ed30609334f70000000017160014ea22e269d8edf24954708789c07e8286d7ce0fbe01000000014e5b6605000000001976a914674a8527a29f25613552267d0edfd181212becdc88ac0247304402201da873b8738a6db149c4810b658eba67f09ab6969fd4066631b0f15f184252160220154966c003f817ff57e0736fa39f8f24609ac7e830647835761e84665efddf74012103ac2362ac29f935b88e9c7acbc26f8697fd03cbd7d302041b1d7d9706f3e22d8b00000000';
		let response = simnet.callReadOnlyFn('bme023-0-market-bitcoin', 'get-output-segwit', [Cl.bufferFromHex(txHex), Cl.uint(0)], deployer);
		//silence: console.log('check parse random mempool segwit', txHex);
		expect(response.result).toMatchObject(
			Cl.ok(
				Cl.tuple({
					value: Cl.uint(90594126),
					scriptPubKey: Cl.bufferFromHex('76a914674a8527a29f25613552267d0edfd181212becdc88ac')
				})
			)
		);
	});
	// it('check get-output segwit 0', async () => {
	// 	const transaction = buildMockBitcoinSegwitTransaction();
	// 	const txHex = hex.encode(transaction.toBytes(true, true));
	// 	let response = simnet.callReadOnlyFn('bme023-0-market-bitcoin', 'get-output-segwit', [Cl.bufferFromHex(txHex), Cl.uint(0)], deployer);
	// 	//silence: console.log('check get-output segwit 0', hex.encode((response.result as any).value.data.scriptPubKey.buffer));
	// 	expect(response.result).toMatchObject(
	// 		Cl.ok(
	// 			Cl.tuple({
	// 				value: Cl.uint(0),
	// 				scriptPubKey: Cl.bufferFromHex(
	// 					'6a430c0000000301690100000000000000000000000000000000016f01000000000000000000000000000000140170051a7321b74e2b6a7e949e6c4ad313035b1665095017'
	// 				)
	// 			})
	// 		)
	// 	);
	// });
	// it('check get-output segwit 1', async () => {
	// 	const transaction = buildMockBitcoinSegwitTransaction();
	// 	const txHex = hex.encode(transaction.toBytes(true, true));
	// 	let response = simnet.callReadOnlyFn('bme023-0-market-bitcoin', 'get-output-segwit', [Cl.bufferFromHex(txHex), Cl.uint(1)], deployer);
	// 	//silence: console.log('check get-output segwit 1', hex.encode((response.result as any).value.data.scriptPubKey.buffer));
	// 	expect(response.result).toMatchObject(
	// 		Cl.ok(
	// 			Cl.tuple({
	// 				value: Cl.uint(50000),
	// 				scriptPubKey: Cl.bufferFromHex('001417de0e83f7b4e8b841e6df48e86f56fa19f30c4c')
	// 			})
	// 		)
	// 	);

	// 	// ✅ Your scriptPubKey (SegWit P2WPKH)
	// 	const scriptPubKey = hex.decode('001417de0e83f7b4e8b841e6df48e86f56fa19f30c4c');

	// 	// ✅ Extract the last 20 bytes (skip first 2 bytes)
	// 	const pubKeyHash = scriptPubKey.slice(-20);

	// 	//silence: console.log('🔍 Extracted Public Key Hash:', hex.encode(pubKeyHash));

	// 	const segwitAddress = btc.Address(REGTEST_NETWORK).encode({
	// 		type: 'wpkh',
	// 		hash: pubKeyHash
	// 	});
	// 	expect(segwitAddress).toBe('bcrt1qzl0qaqlhkn5tss0xmaywsm6klgvlxrzvgydph3');
	// 	//silence: console.log('📡 SegWit Address:', segwitAddress);
	// });
	// it('check get-output legacy 0', async () => {
	// 	const transaction = buildMockBitcoinLegacyTransaction();

	// 	//let tx = '6a6e48656c6c6f20537461636b73'; // OP_RETURN + custom marker + "Hello Stacks"
	// 	const txHex = hex.encode(transaction.toBytes(true, false));
	// 	let response = simnet.callReadOnlyFn('bme023-0-market-bitcoin', 'get-output-legacy', [Cl.bufferFromHex(txHex), Cl.uint(0)], deployer);
	// 	//console.log('check get-output legacy 0', txHex);

	// 	expect(response.result).toMatchObject(
	// 		Cl.ok(
	// 			Cl.tuple({
	// 				value: Cl.uint(0),
	// 				scriptPubKey: Cl.bufferFromHex(hex.encode(transaction.getOutput(0).script!))
	// 			})
	// 		)
	// 	);
	// });
	// it('check get-output legacy 1', async () => {
	// 	const transaction = buildMockBitcoinLegacyTransaction();

	// 	//let tx = '6a6e48656c6c6f20537461636b73'; // OP_RETURN + custom marker + "Hello Stacks"
	// 	const txHex = hex.encode(transaction.toBytes(true, false));
	// 	//console.log('check get-output legacy 1', txHex);
	// 	let response = simnet.callReadOnlyFn('bme023-0-market-bitcoin', 'get-output-legacy', [Cl.bufferFromHex(txHex), Cl.uint(1)], deployer);

	// 	expect(response.result).toMatchObject(
	// 		Cl.ok(
	// 			Cl.tuple({
	// 				value: Cl.uint(50000),
	// 				scriptPubKey: Cl.bufferFromHex(hex.encode(transaction.getOutput(1).script!))
	// 			})
	// 		)
	// 	);
	// });
	// it('check parse legacy op_return', async () => {
	// 	const transaction = buildMockBitcoinLegacyTransaction();

	// 	//let tx = '6a6e48656c6c6f20537461636b73'; // OP_RETURN + custom marker + "Hello Stacks"
	// 	const txHex = hex.encode(transaction.toBytes(true, false));
	// 	let response = simnet.callReadOnlyFn('bme023-0-market-bitcoin', 'parse-payload-legacy', [Cl.bufferFromHex(txHex)], deployer);
	// 	//silence: console.log('\n\n check parse legacy op_return', (response.result as any).value.data);

	// 	const data = Cl.serialize(Cl.tuple({ idx: Cl.uint(2), amt: Cl.uint(3), id: Cl.uint(4), addr: Cl.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM') }));
	// 	//silence: console.log('\n\ncheck parse legacy op_return' + hex.encode(data));

	// 	expect(response.result).toMatchObject(
	// 		Cl.ok(
	// 			Cl.some(
	// 				Cl.tuple({
	// 					i: Cl.uint(4),
	// 					o: Cl.uint(2),
	// 					p: Cl.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM')
	// 				})
	// 			)
	// 		)
	// 	);
	// });
	// it('check parse segwit op_return', async () => {
	// 	const transaction = buildMockBitcoinSegwitTransaction();
	// 	const txHex = hex.encode(transaction.toBytes(true, true));
	// 	let response = simnet.callReadOnlyFn('bme023-0-market-bitcoin', 'parse-payload-segwit', [Cl.bufferFromHex(txHex)], deployer);
	// 	// console.log('\n\ncheck parse segwit op_return', (response.result as any).value.data);
	// 	expect(response.result).toMatchObject(
	// 		Cl.ok(
	// 			Cl.some(
	// 				Cl.tuple({
	// 					i: Cl.uint(0),
	// 					o: Cl.uint(20),
	// 					p: Cl.principal('ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5')
	// 				})
	// 			)
	// 		)
	// 	);
	// });
	// // it('check predicitons with legacy transaction', async () => {
	// // 	createCategoricalBitcoinMarket(0, deployer);
	// // 	predictCategory(alice, 0, 'lion', 100, 100001);
	// // 	const transaction = buildMockBitcoinSegwitTransaction();
	// // 	const txHex = hex.encode(transaction.toBytes(true, true));
	// // 	let response = simnet.callReadOnlyFn('bme023-0-market-bitcoin', 'parse-payload-segwit', [Cl.bufferFromHex(txHex)], deployer);
	// // 	// console.log('\n\ncheck parse segwit op_return', (response.result as any).value.data);
	// // 	expect(response.result).toMatchObject(
	// // 		Cl.ok(
	// // 			Cl.some(
	// // 				Cl.tuple({
	// // 					id: Cl.uint(0),
	// // 					idx: Cl.uint(20),
	// // 					amt: Cl.uint(3),
	// // 					addr: Cl.principal('ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5')
	// // 				})
	// // 			)
	// // 		)
	// // 	);
	// // });
});
