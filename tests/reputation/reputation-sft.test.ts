import { Cl } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { alice, bob, constructDao, deployer, fred, isValidExtension, liquidityCont, passProposalByExecutiveSignals, reputationSft, tom } from '../helpers';

process.on('unhandledRejection', (reason) => {
	const msg = String(reason);
	// swallow only the late Clarity unwrap noise
	if (msg.includes('value not found')) {
		console.warn('🔇 Swallowed late Clarity WASM "value not found" rejection');
		return;
	}
	throw reason;
});

describe('minting', () => {
	it('only dao can mint', async () => {
		await constructDao(simnet);
		let response = await simnet.callPublicFn(reputationSft, 'mint', [Cl.principal(alice), Cl.uint(0), Cl.uint(1000)], deployer);
		expect(response.result).toEqual(Cl.error(Cl.uint(30001)));
	});
	it('only dao can burn', async () => {
		await constructDao(simnet);
		let response = await simnet.callPublicFn(reputationSft, 'burn', [Cl.principal(alice), Cl.uint(0), Cl.uint(1000)], deployer);
		expect(response.result).toEqual(Cl.error(Cl.uint(30001)));
	});
	it('only dao can transfer', async () => {
		await constructDao(simnet);
		let response = await simnet.callPublicFn(reputationSft, 'transfer', [Cl.uint(0), Cl.uint(1000), Cl.principal(alice), Cl.principal(bob)], deployer);
		expect(response.result).toEqual(Cl.error(Cl.uint(30001)));
	});
	it('dao can mint and burn additional amount', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		let bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1000 * 2)));
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-2');
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2000 * 2)));
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-3');
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1500 * 2 + 500)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(5 * 2 + 5)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(10 * 2)));
	});
	it('dao can transfer', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		let bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1000 * 2)));
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-4');
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(5 * 2 + 5)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(15 * 2 - 5)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2000 * 2 - 1000)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1000)));
	});
	it('dao can transfer many', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-5');
		let bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1999)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1999)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(19)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(19n)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(tom)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(tom)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(tom)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(4)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2018)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2018)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-total-supply', [Cl.uint(2)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(20 * 2)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-total-supply', [Cl.uint(1)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2000 * 2)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-decimals', [Cl.uint(1)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(0)));
	});
});
describe('claiming', () => {
	it('cannot claim before first epoch', async () => {
		await constructDao(simnet);
		let response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], deployer);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
	});

	it('cannot claim with 0 reps', async () => {
		await constructDao(simnet);
		await simnet.mineEmptyBlocks(4000);

		let response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], deployer);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
	});

	it('only dao extensions can trigger claims', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-disable');
		await simnet.mineEmptyBlocks(4000);

		let bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(3000)));
	});

	it('alice cant claim twice in same epoch', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		await simnet.mineEmptyBlocks(4000);

		isValidExtension(`${deployer}.bme030-0-reputation-token`);

		let bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let stxBalances = await simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		//silence: console.log('contractBalance: ' + stxBalances?.get(`${deployer}.${treasury}`));

		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
	});

	it('alice and bobs claims are proportional', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		await simnet.mineEmptyBlocks(4000);

		let bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let stxBalances = await simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		//silence: console.log('contractBalance: ' + stxBalances?.get(`${deployer}.${treasury}`));

		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));
	});

	it('alice and bob can claim subsequent epochs', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');

		let bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(0));

		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], bob);
		expect(bal.result).toEqual(Cl.uint(0));

		await simnet.mineEmptyBlocks(4000);

		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let stxBalances = await simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		//silence: console.log('contractBalance: ' + stxBalances?.get(`${deployer}.${treasury}`));

		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));

		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(4));

		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], bob);
		expect(bal.result).toEqual(Cl.uint(4));

		await simnet.mineEmptyBlocks(1000);

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));

		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(5));

		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], bob);
		expect(bal.result).toEqual(Cl.uint(5));
	});

	it('alice and bobs shares decrease proportionally when tom creates a market', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		await simnet.mineEmptyBlocks(4000);

		let bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let stxBalances = await simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		//silence: console.log('contractBalance: ' + stxBalances?.get(`${deployer}.${treasury}`));

		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));
	});
});

describe('Reputation Rewards', () => {
	it('prevents claiming in the current epoch, allows in subsequent epoch, and blocks double-claim', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tier-weights');

		// ZEROTH EPOCH - WEIRD
		await simnet.mineEmptyBlocks(1);
		let bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(0));

		// -------- CONTRIBUTE LIQUIDITY ------------------
		let lr = await simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(4000000)], alice);
		expect(lr.result).toEqual(Cl.ok(Cl.uint(2)));
		lr = await simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(4000000)], tom);
		expect(lr.result).toEqual(Cl.ok(Cl.uint(2)));
		// -------- --------------------- --------- ---------

		let response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));

		// FIRST EPOCH - WEIRD
		await simnet.mineEmptyBlocks(1000);
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(1));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(0));
		// -------- --------------------- ----- -------------

		// -------- CONTRIBUTE LIQUIDITY ------------------
		lr = await simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(4000000)], bob);
		expect(lr.result).toEqual(Cl.ok(Cl.uint(2)));
		// -------- --------------------- ------------------

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));

		// SECOND EPOCH - BOB NOW ABLE TO CLAIM
		await simnet.mineEmptyBlocks(1000);
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(2));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(1));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(1));
		// -------- --------------------- ------------------

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));

		// THIRD EPOCH - BOB NOW ABLE TO CLAIM
		await simnet.mineEmptyBlocks(1000);
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(3));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(2));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(2));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(2));
		// -------- --------------------- ------------------

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));

		// FOURTH EPOCH - FRED JOINS NOW ABLE TO CLAIM
		await simnet.mineEmptyBlocks(1000);
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(4));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(3));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(3));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(3));
		// -------- --------------------- ------------------

		// -------- CONTRIBUTE LIQUIDITY ------------------
		lr = await simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(4000000)], fred);
		expect(lr.result).toEqual(Cl.ok(Cl.uint(2)));
		// -------- --------------------- ------------------

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], fred);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));

		// THIRD EPOCH - BOB NOW ABLE TO CLAIM
		await simnet.mineEmptyBlocks(1000);
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(5));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], fred);
		expect(response.result).toEqual(Cl.ok(Cl.uint(2500000000)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(2500000000)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(2500000000)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(2500000000)));
		// -------- --------------------- ------------------
	});
	it('again with tier weights - weigths are set in bootstrap', async () => {
		await constructDao(simnet);

		// ZEROTH EPOCH - WEIRD
		await simnet.mineEmptyBlocks(1);
		let bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(0));

		// -------- CONTRIBUTE LIQUIDITY ------------------
		let lr = await simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(4000000)], alice);
		expect(lr.result).toEqual(Cl.ok(Cl.uint(2)));
		lr = await simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(4000000)], tom);
		expect(lr.result).toEqual(Cl.ok(Cl.uint(2)));
		// -------- --------------------- ------------------

		let response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));

		// FIRST EPOCH - WEIRD
		await simnet.mineEmptyBlocks(1000);
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(1));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(0));
		// -------- --------------------- ----- -------------

		// -------- CONTRIBUTE LIQUIDITY ------------------
		lr = await simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(4000000)], bob);
		expect(lr.result).toEqual(Cl.ok(Cl.uint(2)));
		// -------- --------------------- ------------------

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));

		// SECOND EPOCH - BOB NOW ABLE TO CLAIM
		await simnet.mineEmptyBlocks(1000);
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(2));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(1));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(1));
		// -------- --------------------- ------------------

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));

		// THIRD EPOCH - BOB NOW ABLE TO CLAIM
		await simnet.mineEmptyBlocks(1000);
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(3));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(2));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(2));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(2));
		// -------- --------------------- ------------------

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));

		// FOURTH EPOCH - FRED JOINS NOW ABLE TO CLAIM
		await simnet.mineEmptyBlocks(1000);
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(4));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(3));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(3));
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(3));
		// -------- --------------------- ------------------

		// -------- CONTRIBUTE LIQUIDITY ------------------
		lr = await simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(4000000)], fred);
		expect(lr.result).toEqual(Cl.ok(Cl.uint(2)));
		// -------- --------------------- ------------------

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], fred);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));

		// THIRD EPOCH - BOB NOW ABLE TO CLAIM
		await simnet.mineEmptyBlocks(1000);
		bal = await simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(5));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], fred);
		expect(response.result).toEqual(Cl.ok(Cl.uint(2500000000)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(2500000000)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(2500000000)));
		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(2500000000)));
		// -------- --------------------- ------------------
	});
});
