import { Cl } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { alice, constructDao, deployer, marketScalingCPMM, metadataHash, reputationSft, stxToken } from '../dao_helpers';

const USD0 = '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43';
const USD1 = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';
const USD2 = '0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17';
const USD3 = '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';

async function assertBalance(user: string, tier: number, balance: number) {
	let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(tier), Cl.principal(user)], user);
	expect(bal.result).toEqual(Cl.ok(Cl.uint(balance * 2)));
}

const lion = 0;
const tiger = 1;
const cheetah = 2;

describe('claiming errors', () => {
	it('err too few categories', async () => {
		await constructDao(simnet);
		let response = simnet.callPublicFn(
			marketScalingCPMM,
			'create-market',
			[
				// Cl.list([Cl.tuple({ min: Cl.uint(100), max: Cl.uint(110) })]),
				Cl.none(),
				Cl.principal(stxToken),
				Cl.bufferFromHex(metadataHash()),
				Cl.list([]),
				Cl.principal(`${deployer}.bme022-0-market-gating`),
				Cl.none(),
				Cl.none(),
				Cl.bufferFromHex(USD0),
				Cl.uint(100000000),
				Cl.none()
			],
			deployer
		);
		//expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
	});

	it('create binary market ok', async () => {
		await constructDao(simnet);
		let data = simnet.callReadOnlyFn(marketScalingCPMM, 'get-price-band-width', [Cl.bufferFromHex(USD0)], alice);
		console.log('create binary market ok', data.result.value.value);
		await createBinaryMarket(0);
	});
});

// 	it('create ok', async () => {
// 		await createScalarMarket(0);
// 		//await assertBalance(deployer, 6, 4);
// 	});

// 	it('create and stake not ok on unknown category', async () => {
// 		await createScalarMarket(0);
// 		//await assertBalance(deployer, 6, 4);
// 		await createScalarMarket(1);
// 		//await assertBalance(deployer, 6, 8);
// 		await predictCategory(alice, 0, 6, 1000, 10023);
// 	});

// 	it('create and stake ok', async () => {
// 		await createScalarMarket(0);
// 		await predictCategory(alice, 0, lion, 1000, 0);
// 	});
// 	it('res agent cannot stake', async () => {
// 		await createScalarMarket(0);
// 		await predictCategory(tom, 0, lion, 1000, 12);
// 	});

// 	it('create and stake spread ok', async () => {
// 		await createScalarMarket(0);
// 		await predictCategory(alice, 0, lion, 1000, 0);
// 		await predictCategory(bob, 0, tiger, 1000, 1);
// 		await predictCategory(betty, 0, cheetah, 1000, 2);
// 	});

// 	it('resolve ok', async () => {
// 		await createScalarMarket(0);
// 		await predictCategory(alice, 0, lion, 1000, 0);
// 		await predictCategory(bob, 0, tiger, 1000, 1);
// 		await predictCategory(betty, 0, cheetah, 1000, 2);
// 		resolveMarket(0, 5);
// 	});

// 	it('resolve undisputed requires window to elapse', async () => {
// 		await createScalarMarket(0);
// 		await predictCategory(alice, 0, lion, 1000, 0);
// 		await predictCategory(bob, 0, tiger, 1000, 1);
// 		await predictCategory(betty, 0, cheetah, 1000, 2);
// 		resolveMarket(0, 5);
// 		simnet.mineEmptyBlocks(10);
// 		await resolveMarketUndisputed(0, 10019);
// 	});

// 	it('resolve undisputed requires window to elapse', async () => {
// 		await createScalarMarket(0);
// 		await predictCategory(alice, 0, lion, 1000, 0);
// 		await predictCategory(bob, 0, tiger, 1000, 1);
// 		await predictCategory(betty, 0, cheetah, 1000, 2);
// 		resolveMarket(0, 5);
// 		simnet.mineEmptyBlocks(25);
// 		await resolveMarketUndisputed(0);
// 	});

// 	it('resolve undisputed requires window to elapse', async () => {
// 		await createScalarMarket(0);
// 		await predictCategory(alice, 0, lion, 1000000, 0);
// 		await predictCategory(bob, 0, tiger, 1000000, 1);
// 		await predictCategory(betty, 0, cheetah, 1000000, 2);
// 		resolveMarket(0, 5);
// 		simnet.mineEmptyBlocks(25);
// 		await resolveMarketUndisputed(0);
// 		assertContractBalance(simnet, marketScalingCPMM, 102970000n);
// 	});

// 	it('claim err-user-not-winner-or-claimed', async () => {
// 		await createScalarMarket(0, deployer, undefined, 10000);
// 		await predictCategory(alice, 0, lion, 1000, 0);
// 		await predictCategory(bob, 0, tiger, 1000, 1);
// 		await predictCategory(betty, 0, cheetah, 1000, 2);
// 		resolveMarket(0, 5);
// 		simnet.mineEmptyBlocks(25);
// 		await resolveMarketUndisputed(0);
// 		assertContractBalance(simnet, marketScalingCPMM, 12970n);
// 		claim(fred, 0, 80, 10008);
// 	});

// 	it('claim loser ok', async () => {
// 		await createScalarMarket(0);
// 		await predictCategory(alice, 0, lion, 1000, 0);
// 		await predictCategory(bob, 0, tiger, 1000, 1);
// 		await predictCategory(betty, 0, cheetah, 1000, 2);
// 		resolveMarket(0, 5);
// 		simnet.mineEmptyBlocks(25);
// 		await resolveMarketUndisputed(0);
// 		assertContractBalance(simnet, marketScalingCPMM, 100002970n);
// 		claim(betty, 0, 80, 10006);
// 	});

// 	it('claim alice wins ok', async () => {
// 		await createScalarMarket(0);
// 		await predictCategory(alice, 0, 5, 1000, 5);
// 		await predictCategory(bob, 0, tiger, 1000, 1);
// 		await predictCategory(betty, 0, cheetah, 1000, 2);
// 		resolveMarket(0, 5);
// 		simnet.mineEmptyBlocks(25);
// 		await resolveMarketUndisputed(0);
// 		assertContractBalance(simnet, marketScalingCPMM, 100002970n);
// 		claim(alice, 0, 29692);
// 	});

// 	it('ensure share are more expensive when pool grows', async () => {
// 		await createScalarMarket(0);
// 		await predictCategory(alice, 0, 5, 1000, 5);
// 		await predictCategory(bob, 0, tiger, 1000, 1);
// 		await predictCategory(betty, 0, cheetah, 1000, 2);
// 		resolveMarket(0, 5);
// 		simnet.mineEmptyBlocks(25);
// 		await resolveMarketUndisputed(0);
// 		assertContractBalance(simnet, marketScalingCPMM, 100002970n);
// 		claim(alice, 0, 29692);
// 	});

// 	it('claim winner ok', async () => {
// 		assertContractBalance(simnet, marketScalingCPMM, undefined);
// 		//silence: console.log('----> contractBalance : ' + marketScalingCPMM + ' : ' + simnet.getAssetsMap().get('STX')?.get(`${deployer}.${marketScalingCPMM}`));
// 		await createScalarMarket(0, deployer, stxToken, 9999);
// 		//silence: console.log('----> contractBalance : ' + marketScalingCPMM + ' : ' + simnet.getAssetsMap().get('STX')?.get(`${deployer}.${marketScalingCPMM}`));
// 		let response = await predictCategory(alice, 0, 5, 3333, 5, stxToken, 9000);
// 		//silence: console.log('----> contractBalance : ' + marketScalingCPMM + ' : ' + simnet.getAssetsMap().get('STX')?.get(`${deployer}.${marketScalingCPMM}`));
// 		// console.log('claim winner ok', response.events);
// 		response = await predictCategory(bob, 0, lion, 3000, 0, stxToken, 3333);
// 		//silence: console.log('----> contractBalance : ' + marketScalingCPMM + ' : ' + simnet.getAssetsMap().get('STX')?.get(`${deployer}.${marketScalingCPMM}`));
// 		// console.log('claim winner ok', response.events);
// 		response = await predictCategory(betty, 0, cheetah, 3333, 2, stxToken, 0);
// 		// console.log('claim winner ok', response.events);
// 		const result = await resolveMarket(0, 5);

// 		await printMarketBalances(alice, 0);

// 		await printMarketBalances(alice, 0);
// 		printTokenStakeBalances(alice, 0);
// 		await printMarketBalances(bob, 0);
// 		printTokenStakeBalances(bob, 0);
// 		await printMarketBalances(betty, 0);
// 		printTokenStakeBalances(betty, 0);

// 		simnet.mineEmptyBlocks(25);
// 		await resolveMarketUndisputed(0);
// 		assertContractBalance(simnet, marketScalingCPMM, 25509n);
// 		assertDataVarNumber(simnet, marketScalingCPMM, 'dev-fee-bips', 100);
// 		assertDataVarNumber(simnet, marketScalingCPMM, 'market-fee-bips-max', 300);

// 		// claim for the treasury seed fund
// 		await claimDao(`${deployer}.bme024-0-market-scalar-pyth`, 0, 4893);
// 		assertContractBalance(simnet, marketScalingCPMM, 20616n);

// 		await claim(alice, 0, 20612);
// 		assertContractBalance(simnet, marketScalingCPMM, 4n);

// 		await claim(bob, 0, 0, 10006);
// 		assertContractBalance(simnet, marketScalingCPMM, 4n);
// 	});

// 	it('fails if too much slippage ', async () => {
// 		await createScalarMarket(0);
// 		let response = await predictCategory(deployer, 0, lion, 3333, 0, stxToken, 3333);
// 	});

// 	it('claim more winners ok', async () => {
// 		await createScalarMarket(0, deployer, undefined, 9999);

// 		let response = await predictCategory(deployer, 0, 5, 3333, 5, stxToken, 5000);
// 		response = await predictCategory(alice, 0, tiger, 3333, 1, stxToken, 0);
// 		response = await predictCategory(bob, 0, cheetah, 3333, 2, stxToken, 0);
// 		response = await predictCategory(betty, 0, tiger, 3333, 1, stxToken, 5000);
// 		response = await predictCategory(fred, 0, cheetah, 3333, 2, stxToken, 5000);
// 		(response = await predictCategory(wallace, 0, 5, 3333, 5)), stxToken, 5000;
// 		(response = await predictCategory(piedro, 0, tiger, 3333, 1)), stxToken, 5000;
// 		response = await predictCategory(developer, 0, cheetah, 3333, 2, stxToken, 5000);

// 		const result = await resolveMarket(0, 5);

// 		await printMarketBalances(alice, 0);

// 		await printMarketBalances(alice, 0);
// 		await printMarketBalances(bob, 0);
// 		await printMarketBalances(betty, 0);

// 		simnet.mineEmptyBlocks(25);
// 		await resolveMarketUndisputed(0);
// 		assertContractBalance(simnet, marketScalingCPMM, 42999n);
// 		assertDataVarNumber(simnet, marketScalingCPMM, 'dev-fee-bips', 100);
// 		assertDataVarNumber(simnet, marketScalingCPMM, 'market-fee-bips-max', 300);

// 		// claim for the treasury seed fund
// 		response = simnet.callPublicFn(
// 			'bme006-0-treasury',
// 			'claim-for-dao',
// 			[Cl.principal(deployer + '.bme024-0-market-scalar-pyth'), Cl.uint(0), Cl.principal(stxToken)],
// 			bob
// 		);
// 		//silence: console.log('claim winner ok', response.events);
// 		expect(response.result).toEqual(Cl.ok(Cl.uint(3134)));

// 		await claim(wallace, 0, 28134);
// 		await claim(deployer, 0, 11727);
// 		await claim(developer, 0, 3333, 10006);
// 		await claim(alice, 0, 80, 10006);
// 		await claim(betty, 0, 80, 10006);
// 		assertContractBalance(simnet, marketScalingCPMM, 4n);
// 	});
// });

// /*
//   The test below is an example. Learn more in the clarinet-sdk readme:
//   https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
// */
// async function printMarketBalances(user: string, marketId: number) {
// 	let data = simnet.callReadOnlyFn(marketScalingCPMM, 'get-market-data', [Cl.uint(marketId)], user);
// 	//silence: console.log('MarketBalances ---> categories', (data.result as any).value.data.categories.list);
// 	//silence: console.log('MarketBalances ---> outcome', (data.result as any).value.data.outcome.value?.value);
// 	//silence: console.log('MarketBalances ---> stakes', (data.result as any).value.data.stakes.list);
// 	//silence: console.log('MarketBalances ---> stake-tokens', (data.result as any).value.data['stake-tokens']);
// }

// async function printStakeBalances(user: string, marketId: number) {
// 	let data = simnet.callReadOnlyFn(marketScalingCPMM, 'get-stake-balances', [Cl.uint(marketId), Cl.principal(user)], alice);
// 	//silence: console.log('get-stake-balances: ' + user, (data.result as any).value);
// }
// async function printTokenStakeBalances(user: string, marketId: number) {
// 	let data = simnet.callReadOnlyFn(marketScalingCPMM, 'get-token-balances', [Cl.uint(marketId), Cl.principal(user)], alice);
// 	//silence: console.log('get-token-balances: ' + user, (data.result as any).value);
// }
// export async function createBinaryMarketWithGating(marketId: number, proof: any, key?: any, creator?: string, token?: string, fee?: number) {
// 	let response = simnet.callPublicFn(
// 		marketScalingCPMM,
// 		'create-market',
// 		[
// 			// Cl.list([Cl.tuple({ min: Cl.uint(100), max: Cl.uint(110) }), Cl.tuple({ min: Cl.uint(110), max: Cl.uint(120) })]),
// 			fee ? Cl.some(Cl.uint(fee)) : Cl.none(),
// 			Cl.principal(token ? token : stxToken),
// 			Cl.bufferFromHex(key ? key : metadataHash()),
// 			proof,
// 			Cl.principal(`${deployer}.bme022-0-market-gating`),
// 			Cl.none(),
// 			Cl.none(),
// 			Cl.bufferFromHex(USD0),
// 			Cl.uint(100000000),
// 			Cl.none()
// 		],
// 		creator ? creator : deployer
// 	);
// 	if (marketId > 200) {
// 		expect(response.result).toEqual(Cl.error(Cl.uint(marketId)));
// 	} else {
// 		expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
// 	}
// 	return response;
// }
// export async function createBinaryMarketWithFees(marketId: number, fee: number, creator?: string, token?: string) {
// 	let response = simnet.callPublicFn(
// 		marketScalingCPMM,
// 		'create-market',
// 		[
// 			// Cl.list([Cl.tuple({ min: Cl.uint(100), max: Cl.uint(110) }), Cl.tuple({ min: Cl.uint(110), max: Cl.uint(120) })]),
// 			Cl.some(Cl.uint(fee)),
// 			Cl.principal(token ? token : stxToken),
// 			Cl.bufferFromHex(metadataHash()),
// 			Cl.list([]),
// 			Cl.principal(`${deployer}.bme022-0-market-gating`),
// 			Cl.none(),
// 			Cl.none(),
// 			Cl.bufferFromHex(USD0),
// 			Cl.uint(100000000),
// 			Cl.none()
// 		],
// 		creator ? creator : deployer
// 	);
// 	expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
// 	return response;
// }
// export async function createBinaryMarketWithErrorCode(errorCode: number, fee?: number, creator?: string, token?: string) {
// 	let response = simnet.callPublicFn(
// 		marketScalingCPMM,
// 		'create-market',
// 		[
// 			// Cl.list([Cl.tuple({ min: Cl.uint(100), max: Cl.uint(110) }), Cl.tuple({ min: Cl.uint(110), max: Cl.uint(120) })]),
// 			fee ? Cl.some(Cl.uint(fee)) : Cl.none(),
// 			Cl.principal(token ? token : stxToken),
// 			Cl.bufferFromHex(metadataHash()),
// 			Cl.list([]),
// 			Cl.principal(`${deployer}.bme022-0-market-gating`),
// 			Cl.none(),
// 			Cl.none(),
// 			Cl.bufferFromHex(USD0),
// 			Cl.uint(100000000),
// 			Cl.none()
// 		],
// 		creator ? creator : deployer
// 	);
// 	expect(response.result).toEqual(Cl.error(Cl.uint(errorCode)));
// 	return response;
// }
export async function createBinaryMarket(marketId: number, creator?: string, token?: string) {
	let response = simnet.callPublicFn(
		marketScalingCPMM,
		'create-market',
		[
			// Cl.list([Cl.tuple({ min: Cl.uint( 100), max: Cl.uint(110) }), Cl.tuple({ min: Cl.uint(110), max: Cl.uint(120) })]),
			Cl.none(),
			Cl.principal(token ? token : stxToken),
			Cl.bufferFromHex(metadataHash()),
			Cl.list([]),
			Cl.principal(`${deployer}.bme022-0-market-gating`),
			Cl.none(),
			Cl.none(),
			Cl.bufferFromHex(USD0),
			Cl.uint(100000000),
			Cl.none()
		],
		creator ? creator : deployer
	);
	expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
	return response;
}
// async function createScalarMarket(marketId: number, creator?: string, token?: string, seed?: number) {
// 	await constructDao(simnet);
// 	let response = simnet.callPublicFn(
// 		marketScalingCPMM,
// 		'create-market',
// 		[
// 			// Cl.list([Cl.tuple({ min: Cl.uint(90), max: Cl.uint(100) }), Cl.tuple({ min: Cl.uint(100), max: Cl.uint(110) }), Cl.tuple({ min: Cl.uint(110), max: Cl.uint(120) })]),
// 			Cl.none(),
// 			Cl.principal(token ? token : stxToken),
// 			Cl.bufferFromHex(metadataHash()),
// 			Cl.list([]),
// 			Cl.principal(`${deployer}.bme022-0-market-gating`),
// 			Cl.none(),
// 			Cl.none(),
// 			Cl.bufferFromHex(USD0),
// 			Cl.uint(seed ? seed : 100000000),
// 			Cl.none()
// 		],
// 		creator ? creator : deployer
// 	);
// 	expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
// }
// async function predictCategory(user: string, marketId: number, category: number, amount: number, code: number, token?: string, maxAmount?: number) {
// 	let response = simnet.callPublicFn(
// 		marketScalingCPMM,
// 		'predict-category',
// 		[Cl.uint(marketId), Cl.uint(amount), Cl.uint(category), Cl.principal(token ? token : stxToken), Cl.uint(maxAmount ? maxAmount : amount)],
// 		user
// 	);
// 	if (code > 10) {
// 		if (code === 12) {
// 			expect(response.result).toEqual(Cl.error(Cl.uint(2)));
// 		} else {
// 			expect(response.result).toEqual(Cl.error(Cl.uint(code)));
// 		}
// 	} else {
// 		expect(response.result).toEqual(Cl.ok(Cl.uint(code)));
// 	}
// 	return response;
// }
// async function resolveMarket(marketId: number, winner: number) {
// 	simnet.mineEmptyBlocks(288);
// 	let response = simnet.callPublicFn(marketScalingCPMM, 'resolve-market', [Cl.uint(marketId)], bob);
// 	//silence: console.log(response.result);
// 	expect(response.result).toEqual(Cl.ok(Cl.some(Cl.uint(winner))));
// 	return response;
// }
// async function resolveMarketUndisputed(marketId: number, code?: number) {
// 	let response = simnet.callPublicFn(marketScalingCPMM, 'resolve-market-undisputed', [Cl.uint(marketId)], bob);
// 	if (code) {
// 		expect(response.result).toEqual(Cl.error(Cl.uint(code)));
// 	} else {
// 		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
// 	}
// }
// async function claim(user: string, marketId: number, share: number, code?: number) {
// 	let response = simnet.callPublicFn(marketScalingCPMM, 'claim-winnings', [Cl.uint(marketId), Cl.principal(stxToken)], user);
// 	if (code) {
// 		expect(response.result).toEqual(Cl.error(Cl.uint(code)));
// 	} else {
// 		expect(response.result).toEqual(Cl.ok(Cl.uint(share)));
// 	}
// }
