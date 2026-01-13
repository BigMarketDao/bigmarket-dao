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
	developer,
	fred,
	marketPredictingCPMM,
	metadataHash,
	piedro,
	stxToken,
	tom,
	wallace
} from '../dao_helpers';

describe('claiming errors', () => {
	it('err too few categories', async () => {
		await constructDao(simnet);
		let response = simnet.callPublicFn(
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
		await createCategoricalMarket(0);
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
		await predictCategory(alice, 0, 'lion', 1000, 0);
	});
	it('res agent cannot stake', async () => {
		await createCategoricalMarket(0);
		await predictCategory(tom, 0, 'lion', 1000, 12);
	});

	it('create and stake spread ok', async () => {
		await createCategoricalMarket(0);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await predictCategory(bob, 0, 'tiger', 1000, 1);
		await predictCategory(betty, 0, 'cheetah', 1000, 2);
	});

	it('resolve ok', async () => {
		await createCategoricalMarket(0);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await predictCategory(bob, 0, 'tiger', 1000, 1);
		await predictCategory(betty, 0, 'cheetah', 1000, 2);
		await resolveMarket(0, 'cheetah', 2);
	});

	it('resolve undisputed requires window to elapse', async () => {
		await createCategoricalMarket(0);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await predictCategory(bob, 0, 'tiger', 1000, 1);
		await predictCategory(betty, 0, 'cheetah', 1000, 2);
		await resolveMarket(0, 'cheetah', 2);
		simnet.mineEmptyBlocks(10);
		await resolveMarketUndisputed(0, 10019);
	});

	it('resolve undisputed requires window to elapse', async () => {
		await createCategoricalMarket(0);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await predictCategory(bob, 0, 'tiger', 1000, 1);
		await predictCategory(betty, 0, 'cheetah', 1000, 2);
		await resolveMarket(0, 'cheetah', 2);
		simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
	});

	it('resolve undisputed requires window to elapse', async () => {
		await createCategoricalMarket(0);
		await predictCategory(alice, 0, 'lion', 1000000, 0);
		await predictCategory(bob, 0, 'tiger', 1000000, 1);
		await predictCategory(betty, 0, 'cheetah', 1000000, 2);
		await resolveMarket(0, 'cheetah', 2);
		simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
		assertContractBalance(simnet, marketPredictingCPMM, 102970000n);
	});

	it('claim err-user-not-winner-or-claimed', async () => {
		await createCategoricalMarket(0, deployer, undefined, 10000);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await predictCategory(bob, 0, 'tiger', 1000, 1);
		await predictCategory(betty, 0, 'cheetah', 1000, 2);
		await resolveMarket(0, 'cheetah', 2);
		simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
		assertContractBalance(simnet, marketPredictingCPMM, 12970n);
		await claim(fred, 0, 80, 10008);
	});

	it('claim loser ok', async () => {
		await createCategoricalMarket(0);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await predictCategory(bob, 0, 'tiger', 1000, 1);
		await predictCategory(betty, 0, 'cheetah', 1000, 2);
		await resolveMarket(0, 'cheetah', 2);
		simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
		assertContractBalance(simnet, marketPredictingCPMM, 100002970n);
		await claim(alice, 0, 80, 10006);
	});

	it('claim winner ok', async () => {
		await createCategoricalMarket(0, deployer, undefined, 9999);
		let response = await predictCategory(alice, 0, 'lion', 333, 0, stxToken, 10000);
		// console.log('claim winner ok', response.events);
		response = await predictCategory(bob, 0, 'tiger', 333, 1, stxToken, 10000);
		// console.log('claim winner ok', response.events);
		response = await predictCategory(betty, 0, 'cheetah', 333, 2, stxToken, 10000);
		// console.log('claim winner ok', response.events);
		const result = await resolveMarket(0, 'cheetah', 2);

		await printMarketBalances(alice, 0);

		await printMarketBalances(alice, 0);
		await printMarketBalances(bob, 0);
		await printMarketBalances(betty, 0);

		simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
		assertContractBalance(simnet, marketPredictingCPMM, 39699n);
		assertDataVarNumber(simnet, marketPredictingCPMM, 'dev-fee-bips', 100);
		assertDataVarNumber(simnet, marketPredictingCPMM, 'market-fee-bips-max', 300);

		// claim for the treasury seed fund
		response = simnet.callPublicFn('bme006-0-treasury', 'claim-for-dao', [Cl.principal(deployer + '.bme024-0-market-predicting'), Cl.uint(0), Cl.principal(stxToken)], bob);
		// console.log('claim winner ok', response.events);
		expect(response.result).toEqual(Cl.ok(Cl.uint(7124)));

		await claim(betty, 0, 32574);
		assertContractBalance(simnet, marketPredictingCPMM, 1n);
	});

	it('claim winner ok', async () => {
		await createCategoricalMarket(0, deployer, undefined, 9999);

		let response = await predictCategory(deployer, 0, 'lion', 333, 0, stxToken, 10000);
		response = await predictCategory(alice, 0, 'tiger', 333, 1, stxToken, 10000);
		response = await predictCategory(bob, 0, 'cheetah', 333, 2, stxToken, 10000);
		// response = await predictCategory(tom, 0, 'lion', 3333, 0);
		response = await predictCategory(betty, 0, 'tiger', 333, 1, stxToken, 10000);
		response = await predictCategory(fred, 0, 'cheetah', 333, 2, stxToken, 10000);
		response = await predictCategory(wallace, 0, 'lion', 333, 0, stxToken, 10000);
		response = await predictCategory(piedro, 0, 'tiger', 333, 1, stxToken, 10000);
		response = await predictCategory(developer, 0, 'cheetah', 333, 2, stxToken, 10000);

		const result = await resolveMarket(0, 'cheetah', 2);

		await printMarketBalances(alice, 0);

		await printMarketBalances(alice, 0);
		await printMarketBalances(bob, 0);
		await printMarketBalances(betty, 0);

		simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
		assertContractBalance(simnet, marketPredictingCPMM, 89199n);
		assertDataVarNumber(simnet, marketPredictingCPMM, 'dev-fee-bips', 100);
		assertDataVarNumber(simnet, marketPredictingCPMM, 'market-fee-bips-max', 300);

		// claim for the treasury seed fund
		response = simnet.callPublicFn('bme006-0-treasury', 'claim-for-dao', [Cl.principal(deployer + '.bme024-0-market-predicting'), Cl.uint(0), Cl.principal(stxToken)], bob);
		// console.log('claim winner ok', response.events);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5927)));

		await claim(fred, 0, 20094);
		await claim(bob, 0, 27101);
		await claim(developer, 0, 36075);
		await claim(alice, 0, 80, 10006);
		await claim(betty, 0, 80, 10006);
		assertContractBalance(simnet, marketPredictingCPMM, 2n);
	});
});

/*
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/
async function printMarketBalances(user: string, marketId: number) {
	let data = simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-market-data', [Cl.uint(marketId)], user);
	// console.log('MarketBalances ---> categories', data.result as any);
	// console.log('MarketBalances ---> categories', (data.result as any).value.value.categories);
	// console.log('MarketBalances ---> outcome', (data.result as any).value.value.outcome.value?.value);
	// console.log('MarketBalances ---> stakes', (data.result as any).value.value.stakes);
	// console.log('MarketBalances ---> stake-tokens', (data.result as any).value.value['stake-tokens']);
}

async function printStakeBalances(user: string, marketId: number) {
	let data = simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-stake-balances', [Cl.uint(marketId), Cl.principal(user)], alice);
	//console.log("get-stake-balances: " + user, (data.result as any).value)
}
export async function createBinaryMarketWithGating(marketId: number, proof: any, key?: any, creator?: string, token?: string, fee?: number) {
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
export async function createBinaryMarketWithFees(marketId: number, fee: number, creator?: string, token?: string) {
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
export async function createBinaryMarketWithErrorCode(errorCode: number, fee?: number, creator?: string, token?: string) {
	let response = simnet.callPublicFn(
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
async function createCategoricalMarket(marketId: number, creator?: string, token?: string, seed?: number) {
	await constructDao(simnet);
	let response = simnet.callPublicFn(
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
			Cl.uint(seed ? seed : 100000000),
			Cl.none()
		],
		creator ? creator : deployer
	);
	expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
}
async function predictCategory(user: string, marketId: number, category: string, amount: number, code: number, token?: string, maxCost?: number) {
	let response = simnet.callPublicFn(
		'bme024-0-market-predicting',
		'predict-category',
		[Cl.uint(marketId), Cl.uint(amount), Cl.stringAscii(category), Cl.principal(token ? token : stxToken), Cl.uint(maxCost ? maxCost : amount)],
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
	let response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(marketId), Cl.stringAscii(category)], bob);
	expect(response.result).toEqual(Cl.ok(Cl.uint(winner)));
	return response;
}
async function resolveMarketUndisputed(marketId: number, code?: number) {
	let response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market-undisputed', [Cl.uint(marketId)], bob);
	if (code) {
		expect(response.result).toEqual(Cl.error(Cl.uint(code)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
	}
}
async function claim(user: string, marketId: number, share: number, code?: number) {
	let response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(marketId), Cl.principal(stxToken)], user);
	if (code) {
		expect(response.result).toEqual(Cl.error(Cl.uint(code)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.uint(share)));
	}
}
