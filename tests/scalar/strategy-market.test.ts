import { Cl } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { createBinaryMarket, predictCategory } from '../categorical/categorical.test';
import {
	alice,
	bob,
	constructDao,
	deployer,
	marketPredicting,
	marketPredictingCPMM,
	metadataHash,
	passProposalByCoreVote,
	scalarStrategyHedge,
	tpepeToken,
	tusdhToken
} from '../dao_helpers';

const tokenA = Cl.principal(tpepeToken);
const tokenB = Cl.principal(tusdhToken);
const tokenIn = tokenA;
const tokenOut = tokenB;
describe('BME032 Scalar Market Hedging', () => {
	const feed = Cl.bufferFromHex('11'.repeat(32));

	it('only DAO can call all setter functions', async () => {
		constructDao(simnet);
		// unauthorised caller
		let tx = simnet.callPublicFn(scalarStrategyHedge, 'set-hedge-multipliers', [Cl.list([Cl.uint(1), Cl.uint(2), Cl.uint(3), Cl.uint(4), Cl.uint(5), Cl.uint(6)])], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(32000)));
		tx = simnet.callPublicFn(scalarStrategyHedge, 'set-hedge-market-contract', [Cl.principal(`${deployer}.${marketPredicting}`)], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(32000)));
		tx = simnet.callPublicFn(scalarStrategyHedge, 'set-hedge-scalar-contract', [Cl.principal(`${deployer}.${marketPredicting}`)], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(32000)));
		tx = simnet.callPublicFn(scalarStrategyHedge, 'set-hedge-caps', [Cl.uint(20), Cl.uint(20)], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(32000)));
		tx = simnet.callPublicFn(scalarStrategyHedge, 'set-hedge-min-trade', [Cl.uint(20)], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(32000)));
		tx = simnet.callPublicFn(scalarStrategyHedge, 'set-hedge-cooldown', [Cl.uint(20)], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(32000)));
		tx = simnet.callPublicFn(scalarStrategyHedge, 'set-swap-token-pair', [Cl.bufferFromHex(metadataHash()), tokenA, tokenB, tokenIn, tokenOut], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(32000)));
		tx = simnet.callPublicFn(scalarStrategyHedge, 'perform-swap-hedge', [Cl.uint(0), Cl.uint(0), Cl.bufferFromHex(metadataHash()), tokenA, tokenB, tokenIn, tokenOut], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(32005)));
		passProposalByCoreVote('bdp000-hedge1');
		tx = simnet.callPublicFn(
			scalarStrategyHedge,
			'perform-swap-hedge',
			[Cl.uint(0), Cl.uint(0), Cl.bufferFromHex('0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'), tokenA, tokenB, tokenIn, tokenOut],
			alice
		);
		expect(tx.result).toEqual(Cl.error(Cl.uint(32000)));
	});

	it('check disable hedging', async () => {
		constructDao(simnet);
		let data = simnet.callReadOnlyFn(marketPredicting, 'is-hedging-enabled', [], alice);
		expect(data.result).toEqual(Cl.bool(true));
		data = simnet.callReadOnlyFn(marketPredictingCPMM, 'is-hedging-enabled', [], alice);
		expect(data.result).toEqual(Cl.bool(true));
		passProposalByCoreVote('bdp000-hedge-disable');
		data = simnet.callReadOnlyFn(marketPredicting, 'is-hedging-enabled', [], alice);
		expect(data.result).toEqual(Cl.bool(false));
		data = simnet.callReadOnlyFn(marketPredictingCPMM, 'is-hedging-enabled', [], alice);
		expect(data.result).toEqual(Cl.bool(false));
	});
	it('check token balances', async () => {
		constructDao(simnet);
		let data = simnet.callReadOnlyFn(marketPredicting, 'get-token-minimum-seed', [tokenA], alice);
		expect(data.result).toEqual(Cl.ok(Cl.some(Cl.uint(100))));
		data = simnet.callReadOnlyFn(marketPredictingCPMM, 'get-token-minimum-seed', [tokenB], alice);
		expect(data.result).toEqual(Cl.ok(Cl.some(Cl.uint(100))));
	});
	it('check token minimum seed', async () => {
		constructDao(simnet);
		let data = simnet.callReadOnlyFn(marketPredicting, 'get-token-balances', [Cl.uint(0), Cl.principal(alice)], alice);
		expect(data.result).toEqual(Cl.ok(Cl.list([Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)])));
		data = simnet.callReadOnlyFn(marketPredictingCPMM, 'get-token-balances', [Cl.uint(0), Cl.principal(alice)], alice);
		expect(data.result).toEqual(Cl.ok(Cl.list([Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)])));
	});
	// read only methods cant use unwrap! so this code leads to errors..
	// it('get expected payout errors', async () => {
	// 	constructDao(simnet);
	// 	let data = simnet.callReadOnlyFn(marketPredicting, 'get-expected-payout', [Cl.uint(0), Cl.uint(0), Cl.principal(alice)], alice);
	// 	expect(data.result).toEqual(Cl.error(Cl.uint(1000)));
	// 	data = simnet.callReadOnlyFn(marketPredictingCPMM, 'get-expected-payout', [Cl.uint(0), Cl.uint(0), Cl.principal(alice)], alice);
	// 	expect(data.result).toEqual(Cl.error(Cl.uint(1000)));
	// });
	it('check token minimum seed', async () => {
		constructDao(simnet);
		let data = simnet.callReadOnlyFn(marketPredicting, 'get-token-balances', [Cl.uint(0), Cl.principal(alice)], alice);
		expect(data.result).toEqual(Cl.ok(Cl.list([Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)])));
		data = simnet.callReadOnlyFn(marketPredictingCPMM, 'get-token-balances', [Cl.uint(0), Cl.principal(alice)], alice);
		expect(data.result).toEqual(Cl.ok(Cl.list([Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)])));
	});
});

describe('Hedging - Market Contract', () => {
	it('err-hedge-unauthorised', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-hedge1');

		let tx = await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 1000, 1);
		await predictCategory(bob, 0, 'nay', 1000, 0);
		simnet.mineEmptyBlocks(144);

		tx = simnet.callPublicFn(marketPredicting, 'execute-hedge', [Cl.uint(0), Cl.principal(`${deployer}.${scalarStrategyHedge}`), tokenA, tokenB, tokenIn, tokenOut], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(10100)));
	});
	it('err-hedging-disabled', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-hedge1');

		let tx = await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 1000, 1);
		await predictCategory(bob, 0, 'nay', 1000, 0);
		simnet.mineEmptyBlocks(144);

		passProposalByCoreVote('bdp000-hedge-disable');

		tx = simnet.callPublicFn(marketPredicting, 'execute-hedge', [Cl.uint(0), Cl.principal(`${deployer}.${scalarStrategyHedge}`), tokenA, tokenB, tokenIn, tokenOut], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(10038)));
	});
	it('err-unauthorised - cant call it directly', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-hedge1');

		let tx = await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 1000, 1);
		await predictCategory(bob, 0, 'nay', 1000, 0);
		simnet.mineEmptyBlocks(144);

		tx = simnet.callPublicFn(scalarStrategyHedge, 'perform-custom-hedge', [Cl.uint(0), Cl.uint(0)], bob);
		expect(tx.result).toEqual(Cl.error(Cl.uint(32000)));
	});
	it('err-hedge-window 1', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-hedge1');

		let tx = await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 1000, 1);
		await predictCategory(bob, 0, 'nay', 1000, 0);
		simnet.mineEmptyBlocks(142);

		tx = simnet.callPublicFn(marketPredicting, 'execute-hedge', [Cl.uint(0), Cl.contractPrincipal(deployer, scalarStrategyHedge), tokenA, tokenB, tokenIn, tokenOut], bob);
		expect(tx.result).toEqual(Cl.error(Cl.uint(10101)));
	});
	it('err-hedge-window 2', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-hedge1');

		let tx = await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 1000, 1);
		await predictCategory(bob, 0, 'nay', 1000, 0);
		simnet.mineEmptyBlocks(289);

		tx = simnet.callPublicFn(marketPredicting, 'execute-hedge', [Cl.uint(0), Cl.contractPrincipal(deployer, scalarStrategyHedge), tokenA, tokenB, tokenIn, tokenOut], bob);
		expect(tx.result).toEqual(Cl.error(Cl.uint(10101)));
	});

	it('err-wrong-market-contract - by hedge contract', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-hedge1');

		let tx = await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 1000, 1);
		await predictCategory(bob, 0, 'nay', 1000, 0);
		simnet.mineEmptyBlocks(144);

		tx = simnet.callPublicFn(marketPredicting, 'execute-hedge', [Cl.uint(0), Cl.contractPrincipal(deployer, scalarStrategyHedge), tokenA, tokenB, tokenIn, tokenOut], bob);
		expect(tx.result).toEqual(Cl.error(Cl.uint(32010)));
	});
	it('execute-hedge - success', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-hedge1');
		passProposalByCoreVote('bdp000-hedge2');

		let tx = await createBinaryMarket(0);
		await predictCategory(alice, 0, 'yay', 1000, 1);
		await predictCategory(bob, 0, 'nay', 1000, 0);
		simnet.mineEmptyBlocks(144);

		tx = simnet.callPublicFn(marketPredicting, 'execute-hedge', [Cl.uint(0), Cl.contractPrincipal(deployer, scalarStrategyHedge), tokenA, tokenB, tokenIn, tokenOut], bob);
		expect(tx.result).toEqual(Cl.ok(Cl.uint(0)));
	});
});
