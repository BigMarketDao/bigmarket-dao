import { bytesToHex } from '@noble/hashes/utils';
import { Cl } from '@stacks/transactions';
import { c32address } from 'c32check';
import { assert, describe, expect, it } from 'vitest';
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
	stxToken,
	tom,
	wallace
} from '../dao_helpers';
import { contractId2Key, generateMerkleProof, generateMerkleTreeUsingStandardPrincipal, proofToClarityValue } from './gating';

async function createBinaryMarket(marketId: number, creator?: string, token?: string) {
	let response = simnet.callPublicFn(
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
	let response = simnet.callPublicFn(
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

/*
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/
describe('gating market  coverage', () => {
	it('err-expecting-merkle-root-for-poll', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
	});
});

describe('gating market  creation', () => {
	it('err-expecting-merkle-root-for-poll', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
	});

	it('err-unauthorised', async () => {
		await constructDao(simnet);
		let response = simnet.callPublicFn(
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

		let data = simnet.callReadOnlyFn('bme022-0-market-gating', 'get-merkle-root', [Cl.bufferFromHex(lookupRootKey)], alice);
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

		let data = simnet.callReadOnlyFn('bme022-0-market-gating', 'get-merkle-root', [Cl.bufferFromHex(lookupRootKey)], alice);
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
		// console.log(
		// 	'bme024-0-market-predicting: 0x' + lookupRootKey + ' root= 0x' + root
		// 	//tree
		// );
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
		// console.log('bme024-0-market-predicting: 0x' + lookupRootKey + ' root= 0x' + root);
		let response = await createBinaryMarketWithGating(2214, proofToClarityValue(merklProof.proof), metadataHash(), alice, stxToken);
	});

	it('GENERATE TESTNET MERKLE ROOTS FOR MARKET CREATION', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-gating');
		let allowedCreators = [
			'ST1CV2YGRJA5X8BWS0GP31J9HF56M06CQK8998TSX',
			'ST33YD6D9E9XSERRKVKY06D7XW5TRZGSRVZ920ECB',
			'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY',
			'ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ',
			'ST3SJD6KV86N90W0MREGRTM1GWXN8Z91PF6W0BQKM',
			'STEZD95XQ194X67C1QJW4PHKDG8F5D66ZCYFX27A'
		];
		let { tree, root } = generateMerkleTreeUsingStandardPrincipal(allowedCreators);
		let merklProof = generateMerkleProof(tree, 'ST3RR3HF25CQ9A5DEWS4R1WKJSBCFKQXFBYPJK3WV');
		const lookupRootKey = contractId2Key('ST1CV2YGRJA5X8BWS0GP31J9HF56M06CQK8998TSX.bme023-0-market-scalar-pyth');
		console.log(
			'ST1CV2YGRJA5X8BWS0GP31J9HF56M06CQK8998TSX, ST33YD6D9E9XSERRKVKY06D7XW5TRZGSRVZ920ECB, ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY, ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ, ST3SJD6KV86N90W0MREGRTM1GWXN8Z91PF6W0BQKM, STEZD95XQ194X67C1QJW4PHKDG8F5D66ZCYFX27A '
		);
		console.log('--------------------------------------------------------------------------------------------------------------');
		console.log(allowedCreators);
		console.log(
			'TESTNET: MERKLE ROOTS FOR MARKET CREATION: \nST1CV2YGRJA5X8BWS0GP31J9HF56M06CQK8998TSX.bme023-0-market-scalar-pyth: \nkey= 0x' + lookupRootKey + '\nroot= 0x' + root
			//tree
		);
		console.log('--------------------------------------------------------------------------------------------------------------');
		allowedCreators = [
			'SP1SCD8ERMTFYE6CK9S0MHWQCP6SY4NAVFJ538A27',
			'SPEZD95XQ194X67C1QJW4PHKDG8F5D66ZCT8BY29', //am
			'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z', // daoguy
			'SP2Z2CBMGWB9MQZAF5Z8X56KS69XRV3SJF4WKJ7J9', // deorg
			'SPQE3J7XMMK0DN0BWJZHGE6B05VDYQRXRMDV734D' // jb
		];
		let newRoot = generateMerkleTreeUsingStandardPrincipal(allowedCreators);
		//let merklProof1 = generateMerkleProof(newRoot.tree, 'ST3RR3HF25CQ9A5DEWS4R1WKJSBCFKQXFBYPJK3WV');
		const lookupRootKey1 = contractId2Key('SP1SCD8ERMTFYE6CK9S0MHWQCP6SY4NAVFJ538A27.bme023-0-market-scalar-pyth');
		console.log('--------------------------------------------------------------------------------------------------------------');
		console.log(allowedCreators);
		console.log(
			'MAINNET: MERKLE ROOTS FOR MARKET CREATION: \nSP22SW60674C0V6B5E234C7ZD2YR8WXKXXVC48GZR.bme023-0-market-scalar-pyth: \nkey= 0x' +
				lookupRootKey1 +
				'\nroot= 0x' +
				newRoot.root
			//tree
		);

		console.log('--------------------------------------------------------------------------------------------------------------');
		// Allowed = ["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5", "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG", "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC"];
		allowedCreators = [
			'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
			// 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
			// 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
			// 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
		];
		newRoot = generateMerkleTreeUsingStandardPrincipal(allowedCreators);
		//let merklProof1 = generateMerkleProof(newRoot.tree, 'ST3RR3HF25CQ9A5DEWS4R1WKJSBCFKQXFBYPJK3WV');
		const lookupRootKey2 = contractId2Key('ST1CV2YGRJA5X8BWS0GP31J9HF56M06CQK8998TSX.bme023-0-market-scalar-pyth');
		console.log('--------------------------------------------------------------------------------------------------------------');
		console.log(allowedCreators);
		console.log(
			'DEVNET: MERKLE ROOTS FOR MARKET CREATION: \nSP22SW60674C0V6B5E234C7ZD2YR8WXKXXVC48GZR.bme023-0-market-scalar-pyth: \nkey= 0x' +
				lookupRootKey2 +
				'\nroot= 0x' +
				newRoot.root
			//tree
		);
		//silence: console.log('--------------------------------------------------------------------------------------------------------------');
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
		//silence: console.log('lookupRootKey=' + lookupRootKey);
		//silence: console.log('RooT=' + root);

		let data = simnet.callReadOnlyFn('bme022-0-market-gating', 'get-merkle-root', [Cl.bufferFromHex(lookupRootKey)], alice);
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
	//silence: console.log('ddv: ', ddv);
	if (!ddv) return;

	//expect(ddv['proof-valid']).toMatchObject(Cl.tuple({"proof-valid":Cl.bool(true)}));
	assert('548bbe4cdf9ba84d53315dc3802e9665b6351d53ae24372e9b6f01b33bd7b684' === bytesToHex(ddv['contract-key'].buffer));

	const cAddress = c32address(ddv['txsender'].address.version, ddv['txsender'].address.hash160);
	assert(
		'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bme024-0-market-predicting' === cAddress + '.' + ddv['txsender'].contractName.content,
		'contract-name returned from contract is unexpected ' + user
	);

	//silence: console.log('lookupRootKey2=' + bytesToHex(ddv['contract-name'].buffer));

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
