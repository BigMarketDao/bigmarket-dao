import { Cl } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { constructDao, passProposalByCoreVote, tokenSale } from './dao_helpers';

const accounts = simnet.getAccounts();

const acc = simnet.getAccounts();
const alice = acc.get('wallet_1')!;
const bob = acc.get('wallet_2')!;
const deployer = accounts.get('deployer')!;
const coreProposals = 'bme003-0-core-proposals'; // Replace with actual contract name
const proposalVoting = 'bme001-0-proposal-voting'; // Replace with actual contract name
async function callCallback(extension: string) {
	let tx = simnet.callPublicFn(extension, 'callback', [Cl.principal(alice), Cl.bufferFromAscii('0x0a')], deployer);
	expect(tx.result).toEqual(Cl.ok(Cl.bool(true)));
}

/* 
  The test below is an example.  Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/
describe('test callback methods in all extensions', () => {
	it('ensures the contract is deployed', () => {
		constructDao(simnet);
		callCallback('bme000-0-governance-token');
		callCallback('bme001-0-proposal-voting');
		callCallback('bme003-0-core-proposals');
		callCallback('bme006-0-treasury');
		callCallback('bme008-0-resolution-coordinator');
		callCallback('bme010-0-liquidity-contribution');
		callCallback('bme021-0-market-voting');
		callCallback('bme022-0-market-gating');
		callCallback('bme024-0-market-predicting');
		callCallback('bme024-0-market-scalar-pyth');
		callCallback('bme030-0-reputation-token');
		callCallback('bme032-0-scalar-strategy-hedge');
		callCallback('bme040-0-shares-marketplace');
	});
});

describe('bme001-0-proposal-voting contract', () => {
	it('ensures the contract is deployed', () => {
		const contractSource = simnet.getContractSource('bme001-0-proposal-voting');
		expect(contractSource).toBeDefined();
		//console.log(contractSource);
	});

	it('try set extension', () => {
		constructDao(simnet);
		let tx = simnet.callPublicFn('bigmarket-dao', 'set-extension', [Cl.principal(`${deployer}.${tokenSale}`), Cl.bool(true)], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(1000)));
		let data = simnet.callReadOnlyFn('bigmarket-dao', 'is-extension', [Cl.principal(`${deployer}.${tokenSale}`)], alice);
		expect(data.result).toEqual(Cl.bool(true));

		passProposalByCoreVote('bdp000-extensions');
		data = simnet.callReadOnlyFn('bigmarket-dao', 'is-extension', [Cl.principal(`${deployer}.${tokenSale}`)], alice);
		expect(data.result).toEqual(Cl.bool(false));
		tx = simnet.callPublicFn('bigmarket-dao', 'request-extension-callback', [Cl.principal(`${deployer}.${tokenSale}`), Cl.bufferFromAscii('nay')], alice);
		expect(tx.result).toEqual(Cl.error(Cl.uint(1002)));
	});

	it('core-propose - can set new sunset height', async () => {
		// Step 1: Construct DAO
		const daoProposal = `${deployer}.bdp000-bootstrap`;
		const constructResponse = simnet.callPublicFn(
			'bigmarket-dao', // Replace with actual DAO contract name
			'construct',
			[Cl.principal(daoProposal)],
			deployer
		);
		expect(constructResponse.result.type).toEqual(constructResponse.result.type);
		expect(constructResponse.result).toEqual(Cl.ok(Cl.bool(true)));

		// Step 2: Submit the sunset height proposal
		const proposal1 = `${deployer}.bdp000-core-team-sunset-height`;
		const coreProposeResponse = simnet.callPublicFn(
			coreProposals,
			'core-propose',
			[Cl.principal(proposal1), Cl.uint(simnet.burnBlockHeight + 10), Cl.uint(100), Cl.some(Cl.uint(6600))],
			alice
		);
		expect(coreProposeResponse.result).toEqual(Cl.ok(Cl.bool(true)));

		// Step 3: Mine 2 empty blocks
		simnet.mineEmptyBurnBlocks(20);

		// Step 4: Vote on the proposal
		const voteResponse = simnet.callPublicFn(proposalVoting, 'vote', [Cl.uint(1000), Cl.bool(true), Cl.principal(proposal1), Cl.none()], bob);
		expect(voteResponse.result).toEqual(Cl.ok(Cl.bool(true)));

		// Step 6: Mine 200 empty blocks to reach the conclusion point
		simnet.mineEmptyBurnBlocks(200);

		// Step 7: Conclude the proposal
		const concludeResponse = simnet.callPublicFn(proposalVoting, 'conclude', [Cl.principal(proposal1)], bob);
		expect(concludeResponse.result).toEqual(Cl.ok(Cl.bool(true)));

		// Step 8: Check the sunset height after conclusion
		const heightAfter = simnet.getDataVar(coreProposals, 'core-team-sunset-height');
		console.log('heightAfter: ', heightAfter);
		expect((heightAfter as any).value).toBeGreaterThan(0n); // Expect updated height
	});
});
