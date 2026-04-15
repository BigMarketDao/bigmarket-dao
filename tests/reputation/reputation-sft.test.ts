import { Cl } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import {
	alice,
	bob,
	constructDao,
	deployer,
	fred,
	isValidExtension,
	liquidityCont,
	passProposalByCoreVote,
	passProposalByExecutiveSignals,
	reputationSft,
	tom
} from '../dao_helpers';

describe('Reputation', () => {
	const feed = Cl.bufferFromHex('11'.repeat(32));

	it('only DAO can call all setter functions', async () => {
		constructDao(simnet);
		// unauthorised caller
		let tx = simnet.callPublicFn(reputationSft, 'set-launch-height', [], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(30001)));
		tx = simnet.callPublicFn(reputationSft, 'set-reward-per-epoch', [Cl.uint(10)], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(30001)));
		tx = simnet.callPublicFn(reputationSft, 'set-tier-weight', [Cl.uint(1), Cl.uint(10)], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(30001)));
		tx = simnet.callPublicFn(reputationSft, 'mint', [Cl.principal(alice), Cl.uint(1), Cl.uint(10)], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(30001)));
		tx = simnet.callPublicFn(reputationSft, 'burn', [Cl.principal(alice), Cl.uint(1), Cl.uint(10)], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(30001)));
		tx = simnet.callPublicFn(reputationSft, 'transfer', [Cl.uint(1), Cl.uint(10), Cl.principal(alice), Cl.principal(bob)], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(30001)));
	});

	it('check disable hedging', async () => {
		constructDao(simnet);
		let data = simnet.callReadOnlyFn(reputationSft, 'get-overall-supply', [], alice);
		expect(data.result).toEqual(Cl.ok(Cl.uint(0)));
		data = simnet.callReadOnlyFn(reputationSft, 'get-weighted-supply', [], alice);
		expect(data.result).toEqual(Cl.ok(Cl.uint(0)));
		data = simnet.callReadOnlyFn(reputationSft, 'get-epoch', [], alice);
		expect(data.result).toEqual(Cl.uint(0));
		data = simnet.callReadOnlyFn(reputationSft, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(data.result).toEqual(Cl.uint(0));
		data = simnet.callReadOnlyFn(reputationSft, 'get-latest-claimable-epoch', [], alice);
		expect(data.result).toEqual(Cl.uint(0));
		data = simnet.callReadOnlyFn(reputationSft, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(data.result).toEqual(Cl.ok(Cl.uint(0)));
		data = simnet.callReadOnlyFn(reputationSft, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(data.result).toEqual(Cl.ok(Cl.uint(0)));
		data = simnet.callReadOnlyFn(reputationSft, 'get-total-supply', [Cl.uint(1)], alice);
		expect(data.result).toEqual(Cl.ok(Cl.uint(0)));
		data = simnet.callReadOnlyFn(reputationSft, 'get-decimals', [Cl.uint(1)], alice);
		expect(data.result).toEqual(Cl.ok(Cl.uint(0)));
		data = simnet.callReadOnlyFn(reputationSft, 'get-token-uri', [Cl.uint(1)], alice);
		expect(data.result).toEqual(Cl.ok(Cl.none()));
	});
	it('call setters', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-sft-setters');
	});
});

describe('minting', () => {
	it('only dao can mint', async () => {
		await constructDao(simnet);
		let response = simnet.callPublicFn(reputationSft, 'mint', [Cl.principal(alice), Cl.uint(0), Cl.uint(1000)], deployer);
		expect(response.result).toEqual(Cl.error(Cl.uint(30001)));
	});
	it('only dao can burn', async () => {
		await constructDao(simnet);
		let response = simnet.callPublicFn(reputationSft, 'burn', [Cl.principal(alice), Cl.uint(0), Cl.uint(1000)], deployer);
		expect(response.result).toEqual(Cl.error(Cl.uint(30001)));
	});
	it('only dao can transfer', async () => {
		await constructDao(simnet);
		let response = simnet.callPublicFn(reputationSft, 'transfer', [Cl.uint(0), Cl.uint(1000), Cl.principal(alice), Cl.principal(bob)], deployer);
		expect(response.result).toEqual(Cl.error(Cl.uint(30001)));
	});
	it('dao can mint and burn additional amount', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1000)));
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-2');
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2000)));
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-3');
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1500)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(5)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(10)));
	});
	it('dao can transfer', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1000)));
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-4');
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(5)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(15)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2000)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(0)));
	});
	it('dao can transfer many', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-5');
		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(999)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(999)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(9)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(9n)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(tom)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(tom)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(tom)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(4)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1008)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1008)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-total-supply', [Cl.uint(2)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(20)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-total-supply', [Cl.uint(1)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2000)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-decimals', [Cl.uint(1)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(0)));
	});
});
describe('claiming', () => {
	it('cannot claim before first epoch', async () => {
		await constructDao(simnet);
		let response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], deployer);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
	});

	it('cannot claim with 0 reps', async () => {
		await constructDao(simnet);
		simnet.mineEmptyBlocks(4000);

		let response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], deployer);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
	});

	it('only dao extensions can trigger claims', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-disable');
		simnet.mineEmptyBlocks(4000);

		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010)));

		let response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(3000)));
	});

	it('alice cant claim twice in same epoch', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		simnet.mineEmptyBlocks(4000);

		isValidExtension(`${deployer}.bme030-0-reputation-token`);

		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010)));

		let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		//silence: console.log('contractBalance: ' + stxBalances?.get(`${deployer}.${treasury}`));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010)));

		let response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));

		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
	});

	it('alice and bobs claims are proportional', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		simnet.mineEmptyBlocks(4000);

		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010)));

		let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		//silence: console.log('contractBalance: ' + stxBalances?.get(`${deployer}.${treasury}`));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010)));

		let response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));

		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));
	});

	it('alice and bob can claim subsequent epochs', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');

		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(0));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], bob);
		expect(bal.result).toEqual(Cl.uint(0));

		simnet.mineEmptyBlocks(4000);

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010)));

		let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		//silence: console.log('contractBalance: ' + stxBalances?.get(`${deployer}.${treasury}`));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010)));

		let response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));

		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(4));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], bob);
		expect(bal.result).toEqual(Cl.uint(3));

		simnet.mineEmptyBlocks(1000);

		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));

		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(5));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], bob);
		expect(bal.result).toEqual(Cl.uint(4));
	});

	it('alice and bobs shares decrease proportionally when tom creates a market', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		simnet.mineEmptyBlocks(4000);

		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010)));

		let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		//silence: console.log('contractBalance: ' + stxBalances?.get(`${deployer}.${treasury}`));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010)));

		let response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));

		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000000000)));
	});
});

describe('Reputation Rewards', () => {
	it('prevents claiming in the current epoch, allows in subsequent epoch, and blocks double-claim', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-sft-tier-weights');

		// ZEROTH EPOCH - WEIRD
		simnet.mineEmptyBlocks(1);
		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(0));

		// -------- CONTRIBUTE LIQUIDITY ------------------
		let lr = simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(4000000)], alice);
		expect(lr.result).toEqual(Cl.ok(Cl.uint(2)));
		lr = simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(4000000)], tom);
		expect(lr.result).toEqual(Cl.ok(Cl.uint(2)));
		// -------- --------------------- --------- ---------

		let response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));

		// FIRST EPOCH - WEIRD
		simnet.mineEmptyBlocks(1000);
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(1));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(0));
		// -------- --------------------- ----- -------------

		// -------- CONTRIBUTE LIQUIDITY ------------------
		lr = simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(4000000)], bob);
		expect(lr.result).toEqual(Cl.ok(Cl.uint(2)));
		// -------- --------------------- ------------------

		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));

		// SECOND EPOCH - BOB NOW ABLE TO CLAIM
		simnet.mineEmptyBlocks(1000);
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(2));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(0));
		// -------- --------------------- ------------------

		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));

		// THIRD EPOCH - BOB NOW ABLE TO CLAIM
		simnet.mineEmptyBlocks(1000);
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(3));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(1));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(1));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(1));
		// -------- --------------------- ------------------

		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));

		// FOURTH EPOCH - FRED JOINS NOW ABLE TO CLAIM
		simnet.mineEmptyBlocks(1000);
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(4));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(2));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(2));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(2));
		// -------- --------------------- ------------------

		// -------- CONTRIBUTE LIQUIDITY ------------------
		lr = simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(4000000)], fred);
		expect(lr.result).toEqual(Cl.ok(Cl.uint(2)));
		// -------- --------------------- ------------------

		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], fred);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));

		// THIRD EPOCH - BOB NOW ABLE TO CLAIM
		simnet.mineEmptyBlocks(1000);
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(5));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], fred);
		expect(response.result).toEqual(Cl.ok(Cl.uint(2500000000)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(2500000000)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(2500000000)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(2500000000)));
		// -------- --------------------- ------------------
	});
	it('again with tier weights - weigths are set in bootstrap', async () => {
		await constructDao(simnet);

		// ZEROTH EPOCH - WEIRD
		simnet.mineEmptyBlocks(1);
		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(0));

		// -------- CONTRIBUTE LIQUIDITY ------------------
		let lr = simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(4000000)], alice);
		expect(lr.result).toEqual(Cl.ok(Cl.uint(2)));
		lr = simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(4000000)], tom);
		expect(lr.result).toEqual(Cl.ok(Cl.uint(2)));
		// -------- --------------------- ------------------

		let response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));

		// FIRST EPOCH - WEIRD
		simnet.mineEmptyBlocks(1000);
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(1));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(0));
		// -------- --------------------- ----- -------------

		// -------- CONTRIBUTE LIQUIDITY ------------------
		lr = simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(4000000)], bob);
		expect(lr.result).toEqual(Cl.ok(Cl.uint(2)));
		// -------- --------------------- ------------------

		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));

		// SECOND EPOCH - BOB NOW ABLE TO CLAIM
		simnet.mineEmptyBlocks(1000);
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(2));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(0));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(0));
		// -------- --------------------- ------------------

		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));

		// THIRD EPOCH - BOB NOW ABLE TO CLAIM
		simnet.mineEmptyBlocks(1000);
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(3));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(1));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(1));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(1));
		// -------- --------------------- ------------------

		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));

		// FOURTH EPOCH - FRED JOINS NOW ABLE TO CLAIM
		simnet.mineEmptyBlocks(1000);
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(4));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.uint(2));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(bob)], bob);
		expect(bal.result).toEqual(Cl.uint(2));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(tom)], tom);
		expect(bal.result).toEqual(Cl.uint(2));
		// -------- --------------------- ------------------

		// -------- CONTRIBUTE LIQUIDITY ------------------
		lr = simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(4000000)], fred);
		expect(lr.result).toEqual(Cl.ok(Cl.uint(2)));
		// -------- --------------------- ------------------

		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], fred);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(3333333333)));

		// THIRD EPOCH - BOB NOW ABLE TO CLAIM
		simnet.mineEmptyBlocks(1000);
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(5));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], fred);
		expect(response.result).toEqual(Cl.ok(Cl.uint(2500000000)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(2500000000)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(2500000000)));
		response = simnet.callPublicFn(reputationSft, 'claim-big-reward', [], tom);
		expect(response.result).toEqual(Cl.ok(Cl.uint(2500000000)));
		// -------- --------------------- ------------------
	});
});
