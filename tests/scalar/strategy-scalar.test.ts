import { Cl } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { alice, bob, constructDao, deployer, marketScalingCPMM, metadataHash, passProposalByCoreVote, scalarStrategyHedge, tpepeToken, tusdhToken } from '../dao_helpers';
import { createBinaryMarket, predictCategory } from './scalar-market-pyth.test';

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
		tx = simnet.callPublicFn(scalarStrategyHedge, 'set-hedge-market-contract', [Cl.principal(`${deployer}.${marketScalingCPMM}`)], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(32000)));
		tx = simnet.callPublicFn(scalarStrategyHedge, 'set-hedge-scalar-contract', [Cl.principal(`${deployer}.${marketScalingCPMM}`)], alice);
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

	it('can set and read swap pair', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-hedge-bad-token-pairs1', 32012);
		passProposalByCoreVote('bdp000-hedge-bad-token-pairs2', 32011);
		passProposalByCoreVote('bdp000-hedge-bad-token-pairs3', 32012);
	});
});

describe('Hedging - Market Contract', () => {
	it('err-hedging-disabled', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-hedge1');

		let tx = await createBinaryMarket(0);
		await predictCategory(alice, 0, 1, 1000, 1);
		await predictCategory(bob, 0, 0, 1000, 0);
		simnet.mineEmptyBlocks(144);

		passProposalByCoreVote('bdp000-hedge-disable');

		tx = simnet.callPublicFn(marketScalingCPMM, 'execute-hedge', [Cl.uint(0), Cl.principal(`${deployer}.${scalarStrategyHedge}`), tokenA, tokenB, tokenIn, tokenOut], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(10038)));
	});
	it('err-pair-not-found - cant call it directly', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-hedge1');

		let tx = await createBinaryMarket(0);
		await predictCategory(alice, 0, 1, 1000, 1);
		await predictCategory(bob, 0, 0, 1000, 0);
		simnet.mineEmptyBlocks(144);

		tx = simnet.callPublicFn(scalarStrategyHedge, 'perform-swap-hedge', [Cl.uint(0), Cl.uint(0), Cl.bufferFromHex(metadataHash()), tokenA, tokenB, tokenIn, tokenOut], bob);
		expect(tx.result).toEqual(Cl.error(Cl.uint(32005)));
	});
	it('err-hedge-window 1', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-hedge1');

		let tx = await createBinaryMarket(0);
		await predictCategory(alice, 0, 1, 1000, 1);
		await predictCategory(bob, 0, 0, 1000, 0);
		simnet.mineEmptyBlocks(142);

		tx = simnet.callPublicFn(marketScalingCPMM, 'execute-hedge', [Cl.uint(0), Cl.contractPrincipal(deployer, scalarStrategyHedge), tokenA, tokenB, tokenIn, tokenOut], bob);
		expect(tx.result).toEqual(Cl.error(Cl.uint(10101)));
	});
	it('err-hedge-window 2', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-hedge1');

		let tx = await createBinaryMarket(0);
		await predictCategory(alice, 0, 1, 1000, 1);
		await predictCategory(bob, 0, 0, 1000, 0);
		simnet.mineEmptyBlocks(289);

		tx = simnet.callPublicFn(marketScalingCPMM, 'execute-hedge', [Cl.uint(0), Cl.contractPrincipal(deployer, scalarStrategyHedge), tokenA, tokenB, tokenIn, tokenOut], bob);
		expect(tx.result).toEqual(Cl.error(Cl.uint(10101)));
	});

	it('err-pair-not-found', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-hedge1');

		let tx = await createBinaryMarket(0);
		await predictCategory(alice, 0, 1, 1000, 1);
		await predictCategory(bob, 0, 0, 1000, 0);
		simnet.mineEmptyBlocks(144);

		tx = simnet.callPublicFn(marketScalingCPMM, 'execute-hedge', [Cl.uint(0), Cl.contractPrincipal(deployer, scalarStrategyHedge), tokenA, tokenB, tokenIn, tokenOut], bob);
		expect(tx.result).toEqual(Cl.error(Cl.uint(32005)));
	});
	it('err-wrong-market-contract - by hedge contract', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-hedge1');
		// uses correct feed id
		passProposalByCoreVote('bdp000-hedge3');

		let tx = await createBinaryMarket(0);
		await predictCategory(alice, 0, 1, 1000, 1);
		await predictCategory(bob, 0, 0, 1000, 0);
		simnet.mineEmptyBlocks(144);

		tx = simnet.callPublicFn(marketScalingCPMM, 'execute-hedge', [Cl.uint(0), Cl.contractPrincipal(deployer, scalarStrategyHedge), tokenA, tokenB, tokenIn, tokenOut], bob);
		expect(tx.result).toEqual(Cl.error(Cl.uint(32010)));
	});
	it('execute-hedge - zero balance - treasury has no tokens to swap', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-hedge1');
		// straighten out the market contracts
		passProposalByCoreVote('bdp000-hedge2');
		// uses correct feed id
		passProposalByCoreVote('bdp000-hedge3');

		let tx = await createBinaryMarket(0);
		await predictCategory(alice, 0, 1, 1000, 1);
		await predictCategory(bob, 0, 0, 1000, 0);
		simnet.mineEmptyBlocks(144);

		tx = simnet.callPublicFn(marketScalingCPMM, 'execute-hedge', [Cl.uint(0), Cl.contractPrincipal(deployer, scalarStrategyHedge), tokenA, tokenB, tokenIn, tokenOut], bob);
		expect(tx.result).toEqual(Cl.error(Cl.uint(32007)));
	});
	// it('execute-hedge - non zero balance', async () => {
	// 	constructDao(simnet);
	// 	passProposalByCoreVote('bdp000-hedge1');
	// 	// straighten out the market contracts
	// 	passProposalByCoreVote('bdp000-hedge2');
	// 	// uses correct feed id
	// 	passProposalByCoreVote('bdp000-hedge3');
	// 	// mint treasury some tpepe
	// 	passProposalByCoreVote('bdp000-hedge4');

	// 	console.log('execute-hedge - zero balance - treasury has no tokens to swap', simnet.getAssetsMap());

	// 	let tx = await createBinaryMarket(0);
	// 	await predictCategory(alice, 0, 1, 1000, 1);
	// 	await predictCategory(bob, 0, 0, 1000, 0);
	// 	simnet.mineEmptyBlocks(144);

	// 	tx = simnet.callPublicFn(marketScalingCPMM, 'execute-hedge', [Cl.uint(0), Cl.contractPrincipal(deployer, scalarStrategyHedge), tokenA, tokenB, tokenIn, tokenOut], bob);
	// 	expect(tx.result).toEqual(Cl.ok(Cl.uint(0)));
	// });
});
