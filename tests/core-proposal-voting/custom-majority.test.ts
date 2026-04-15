import { Cl } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { alice, bob, constructDao, coreProposals, deployer, proposalVoting } from '../dao_helpers';

describe('custom majority tests', () => {
	it('check value set by proposal', async () => {
		await constructDao(simnet);
		const proposal = 'bdp001-initialise-token-sale';
		await corePropose(alice, proposal, 6600);
		ensureProposalDataMatches(proposal, 0, 0, 6600, alice, false, false);
	});

	it('check none set by proposal', async () => {
		await constructDao(simnet);
		const proposal = 'bdp001-initialise-token-sale';
		await corePropose(alice, proposal);
		ensureProposalDataMatches(proposal, 0, 0, -1, alice, false, false);
	});

	it('check err-not-majority', async () => {
		await constructDao(simnet);
		const proposal = 'bdp001-initialise-token-sale';
		await corePropose(alice, proposal, 80, 3011);
	});

	it('check err-not-majority for 50%', async () => {
		await constructDao(simnet);
		const proposal = 'bdp001-initialise-token-sale';
		await corePropose(alice, proposal, 5000, 3011);
	});

	it('check ok for 50.01%', async () => {
		await constructDao(simnet);
		const proposal = 'bdp001-initialise-token-sale';
		await corePropose(alice, proposal, 5001);
	});

	it('check vote cant conclude before end height', async () => {
		await constructDao(simnet);
		const proposal = 'bdp001-initialise-token-sale';
		await corePropose(deployer, proposal);
		simnet.mineEmptyBurnBlocks(20);
		vote(bob, proposal, 100, false);
		vote(alice, proposal, 100, true);
		simnet.mineEmptyBurnBlocks(20);
		ensureProposalDataMatches(proposal, 100, 100, -1, deployer, false, false);
		conclude(proposal, true, 3009);
	});

	it('check tied vote concludes false', async () => {
		await constructDao(simnet);
		const proposal = 'bdp001-initialise-token-sale';
		await corePropose(deployer, proposal);
		simnet.mineEmptyBurnBlocks(20);
		vote(bob, proposal, 100, false);
		vote(alice, proposal, 100, true);
		simnet.mineEmptyBurnBlocks(20);
		ensureProposalDataMatches(proposal, 100, 100, -1, deployer, false, false);
		simnet.mineEmptyBurnBlocks(200);
		conclude(proposal, false);
	});

	it('check vote less than custom concludes false', async () => {
		await constructDao(simnet);
		const proposal = 'bdp001-initialise-token-sale';
		await corePropose(deployer, proposal, 5001);
		simnet.mineEmptyBurnBlocks(20);
		vote(bob, proposal, 10001, false);
		vote(alice, proposal, 10002, true);
		simnet.mineEmptyBurnBlocks(20);
		ensureProposalDataMatches(proposal, 10002, 10001, 5001, deployer, false, false);
		simnet.mineEmptyBurnBlocks(200);
		conclude(proposal, false);
	});

	it('check vote equal to custom concludes false', async () => {
		await constructDao(simnet);
		const proposal = 'bdp001-initialise-token-sale';
		await corePropose(deployer, proposal, 5001);
		simnet.mineEmptyBurnBlocks(20);
		vote(bob, proposal, 10001, false);
		vote(alice, proposal, 10002, true);
		simnet.mineEmptyBurnBlocks(20);
		ensureProposalDataMatches(proposal, 10002, 10001, 5001, deployer, false, false);
		simnet.mineEmptyBurnBlocks(200);
		conclude(proposal, false);
	});

	it('check vote greater than custom concludes true', async () => {
		await constructDao(simnet);
		const proposal = 'bdp001-initialise-token-sale';
		await corePropose(deployer, proposal, 5001);
		simnet.mineEmptyBurnBlocks(20);
		vote(bob, proposal, 10000, false);
		vote(alice, proposal, 10005, true);
		simnet.mineEmptyBurnBlocks(20);
		ensureProposalDataMatches(proposal, 10005, 10000, 5001, deployer, false, false);
		simnet.mineEmptyBurnBlocks(200);
		conclude(proposal, true);
	});
});

// ==========================================================================================
// Helper functions
async function conclude(proposal: string, outcome: boolean, errorCode?: number) {
	const response = simnet.callPublicFn(proposalVoting, 'conclude', [Cl.principal(`${deployer}.${proposal}`)], bob);
	if (errorCode) {
		expect(response.result).toEqual(Cl.error(Cl.uint(errorCode)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.bool(outcome)));
	}
}
async function vote(voter: string, proposal: string, amount: number, yes: boolean, errorCode?: number) {
	const response = simnet.callPublicFn(proposalVoting, 'vote', [Cl.uint(amount), Cl.bool(yes), Cl.principal(`${deployer}.${proposal}`), Cl.none()], voter);
	if (errorCode) {
		expect(response.result).toEqual(Cl.error(Cl.uint(errorCode)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
	}
}
async function corePropose(proposer: string, proposal: string, customMajority?: number, errorCode?: number) {
	const response = simnet.callPublicFn(
		coreProposals,
		'core-propose',
		[Cl.principal(`${deployer}.${proposal}`), Cl.uint(simnet.burnBlockHeight + 10), Cl.uint(100), !customMajority ? Cl.none() : Cl.some(Cl.uint(customMajority))],
		proposer
	);
	if (errorCode) {
		expect(response.result).toEqual(Cl.error(Cl.uint(errorCode)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
	}
}
async function ensureProposalDataMatches(
	proposal: string,
	votesFor: number,
	votesAgainst: number,
	customMajority: number,
	proposer: string,
	concluded: boolean,
	passed: boolean
) {
	let response = simnet.callReadOnlyFn(proposalVoting, 'get-proposal-data', [Cl.principal(`${deployer}.${proposal}`)], alice);
	expect(response.result).toMatchObject(
		Cl.some(
			Cl.tuple({
				'votes-for': Cl.uint(votesFor),
				'votes-against': Cl.uint(votesAgainst),
				'custom-majority': customMajority < 0 ? Cl.none() : Cl.some(Cl.uint(customMajority)),
				proposer: Cl.principal(proposer),
				concluded: Cl.bool(concluded),
				passed: Cl.bool(passed)
			})
		)
	);
}
