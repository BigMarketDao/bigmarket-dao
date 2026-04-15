import { boolCV, Cl, listCV, principalCV, someCV, stringAsciiCV, uintCV } from '@stacks/transactions';
import { bufferFromHex } from '@stacks/transactions/dist/cl';
import { describe, expect, it } from 'vitest';
import { createBinaryMarket, createBinaryMarketWithGating, predictCategory } from '../categorical/categorical.test';
import { alice, annie, betty, bob, constructDao, deployer, developer, metadataHash, passProposalByCoreVote, stxToken, tom, wallace } from '../dao_helpers';
import { generateMerkleProof, generateMerkleTreeUsingStandardPrincipal, proofToClarityValue } from '../gating/gating';
import { resolveUndisputed } from './helpers_staking';

/* 
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/

describe('check actual claims vs expected for some scenarios', () => {
	it('Alice stake 100STX on YES, market resolves yes', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(alice, 0, 'yay', 100000, 1);
		await resolveUndisputed(0, true);

		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(393666n)));
	});

	it('Alice stakes 100STX on yes, Bob 100STX on NO market resolves yes', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(alice, 0, 'yay', 10000, 1);
		response = await predictCategory(bob, 0, 'nay', 10000, 0);

		await resolveUndisputed(0, true);

		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(39584n)));

		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], bob);
		expect(response.result).toEqual(Cl.error(Cl.uint(10006)));
	});

	it('Alice stakes 100 STX on YES, Bob stakes 50 STX on YES, Tom stakes 200 STX on NO, Annie stakes 20 STX on NO, market resolves NO', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote(`bdp001-gating`);
		const allowedCreators = [alice, bob, tom, betty, wallace];
		const { tree, root } = generateMerkleTreeUsingStandardPrincipal(allowedCreators);
		let merdat = generateMerkleProof(tree, alice);
		let response = await createBinaryMarketWithGating(0, proofToClarityValue(merdat.proof), metadataHash(), alice, stxToken);
		response = await predictCategory(alice, 0, 'yay', 10000, 1);
		response = await predictCategory(bob, 0, 'yay', 5000, 1);
		response = await predictCategory(developer, 0, 'nay', 20000, 0);
		response = await predictCategory(annie, 0, 'nay', 20000, 0);

		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		await resolveUndisputed(0, false);
		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(10006)));
		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], bob);
		let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		//silence: console.log('contractBalance: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));
		expect(response.result).toEqual(Cl.error(Cl.uint(10006)));
		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], developer);
		expect(response.result).toEqual(Cl.ok(Cl.uint(79144n)));
		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], annie);
		expect(response.result).toEqual(Cl.ok(Cl.uint(79080n)));
		stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		//silence: console.log('contractBalance: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));
	});
});

it('Alice stakes 100 STX on YES, Bob stakes 50 STX on YES, Tom stakes 200 STX on NO, Annie stakes 20 STX on NO, market resolves NO', async () => {
	await constructDao(simnet);
	let response = await createBinaryMarket(0, deployer, stxToken);
	response = await predictCategory(alice, 0, 'nay', 100000, 0, stxToken);
	response = await predictCategory(bob, 0, 'nay', 5000000, 0, stxToken);
	response = await predictCategory(developer, 0, 'nay', 200000, 0, stxToken);
	response = await predictCategory(annie, 0, 'nay', 200000, 0, stxToken);

	expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
	await resolveUndisputed(0, false);
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], alice);
	expect(response.result).toEqual(Cl.ok(Cl.uint(370012n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], bob);
	let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
	//silence: console.log('contractBalance: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));
	expect(response.result).toEqual(Cl.ok(Cl.uint(15453197n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], developer);
	expect(response.result).toEqual(Cl.ok(Cl.uint(631442n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], annie);
	expect(response.result).toEqual(Cl.ok(Cl.uint(627851n)));
	stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
	//silence: console.log('contractBalance: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));
});

it('Alice stakes 100 STX on YES, Bob stakes 50 STX on YES, Tom stakes 200 STX on NO, Annie stakes 20 STX on NO, market resolves NO', async () => {
	await constructDao(simnet);
	let response = await createBinaryMarket(0, deployer, stxToken);
	response = await createBinaryMarket(1, deployer, stxToken);

	response = await predictCategory(alice, 0, 'nay', 100000, 0, stxToken);
	response = await predictCategory(bob, 0, 'nay', 5000000, 0, stxToken);
	response = await predictCategory(developer, 0, 'nay', 200000, 0, stxToken);
	response = await predictCategory(annie, 0, 'nay', 200000, 0, stxToken);
	response = await predictCategory(alice, 1, 'nay', 100, 0, stxToken);
	response = await predictCategory(bob, 1, 'nay', 5000000, 0, stxToken);
	response = await predictCategory(developer, 1, 'nay', 200000, 0, stxToken);
	response = await predictCategory(annie, 1, 'nay', 200000, 0, stxToken);

	await resolveUndisputed(0, false);
	await resolveUndisputed(1, false);

	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], alice);
	expect(response.result).toEqual(Cl.ok(Cl.uint(370012n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], bob);
	let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
	//silence: console.log('contractBalance: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));
	expect(response.result).toEqual(Cl.ok(Cl.uint(15453197n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], developer);
	expect(response.result).toEqual(Cl.ok(Cl.uint(631442n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], annie);
	expect(response.result).toEqual(Cl.ok(Cl.uint(627851n)));
	stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
	//silence: console.log('contractBalance: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));

	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(1), Cl.principal(stxToken)], alice);
	expect(response.result).toEqual(Cl.ok(Cl.uint(369n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(1), Cl.principal(stxToken)], bob);
	stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
	//silence: console.log('contractBalance: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));
	expect(response.result).toEqual(Cl.ok(Cl.uint(15520483n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(1), Cl.principal(stxToken)], developer);
	let data = simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-market-data', [Cl.uint(0)], alice);
	expect(data.result).toMatchObject(
		Cl.some(
			Cl.tuple({
				creator: principalCV(deployer),
				'market-data-hash': bufferFromHex(metadataHash()),
				stakes: listCV([uintCV(59105085n), uintCV(50000000n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
				categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
				outcome: someCV(uintCV(0)),
				'resolution-state': uintCV(3),
				concluded: boolCV(true)
			})
		)
	);
	data = simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-stake-balances', [Cl.uint(1), Cl.principal(annie)], annie);
	expect(data.result).toEqual(Cl.ok(Cl.list([Cl.uint(335607n), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)])));
	stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
	//silence: console.log('contractBalance 32: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));

	expect(response.result).toEqual(Cl.ok(Cl.uint(633944n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(1), Cl.principal(stxToken)], annie);
	expect(response.result).toEqual(Cl.ok(Cl.uint(630317n)));
	stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
	//silence: console.log('contractBalance 32: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));
});
