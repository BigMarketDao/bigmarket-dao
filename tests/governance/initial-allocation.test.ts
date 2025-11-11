import { Cl } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { alice, betty, bob, constructDao, deployer, fred, passProposalByCoreVote, tom, wallace } from '../dao_helpers';

process.on('unhandledRejection', (reason) => {
	const msg = String(reason);
	// swallow only the late Clarity unwrap noise
	if (msg.includes('value not found')) {
		console.warn('🔇 Swallowed late Clarity WASM "value not found" rejection');
		return;
	}
	throw reason;
});

async function checkIsNotRecipient(user: string) {
	let response = simnet.callReadOnlyFn('bme000-0-governance-token', 'get-vesting-schedule', [Cl.principal(betty)], deployer);
	expect(response.result).toEqual(Cl.none());
}

async function checkIsRecipient(user: string, amount: number, duration: number, claimed: number) {
	let response = simnet.callReadOnlyFn('bme000-0-governance-token', 'get-vesting-schedule', [Cl.standardPrincipal(user)], deployer);
	expect(response.result).toMatchObject(Cl.some(Cl.tuple({ 'total-amount': Cl.uint(amount), duration: Cl.uint(duration), claimed: Cl.uint(claimed) })));
}

async function makeClaim(user: string) {
	let response = simnet.callPublicFn('bme000-0-governance-token', 'core-claim', [], user);
	return response;
}

describe('initial distribution', () => {
	it('User is not recipient', async () => {
		constructDao(simnet);
		checkIsNotRecipient(betty);
	});

	it('check initial recipients', async () => {
		constructDao(simnet);
		checkIsRecipient(deployer, 300000000000, 105120, 0);
		checkIsRecipient(alice, 300000000000, 105120, 0);
		checkIsRecipient(tom, 300000000000, 105120, 0);
		checkIsRecipient(bob, 300000000000, 105120, 0);
	});

	it('cannot reset allocation directly', async () => {
		constructDao(simnet);
		let response = simnet.callPublicFn(
			'bme000-0-governance-token',
			'set-core-team-vesting',
			[Cl.list([Cl.tuple({ 'start-block': Cl.uint(100), recipient: Cl.standardPrincipal(deployer), duration: Cl.uint(105120) })])],
			deployer
		);
		expect(response.result).toEqual(Cl.error(Cl.uint(3000n)));
	});

	it('can reset allocation via dao', async () => {
		constructDao(simnet);
		let response = await passProposalByCoreVote('bdp001-reset-allocation');
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));

		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
		//console.log(response.events)
		checkIsRecipient(deployer, 500000000000, 100, 0);
		checkIsRecipient(wallace, 500000000000, 100, 0);
		checkIsRecipient(fred, 500000000000, 100, 0);
		checkIsNotRecipient(tom);
		checkIsNotRecipient(bob);
	});

	it('cannot claim before cliff', async () => {
		constructDao(simnet);
		simnet.mineEmptyBlocks(105120 / 2);
		checkIsRecipient(alice, 300000000000, 105120, 0);
		let response = await makeClaim(alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(3006)));
	});

	it('can claim after cliff', async () => {
		constructDao(simnet);
		checkIsRecipient(alice, 300000000000, 105120, 0);
		simnet.mineEmptyBlocks(105120 + 1);
		let response = await makeClaim(alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(300000000000)));
	});

	it('can claim incrementally after cliff', async () => {
		constructDao(simnet);
		checkIsRecipient(alice, 300000000000, 105120, 0);
		simnet.mineEmptyBlocks(105120 / 2 + 1);
		let response = await makeClaim(alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(150002853881)));
		simnet.mineEmptyBlocks(105120 / 4);
		response = await makeClaim(alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(75000000000)));
		simnet.mineEmptyBlocks(105120 / 4);
		response = await makeClaim(alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(74997146119)));
		simnet.mineEmptyBlocks(105120 / 4);
		response = await makeClaim(alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(3004)));
	});

	it('cannot reset allocation after first claim made', async () => {
		constructDao(simnet);
		simnet.mineEmptyBlocks(105120 / 2 + 1);
		let response = await makeClaim(alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(150002853881)));
		checkIsRecipient(alice, 300000000000, 105120, 150002853881);

		const response1 = await passProposalByCoreVote('bdp001-reset-allocation', 3007);
		//console.log(response1)
	});
});
