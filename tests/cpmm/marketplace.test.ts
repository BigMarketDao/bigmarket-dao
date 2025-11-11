import { Cl } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import {
	alice,
	assertContractBalance,
	bob,
	claimDao,
	constructDao,
	deployer,
	fred,
	marketPredictingCPMM,
	marketScalingCPMM,
	metadataHash,
	passProposalByCoreVote,
	scalarStrategyHedge,
	stxToken
} from '../dao_helpers';
const USD0 = '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43';
const USD5 = '0xfffd8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';

// bob =
describe('claiming errors', () => {
	it('ensure alice can create a sell order', async () => {
		await createCategoricalMarket(0);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100);
	});

	it('ensure alice can create two sell orders if first is cancelled', async () => {
		await createCategoricalMarket(0);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100);
		await cancelShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0);
		await createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100);
	});

	it('ensure alice cant create two sell order', async () => {
		await createCategoricalMarket(0);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100);
		await createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100, 40001);
	});

	it('ensure alice can create two sell orders if first is cancelled', async () => {
		await createCategoricalMarket(0);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100);
		await cancelShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0);
		await createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100);
	});

	it('ensure alice sell order cant be fullfilled if her balance too low', async () => {
		await createCategoricalMarket(0);
		await printMarketBalances(alice, 0);
		await printMarketBalances(bob, 0);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 2000, 100);
		await fillShareOrder(`${deployer}.${marketPredictingCPMM}`, bob, alice, 0, 0, 10013);
		await printMarketBalances(alice, 0);
		await printMarketBalances(bob, 0);
	});

	it('scalar: ensure alice sell order cant be fullfilled if her balance too low', async () => {
		await constructDao(simnet);
		passProposalByCoreVote('bdp000-scalar1');
		let tx = simnet.callReadOnlyFn(scalarStrategyHedge, 'get-swap-token-pair', [Cl.bufferFromHex(USD0)], alice);
		tx = simnet.callPrivateFn(scalarStrategyHedge, 'compute-swap-amount', [Cl.principal(stxToken), Cl.uint(2)], alice);
		await createScalarMarket(0, USD5);
		await printMarketBalances(alice, 0);
		await printMarketBalances(bob, 0);
		await predictCategoryScalar(alice, 0, 0, 1000, 0);
		await createShareOrder(`${deployer}.${marketScalingCPMM}`, alice, 0, 0, 2000, 100);
		await fillShareOrder(`${deployer}.${marketScalingCPMM}`, bob, alice, 0, 0);
		await printMarketBalances(alice, 0);
		await printMarketBalances(bob, 0);
	});

	it('ensure alice sell order can be fullfilled', async () => {
		await createCategoricalMarket(0);
		await printMarketBalances(alice, 0);
		await printMarketBalances(bob, 0);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100);
		await fillShareOrder(`${deployer}.${marketPredictingCPMM}`, bob, alice, 0, 0);
		await printMarketBalances(alice, 0);
		await printMarketBalances(bob, 0);
	});

	it('scalar: ensure alice sell order can be fullfilled', async () => {
		await constructDao(simnet);
		await createScalarMarket(0, USD0);
		await predictCategoryScalar(alice, 0, 0, 1000, 0);
		await createShareOrder(`${deployer}.${marketScalingCPMM}`, alice, 0, 0, 200, 100);
		await fillShareOrder(`${deployer}.${marketScalingCPMM}`, bob, alice, 0, 0);
	});

	it('ensure bob cant buy non existing order ', async () => {
		await createCategoricalMarket(0);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await predictCategory(fred, 0, 'lion', 1000, 0);
		await createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100);
		await fillShareOrder(`${deployer}.${marketPredictingCPMM}`, bob, fred, 0, 0, 40003);
	});

	it('ensure bob order expires', async () => {
		await createCategoricalMarket(0);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 1000, 100);
		const result = await resolveMarket(0, 'cheetah', 2);
		await fillShareOrder(`${deployer}.${marketPredictingCPMM}`, bob, alice, 0, 0, 40004);
	});

	it('ensure bob order can buy if expiry pushed', async () => {
		await createCategoricalMarket(0);
		await predictCategory(alice, 0, 'tiger', 1000, 1);
		await createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 1, 1000, 300);
		//const result = await resolveMarket(0, 'cheetah', 2);
		//await resolveMarketUndisputed(0);
		await fillShareOrder(`${deployer}.${marketPredictingCPMM}`, bob, alice, 0, 1);
	});

	it('ensure order cant be filled twice', async () => {
		await createCategoricalMarket(0);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 1000, 100);
		await fillShareOrder(`${deployer}.${marketPredictingCPMM}`, bob, alice, 0, 0);
		await printMarketBalances(alice, 0);
		await printMarketBalances(bob, 0);
		await fillShareOrder(`${deployer}.${marketPredictingCPMM}`, fred, alice, 0, 0, 40003);
	});

	it('check bob and alice can both claim after p2p trade', async () => {
		await createCategoricalMarket(0);
		await predictCategory(alice, 0, 'lion', 1000, 0);
		await createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 1000, 100);
		await fillShareOrder(`${deployer}.${marketPredictingCPMM}`, bob, alice, 0, 0);

		const result = await resolveMarket(0, 'lion', 0);
		simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
		assertContractBalance(simnet, marketPredictingCPMM, 100000990n);

		await claim(alice, 0, 2936);
		await claim(bob, 0, 2999);
		await claimDao(`${deployer}.bme024-0-market-predicting`, 0, 99995052);
		await printMarketBalances(alice, 0);
		await printMarketBalances(bob, 0);
		assertContractBalance(simnet, marketPredictingCPMM, 3n);
	});
});

/*
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/
async function printMarketBalances(user: string, marketId: number) {
	let data = simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-market-data', [Cl.uint(marketId)], user);
	//console.log("categories", (data.result as any).value.data.categories)
	//console.log("outcome", (data.result as any).value.data.outcome)
	//console.log("stakes", (data.result as any).value.data.stakes)
}

async function printStakeBalances(user: string, marketId: number) {
	let data = simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-stake-balances', [Cl.uint(marketId), Cl.principal(user)], alice);
	//silence: console.log('get-stake-balances: ' + user, (data.result as any).value);
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
async function createCategoricalMarket(marketId: number, creator?: string, token?: string) {
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
			Cl.uint(100000000),
			Cl.none()
		],
		creator ? creator : deployer
	);
	expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
}
async function createScalarMarket(marketId: number, priceFeed: string, creator?: string, token?: string, code?: number) {
	let response = simnet.callPublicFn(
		marketScalingCPMM,
		'create-market',
		[
			// (map-set test-values "STX/USD/0" { value: u950000000, timestamp: u1739355000 })
			// (map-set test-values "STX/USD/1" { value: u1050000000, timestamp: u1739355100 })
			// (map-set test-values "STX/USD/2" { value: u1150000000, timestamp: u1739355200 })
			// Cl.list([Cl.tuple({ min: Cl.uint(90), max: Cl.uint(100) }), Cl.tuple({ min: Cl.uint(100), max: Cl.uint(110) }), Cl.tuple({ min: Cl.uint(110), max: Cl.uint(120) })]),
			Cl.none(),
			Cl.principal(token ? token : stxToken),
			Cl.bufferFromHex(metadataHash()),
			Cl.list([]),
			Cl.principal(`${deployer}.bme022-0-market-gating`),
			Cl.none(),
			Cl.none(),
			Cl.bufferFromHex(priceFeed),
			Cl.uint(100000000),
			Cl.none()
		],
		creator ? creator : deployer
	);
	if (code) {
		expect(response.result).toEqual(Cl.error(Cl.uint(code)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
	}
	return response;
}
async function predictCategory(user: string, marketId: number, category: string, amount: number, code: number, token?: string) {
	let response = simnet.callPublicFn(
		'bme024-0-market-predicting',
		'predict-category',
		[Cl.uint(marketId), Cl.uint(amount), Cl.stringAscii(category), Cl.principal(token ? token : stxToken), Cl.uint(amount)],
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
async function predictCategoryScalar(user: string, marketId: number, category: number, amount: number, code: number, token?: string) {
	let response = simnet.callPublicFn(
		marketScalingCPMM,
		'predict-category',
		[Cl.uint(marketId), Cl.uint(amount), Cl.uint(category), Cl.principal(token ? token : stxToken), Cl.uint(amount)],
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
async function fillShareOrder(market: string, buyer: string, seller: string, marketId: number, outcome: number, code?: number) {
	let response = simnet.callPublicFn(
		'bme040-0-shares-marketplace',
		'fill-share-order',
		[Cl.principal(market), Cl.uint(marketId), Cl.uint(outcome), Cl.principal(seller), Cl.principal(stxToken)],
		buyer
	);
	if (code) {
		expect(response.result).toEqual(Cl.error(Cl.uint(code)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
	}
}
async function createShareOrder(market: string, user: string, marketId: number, outcome: number, amount: number, expires: number, code?: number) {
	let response = simnet.callPublicFn(
		'bme040-0-shares-marketplace',
		'create-share-order',
		[Cl.principal(market), Cl.uint(marketId), Cl.uint(outcome), Cl.uint(amount), Cl.uint(expires)],
		user
	);
	if (code) {
		expect(response.result).toEqual(Cl.error(Cl.uint(code)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
	}
}
async function cancelShareOrder(market: string, user: string, marketId: number, outcome: number, code?: number) {
	let response = simnet.callPublicFn('bme040-0-shares-marketplace', 'cancel-share-order', [Cl.principal(market), Cl.uint(marketId), Cl.uint(outcome)], user);
	if (code) {
		expect(response.result).toEqual(Cl.error(Cl.uint(code)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
	}
}
