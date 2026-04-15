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
	marketScalingCPMM,
	marketVoting,
	metadataHash,
	passProposalByCoreVote,
	reputationSft,
	stxToken,
	tom,
	treasury,
	wallace
} from '../dao_helpers';

const USD0 = '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43';
const USD1 = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';
const USD2 = '0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17';
const USD3 = '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';
const USD4 = '0xff0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';
const USD5 = '0xfffd8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';
async function assertBalance(user: string, tier: number, balance: number) {
	let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(tier), Cl.principal(user)], user);
	expect(bal.result).toEqual(Cl.ok(Cl.uint(balance * 2)));
}

describe('claiming errors', () => {
	it('create binary market ok', async () => {
		await constructDao(simnet);
		await createBinaryMarket(0);
	});

	it('create ok', async () => {
		await constructDao(simnet);
		await createScalarMarket(0, USD0);
		//await assertBalance(deployer, 6, 4);
	});

	it('create and stake not ok on unknown category', async () => {
		await constructDao(simnet);
		await createScalarMarket(0, USD0);
		await createScalarMarket(1, USD1);
		//await assertBalance(deployer, 6, 8);
		await predictCategory(alice, 0, 15, 1000, 10023);
	});

	it('create and stake ok', async () => {
		await constructDao(simnet);
		await createScalarMarket(0, USD0);
		await createScalarMarket(1, USD1);
		await predictCategory(alice, 0, 0, 1000, 0);
	});
	it('res agent cannot stake', async () => {
		await constructDao(simnet);
		await createScalarMarket(0, USD0);
		await createScalarMarket(1, USD1);
		await predictCategory(tom, 0, 0, 1000, 12);
	});

	it('create and stake spread ok', async () => {
		await constructDao(simnet);
		await createScalarMarket(0, USD0);
		await createScalarMarket(1, USD1);
		await predictCategory(alice, 0, 0, 1000, 0);
		await predictCategory(bob, 0, 1, 1000, 1);
		await predictCategory(betty, 0, 2, 1000, 2);
	});

	it('resolve to category 5 for STX/USD/0', async () => {
		await constructDao(simnet);
		await createScalarMarket(0, USD0);
		await predictCategory(alice, 0, 0, 1000, 0);
		await predictCategory(bob, 0, 1, 1000, 1);
		await predictCategory(betty, 0, 2, 1000, 2);
		simnet.mineEmptyBlocks(144);
		await passProposalByCoreVote('bdbp001-set-manual-fallback');
		await resolveMarket(0, 3);
		simnet.mineEmptyBlocks(143);
		await resolveMarketError(0, 10020);
		simnet.mineEmptyBlocks(1);
		await resolveMarketError(0, 10020);
	});

	it('resolve to category 3 for STX/USD/1', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdbp001-set-manual-fallback');
		await createScalarMarket(0, USD1);
		await predictCategory(alice, 0, 0, 1000, 0);
		await predictCategory(bob, 0, 1, 1000, 1);
		await predictCategory(betty, 0, 2, 1000, 2);
		simnet.mineEmptyBlocks(144);
		await resolveMarketError(0, 10020);
		simnet.mineEmptyBlocks(143);
		await resolveMarketError(0, 10020);
		simnet.mineEmptyBlocks(1);
		const response = await resolveMarket(0, 3);
		printMarketevents(response);
	});

	it('resolve to category 3 for STX/USD/2', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdbp001-set-manual-fallback');
		await createScalarMarket(0, USD2);
		await predictCategory(alice, 0, 0, 1000, 0);
		await predictCategory(bob, 0, 1, 1000, 1);
		await predictCategory(betty, 0, 2, 1000, 2);
		simnet.mineEmptyBlocks(144);
		await resolveMarketError(0, 10020);
		simnet.mineEmptyBlocks(143);
		await resolveMarketError(0, 10020);
		simnet.mineEmptyBlocks(1);
		const response = await resolveMarket(0, 3);
		printMarketevents(response);
	});

	it('resolve to category 3 for STX/USD (ie 0)', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdbp001-set-manual-fallback');
		await createScalarMarket(0, USD3);
		await predictCategory(alice, 0, 0, 1000, 0);
		await predictCategory(bob, 0, 1, 1000, 1);
		await predictCategory(betty, 0, 2, 1000, 2);
		simnet.mineEmptyBlocks(144);
		await resolveMarketError(0, 10020);
		simnet.mineEmptyBlocks(143);
		await resolveMarketError(0, 10020);
		simnet.mineEmptyBlocks(1);
		const response = await resolveMarket(0, 3);
		printMarketevents(response);
	});

	it('resolve to category 3 if above range STX/USD/3', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdbp001-set-manual-fallback');
		await createScalarMarket(0, USD3);
		await predictCategory(alice, 0, 0, 1000, 0);
		await predictCategory(bob, 0, 1, 1000, 1);
		await predictCategory(betty, 0, 2, 1000, 2);
		simnet.mineEmptyBlocks(144);
		await resolveMarketError(0, 10020);
		simnet.mineEmptyBlocks(143);
		await resolveMarketError(0, 10020);
		simnet.mineEmptyBlocks(1);
		const response = await resolveMarket(0, 3);
		printMarketevents(response);
	});

	it('resolve undisputed requires window to elapse', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdbp001-set-manual-fallback');
		await createScalarMarket(0, USD0);
		await predictCategory(alice, 0, 0, 1000, 0);
		await predictCategory(bob, 0, 1, 1000, 1);
		await predictCategory(betty, 0, 2, 1000, 2);
		simnet.mineEmptyBlocks(288);
		await resolveMarket(0, 3);
		simnet.mineEmptyBlocks(20); // set ot 24 in bootstrap prop
		await resolveMarketUndisputed(0, 10019);
		simnet.mineEmptyBlocks(5);
		await resolveMarketUndisputed(0);
	});

	it('err-invalid-param setting bips', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdbp001-set-bips');
		await passProposalByCoreVote('bdbp001-set-bips-error', 10156);
	});

	it('claim err-user-not-winner-or-claimed', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdbp001-set-manual-fallback');
		await createScalarMarket(0, USD0);
		await predictCategory(alice, 0, 0, 1000, 0);
		await predictCategory(bob, 0, 1, 1000, 1);
		await predictCategory(betty, 0, 2, 1000, 2);
		simnet.mineEmptyBlocks(288);
		await resolveMarket(0, 3);
		simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
		assertContractBalance(simnet, marketScalingCPMM, 100002970n);

		await claim(fred, 0, 80, 10008);
	});

	it('claim loser 1 ok', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdbp001-set-manual-fallback');
		await createScalarMarket(0, USD1);
		await predictCategory(alice, 0, 0, 1000, 0);
		await predictCategory(bob, 0, 1, 1000, 1);
		await predictCategory(betty, 0, 2, 1000, 2);
		simnet.mineEmptyBlocks(288);
		await resolveMarket(0, 3);
		simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
		assertContractBalance(simnet, marketScalingCPMM, 100002970n);
		await claim(alice, 0, 80, 10006);
	});

	it('claim loser 2 ok', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdbp001-set-manual-fallback');
		await createScalarMarket(0, USD2);
		await predictCategory(alice, 0, 0, 1000, 0);
		await predictCategory(bob, 0, 1, 1000, 1);
		await predictCategory(betty, 0, 2, 1000, 2);
		simnet.mineEmptyBlocks(288);
		await resolveMarket(0, 3);
		simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
		assertContractBalance(simnet, marketScalingCPMM, 100002970n);
		await claim(bob, 0, 80, 10006);
	});

	it('claim winner ok', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdbp001-set-manual-fallback');
		await createScalarMarket(0, USD0);
		await predictCategory(alice, 0, 3, 1000, 3);
		await predictCategory(bob, 0, 1, 1000, 1);
		await predictCategory(betty, 0, 2, 1000, 2);
		simnet.mineEmptyBlocks(288);
		await resolveMarket(0, 3);
		//console.log("claim winner ok",result.events[0].data.value)

		await printMarketBalances(alice, 0);

		simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
		assertContractBalance(simnet, marketScalingCPMM, 100002970n);
		assertDataVarNumber(simnet, marketScalingCPMM, 'dev-fee-bips', 100);
		assertDataVarNumber(simnet, marketScalingCPMM, 'market-fee-bips-max', 300);

		const response = await claim(alice, 0, 29686);
		//silence: console.log('claim winner ok', response);
	});

	it('claim winners ok all staked on winning category', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdbp001-set-manual-fallback');
		await createScalarMarket(0, USD2);
		await predictCategory(alice, 0, 5, 1000, 5);
		await predictCategory(bob, 0, 3, 1000, 3);
		await predictCategory(betty, 0, 3, 1000, 3);
		simnet.mineEmptyBlocks(288);
		await resolveMarket(0, 3);
		//console.log("claim winner ok",result.events[0].data.value)

		await printMarketBalances(alice, 0);

		simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
		assertContractBalance(simnet, marketScalingCPMM, 100002970n);

		let response = await claim(alice, 0, 0, 10006);
		response = await claim(bob, 0, 29677);
		response = await claim(betty, 0, 29671);
		// console.log('claim winner ok', response);
	});

	it('assert overbuying throw correct error', async () => {
		await constructDao(simnet);
		await createScalarMarket(0, USD2);
		await predictCategory(alice, 0, 1, 1000000000000, 10031);
	});

	it('claim winners ok all staked on wrong category', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdbp001-set-manual-fallback');
		await passProposalByCoreVote('bdp001-set-dev-fee-zero');
		let response = simnet.callPublicFn(
			marketScalingCPMM,
			'create-market',
			[
				// (map-set test-values "STX/USD/0" { value: u950000000, timestamp: u1739355000 })
				// (map-set test-values "STX/USD/1" { value: u1050000000, timestamp: u1739355100 })
				// (map-set test-values "STX/USD/2" { value: u1150000000, timestamp: u1739355200 })
				// Cl.list([Cl.tuple({ min: Cl.uint(90), max: Cl.uint(100) }), Cl.tuple({ min: Cl.uint(100), max: Cl.uint(110) }), Cl.tuple({ min: Cl.uint(110), max: Cl.uint(120) })]),
				Cl.none(),
				Cl.principal(stxToken),
				Cl.bufferFromHex(metadataHash()),
				Cl.list([]),
				Cl.principal(`${deployer}.bme022-0-market-gating`),
				Cl.none(),
				Cl.none(),
				Cl.bufferFromHex(USD0),
				Cl.uint(99000000),
				Cl.none()
			],
			deployer
		);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		await predictCategory(alice, 0, 1, 10000000, 1);
		await predictCategory(bob, 0, 1, 10000000, 1);
		await predictCategory(betty, 0, 1, 10000000, 1);
		await predictCategory(wallace, 0, 3, 10000000, 3);
		simnet.mineEmptyBlocks(288);
		await resolveMarket(0, 3);
		//console.log("claim winner ok",result.events[0].data.value)

		await printMarketBalances(alice, 0);

		await printMarketBalances(alice, 0);
		await printMarketBalances(bob, 0);
		await printMarketBalances(betty, 0);
		//await printMarketBalances(`${deployer}.${marketScalingCPMM}`, 0);

		simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
		assertContractBalance(simnet, marketScalingCPMM, 139000000n);

		response = await claim(alice, 0, 976, 10006);
		response = await claim(bob, 0, 976, 10006);
		response = await claim(betty, 0, 976, 10006);
		// console.log('claim winner ok', response);
		assertContractBalance(simnet, marketScalingCPMM, 139000000n);

		let data = await projectedWinnings(wallace, 0, 0);
		//silence: console.log('-----------------------------------------------------------------');
		//silence: console.log('claim winner ok', data.result.value);
		//silence: console.log('-----------------------------------------------------------------');

		data = await projectedWinnings(`${deployer}.${treasury}`, 0, 0);
		//silence: console.log('-----------------------------------------------------------------');
		//silence: console.log('claim winner ok', data.result.value);
		//silence: console.log('-----------------------------------------------------------------');

		await claim(wallace, 0, 105813283);
		assertContractBalance(simnet, marketScalingCPMM, 33186717n);

		response = simnet.callPublicFn('bme006-0-treasury', 'claim-for-dao', [Cl.principal(deployer + '.bme024-0-market-scalar-pyth'), Cl.uint(0), Cl.principal(stxToken)], bob);
		//silence: console.log('claim winner ok', response.events);
		expect(response.result).toEqual(Cl.ok(Cl.uint(33186716n)));

		assertContractBalance(simnet, marketScalingCPMM, 1n);
	});

	it('claim winner ok - check data mapas', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdbp001-set-manual-fallback');
		await createScalarMarket(0, USD0);
		await predictCategory(alice, 0, 3, 1000, 3);
		await predictCategory(bob, 0, 1, 1000, 1);
		await predictCategory(betty, 0, 2, 1000, 2);
		simnet.mineEmptyBlocks(288);
		await resolveMarket(0, 3);
		simnet.mineEmptyBlocks(25);
		await resolveMarketUndisputed(0);
		assertContractBalance(simnet, marketScalingCPMM, 100002970n);
		assertDataVarNumber(simnet, marketScalingCPMM, 'dev-fee-bips', 100);
		assertDataVarNumber(simnet, marketScalingCPMM, 'market-fee-bips-max', 300);
		const response = await claim(alice, 0, 29686);
		expect(response.result).toEqual(Cl.ok(Cl.uint(29686)));

		let data = simnet.callReadOnlyFn(marketScalingCPMM, 'get-market-data', [Cl.uint(0)], alice);
		console.log('claim winner ok - check data mapas', data);
		data = simnet.callReadOnlyFn(marketScalingCPMM, 'get-stake-balances', [Cl.uint(0), Cl.principal(alice)], alice);
		console.log('claim winner ok - check data mapas', data);
		data = simnet.callReadOnlyFn(marketScalingCPMM, 'get-token-balances', [Cl.uint(0), Cl.principal(alice)], alice);
		console.log('claim winner ok - check data mapas', data);
		data = simnet.callReadOnlyFn(marketScalingCPMM, 'get-share-cost', [Cl.uint(0), Cl.uint(0), Cl.uint(10000)], alice);
		console.log('claim winner ok - check data mapas', data);
		data = simnet.callReadOnlyFn(marketScalingCPMM, 'get-max-shares', [Cl.uint(0), Cl.uint(0), Cl.uint(10000)], alice);
		console.log('claim winner ok - check data mapas', data);
		data = simnet.callReadOnlyFn(marketScalingCPMM, 'get-expected-payout', [Cl.uint(0), Cl.uint(0), Cl.principal(alice)], alice);
		console.log('claim winner ok - check data mapas', data);
	});
});
describe('disputes', () => {
	it('resolve with fallback price', async () => {
		await constructDao(simnet);
		let tx = await createScalarMarket(0, USD4, deployer, stxToken, 10154);
		passProposalByCoreVote('bdp000-scalar1');
		tx = await createScalarMarket(0, USD5, deployer, stxToken);
		await predictCategory(alice, 0, 5, 1000, 5);
		await predictCategory(bob, 0, 3, 1000, 3);
		await predictCategory(betty, 0, 3, 1000, 3);
		simnet.mineEmptyBlocks(288);
		tx = await resolveMarket(0, 3);
	});

	it('market closes via voting', async () => {
		await constructDao(simnet);
		await createScalarMarket(0, USD2);
		await predictCategory(alice, 0, 5, 1000, 5);
		await predictCategory(bob, 0, 3, 1000, 3);
		await predictCategory(betty, 0, 3, 1000, 3);
		simnet.mineEmptyBlocks(288);
		await resolveMarket(0, 3);
		//console.log("claim winner ok",result.events[0].data.value)

		await printMarketBalances(alice, 0);
		let tx = simnet.callPublicFn(
			marketVoting,
			'create-market-vote',
			[Cl.principal(`${deployer}.${marketScalingCPMM}`), Cl.uint(0), Cl.list([Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)]), Cl.uint(6)],
			alice
		);
		expect(tx.result).toEqual(Cl.ok(Cl.bool(true)));

		tx = simnet.callPublicFn(marketVoting, 'vote', [Cl.principal(`${deployer}.${marketScalingCPMM}`), Cl.uint(0), Cl.uint(5), Cl.uint(100), Cl.none()], alice);
		expect(tx.result).toEqual(Cl.ok(Cl.bool(true)));
		tx = simnet.callPublicFn(marketVoting, 'vote', [Cl.principal(`${deployer}.${marketScalingCPMM}`), Cl.uint(0), Cl.uint(5), Cl.uint(100), Cl.none()], bob);
		expect(tx.result).toEqual(Cl.ok(Cl.bool(true)));
		tx = simnet.callPublicFn(marketVoting, 'vote', [Cl.principal(`${deployer}.${marketScalingCPMM}`), Cl.uint(0), Cl.uint(5), Cl.uint(100), Cl.none()], betty);
		expect(tx.result).toEqual(Cl.error(Cl.uint(1)));
		tx = simnet.callPublicFn(marketVoting, 'vote', [Cl.principal(`${deployer}.${marketScalingCPMM}`), Cl.uint(0), Cl.uint(5), Cl.uint(100), Cl.none()], tom);
		expect(tx.result).toEqual(Cl.ok(Cl.bool(true)));
		await resolveMarketUndisputed(0, 10019);
		tx = simnet.callPublicFn(marketScalingCPMM, 'force-resolve-market', [Cl.uint(0)], bob);
		expect(tx.result).toEqual(Cl.error(Cl.uint(10020)));

		simnet.mineEmptyBlocks(20);
		tx = simnet.callPublicFn(marketVoting, 'conclude-market-vote', [Cl.principal(`${deployer}.${marketScalingCPMM}`), Cl.uint(0)], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(2113)));
		simnet.mineEmptyBlocks(5);
		tx = simnet.callPublicFn(marketVoting, 'conclude-market-vote', [Cl.principal(`${deployer}.${marketScalingCPMM}`), Cl.uint(0)], alice);
		expect(tx.result).toEqual(Cl.ok(Cl.uint(5)));
		await claim(alice, 0, 29686);
		await claim(bob, 0, 0, 10006);
		await claim(betty, 0, 0, 10006);
	});
	it('market closes after voting via forced resolution', async () => {
		await constructDao(simnet);
		await createScalarMarket(0, USD2);
		await predictCategory(alice, 0, 5, 1000, 5);
		await predictCategory(bob, 0, 3, 1000, 3);
		await predictCategory(betty, 0, 3, 1000, 3);
		simnet.mineEmptyBlocks(288);
		await resolveMarket(0, 3);
		//console.log("claim winner ok",result.events[0].data.value)

		await printMarketBalances(alice, 0);
		let tx = simnet.callPublicFn(
			marketVoting,
			'create-market-vote',
			[Cl.principal(`${deployer}.${marketScalingCPMM}`), Cl.uint(0), Cl.list([Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)]), Cl.uint(6)],
			alice
		);
		expect(tx.result).toEqual(Cl.ok(Cl.bool(true)));

		await resolveMarketUndisputed(0, 10019);
		simnet.mineEmptyBlocks(2000);
		tx = simnet.callPublicFn(marketScalingCPMM, 'force-resolve-market', [Cl.uint(0)], bob);
		expect(tx.result).toEqual(Cl.ok(Cl.bool(true)));

		tx = simnet.callPublicFn(marketVoting, 'conclude-market-vote', [Cl.principal(`${deployer}.${marketScalingCPMM}`), Cl.uint(0)], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(10020)));

		await claim(alice, 0, 0, 10006);
		await claim(bob, 0, 29677);
		await claim(betty, 0, 29671);
	});
});

/*
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/
// async function printPriceData() {
// 	let data = simnet.callReadOnlyFn('dia-oracle', 'get-value', [Cl.stringAscii(USD0)], alice);
// 	//silence: console.log(USD0, (data.result as any).value);
// 	data = simnet.callReadOnlyFn('dia-oracle', 'get-value', [Cl.stringAscii(USD1)], alice);
// 	//silence: console.log(USD1, (data.result as any).value);
// 	data = simnet.callReadOnlyFn('dia-oracle', 'get-value', [Cl.stringAscii(USD2)], alice);
// 	//silence: console.log(USD2, (data.result as any).value);
// }

async function printMarketevents(response: any) {
	//silence: console.log('response', response.events[0].data.value.data);
}

async function printMarketBalances(user: string, marketId: number) {
	let data = simnet.callReadOnlyFn(marketScalingCPMM, 'get-market-data', [Cl.uint(marketId)], user);
	//silence: console.log('categories', (data.result as any).value.data.categories.list[0]);
	//silence: console.log('categories', (data.result as any).value.data.categories.list[1]);
	//silence: console.log('categories', (data.result as any).value.data.categories.list[2]);
	//silence: console.log('outcome', (data.result as any).value.data.outcome);
	//silence: console.log('stakes', (data.result as any).value.data.stakes);
}

async function printStakeBalances(user: string, marketId: number) {
	let data = simnet.callReadOnlyFn(marketScalingCPMM, 'get-stake-balances', [Cl.uint(marketId), Cl.principal(user)], alice);
	//silence: console.log('get-stake-balances: ' + user, (data.result as any).value);
}
export async function createBinaryMarket(marketId: number, creator?: string, token?: string) {
	let response = simnet.callPublicFn(
		marketScalingCPMM,
		'create-market',
		[
			// Cl.list([Cl.tuple({ min: Cl.uint(0), max: Cl.uint(1) }), Cl.tuple({ min: Cl.uint(1), max: Cl.uint(2) })]),
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
export async function predictCategory(user: string, marketId: number, category: number, amount: number, code: number, token?: string) {
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
async function resolveMarket(marketId: number, finalIndex: number) {
	let response = simnet.callPublicFn(marketScalingCPMM, 'resolve-market', [Cl.uint(marketId)], bob);
	expect(response.result).toEqual(Cl.ok(Cl.some(Cl.uint(finalIndex))));
	return response;
}
async function resolveMarketError(marketId: number, errorCode: number) {
	let response = simnet.callPublicFn(marketScalingCPMM, 'resolve-market', [Cl.uint(marketId)], bob);
	expect(response.result).toEqual(Cl.error(Cl.uint(errorCode)));
	return response;
}

async function resolveMarketUndisputed(marketId: number, code?: number) {
	let response = simnet.callPublicFn(marketScalingCPMM, 'resolve-market-undisputed', [Cl.uint(marketId)], bob);
	if (code) {
		expect(response.result).toEqual(Cl.error(Cl.uint(code)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
	}
	return response;
}

async function claim(user: string, marketId: number, share: number, code?: number) {
	let response = simnet.callPublicFn(marketScalingCPMM, 'claim-winnings', [Cl.uint(marketId), Cl.principal(stxToken)], user);
	if (code) {
		expect(response.result).toEqual(Cl.error(Cl.uint(code)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.uint(share)));
	}
	return response;
}
async function transferLosingStake(user: string, marketId: number) {
	let response = simnet.callPublicFn(marketScalingCPMM, 'transfer-losing-stakes', [Cl.uint(marketId), Cl.principal(stxToken)], user);
	expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
	return response;
}

async function projectedWinnings(user: string, marketId: number, index: number) {
	let data = simnet.callReadOnlyFn(marketScalingCPMM, 'get-expected-payout', [Cl.uint(marketId), Cl.uint(index), Cl.principal(user)], alice);
	return data;
}
