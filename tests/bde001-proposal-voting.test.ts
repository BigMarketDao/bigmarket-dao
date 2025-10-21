import { Cl } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { setupSimnet } from './helpers';

const simnet = await setupSimnet();
const accounts = await simnet.getAccounts();

const acc = await simnet.getAccounts();
const alice = acc.get('wallet_1')!;
const bob = acc.get('wallet_2')!;
const deployer = accounts.get('deployer')!;
const coreProposals = 'bme003-0-core-proposals'; // Replace with actual contract name
const proposalVoting = 'bme001-0-proposal-voting'; // Replace with actual contract name

/*
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/

describe('bme001-0-proposal-voting contract', () => {
	it('ensures the contract is deployed', () => {
		const contractSource = simnet.getContractSource('bme001-0-proposal-voting');
		expect(contractSource).toBeDefined();
		//console.log(contractSource);
	});

	it('core-propose - can set new sunset height', async () => {
		// Step 1: Construct DAO
		const daoProposal = `${deployer}.bdp000-bootstrap`;
		const constructResponse = await simnet.callPublicFn(
			'bigmarket-dao', // Replace with actual DAO contract name
			'construct',
			[Cl.principal(daoProposal)],
			deployer
		);
		expect(constructResponse.result.type).toEqual(constructResponse.result.type);
		expect(constructResponse.result).toEqual(Cl.ok(Cl.bool(true)));

		// Step 2: Submit the sunset height proposal
		const proposal1 = `${deployer}.bdp000-core-team-sunset-height`;
		const coreProposeResponse = await simnet.callPublicFn(
			coreProposals,
			'core-propose',
			[Cl.principal(proposal1), Cl.uint(simnet.burnBlockHeight + 10), Cl.uint(100), Cl.some(Cl.uint(6600))],
			alice
		);
		expect(coreProposeResponse.result).toEqual(Cl.ok(Cl.bool(true)));

		// Step 3: Mine 2 empty blocks
		await simnet.mineEmptyBurnBlocks(20);

		// Step 4: Vote on the proposal
		const voteResponse = await simnet.callPublicFn(proposalVoting, 'vote', [Cl.uint(1000), Cl.bool(true), Cl.principal(proposal1), Cl.none()], bob);
		expect(voteResponse.result).toEqual(Cl.ok(Cl.bool(true)));

		// Step 6: Mine 200 empty blocks to reach the conclusion point
		await simnet.mineEmptyBurnBlocks(200);

		// Step 7: Conclude the proposal
		const concludeResponse = await simnet.callPublicFn(proposalVoting, 'conclude', [Cl.principal(proposal1)], bob);
		expect(concludeResponse.result).toEqual(Cl.ok(Cl.bool(true)));

		// Step 8: Check the sunset height after conclusion
		const heightAfter = await simnet.getDataVar(coreProposals, 'core-team-sunset-height');
		console.log('heightAfter: ', heightAfter);
		expect((heightAfter as any).value).toBeGreaterThan(0n); // Expect updated height
	});
});

// it("two votes one good", async () => {
//   constructDao(simnet);
//   const proposal = `${deployer}.bdp000-core-team-sunset-height`;
//   corePropose(simnet, proposalVoting, proposal);
//   const votes = prepareVotes([
//     { voter: alice, votingPower: 100, for: true, timestamp: 1633024800 },
//     { voter: bob, votingPower: 50, for: false, timestamp: 1633025800 },
//   ]);

//   const result = await simnet.callPublicFn(
//     "bme001-0-proposal-voting",
//     "batch-vote",
//     [Cl.principal(proposal), votes],
//     wallet1
//   );

//   console.log(Cl.prettyPrint(result.result));
// });
