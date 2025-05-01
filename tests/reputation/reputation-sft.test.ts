import { describe, expect, it } from 'vitest';
import { Cl } from '@stacks/transactions';
import { alice, bob, constructDao, deployer, isValidExtension, passProposalByExecutiveSignals, reputationSft, setupSimnet, tom, treasury } from '../helpers';

const simnet = await setupSimnet();

async function assertBalance(user: string, tier: number, balance: number) {
	let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(tier), Cl.principal(user)], user);
	expect(bal.result).toEqual(Cl.ok(Cl.uint(balance * 2)));
}

describe('minting', () => {
	it('only dao can mint', async () => {
		constructDao(simnet);
		let response = await simnet.callPublicFn(reputationSft, 'mint', [Cl.principal(alice), Cl.uint(0), Cl.uint(1000)], deployer);
		expect(response.result).toEqual(Cl.error(Cl.uint(30001)));
	});
	it('only dao can burn', async () => {
		constructDao(simnet);
		let response = await simnet.callPublicFn(reputationSft, 'burn', [Cl.principal(alice), Cl.uint(0), Cl.uint(1000)], deployer);
		expect(response.result).toEqual(Cl.error(Cl.uint(30001)));
	});
	it('only dao can transfer', async () => {
		constructDao(simnet);
		let response = await simnet.callPublicFn(reputationSft, 'transfer', [Cl.uint(0), Cl.uint(1000), Cl.principal(alice), Cl.principal(bob)], deployer);
		expect(response.result).toEqual(Cl.error(Cl.uint(30001)));
	});
	it('dao can mint and burn additional amount', async () => {
		constructDao(simnet);
		passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1000 * 2)));
		passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-2');
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2000 * 2)));
		passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-3');
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1500 * 2 + 500)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(5 * 2 + 5)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(10 * 2)));
	});
	it('dao can transfer', async () => {
		constructDao(simnet);
		passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1000 * 2)));
		passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-4');
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(5 * 2 + 5)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(15 * 2 - 5)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2000 * 2 - 1000)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1000)));
	});
	it('dao can transfer many', async () => {
		constructDao(simnet);
		passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-5');
		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1999)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1999)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(19)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(19n)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(2), Cl.principal(tom)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(1), Cl.principal(tom)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(tom)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(4)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2018)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2018)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-total-supply', [Cl.uint(2)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(20 * 2)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-total-supply', [Cl.uint(1)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(2000 * 2)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-decimals', [Cl.uint(1)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(0)));
	});
});
describe('claiming', () => {
	it('cannot claim before first epoch', async () => {
		constructDao(simnet);
		let response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], deployer);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
	});

	it('cannot claim with 0 reps', async () => {
		constructDao(simnet);
		simnet.mineEmptyBlocks(4000);

		let response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], deployer);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
	});

	it('only dao extensions can trigger claims', async () => {
		constructDao(simnet);
		passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		passProposalByExecutiveSignals(simnet, 'bdp001-sft-disable');
		simnet.mineEmptyBlocks(4000);

		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(3000)));
	});

	it('alice cant claim twice in same epoch', async () => {
		constructDao(simnet);
		passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		simnet.mineEmptyBlocks(4000);

		isValidExtension(`${deployer}.bme030-0-reputation-token`);

		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		console.log('contractBalance: ' + stxBalances?.get(`${deployer}.${treasury}`));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(500000000)));

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
	});

	it('alice and bobs claims are proportional', async () => {
		constructDao(simnet);
		passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		simnet.mineEmptyBlocks(4000);

		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		console.log('contractBalance: ' + stxBalances?.get(`${deployer}.${treasury}`));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(500000000)));

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(500000000)));
	});

	it('alice and bob can claim subsequent epochs', async () => {
		constructDao(simnet);
		passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');

		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(0));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], bob);
		expect(bal.result).toEqual(Cl.uint(0));

		simnet.mineEmptyBlocks(4000);

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		console.log('contractBalance: ' + stxBalances?.get(`${deployer}.${treasury}`));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(500000000)));

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(500000000)));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(1));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], bob);
		expect(bal.result).toEqual(Cl.uint(1));

		simnet.mineEmptyBlocks(4000);

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(500000000)));

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(500000000)));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-epoch', [], bob);
		expect(bal.result).toEqual(Cl.uint(2));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-last-claimed-epoch', [Cl.principal(alice)], bob);
		expect(bal.result).toEqual(Cl.uint(2));
	});

	it('alice and bobs shares decrease proportionally when tom creates a market', async () => {
		constructDao(simnet);
		passProposalByExecutiveSignals(simnet, 'bdp001-sft-tokens-1');
		simnet.mineEmptyBlocks(4000);

		let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));
		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(bob)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
		console.log('contractBalance: ' + stxBalances?.get(`${deployer}.${treasury}`));

		bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-overall-balance', [Cl.principal(alice)], alice);
		expect(bal.result).toEqual(Cl.ok(Cl.uint(1010 * 2)));

		let response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(500000000)));

		response = await simnet.callPublicFn(reputationSft, 'claim-big-reward', [], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(500000000)));
	});
});
