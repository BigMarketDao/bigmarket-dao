import { describe, expect, it } from 'vitest';
import { Cl } from '@stacks/transactions';
import { alice, assertContractBalance, bob, claimDao, constructDao, deployer, fred, marketPredictingCPMM, metadataHash, setupSimnet, stxToken } from '../helpers';

const simnet = await setupSimnet();
// bob =
describe('claiming errors', () => {
	it('ensure alice can create a sell order', async () => {
		createCategoricalMarket(0);
		predictCategory(alice, 0, 'lion', 1000, 0);
		createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100);
	});

	it('ensure alice can create two sell orders if first is cancelled', async () => {
		createCategoricalMarket(0);
		predictCategory(alice, 0, 'lion', 1000, 0);
		createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100);
		cancelShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0);
		createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100);
	});

	it('ensure alice cant create two sell order', async () => {
		createCategoricalMarket(0);
		predictCategory(alice, 0, 'lion', 1000, 0);
		createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100);
		createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100, 40001);
	});

	it('ensure alice can create two sell orders if first is cancelled', async () => {
		createCategoricalMarket(0);
		predictCategory(alice, 0, 'lion', 1000, 0);
		createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100);
		cancelShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0);
		createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100);
	});

	it('ensure alice sell order cant be fullfilled if her balance too low', async () => {
		createCategoricalMarket(0);
		printStakeBalances(alice, 0);
		printStakeBalances(bob, 0);
		predictCategory(alice, 0, 'lion', 1000, 0);
		createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 2000, 100);
		fillShareOrder(`${deployer}.${marketPredictingCPMM}`, bob, alice, 0, 0, 10013);
		printStakeBalances(alice, 0);
		printStakeBalances(bob, 0);
	});

	it('ensure alice sell order can be fullfilled', async () => {
		createCategoricalMarket(0);
		printStakeBalances(alice, 0);
		printStakeBalances(bob, 0);
		predictCategory(alice, 0, 'lion', 1000, 0);
		createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100);
		fillShareOrder(`${deployer}.${marketPredictingCPMM}`, bob, alice, 0, 0);
		printStakeBalances(alice, 0);
		printStakeBalances(bob, 0);
	});

	it('ensure bob cant buy non existing order ', async () => {
		createCategoricalMarket(0);
		predictCategory(alice, 0, 'lion', 1000, 0);
		predictCategory(fred, 0, 'lion', 1000, 0);
		createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 200, 100);
		fillShareOrder(`${deployer}.${marketPredictingCPMM}`, bob, fred, 0, 0, 40003);
	});

	it('ensure bob can buy after market resolves', async () => {
		createCategoricalMarket(0);
		predictCategory(alice, 0, 'lion', 1000, 0);
		createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 1000, 100);
		const result = await resolveMarket(0, 'cheetah', 2);
		fillShareOrder(`${deployer}.${marketPredictingCPMM}`, bob, alice, 0, 0, 10020);
	});

	it('ensure order cant be filled twice', async () => {
		createCategoricalMarket(0);
		predictCategory(alice, 0, 'lion', 1000, 0);
		createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 1000, 100);
		fillShareOrder(`${deployer}.${marketPredictingCPMM}`, bob, alice, 0, 0);
		printStakeBalances(alice, 0);
		printStakeBalances(bob, 0);
		fillShareOrder(`${deployer}.${marketPredictingCPMM}`, fred, alice, 0, 0, 40003);
	});

	it('check bob and alice can both claim after p2p trade', async () => {
		createCategoricalMarket(0);
		predictCategory(alice, 0, 'lion', 1000, 0);
		createShareOrder(`${deployer}.${marketPredictingCPMM}`, alice, 0, 0, 1000, 100);
		fillShareOrder(`${deployer}.${marketPredictingCPMM}`, bob, alice, 0, 0);

		const result = await resolveMarket(0, 'lion', 0);
		simnet.mineEmptyBlocks(25);
		resolveMarketUndisputed(0);
		assertContractBalance(marketPredictingCPMM, 100000990n);

		claim(alice, 0, 2939);
		claim(bob, 0, 2999);
		claimDao(`${deployer}.bme024-0-market-predicting`, 0, 99995049);
		printStakeBalances(alice, 0);
		printStakeBalances(bob, 0);
		assertContractBalance(marketPredictingCPMM, 3n);
	});
});

/*
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/
async function printMarketBalances(marketId: number) {
	let data = await simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-market-data', [Cl.uint(marketId)], alice);
	//console.log("categories", (data.result as any).value.data.categories)
	//console.log("outcome", (data.result as any).value.data.outcome)
	//console.log("stakes", (data.result as any).value.data.stakes)
}

async function printStakeBalances(user: string, marketId: number) {
	let data = await simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-stake-balances', [Cl.uint(marketId), Cl.principal(user)], alice);
	console.log('get-stake-balances: ' + user, (data.result as any).value);
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
			Cl.principal(`${deployer}.bme022-0-market-gating`)
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
			Cl.principal(`${deployer}.bme022-0-market-gating`)
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
			Cl.principal(`${deployer}.bme022-0-market-gating`)
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
			Cl.uint(100000000)
		],
		creator ? creator : deployer
	);
	expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
	return response;
}
async function createCategoricalMarket(marketId: number, creator?: string, token?: string) {
	constructDao(simnet);
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
			Cl.uint(100000000)
		],
		creator ? creator : deployer
	);
	expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
}
async function predictCategory(user: string, marketId: number, category: string, amount: number, code: number, token?: string) {
	let response = await simnet.callPublicFn(
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
async function resolveMarket(marketId: number, category: string, winner: number, token?: string) {
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
async function fillShareOrder(market: string, buyer: string, seller: string, marketId: number, outcome: number, code?: number) {
	let response = await simnet.callPublicFn(
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
	let response = await simnet.callPublicFn(
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
	let response = await simnet.callPublicFn('bme040-0-shares-marketplace', 'cancel-share-order', [Cl.principal(market), Cl.uint(marketId), Cl.uint(outcome)], user);
	if (code) {
		expect(response.result).toEqual(Cl.error(Cl.uint(code)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
	}
}
