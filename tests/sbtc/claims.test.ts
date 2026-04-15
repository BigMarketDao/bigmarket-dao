import { Cl, principalCV, uintCV } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { createBinaryMarket, predictCategory } from '../categorical/categorical.test';
import { alice, bob, constructDao, deployer, sbtcToken } from '../dao_helpers';

/*
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/

describe('claiming errors', () => {
	it('err-market-not-found', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, sbtcToken);
		// not deployer
		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(1), Cl.principal(sbtcToken)], deployer);
		expect(response.result).toEqual(Cl.error(Cl.uint(10005)));
	});

	it('err-user-balance-unknown', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, sbtcToken);
		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(10009)));
	});

	it('err-market-not-concluded', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, sbtcToken);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = await predictCategory(alice, 0, 'yay', 2000000, 1, sbtcToken);
		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(10009)));
	});

	it('err-user-not-winner', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, sbtcToken);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = await predictCategory(bob, 0, 'nay', 2000000, 0, sbtcToken);
		simnet.mineEmptyBlocks(288);
		response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('yay')], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(1)));
		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], bob);
		expect(response.result).toEqual(Cl.error(Cl.uint(10009)));
	});

	it('err-winning-pool-is-zero', async () => {
		// unreachable
	});

	it('err-market-not-concluded', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, sbtcToken);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = await predictCategory(bob, 0, 'nay', 2000000, 0, sbtcToken);
		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], bob);
		expect(response.result).toEqual(Cl.error(Cl.uint(10009)));
	});
});

describe('successful claim', () => {
	it('bob wins 50% of pool', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, sbtcToken);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = await predictCategory(bob, 0, 'yay', 5000, 1, sbtcToken);
		response = await predictCategory(alice, 0, 'yay', 5000, 1, sbtcToken);

		let aliceStake = simnet.getMapEntry(
			'bme024-0-market-predicting',
			'stake-balances',
			Cl.tuple({
				'market-id': uintCV(0),
				user: principalCV(alice)
			})
		);
		expect(aliceStake).toEqual(Cl.some(Cl.list([Cl.uint(0), Cl.uint(9896n), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)])));

		simnet.mineEmptyBlocks(288);
		response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('yay')], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(1)));

		simnet.mineEmptyBlocks(10);
		response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market-undisputed', [Cl.uint(0)], deployer);
		expect(response.result).toEqual(Cl.error(Cl.uint(10019)));

		simnet.mineEmptyBlocks(145);
		response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market-undisputed', [Cl.uint(0)], deployer);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));

		let data = simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-stake-balances', [Cl.uint(0), Cl.principal(alice)], alice);
		expect(data.result).toEqual(Cl.ok(Cl.list([Cl.uint(0), Cl.uint(9896n), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)])));
		let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		//silence: console.log('contractBalance 215: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));

		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(19788n)));

		stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		//silence: console.log('contractBalance 228: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));

		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(sbtcToken)], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(19792n)));
		stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		//silence: console.log('contractBalance 242: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));
	});
});
