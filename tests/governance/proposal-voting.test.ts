import { Cl, someCV, tupleCV } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { alice, bob, constructDao, coreProposals, corePropose, deployer, passProposalByCoreVote } from '../dao_helpers';

describe('proposal voting system', () => {
	it('non-DAO user cannot add a proposal', async () => {
		constructDao(simnet);

		const tx = simnet.callPublicFn(
			'bme001-0-proposal-voting',
			'add-proposal',
			[
				Cl.contractPrincipal(deployer, 'bdp000-voting-propose'),
				Cl.tuple({
					'start-burn-height': Cl.uint(0),
					'end-burn-height': Cl.uint(10),
					proposer: Cl.standardPrincipal(alice),
					'custom-majority': Cl.none()
				})
			],
			alice
		);

		// Expect unauthorized error (u3000)
		expect(tx.result).toEqual(Cl.error(Cl.uint(3000)));
	});

	it('DAO cannot add proposal directly', async () => {
		constructDao(simnet);

		// Pass a core proposal that adds a new fake proposal (like your governance-setters pattern)
		// const result = await passProposalByCoreVote('bdp000-voting-propose');
		// expect(result.result).toEqual(Cl.ok(Cl.bool(true)));

		// Now manually add another test proposal through DAO call
		const proposalPrincipal = Cl.contractPrincipal(deployer, 'bdp000-voting-propose');
		const tx = simnet.callPublicFn(
			'bme001-0-proposal-voting',
			'add-proposal',
			[
				proposalPrincipal,
				Cl.tuple({
					'start-burn-height': Cl.uint(0),
					'end-burn-height': Cl.uint(200),
					proposer: Cl.standardPrincipal(deployer),
					'custom-majority': Cl.none()
				})
			],
			deployer // executed via DAO in reality
		);

		expect(tx.result).toEqual(Cl.error(Cl.uint(3000)));

		// Confirm it’s stored
		const ro = simnet.callReadOnlyFn('bme001-0-proposal-voting', 'get-proposal-data', [proposalPrincipal], deployer);
		expect(ro.result).toEqual(Cl.none());
	});

	it('proposal starts too soon', async () => {
		constructDao(simnet);
		const proposalPrincipal = Cl.contractPrincipal(deployer, 'bdp000-voting-propose');
		const tx = simnet.callPublicFn(coreProposals, 'core-propose', [proposalPrincipal, Cl.uint(simnet.blockHeight - 5), Cl.uint(100), Cl.some(Cl.uint(6600))], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(3304)));
	});

	it('proposal ends too late', async () => {
		constructDao(simnet);
		const proposalPrincipal = Cl.contractPrincipal(deployer, 'bdp000-voting-propose');
		const tx = simnet.callPublicFn(coreProposals, 'core-propose', [proposalPrincipal, Cl.uint(simnet.blockHeight + 5), Cl.uint(1001), Cl.some(Cl.uint(6600))], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(3305)));
	});

	it('err-sunset-height-reached', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-voting-propose');

		simnet.mineEmptyBurnBlocks(888889);

		const proposalPrincipal = Cl.contractPrincipal(deployer, 'bdbp001-set-manual-fallback'); // random prop
		const tx = simnet.callPublicFn(coreProposals, 'core-propose', [proposalPrincipal, Cl.uint(simnet.blockHeight + 5), Cl.uint(100), Cl.some(Cl.uint(6600))], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(3302)));
	});

	it('err-sunset-height-in-past', async () => {
		constructDao(simnet);
		//passProposalByCoreVote('bdp000-voting-propose');

		const proposalPrincipal = Cl.contractPrincipal(deployer, 'bdp000-voting-propose-sunset');
		let tx = simnet.callPublicFn(coreProposals, 'core-propose', [proposalPrincipal, Cl.uint(simnet.blockHeight + 5), Cl.uint(100), Cl.some(Cl.uint(6600))], alice);
		// corePropose(simnet, 'bdp000-voting-propose');
		simnet.mineEmptyBurnBlocks(20);

		// Alice votes FOR
		tx = simnet.callPublicFn('bme001-0-proposal-voting', 'vote', [Cl.uint(1000), Cl.bool(true), proposalPrincipal, Cl.none()], alice);
		expect(tx.result).toEqual(Cl.ok(Cl.bool(true)));

		// Bob votes AGAINST
		tx = simnet.callPublicFn('bme001-0-proposal-voting', 'vote', [Cl.uint(500), Cl.bool(false), proposalPrincipal, Cl.none()], bob);
		expect(tx.result).toEqual(Cl.ok(Cl.bool(true)));

		// Mine enough blocks to reach end
		simnet.mineEmptyBlocks(988889);

		// Conclude
		simnet.callPublicFn('bme001-0-proposal-voting', 'conclude', [proposalPrincipal], deployer);
		//expect(tx.result).toEqual(Cl.error(Cl.uint(3303)));
	});

	it('users can vote and conclude proposal', async () => {
		constructDao(simnet);

		// Add a test proposal (DAO call simulation)
		const proposalPrincipal = Cl.contractPrincipal(deployer, 'bdp000-voting-propose');
		corePropose(simnet, 'bdp000-voting-propose');
		simnet.mineEmptyBurnBlocks(20);

		// Alice votes FOR
		let tx = simnet.callPublicFn('bme001-0-proposal-voting', 'vote', [Cl.uint(1000), Cl.bool(true), proposalPrincipal, Cl.none()], alice);
		expect(tx.result).toEqual(Cl.ok(Cl.bool(true)));

		// Bob votes AGAINST
		tx = simnet.callPublicFn('bme001-0-proposal-voting', 'vote', [Cl.uint(500), Cl.bool(false), proposalPrincipal, Cl.none()], bob);
		expect(tx.result).toEqual(Cl.ok(Cl.bool(true)));

		// Mine enough blocks to reach end
		simnet.mineEmptyBlocks(100);

		// Conclude
		const concludeTx = simnet.callPublicFn('bme001-0-proposal-voting', 'conclude', [proposalPrincipal], deployer);
		expect(concludeTx.result).toEqual(Cl.ok(Cl.bool(true)));

		// Read back proposal data to confirm conclusion
		const ro = simnet.callReadOnlyFn('bme001-0-proposal-voting', 'get-proposal-data', [proposalPrincipal], deployer);
		console.log('users can vote and conclude proposal', ro.result);
		const proposalData = ro.result;
		expect(proposalData).toMatchObject(
			someCV(
				tupleCV({
					concluded: Cl.bool(true),
					passed: Cl.bool(true)
				})
			)
		);
		// expect(proposalData['concluded']).toBe(true);
		// expect(proposalData['passed']).toBe(true);
	});

	it('reclaim votes after conclusion', async () => {
		constructDao(simnet);

		// Add and conclude as before
		const proposalPrincipal = Cl.contractPrincipal(deployer, 'bdp000-voting-propose');
		corePropose(simnet, 'bdp000-voting-propose');
		simnet.mineEmptyBurnBlocks(20);
		let tx = simnet.callPublicFn('bme001-0-proposal-voting', 'vote', [Cl.uint(100), Cl.bool(true), proposalPrincipal, Cl.none()], alice);
		expect(tx.result).toEqual(Cl.ok(Cl.bool(true)));
		simnet.mineEmptyBurnBlocks(100);
		tx = simnet.callPublicFn('bme001-0-proposal-voting', 'conclude', [proposalPrincipal], deployer);
		expect(tx.result).toEqual(Cl.ok(Cl.bool(true)));

		// Now reclaim
		const reclaimTx = simnet.callPublicFn('bme001-0-proposal-voting', 'reclaim-votes', [Cl.some(proposalPrincipal)], alice);
		expect(reclaimTx.result).toEqual(Cl.ok(Cl.bool(true)));
	});

	it('callback returns ok true', async () => {
		const tx = simnet.callPublicFn('bme001-0-proposal-voting', 'callback', [Cl.standardPrincipal(alice), Cl.bufferFromHex('00')], alice);
		expect(tx.result).toEqual(Cl.ok(Cl.bool(true)));
	});
});
