import { describe, expect, it } from 'vitest';
import { Cl, principalCV, uintCV } from '@stacks/transactions';
import { alice, bob, constructDao, deployer, metadataHash, setupSimnet, stxToken } from '../helpers';
import { createBinaryMarket, predictCategory } from '../categorical/categorical.test';

const simnet = await setupSimnet();

/*
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/

describe('claiming errors', () => {
	it('err-market-not-found', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
		// not deployer
		response = await simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(1), Cl.principal(stxToken)], deployer);
		expect(response.result).toEqual(Cl.error(Cl.uint(10005)));
	});

	it('err-market-not-concluded', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(10009)));
	});

	it('err-market-not-concluded', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(alice, 0, 'yay', 2000000, 1);
		response = await simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(10009)));
	});

	it('err-user-not-winner', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(bob, 0, 'nay', 2000000, 0, stxToken);
		await simnet.mineEmptyBlocks(288);
		response = await simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('nay')], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = await simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], bob);
		expect(response.result).toEqual(Cl.error(Cl.uint(10009)));
	});
});

describe('successful claim', () => {
	it('bob wins 50% of pool', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(bob, 0, 'yay', 5000, 1);
		response = await predictCategory(alice, 0, 'yay', 5000, 1);

		let aliceStake = await simnet.getMapEntry(
			'bme024-0-market-predicting',
			'stake-balances',
			Cl.tuple({
				'market-id': uintCV(0),
				user: principalCV(alice)
			})
		);
		expect(aliceStake).toEqual(Cl.some(Cl.list([Cl.uint(0), Cl.uint(9897n), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)])));

		await simnet.mineEmptyBlocks(288);
		response = await simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('yay')], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(1)));

		await simnet.mineEmptyBlocks(10);
		response = await simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market-undisputed', [Cl.uint(0)], deployer);
		expect(response.result).toEqual(Cl.error(Cl.uint(10019)));

		await simnet.mineEmptyBlocks(145);
		response = await simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market-undisputed', [Cl.uint(0)], deployer);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));

		let data = await simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-stake-balances', [Cl.uint(0), Cl.principal(alice)], alice);
		expect(data.result).toEqual(Cl.ok(Cl.list([Cl.uint(0), Cl.uint(9897n), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)])));
		let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		console.log('contractBalance 215: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));

		response = await simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(19790n)));

		stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		console.log('contractBalance 272: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));

		response = await simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(19794n)));
		stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		console.log('contractBalance 285: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));
	});
});
