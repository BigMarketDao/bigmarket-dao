import { boolCV, Cl, listCV, noneCV, principalCV, stringAsciiCV, uintCV } from '@stacks/transactions';
import { bufferFromHex } from '@stacks/transactions/dist/cl';
import { describe, expect, it } from 'vitest';
import { createBinaryMarket, predictCategory } from '../categorical/categorical.test';
import { constructDao, metadataHash, sbtcToken } from '../dao_helpers';

const accounts = simnet.getAccounts();
const alice = accounts.get('wallet_1')!;
const bob = accounts.get('wallet_2')!;
const deployer = accounts.get('deployer')!;

/*
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/

describe('prediction errors', () => {
	it("user can't commit if slippage too high", async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, sbtcToken);
		response = await predictCategory(alice, 0, 'yay', 90071992547, 10031, sbtcToken);
	});
});

describe('prediction fees and stakes', () => {
	it('user transfers exact stake', async () => {
		await constructDao(simnet);
		let balances = simnet.getAssetsMap().get('STX');
		// console.log("prediction fees and stakes:", balances);

		let response = await createBinaryMarket(0, deployer, sbtcToken);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = await predictCategory(alice, 0, 'yay', 2000000, 1, sbtcToken);
		balances = simnet.getAssetsMap().get('STX');

		response = await predictCategory(bob, 0, 'nay', 10000000, 0, sbtcToken);
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
					'hedge-executor': noneCV(),
					hedged: boolCV(false),
					'cool-down-period': uintCV(144),
					'market-duration': uintCV(144),
					concluded: boolCV(false),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'sbtc'),
					treasury: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'bme022-0-market-gating')
				})
			)
		);
	});

	it('fees are collected up front from prediction stakes', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, sbtcToken);
		response = await predictCategory(alice, 0, 'yay', 2000000, 1, sbtcToken);
		response = await predictCategory(bob, 0, 'nay', 10000000, 0, sbtcToken);
		const data = simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-market-data', [Cl.uint(0)], alice);
		expect(data.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					'stake-tokens': listCV([uintCV(69800000n), uintCV(53960000n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					stakes: listCV([uintCV(65224266n), uintCV(53669384n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: noneCV(),
					'market-data-hash': bufferFromHex(metadataHash()),
					'resolution-burn-height': uintCV(0),
					'resolution-state': uintCV(0),
					'market-fee-bips': uintCV(0),
					concluded: boolCV(false),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'sbtc'),
					treasury: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'bme022-0-market-gating')
				})
			)
		);
	});

	it('alice hedges yes and no', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, sbtcToken);
		response = await predictCategory(alice, 0, 'yay', 2000000, 1, sbtcToken);

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

		response = await predictCategory(alice, 0, 'nay', 4000000, 0, sbtcToken);

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
