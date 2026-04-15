import { boolCV, Cl, listCV, noneCV, principalCV, stringAsciiCV, uintCV } from '@stacks/transactions';
import { bufferFromHex } from '@stacks/transactions/dist/cl';
import { describe, expect, it } from 'vitest';
import { createBinaryMarket, predictCategory } from '../categorical/categorical.test';
import { alice, bob, constructDao, deployer, metadataHash, reputationSft, stxToken } from '../dao_helpers';

async function assertBalance(user: string, tier: number, balance: number) {
	let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(tier), Cl.principal(user)], user);
	expect(bal.result).toEqual(Cl.ok(Cl.uint(balance * 2)));
}

/*
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/

describe('prediction errors', () => {
	it("user can't commit more than their balance", async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(alice, 0, 'yay', 9007199254, 10031);
	});

	it('err-already-concluded', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		//await assertBalance(deployer, 0, 0);

		response = await predictCategory(alice, 0, 'yay', 1000000, 1);
		// conclude
		simnet.mineEmptyBlocks(288);
		response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('yay')], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(1)));

		response = await predictCategory(alice, 0, 'yay', 1000000, 10018);
		//assertBalance(alice, 7, 4);
	});
});

describe('prediction fees and stakes', () => {
	it('user transfers exact stake', async () => {
		await constructDao(simnet);
		let balances = simnet.getAssetsMap().get('STX');
		// console.log("prediction fees and stakes:", balances);

		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(alice, 0, 'yay', 2000000, 1);

		balances = simnet.getAssetsMap().get('STX');

		expect(response.result).toEqual(Cl.ok(Cl.uint(1)));
		response = await predictCategory(bob, 0, 'nay', 10000000, 0);
		const data = simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-market-data', [Cl.uint(0)], alice);
		expect(data.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					'market-data-hash': bufferFromHex(metadataHash()),
					'stake-tokens': listCV([uintCV(69800000n), uintCV(53960000n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					stakes: listCV([uintCV(65224266n), uintCV(53669384n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: noneCV(),
					'resolution-burn-height': uintCV(0),
					'resolution-state': uintCV(0),
					'market-fee-bips': uintCV(0),
					concluded: boolCV(false),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx'),
					treasury: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'bme022-0-market-gating')
				})
			)
		);
	});

	it('fees are collected up front from prediction stakes', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(alice, 0, 'yay', 2000000, 1);
		response = await predictCategory(bob, 0, 'nay', 10000000, 0);
		const data = simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-market-data', [Cl.uint(0)], alice);
		expect(data.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					'market-data-hash': bufferFromHex(metadataHash()),
					'stake-tokens': listCV([uintCV(69800000n), uintCV(53960000n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					stakes: listCV([uintCV(65224266n), uintCV(53669384n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: noneCV(),
					'resolution-burn-height': uintCV(0),
					'resolution-state': uintCV(0),
					'market-fee-bips': uintCV(0),
					concluded: boolCV(false),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx'),
					treasury: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'bme022-0-market-gating')
				})
			)
		);
	});

	it('alice hedges yes and no', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(alice, 0, 'yay', 2000000, 1);

		// check stake
		let aliceStake = simnet.getMapEntry(
			'bme024-0-market-predicting',
			'stake-balances',
			Cl.tuple({
				'market-id': uintCV(0),
				user: principalCV(alice)
			})
		);
		expect(aliceStake).toEqual(
			Cl.some(Cl.list([Cl.uint(0), Cl.uint(3669384n), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)]))
		);

		response = await predictCategory(alice, 0, 'nay', 4000000, 0, stxToken);

		aliceStake = simnet.getMapEntry(
			'bme024-0-market-predicting',
			'stake-balances',
			Cl.tuple({
				'market-id': uintCV(0),
				user: principalCV(alice)
			})
		);
		expect(aliceStake).toEqual(
			Cl.some(Cl.list([Cl.uint(7338769n), Cl.uint(3669384n), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)]))
		);
	});
});
