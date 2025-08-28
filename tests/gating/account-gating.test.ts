import { assert, describe, expect, it } from 'vitest';
import { c32address } from 'c32check';
import { Cl } from '@stacks/transactions';
import {
	alice,
	betty,
	bob,
	constructDao,
	deployer,
	fred,
	isValidExtension,
	metadataHash,
	passProposalByCoreVote,
	passProposalByExecutiveSignals,
	setupSimnet,
	stxToken,
	tom,
	wallace
} from '../helpers';
import { contractId2Key, generateMerkleProof, generateMerkleTreeUsingStandardPrincipal, proofToClarityValue } from './gating';
import { bytesToHex } from '@noble/hashes/utils';

async function createBinaryMarket(marketId: number, creator?: string, token?: string) {
	let response = await simnet.callPublicFn(
		'bme024-0-market-predicting',
		'create-market',
		[
			Cl.list([Cl.stringAscii('nay'), Cl.stringAscii('yay')]),
			Cl.none(),
			Cl.principal(token ? token : stxToken),
			Cl.bufferFromHex(metadataHash()),
			Cl.list([]),
			Cl.principal(`${deployer}.bme022-0-market-gating`),
			Cl.none(),
			Cl.none(),
			Cl.uint(100000000),
			Cl.none()
		],
		creator ? creator : deployer
	);
	expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
	return response;
}

async function createBinaryMarketWithGating(marketId: number, proof: any, key?: any, creator?: string, token?: string, fee?: number) {
	let response = await simnet.callPublicFn(
		'bme024-0-market-predicting',
		'create-market',
		[
			Cl.list([Cl.stringAscii('nay'), Cl.stringAscii('yay')]),
			fee ? Cl.some(Cl.uint(fee)) : Cl.none(),
			Cl.principal(token ? token : stxToken),
			Cl.bufferFromHex(key ? key : metadataHash()),
			proof,
			Cl.principal(`${deployer}.bme022-0-market-gating`),
			Cl.none(),
			Cl.none(),
			Cl.uint(100000000),
			Cl.none()
		],
		creator ? creator : deployer
	);
	if (marketId > 200) {
		expect(response.result).toEqual(Cl.error(Cl.uint(marketId)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
	}
	return response;
}

const simnet = await setupSimnet();
/*
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/

describe('gating market  creation', () => {
	it('err-expecting-merkle-root-for-poll', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
	});

	it('err-unauthorised', async () => {
		await constructDao(simnet);
		let response = await simnet.callPublicFn(
			'bme022-0-market-gating',
			'set-merkle-root',
			[
				Cl.bufferFromHex('f5acf4f4f8dc7ee10d4bba032bb8d4776c405916fe07737b4abde40e858408e6'),
				Cl.bufferFromHex('0xf5acf4f4f8dc7ee10d4bba032bb8d4776c405916fe07737b4abde40e858408e6')
			],
			deployer
		);
		expect(response.result).toEqual(Cl.error(Cl.uint(2200)));
	});

	it('ensure bme022 is valid extension', async () => {
		await constructDao(simnet);
		const extension = `${deployer}.bme022-0-market-gating`;
		await isValidExtension(extension);
	});

	it('can call set-merkle-root via proposal', async () => {
		await constructDao(simnet);

		const proposal = `bdp001-gating`;
		//await passProposalByExecutiveSignals(simnet, proposal);
		await passProposalByCoreVote(proposal);
		const lookupRootKey = contractId2Key('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bme024-0-market-predicting');
		const allowedCreators = [alice, bob, tom, betty, wallace];
		//   const allowedCreators = [deployer];
		const { tree, root } = generateMerkleTreeUsingStandardPrincipal(allowedCreators);

		let data = await simnet.callReadOnlyFn('bme022-0-market-gating', 'get-merkle-root', [Cl.bufferFromHex(lookupRootKey)], alice);
		expect(data.result).toEqual(
			// see bdp001-gating
			Cl.some(Cl.tuple({ 'merkle-root': Cl.bufferFromHex(root) }))
		);
	});

	it("can't call create-market with invalid merkle lookup key", async () => {
		await constructDao(simnet);

		const proposal = `bdp001-gating`;
		//await passProposalByExecutiveSignals(simnet, proposal);
		await passProposalByCoreVote(proposal);
		const lookupRootKey = contractId2Key('ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5.bme021-0-market-voting');
		const allowedCreators = [alice, bob, tom, betty, wallace];
		const { tree } = generateMerkleTreeUsingStandardPrincipal(allowedCreators);
		const { proof } = generateMerkleProof(tree, bob);

		let data = await simnet.callReadOnlyFn('bme022-0-market-gating', 'get-merkle-root', [Cl.bufferFromHex(lookupRootKey)], alice);
		expect(data.result).toEqual(Cl.none());

		let response = await createBinaryMarketWithGating(2214, proofToClarityValue(proof), metadataHash(), deployer, stxToken);
	});

	it('deployer can create-market if dao bootstrapped', async () => {
		await constructDao(simnet);
		const allowedCreators = [deployer];
		const { tree, root } = generateMerkleTreeUsingStandardPrincipal(allowedCreators);
		let merklProof = generateMerkleProof(tree, deployer);
		assert(merklProof.valid);
		//merklProof = generateMerkleProof(tree, deployer);
		//assert(merklProof.valid)
		const lookupRootKey = contractId2Key('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bme024-0-market-predicting');
		console.log(
			'bme024-0-market-predicting: 0x' + lookupRootKey + ' root= 0x' + root
			//tree
		);
		let response = await createBinaryMarketWithGating(0, proofToClarityValue(merklProof.proof), metadataHash(), deployer, stxToken);
	});

	it('alice cannot create-market if dao bootstrapped', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-gating-true-testnet');
		const allowedCreators = [deployer];
		const { tree, root } = generateMerkleTreeUsingStandardPrincipal(allowedCreators);
		let merklProof = generateMerkleProof(tree, deployer);
		assert(merklProof.valid);
		//merklProof = generateMerkleProof(tree, deployer);
		//assert(merklProof.valid)
		const lookupRootKey = contractId2Key('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bme024-0-market-predicting');
		console.log('bme024-0-market-predicting: 0x' + lookupRootKey + ' root= 0x' + root);
		let response = await createBinaryMarketWithGating(2214, proofToClarityValue(merklProof.proof), metadataHash(), alice, stxToken);
	});

	it('GENERATE TESTNET MERKLE ROOTS FOR MARKET CREATION', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-gating');
		const allowedCreators = [
			'ST2X0FMCBMBK3F41WVS8PKN75PF9H5ZDRJB7H600B',
			'ST1WBKBD16E10AAX6F3Z54ARM2S1Q4AVRW1CYZVH',
			'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY',
			'ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ',
			'ST3SJD6KV86N90W0MREGRTM1GWXN8Z91PF6W0BQKM',
			'STQE3J7XMMK0DN0BWJZHGE6B05VDYQRXRNM0T1J8',
			'ST2RNHHQDTHGHPEVX83291K4AQZVGWEJ7WD7SDHD8'
		];
		const { tree, root } = generateMerkleTreeUsingStandardPrincipal(allowedCreators);
		let merklProof = generateMerkleProof(tree, 'ST3RR3HF25CQ9A5DEWS4R1WKJSBCFKQXFBYPJK3WV');
		const lookupRootKey = contractId2Key('ST2X0FMCBMBK3F41WVS8PKN75PF9H5ZDRJB7H600B.bme023-0-market-scalar-pyth');
		console.log(
			'ST2X0FMCBMBK3F41WVS8PKN75PF9H5ZDRJB7H600B, ST1WBKBD16E10AAX6F3Z54ARM2S1Q4AVRW1CYZVH, ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY, ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ, ST3SJD6KV86N90W0MREGRTM1GWXN8Z91PF6W0BQKM, STQE3J7XMMK0DN0BWJZHGE6B05VDYQRXRNM0T1J8, ST2RNHHQDTHGHPEVX83291K4AQZVGWEJ7WD7SDHD8 '
		);
		console.log(
			'GENERATE TESTNET MERKLE ROOTS FOR MARKET CREATION: ST2X0FMCBMBK3F41WVS8PKN75PF9H5ZDRJB7H600B.bme023-0-market-scalar-pyth: 0x' + lookupRootKey + ' root= 0x' + root
			//tree
		);
		//assert(merklProof.valid)
		//merklProof = generateMerkleProof(tree, deployer);
		//assert(merklProof.valid)
		let response = await createBinaryMarketWithGating(2214, proofToClarityValue(merklProof.proof), metadataHash(), alice, stxToken);
	});

	it('can create-market with valid merkle proof', async () => {
		await constructDao(simnet);

		const proposal = `bdp001-gating`;
		//await passProposalByExecutiveSignals(simnet, proposal);
		await passProposalByCoreVote(proposal);
		const lookupRootKey = contractId2Key('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bme024-0-market-predicting');
		const allowedCreators = [alice, bob, tom, betty, wallace];
		const disallowedCreators = [wallace, fred];
		const { tree, root } = generateMerkleTreeUsingStandardPrincipal(allowedCreators);
		// console.log('Leaves (Tree):', tree.getLeaves().map(bytesToHex));
		console.log('lookupRootKey=' + lookupRootKey);
		console.log('RooT=' + root);

		let data = await simnet.callReadOnlyFn('bme022-0-market-gating', 'get-merkle-root', [Cl.bufferFromHex(lookupRootKey)], alice);
		expect(data.result).toEqual(Cl.some(Cl.tuple({ 'merkle-root': Cl.bufferFromHex(root!) })));

		// bob can create a market
		let merdat = generateMerkleProof(tree, bob);
		assert(merdat.valid, 'should be a valid proof');
		await assertContractData(0, lookupRootKey, merdat.leaf, bob, merdat.proof);

		// // // alice can create a market
		// merdat = generateMerkleProof(tree, alice);
		// assert(merdat.valid, 'should be a valid proof');
		// await assertContractData(1, lookupRootKey, merdat.leaf, alice, merdat.proof);

		// // // // // tom can create a market
		// merdat = generateMerkleProof(tree, tom);
		// assert(merdat.valid, 'should be a valid proof');
		// await assertContractData(2, lookupRootKey, merdat.leaf, tom, merdat.proof);

		// // // betty can create a market
		// merdat = generateMerkleProof(tree, betty);
		// assert(merdat.valid, 'should be a valid proof');
		// await assertContractData(3, lookupRootKey, merdat.leaf, betty, merdat.proof);

		// // // wallace can create a market
		// merdat = generateMerkleProof(tree, wallace);
		// assert(merdat.valid, 'should be a valid proof');
		// await assertContractData(4, lookupRootKey, merdat.leaf, wallace, merdat.proof);

		// // fred cannot create a market
		// merdat = generateMerkleProof(tree, fred);
		// //assert(merdat.valid, "should be a valid proof");
		// await assertContractData(2214, lookupRootKey, merdat.leaf, fred, merdat.proof);

		// // fred cannot create a market
		// merdat = generateMerkleProof(tree, deployer);
		// //assert(merdat.valid, "should be a valid proof");
		// await assertContractData(2214, lookupRootKey, merdat.leaf, deployer, merdat.proof);
	});
});

async function assertContractData(marketId: number, lookupRootKey: string, leaf: string, user: string, proof: any) {
	// console.log('checking: ' + user + ' leaf: ' + leaf);
	// console.log('lookupRootKey: ' + lookupRootKey);
	// console.log('leaf: ' + leaf);
	// console.log('proof: ', proof);
	// console.log(
	// 	'proof: ',
	// 	proof.map((p: any) => {
	// 		bytesToHex(p.data);
	// 	})
	// );

	let response = await createBinaryMarketWithGating(marketId, proofToClarityValue(proof), lookupRootKey, user, stxToken);
	if (user === fred || user === deployer) {
		expect(response.result).toEqual(Cl.error(Cl.uint(2214)));
		return;
	}

	expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
	//console.log('response.events[0].data.value', response.events[0].data.value)
	//console.log('response.events[1].data.value', response.events[1]?.data.value)
	const ddv = (response.events[0].data as any)?.data;
	console.log('ddv: ', ddv);
	if (!ddv) return;

	//expect(ddv['proof-valid']).toMatchObject(Cl.tuple({"proof-valid":Cl.bool(true)}));
	assert('548bbe4cdf9ba84d53315dc3802e9665b6351d53ae24372e9b6f01b33bd7b684' === bytesToHex(ddv['contract-key'].buffer));

	const cAddress = c32address(ddv['txsender'].address.version, ddv['txsender'].address.hash160);
	assert(
		'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bme024-0-market-predicting' === cAddress + '.' + ddv['txsender'].contractName.content,
		'contract-name returned from contract is unexpected ' + user
	);

	console.log('lookupRootKey2=' + bytesToHex(ddv['contract-name'].buffer));

	assert(
		bytesToHex(ddv['contract-name'].buffer) === '0d000000186264653032332d6d61726b65742d70726564696374696e67',
		'contract-name hash returned from contract is unexpected ' + user
	);
	// assert(
	//   bytesToHex(ddv.leaf.buffer) === leaf,
	//   `leaf returned from contract is unexpected ${bytesToHex(ddv.leaf.buffer)}`
	// );
	const stacksAddress = c32address(ddv.sender.address.version, ddv.sender.address.hash160);
	// console.log(bytesToHex(ddv.leaf.buffer));
	// console.log(stacksAddress);
	// console.log(user);
	assert(stacksAddress === user, 'stacksAddress returned from contract is unexpected ' + user);
	// assert(
	//   bytesToHex(ddv.root.data["merkle-root"].buffer) ===
	//     "5f24649277af2f6364faf35827dffe12b85f2f1dca5ae92733c72af91455aa64",
	//   "root returned from contract is unexpected " + user
	// );
}
