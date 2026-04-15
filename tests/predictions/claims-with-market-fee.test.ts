import { Cl, principalCV, uintCV } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { alice, bob, constructDao, deployer, metadataHash, stxToken } from '../dao_helpers';

async function createBinaryMarketWithFees(marketId: number, fee: number, creator?: string, token?: string) {
	let response = simnet.callPublicFn(
		'bme024-0-market-predicting',
		'create-market',
		[
			Cl.list([Cl.stringAscii('nay'), Cl.stringAscii('yay')]),
			Cl.some(Cl.uint(fee)),
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
async function predictCategory(user: string, marketId: number, category: string, amount: number, code: number, token?: string) {
	let response = simnet.callPublicFn(
		'bme024-0-market-predicting',
		'predict-category',
		[Cl.uint(marketId), Cl.uint(amount), Cl.stringAscii(category), Cl.principal(token ? token : stxToken), Cl.uint(amount * 2)],
		user
	);
	if (code > 10) {
		if (code === 12) {
			expect(response.result).toEqual(Cl.error(Cl.uint(2)));
		} else {
			expect(response.result).toEqual(Cl.error(Cl.uint(code)));
		}
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.uint(code)));
	}
	return response;
}

/*
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/

describe('successful claim', () => {
	it('bob wins 50% of pool', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarketWithFees(0, 200, deployer, stxToken);
		response = await predictCategory(bob, 0, 'yay', 5000, 1);
		response = await predictCategory(alice, 0, 'yay', 5000, 1);

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

		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(19393n)));

		stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		//silence: console.log('contractBalance 272: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));

		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(19397n)));
		stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		//silence: console.log('contractBalance 285: ' + stxBalances?.get(deployer + '.bme024-0-market-predicting'));
	});
});
