import { boolCV, Cl, listCV, principalCV, someCV, stringAsciiCV, uintCV } from '@stacks/transactions';
import { bufferFromHex } from '@stacks/transactions/dist/cl';
import { describe, expect, it } from 'vitest';
import { createBinaryMarket, createBinaryMarketWithGating, predictCategory } from '../categorical/categorical.test';
import { alice, annie, betty, bob, constructDao, deployer, developer, metadataHash, passProposalByCoreVote, sbtcToken, tom, wallace } from '../dao_helpers';
import { generateMerkleProof, generateMerkleTreeUsingStandardPrincipal, proofToClarityValue } from '../gating/gating';
import { resolveUndisputed } from '../predictions/helpers_staking';

/*
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/

describe('check actual claims vs expected for some scenarios', () => {
	it('Alice stake 100STX on YES, market resolves yes', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, sbtcToken);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = await predictCategory(alice, 0, 'yay', 1000000, 1, sbtcToken);
		await resolveUndisputed(0, true);

		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3742037n)));
	});

	it('Alice stakes 100STX on yes, Bob 100STX on NO market resolves yes', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, sbtcToken);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = await predictCategory(alice, 0, 'yay', 1000000, 1, sbtcToken);
		response = await predictCategory(bob, 0, 'nay', 1000000, 0, sbtcToken);
		simnet.mineEmptyBlocks(145);
		await resolveUndisputed(0, true);

		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3814691n)));

		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], bob);
		expect(response.result).toEqual(Cl.error(Cl.uint(10006)));
	});

	it('Alice stakes 100 STX on YES, Bob stakes 50 STX on YES, Tom stakes 200 STX on NO, Annie stakes 20 STX on NO, market resolves NO', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote(`bdp001-gating`);
		const allowedCreators = [alice, bob, tom, betty, wallace];
		const { tree, root } = generateMerkleTreeUsingStandardPrincipal(allowedCreators);
		let merdat = generateMerkleProof(tree, alice);
		let response = await createBinaryMarketWithGating(0, proofToClarityValue(merdat.proof), metadataHash(), alice, sbtcToken);
		response = await predictCategory(alice, 0, 'yay', 1000000, 1, sbtcToken);
		response = await predictCategory(bob, 0, 'yay', 500000, 1, sbtcToken);
		response = await predictCategory(developer, 0, 'nay', 2000000, 0, sbtcToken);
		response = await predictCategory(annie, 0, 'nay', 200000, 0, sbtcToken);

		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		await resolveUndisputed(0, false);
		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(10006)));
		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], bob);
		let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		//silence: console.log('contractBalance: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));
		expect(response.result).toEqual(Cl.error(Cl.uint(10006)));
		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], developer);
		expect(response.result).toEqual(Cl.ok(Cl.uint(7669860n)));
		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], annie);
		expect(response.result).toEqual(Cl.ok(Cl.uint(762550n)));
		stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		//silence: console.log('contractBalance: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));
	});
});

it('Alice stakes 100 STX on YES, Bob stakes 50 STX on YES, Tom stakes 200 STX on NO, Annie stakes 20 STX on NO, market resolves NO', async () => {
	await constructDao(simnet);
	let response = await createBinaryMarket(0, deployer, sbtcToken);
	expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
	response = await predictCategory(alice, 0, 'nay', 10000000, 0, sbtcToken);
	response = await predictCategory(bob, 0, 'nay', 5000000, 0, sbtcToken);
	response = await predictCategory(developer, 0, 'nay', 200000, 0, sbtcToken);
	response = await predictCategory(annie, 0, 'nay', 200000, 0, sbtcToken);

	expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
	await resolveUndisputed(0, false);
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], alice);
	expect(response.result).toEqual(Cl.ok(Cl.uint(25914680n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], bob);
	let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
	//silence: console.log('contractBalance: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));
	expect(response.result).toEqual(Cl.ok(Cl.uint(12208166n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], developer);
	expect(response.result).toEqual(Cl.ok(Cl.uint(507665n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], annie);
	expect(response.result).toEqual(Cl.ok(Cl.uint(505694n)));
	stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
	//silence: console.log('contractBalance: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));
});

it('Alice stakes 100 STX on YES, Bob stakes 50 STX on YES, Tom stakes 200 STX on NO, Annie stakes 20 STX on NO, market resolves NO', async () => {
	await constructDao(simnet);
	let response = await createBinaryMarket(0, deployer, sbtcToken);
	response = await createBinaryMarket(1, deployer, sbtcToken);
	expect(response.result).toEqual(Cl.ok(Cl.uint(1)));

	response = await predictCategory(alice, 0, 'nay', 100000, 0, sbtcToken);
	response = await predictCategory(bob, 0, 'nay', 5000000, 0, sbtcToken);
	response = await predictCategory(developer, 0, 'nay', 20000000, 0, sbtcToken);
	response = await predictCategory(annie, 0, 'nay', 200000, 0, sbtcToken);

	response = await predictCategory(alice, 1, 'nay', 10000, 0, sbtcToken);
	response = await predictCategory(bob, 1, 'nay', 50000, 0, sbtcToken);
	response = await predictCategory(developer, 1, 'nay', 200000, 0, sbtcToken);
	response = await predictCategory(annie, 1, 'nay', 200000, 0, sbtcToken);

	await resolveUndisputed(0, false);
	await resolveUndisputed(1, false);

	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], alice);
	expect(response.result).toEqual(Cl.ok(Cl.uint(375263n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], bob);
	let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
	//silence: console.log('contractBalance: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));
	expect(response.result).toEqual(Cl.ok(Cl.uint(15672521n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], developer);
	expect(response.result).toEqual(Cl.ok(Cl.uint(38430592n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], annie);
	expect(response.result).toEqual(Cl.ok(Cl.uint(476735n)));
	stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
	//silence: console.log('contractBalance: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));

	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(1), Cl.principal(sbtcToken)], alice);
	expect(response.result).toEqual(Cl.ok(Cl.uint(39238n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(1), Cl.principal(sbtcToken)], bob);
	stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
	//silence: console.log('contractBalance: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));
	expect(response.result).toEqual(Cl.ok(Cl.uint(195806n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(1), Cl.principal(sbtcToken)], developer);
	let data = simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-market-data', [Cl.uint(0)], alice);
	expect(data.result).toMatchObject(
		Cl.some(
			Cl.tuple({
				creator: principalCV(deployer),
				'market-data-hash': bufferFromHex(metadataHash()),
				stakes: listCV([uintCV(78881520n), uintCV(50000000n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
				categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
				outcome: someCV(uintCV(0)),
				'resolution-state': uintCV(3),
				concluded: boolCV(true)
			})
		)
	);
	data = simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-stake-balances', [Cl.uint(1), Cl.principal(annie)], annie);
	expect(data.result).toEqual(Cl.ok(Cl.list([Cl.uint(388948n), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)])));
	stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
	//silence: console.log('contractBalance 32: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));

	expect(response.result).toEqual(Cl.ok(Cl.uint(777092n)));
	response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(1), Cl.principal(sbtcToken)], annie);
	expect(response.result).toEqual(Cl.ok(Cl.uint(771109n)));
	stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
	//silence: console.log('contractBalance 32: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));
});
