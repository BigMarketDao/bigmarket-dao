import { describe, expect, it } from 'vitest';
import { Cl } from '@stacks/transactions';
import {
	alice,
	assertContractBalance,
	assertDataVarNumber,
	betty,
	bob,
	claimDao,
	constructDao,
	deployer,
	developer,
	fred,
	marketScalingCPMM,
	metadataHash,
	piedro,
	reputationSft,
	setupSimnet,
	stxToken,
	tom,
	wallace
} from '../helpers';

const simnet = await setupSimnet();
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
		constructDao(simnet);
		let response = await simnet.callPublicFn(
			'bme024-0-market-scalar-pyth',
			'create-market',
			[
				Cl.list([Cl.tuple({ min: Cl.uint(100), max: Cl.uint(110) })]),
				Cl.none(),
				Cl.principal(stxToken),
				Cl.bufferFromHex(metadataHash()),
				Cl.list([]),
				Cl.principal(`${deployer}.bme022-0-market-gating`),
				Cl.none(),
				Cl.none(),
				Cl.bufferFromHex(USD0),
				Cl.uint(100000000)
			],
			deployer
		);
		expect(response.result).toEqual(Cl.error(Cl.uint(10024)));
	});

	it('create binary market ok', async () => {
		constructDao(simnet);
		createBinaryMarket(0);
	});

	it('create ok', async () => {
		createCategoricalMarket(0);
		assertBalance(deployer, 6, 4);
	});

	it('create and stake not ok on unknown category', async () => {
		createCategoricalMarket(0);
		assertBalance(deployer, 6, 4);
		createCategoricalMarket(1);
		assertBalance(deployer, 6, 8);
		predictCategory(alice, 0, 4, 1000, 10023);
	});

	it('create and stake ok', async () => {
		createCategoricalMarket(0);
		predictCategory(alice, 0, lion, 1000, 0);
	});
	it('res agent cannot stake', async () => {
		createCategoricalMarket(0);
		predictCategory(tom, 0, lion, 1000, 12);
	});

	it('create and stake spread ok', async () => {
		createCategoricalMarket(0);
		predictCategory(alice, 0, lion, 1000, 0);
		predictCategory(bob, 0, tiger, 1000, 1);
		predictCategory(betty, 0, cheetah, 1000, 2);
	});

	it('resolve ok', async () => {
		createCategoricalMarket(0);
		predictCategory(alice, 0, lion, 1000, 0);
		predictCategory(bob, 0, tiger, 1000, 1);
		predictCategory(betty, 0, cheetah, 1000, 2);
		resolveMarket(0, 0);
	});

	it('resolve undisputed requires window to elapse', async () => {
		createCategoricalMarket(0);
		predictCategory(alice, 0, lion, 1000, 0);
		predictCategory(bob, 0, tiger, 1000, 1);
		predictCategory(betty, 0, cheetah, 1000, 2);
		resolveMarket(0, 0);
		simnet.mineEmptyBlocks(10);
		resolveMarketUndisputed(0, 10019);
	});

	it('resolve undisputed requires window to elapse', async () => {
		createCategoricalMarket(0);
		predictCategory(alice, 0, lion, 1000, 0);
		predictCategory(bob, 0, tiger, 1000, 1);
		predictCategory(betty, 0, cheetah, 1000, 2);
		resolveMarket(0, 0);
		simnet.mineEmptyBlocks(25);
		resolveMarketUndisputed(0);
	});

	it('resolve undisputed requires window to elapse', async () => {
		createCategoricalMarket(0);
		predictCategory(alice, 0, lion, 1000000, 0);
		predictCategory(bob, 0, tiger, 1000000, 1);
		predictCategory(betty, 0, cheetah, 1000000, 2);
		resolveMarket(0, 0);
		simnet.mineEmptyBlocks(25);
		resolveMarketUndisputed(0);
		assertContractBalance(marketScalingCPMM, 102970000n);
	});

	it('claim err-user-not-winner-or-claimed', async () => {
		createCategoricalMarket(0, deployer, undefined, 10000);
		predictCategory(alice, 0, lion, 1000, 0);
		predictCategory(bob, 0, tiger, 1000, 1);
		predictCategory(betty, 0, cheetah, 1000, 2);
		resolveMarket(0, 0);
		simnet.mineEmptyBlocks(25);
		resolveMarketUndisputed(0);
		assertContractBalance(marketScalingCPMM, 12970n);
		claim(fred, 0, 80, 10008);
	});

	it('claim loser ok', async () => {
		createCategoricalMarket(0);
		predictCategory(alice, 0, lion, 1000, 0);
		predictCategory(bob, 0, tiger, 1000, 1);
		predictCategory(betty, 0, cheetah, 1000, 2);
		resolveMarket(0, 0);
		simnet.mineEmptyBlocks(25);
		resolveMarketUndisputed(0);
		assertContractBalance(marketScalingCPMM, 100002970n);
		claim(betty, 0, 80, 10006);
	});

	it('claim alice wins ok', async () => {
		createCategoricalMarket(0);
		predictCategory(alice, 0, lion, 1000, 0);
		predictCategory(bob, 0, tiger, 1000, 1);
		predictCategory(betty, 0, cheetah, 1000, 2);
		resolveMarket(0, 0);
		simnet.mineEmptyBlocks(25);
		resolveMarketUndisputed(0);
		assertContractBalance(marketScalingCPMM, 100002970n);
		claim(alice, 0, 5939);
	});

	it('ensure share are more expensive when pool grows', async () => {
		createCategoricalMarket(0);
		predictCategory(alice, 0, lion, 1000, 0);
		predictCategory(bob, 0, tiger, 1000, 1);
		predictCategory(betty, 0, cheetah, 1000, 2);
		resolveMarket(0, 0);
		simnet.mineEmptyBlocks(25);
		resolveMarketUndisputed(0);
		assertContractBalance(marketScalingCPMM, 100002970n);
		claim(alice, 0, 5939);
	});

	it('claim winner ok', async () => {
		assertContractBalance(marketScalingCPMM, undefined);
		console.log('----> contractBalance : ' + marketScalingCPMM + ' : ' + simnet.getAssetsMap().get('STX')?.get(`${deployer}.${marketScalingCPMM}`));
		createCategoricalMarket(0, deployer, stxToken, 9999);
		console.log('----> contractBalance : ' + marketScalingCPMM + ' : ' + simnet.getAssetsMap().get('STX')?.get(`${deployer}.${marketScalingCPMM}`));
		let response = await predictCategory(alice, 0, lion, 3333, 0, stxToken, 4000);
		console.log('----> contractBalance : ' + marketScalingCPMM + ' : ' + simnet.getAssetsMap().get('STX')?.get(`${deployer}.${marketScalingCPMM}`));
		// console.log('claim winner ok', response.events);
		response = await predictCategory(bob, 0, lion, 3000, 10031, stxToken, 3333);
		console.log('----> contractBalance : ' + marketScalingCPMM + ' : ' + simnet.getAssetsMap().get('STX')?.get(`${deployer}.${marketScalingCPMM}`));
		// console.log('claim winner ok', response.events);
		response = await predictCategory(betty, 0, cheetah, 3333, 2, stxToken, 0);
		// console.log('claim winner ok', response.events);
		const result = await resolveMarket(0, 0);

		printMarketBalances(0);

		printStakeBalances(alice, 0);
		printTokenStakeBalances(alice, 0);
		printStakeBalances(bob, 0);
		printTokenStakeBalances(bob, 0);
		printStakeBalances(betty, 0);
		printTokenStakeBalances(betty, 0);

		simnet.mineEmptyBlocks(25);
		resolveMarketUndisputed(0);
		assertContractBalance(marketScalingCPMM, 17259n);
		assertDataVarNumber(marketScalingCPMM, 'dev-fee-bips', 100);
		assertDataVarNumber(marketScalingCPMM, 'dao-fee-bips', 150);
		assertDataVarNumber(marketScalingCPMM, 'market-fee-bips-max', 300);

		// claim for the treasury seed fund
		claimDao(`${deployer}.bme024-0-market-scalar-pyth`, 0, 8273);
		assertContractBalance(marketScalingCPMM, 8986n);

		claim(alice, 0, 8985);
		assertContractBalance(marketScalingCPMM, 1n);

		claim(bob, 0, 0, 10008);
		assertContractBalance(marketScalingCPMM, 1n);
	});

	it('fails if too much slippage ', async () => {
		createCategoricalMarket(0);
		let response = await predictCategory(deployer, 0, lion, 3333, 0, stxToken, 3333);
	});

	it('claim more winners ok', async () => {
		createCategoricalMarket(0, deployer, undefined, 9999);

		let response = await predictCategory(deployer, 0, lion, 3333, 0, stxToken, 5000);
		response = await predictCategory(alice, 0, tiger, 3333, 1, stxToken, 0);
		response = await predictCategory(bob, 0, cheetah, 3333, 2, stxToken, 0);
		response = await predictCategory(betty, 0, tiger, 3333, 1, stxToken, 5000);
		response = await predictCategory(fred, 0, cheetah, 3333, 2, stxToken, 5000);
		(response = await predictCategory(wallace, 0, lion, 3333, 0)), stxToken, 5000;
		(response = await predictCategory(piedro, 0, tiger, 3333, 1)), stxToken, 5000;
		response = await predictCategory(developer, 0, cheetah, 3333, 2, stxToken, 5000);

		const result = await resolveMarket(0, 0);

		printMarketBalances(0);

		printStakeBalances(alice, 0);
		printStakeBalances(bob, 0);
		printStakeBalances(betty, 0);

		simnet.mineEmptyBlocks(25);
		resolveMarketUndisputed(0);
		assertContractBalance(marketScalingCPMM, 42999n);
		assertDataVarNumber(marketScalingCPMM, 'dev-fee-bips', 100);
		assertDataVarNumber(marketScalingCPMM, 'dao-fee-bips', 150);
		assertDataVarNumber(marketScalingCPMM, 'market-fee-bips-max', 300);

		// claim for the treasury seed fund
		response = await simnet.callPublicFn(
			'bme006-0-treasury',
			'claim-for-dao',
			[Cl.principal(deployer + '.bme024-0-market-scalar-pyth'), Cl.uint(0), Cl.principal(stxToken)],
			bob
		);
		console.log('claim winner ok', response.events);
		expect(response.result).toEqual(Cl.ok(Cl.uint(8067)));

		claim(wallace, 0, 25287);
		claim(deployer, 0, 9643);
		claim(developer, 0, 3333, 10006);
		claim(alice, 0, 80, 10006);
		claim(betty, 0, 80, 10006);
		assertContractBalance(marketScalingCPMM, 2n);
	});
});

/*
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/
async function printMarketBalances(marketId: number) {
	let data = await simnet.callReadOnlyFn('bme024-0-market-scalar-pyth', 'get-market-data', [Cl.uint(marketId)], alice);
	console.log('MarketBalances ---> categories', (data.result as any).value.data.categories.list);
	console.log('MarketBalances ---> outcome', (data.result as any).value.data.outcome.value?.value);
	console.log('MarketBalances ---> stakes', (data.result as any).value.data.stakes.list);
	console.log('MarketBalances ---> stake-tokens', (data.result as any).value.data['stake-tokens']);
}

async function printStakeBalances(user: string, marketId: number) {
	let data = await simnet.callReadOnlyFn('bme024-0-market-scalar-pyth', 'get-stake-balances', [Cl.uint(marketId), Cl.principal(user)], alice);
	console.log('get-stake-balances: ' + user, (data.result as any).value);
}
async function printTokenStakeBalances(user: string, marketId: number) {
	let data = await simnet.callReadOnlyFn('bme024-0-market-scalar-pyth', 'get-token-balances', [Cl.uint(marketId), Cl.principal(user)], alice);
	console.log('get-token-balances: ' + user, (data.result as any).value);
}
export async function createBinaryMarketWithGating(marketId: number, proof: any, key?: any, creator?: string, token?: string, fee?: number) {
	let response = await simnet.callPublicFn(
		'bme024-0-market-scalar-pyth',
		'create-market',
		[
			Cl.list([Cl.tuple({ min: Cl.uint(100), max: Cl.uint(110) }), Cl.tuple({ min: Cl.uint(110), max: Cl.uint(120) })]),
			fee ? Cl.some(Cl.uint(fee)) : Cl.none(),
			Cl.principal(token ? token : stxToken),
			Cl.bufferFromHex(key ? key : metadataHash()),
			proof,
			Cl.principal(`${deployer}.bme022-0-market-gating`),
			Cl.none(),
			Cl.none(),
			Cl.bufferFromHex(USD0),
			Cl.uint(100000000)
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
		'bme024-0-market-scalar-pyth',
		'create-market',
		[
			Cl.list([Cl.tuple({ min: Cl.uint(100), max: Cl.uint(110) }), Cl.tuple({ min: Cl.uint(110), max: Cl.uint(120) })]),
			Cl.some(Cl.uint(fee)),
			Cl.principal(token ? token : stxToken),
			Cl.bufferFromHex(metadataHash()),
			Cl.list([]),
			Cl.principal(`${deployer}.bme022-0-market-gating`),
			Cl.none(),
			Cl.none(),
			Cl.bufferFromHex(USD0),
			Cl.uint(100000000)
		],
		creator ? creator : deployer
	);
	expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
	return response;
}
export async function createBinaryMarketWithErrorCode(errorCode: number, fee?: number, creator?: string, token?: string) {
	let response = await simnet.callPublicFn(
		'bme024-0-market-scalar-pyth',
		'create-market',
		[
			Cl.list([Cl.tuple({ min: Cl.uint(100), max: Cl.uint(110) }), Cl.tuple({ min: Cl.uint(110), max: Cl.uint(120) })]),
			fee ? Cl.some(Cl.uint(fee)) : Cl.none(),
			Cl.principal(token ? token : stxToken),
			Cl.bufferFromHex(metadataHash()),
			Cl.list([]),
			Cl.principal(`${deployer}.bme022-0-market-gating`),
			Cl.none(),
			Cl.none(),
			Cl.bufferFromHex(USD0),
			Cl.uint(100000000)
		],
		creator ? creator : deployer
	);
	expect(response.result).toEqual(Cl.error(Cl.uint(errorCode)));
	return response;
}
export async function createBinaryMarket(marketId: number, creator?: string, token?: string) {
	let response = await simnet.callPublicFn(
		'bme024-0-market-scalar-pyth',
		'create-market',
		[
			Cl.list([Cl.tuple({ min: Cl.uint(100), max: Cl.uint(110) }), Cl.tuple({ min: Cl.uint(110), max: Cl.uint(120) })]),
			Cl.none(),
			Cl.principal(token ? token : stxToken),
			Cl.bufferFromHex(metadataHash()),
			Cl.list([]),
			Cl.principal(`${deployer}.bme022-0-market-gating`),
			Cl.none(),
			Cl.none(),
			Cl.bufferFromHex(USD0),
			Cl.uint(100000000)
		],
		creator ? creator : deployer
	);
	expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
	return response;
}
async function createCategoricalMarket(marketId: number, creator?: string, token?: string, seed?: number) {
	constructDao(simnet);
	let response = await simnet.callPublicFn(
		'bme024-0-market-scalar-pyth',
		'create-market',
		[
			Cl.list([Cl.tuple({ min: Cl.uint(90), max: Cl.uint(100) }), Cl.tuple({ min: Cl.uint(100), max: Cl.uint(110) }), Cl.tuple({ min: Cl.uint(110), max: Cl.uint(120) })]),
			Cl.none(),
			Cl.principal(token ? token : stxToken),
			Cl.bufferFromHex(metadataHash()),
			Cl.list([]),
			Cl.principal(`${deployer}.bme022-0-market-gating`),
			Cl.none(),
			Cl.none(),
			Cl.bufferFromHex(USD0),
			Cl.uint(seed ? seed : 100000000)
		],
		creator ? creator : deployer
	);
	expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
}
async function predictCategory(user: string, marketId: number, category: number, amount: number, code: number, token?: string, maxAmount?: number) {
	let response = await simnet.callPublicFn(
		'bme024-0-market-scalar-pyth',
		'predict-category',
		[Cl.uint(marketId), Cl.uint(amount), Cl.uint(category), Cl.principal(token ? token : stxToken), Cl.uint(maxAmount ? maxAmount : amount)],
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
async function resolveMarket(marketId: number, winner: number) {
	simnet.mineEmptyBlocks(288);
	let response = await simnet.callPublicFn('bme024-0-market-scalar-pyth', 'resolve-market', [Cl.uint(marketId)], bob);
	console.log(response.result);
	expect(response.result).toEqual(Cl.ok(Cl.some(Cl.uint(winner))));
	return response;
}
async function resolveMarketUndisputed(marketId: number, code?: number) {
	let response = await simnet.callPublicFn('bme024-0-market-scalar-pyth', 'resolve-market-undisputed', [Cl.uint(marketId)], bob);
	if (code) {
		expect(response.result).toEqual(Cl.error(Cl.uint(code)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
	}
}
async function claim(user: string, marketId: number, share: number, code?: number) {
	let response = await simnet.callPublicFn('bme024-0-market-scalar-pyth', 'claim-winnings', [Cl.uint(marketId), Cl.principal(stxToken)], user);
	if (code) {
		expect(response.result).toEqual(Cl.error(Cl.uint(code)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.uint(share)));
	}
}
