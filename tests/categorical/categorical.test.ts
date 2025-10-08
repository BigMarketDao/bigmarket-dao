import { Cl } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import {
	alice,
	assertContractBalance,
	assertDataVarNumber,
	betty,
	bob,
	constructDao,
	deployer,
	fred,
	marketPredictingCPMM,
	metadataHash,
	reputationSft,
	setupSimnet,
	stxToken,
	tom
} from '../helpers';
// SP3Y12HJYP2NMNAFHWBPM2CMYDHYXME1F45GASVBG.bme021-0-market-voting

// SP3Y12HJYP2NMNAFHWBPM2CMYDHYXME1F45GASVBG.bme000-0-governance-token
// SP3Y12HJYP2NMNAFHWBPM2CMYDHYXME1F45GASVBG.bme001-0-proposal-voting
// SP3Y12HJYP2NMNAFHWBPM2CMYDHYXME1F45GASVBG.bme003-0-core-proposals
// SP3Y12HJYP2NMNAFHWBPM2CMYDHYXME1F45GASVBG.bme006-0-treasury
// SP3Y12HJYP2NMNAFHWBPM2CMYDHYXME1F45GASVBG.bme010-0-liquidity-contribution
// SP3Y12HJYP2NMNAFHWBPM2CMYDHYXME1F45GASVBG.bme022-0-market-gating
// SP3Y12HJYP2NMNAFHWBPM2CMYDHYXME1F45GASVBG.bme024-0-market-scalar-pyth
// SP3Y12HJYP2NMNAFHWBPM2CMYDHYXME1F45GASVBG.bme024-0-market-predicting
// SP3Y12HJYP2NMNAFHWBPM2CMYDHYXME1F45GASVBG.bme030-0-reputation-token
// SP3Y12HJYP2NMNAFHWBPM2CMYDHYXME1F45GASVBG.bme032-0-scalar-strategy-hedge

const simnet = await setupSimnet();

async function assertBalance(user: string, tier: number, balance: number) {
	let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(tier), Cl.principal(user)], user);
	expect(bal.result).toEqual(Cl.ok(Cl.uint(balance * 2)));
}

describe('claiming errors', () => {
	it('err too few categories', async () => {
		await constructDao(simnet);
		let response = await simnet.callPublicFn(
			'bme024-0-market-predicting',
			'create-market',
			[
				Cl.list([Cl.stringAscii('lion')]),
				Cl.none(),
				Cl.principal(stxToken),
				Cl.bufferFromHex(metadataHash()),
				Cl.list([]),
				Cl.principal(`${deployer}.bme022-0-market-gating`),
				Cl.none(),
				Cl.none(),
				Cl.uint(100000000),
				Cl.none()
			],
			deployer
		);
		expect(response.result).toEqual(Cl.error(Cl.uint(10024)));
	});

	it('create binary market ok', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
	});

	it('create ok', async () => {
		let response = await createCategoricalMarket(0);
		//silence: console.log('=======createCategoricalMarket===========================================');
		//silence: console.log(response.result);
		//silence: console.log(simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(6), Cl.principal(deployer)], deployer));
		//silence: console.log('=======createCategoricalMarket===========================================');

		//await assertBalance(deployer, 6, 4);
	});

	it('create and stake not ok on unknown category', async () => {
		await createCategoricalMarket(0);
		//await assertBalance(deployer, 6, 4);
		await createCategoricalMarket(1);
		//await assertBalance(deployer, 6, 8);
		await predictCategory(alice, 0, 'lionness', 1000, 10023);
	});

	it('create and stake ok', async () => {
		await createCategoricalMarket(0);
		await createCategoricalMarket(1);
		await predictCategory(alice, 0, 'lion', 1000, 0);
	});
	it('res agent cannot stake', async () => {
		await createCategoricalMarket(0);
		await createCategoricalMarket(1);
		await predictCategory(tom, 0, 'lion', 1000, 12);
	});

	it('create and stake spread ok', async () => {
		await createCategoricalMarket(0);
		await createCategoricalMarket(1);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await predictCategory(bob, 0, 'tiger', 1000, 1);
		await predictCategory(betty, 0, 'cheetah', 1000, 2);
	});

	it('resolve ok', async () => {
		await createCategoricalMarket(0);
		await createCategoricalMarket(1);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await predictCategory(bob, 0, 'tiger', 1000, 1);
		await predictCategory(betty, 0, 'cheetah', 1000, 2);
		await resolveMarket(0, 'cheetah', 2);
	});

	it('resolve undisputed requires window to elapse', async () => {
		await createCategoricalMarket(0);
		await createCategoricalMarket(1);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await predictCategory(bob, 0, 'tiger', 1000, 1);
		await predictCategory(betty, 0, 'cheetah', 1000, 2);
		await resolveMarket(0, 'cheetah', 2);
		await simnet.mineEmptyBlocks(10);
		await resolveMarketUndisputed(0, 10019);
	});

	it('resolve undisputed requires window to elapse', async () => {
		await createCategoricalMarket(0);
		await createCategoricalMarket(1);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await predictCategory(bob, 0, 'tiger', 1000, 1);
		await predictCategory(betty, 0, 'cheetah', 1000, 2);
		await resolveMarket(0, 'cheetah', 2);
		await simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
	});

	it('resolve undisputed requires window to elapse', async () => {
		await createCategoricalMarket(0);
		await createCategoricalMarket(1);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await predictCategory(bob, 0, 'tiger', 1000, 1);
		await predictCategory(betty, 0, 'cheetah', 1000, 2);
		await resolveMarket(0, 'cheetah', 2);
		await simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
		assertContractBalance(marketPredictingCPMM, 200005940n);
	});

	it('claim err-user-not-winner-or-claimed', async () => {
		await createCategoricalMarket(0);
		await createCategoricalMarket(1);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await predictCategory(bob, 0, 'tiger', 1000, 1);
		await predictCategory(betty, 0, 'cheetah', 1000, 2);
		await resolveMarket(0, 'cheetah', 2);
		await simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
		assertContractBalance(marketPredictingCPMM, 200005940n);
		await claim(fred, 0, 80, 10008);
	});

	it('claim loser ok', async () => {
		await createCategoricalMarket(0);
		await createCategoricalMarket(1);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await predictCategory(bob, 0, 'tiger', 1000, 1);
		await predictCategory(betty, 0, 'cheetah', 1000, 2);
		await resolveMarket(0, 'cheetah', 2);
		await simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
		assertContractBalance(marketPredictingCPMM, 200005940n);
		await claim(alice, 0, 80, 10006);
	});

	it('claim winner ok', async () => {
		await createCategoricalMarket(0);
		await createCategoricalMarket(1);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await predictCategory(bob, 0, 'tiger', 1000, 1);
		await predictCategory(betty, 0, 'cheetah', 1000, 2);
		const result = await resolveMarket(0, 'cheetah', 2);
		//console.log("claim winner ok",result.events[0].data.value)

		await printMarketBalances(alice, 0);

		await printMarketBalances(alice, 0);
		await printMarketBalances(bob, 0);
		await printMarketBalances(betty, 0);

		await simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
		assertContractBalance(marketPredictingCPMM, 200005940n);
		assertDataVarNumber(marketPredictingCPMM, 'dev-fee-bips', 100);
		assertDataVarNumber(marketPredictingCPMM, 'dao-fee-bips', 150);
		assertDataVarNumber(marketPredictingCPMM, 'market-fee-bips-max', 300);

		await claim(betty, 0, 11882);
	});
});

/*
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/
async function printMarketBalances(user: string, marketId: number) {
	let data = await simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-market-data', [Cl.uint(marketId)], user);
	//console.log("categories", (data.result as any).value.data.categories)
	//console.log("outcome", (data.result as any).value.data.outcome)
	//console.log("stakes", (data.result as any).value.data.stakes)
}

async function printStakeBalances(user: string, marketId: number) {
	let data = await simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-stake-balances', [Cl.uint(marketId), Cl.principal(user)], alice);
	//console.log("get-stake-balances: " + user, (data.result as any).value)
}
export async function createBinaryMarketWithGating(marketId: number, proof: any, key?: any, creator?: string, token?: string, fee?: number) {
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
export async function createBinaryMarketWithFees(marketId: number, fee: number, creator?: string, token?: string) {
	let response = await simnet.callPublicFn(
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
export async function createBinaryMarketWithErrorCode(errorCode: number, fee?: number, creator?: string, token?: string) {
	let response = await simnet.callPublicFn(
		'bme024-0-market-predicting',
		'create-market',
		[
			Cl.list([Cl.stringAscii('lion'), Cl.stringAscii('tiger')]),
			fee ? Cl.some(Cl.uint(fee)) : Cl.none(),
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
	expect(response.result).toEqual(Cl.error(Cl.uint(errorCode)));
	return response;
}
export async function createBinaryMarket(marketId: number, creator?: string, token?: string) {
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
async function createCategoricalMarket(marketId: number, creator?: string, token?: string) {
	await constructDao(simnet);
	let response = await simnet.callPublicFn(
		'bme024-0-market-predicting',
		'create-market',
		[
			Cl.list([Cl.stringAscii('lion'), Cl.stringAscii('tiger'), Cl.stringAscii('cheetah')]),
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
export async function predictCategory(user: string, marketId: number, category: string, amount: number, code: number, token?: string) {
	let response = await simnet.callPublicFn(
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
async function resolveMarket(marketId: number, category: string, winner: number, token?: string) {
	simnet.mineEmptyBlocks(288);
	let response = await simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(marketId), Cl.stringAscii(category)], bob);
	expect(response.result).toEqual(Cl.ok(Cl.uint(winner)));
	return response;
}
async function resolveMarketUndisputed(marketId: number, code?: number) {
	let response = await simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market-undisputed', [Cl.uint(marketId)], bob);
	if (code) {
		expect(response.result).toEqual(Cl.error(Cl.uint(code)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
	}
}
async function claim(user: string, marketId: number, share: number, code?: number) {
	let response = await simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(marketId), Cl.principal(stxToken)], user);
	if (code) {
		expect(response.result).toEqual(Cl.error(Cl.uint(code)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.uint(share)));
	}
}
