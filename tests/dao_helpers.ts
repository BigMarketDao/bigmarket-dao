import { Simnet } from '@hirosystems/clarinet-sdk';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';
import { Cl, ClarityValue } from '@stacks/transactions';
import { expect } from 'vitest';
import { contractId2Key, generateMerkleProof, generateMerkleTreeUsingStandardPrincipal } from './gating/gating';

export const accounts = simnet.getAccounts();
export const deployer = accounts.get('deployer')!; // ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
export const alice = accounts.get('wallet_1')!; //ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
export const bob = accounts.get('wallet_2')!; // ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
export const tom = accounts.get('wallet_3')!; // ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC
export const betty = accounts.get('wallet_4')!; // ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND
export const fred = accounts.get('wallet_5')!; // ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB
export const wallace = accounts.get('wallet_6')!;
export const piedro = accounts.get('wallet_7')!;
export const annie = accounts.get('wallet_4')!;
export const developer = accounts.get('wallet_8')!;

export const sip13Token = `${deployer}.wrapped-stx`;
export const stxToken = `${deployer}.wrapped-stx`;
export const nftToken = `${deployer}.simple-nft`;
export const sbtcToken = `${deployer}.sbtc`;
export const tpepeToken = `${deployer}.tpepe`;
export const tusdhToken = `${deployer}.tusdh`;

export const proposalVoting = 'bme001-0-proposal-voting';
export const coreProposals = 'bme003-0-core-proposals';
export const marketVoting = 'bme021-0-market-voting';
export const marketGating = 'bme022-0-market-gating';
export const marketPredicting = 'bme024-0-market-predicting';
export const marketPredictingCPMM = 'bme024-0-market-predicting';
export const marketScalingCPMM = 'bme024-0-market-scalar-pyth';
export const reputationSft = 'bme030-0-reputation-token';
export const liquidityCont = 'bme010-0-liquidity-contribution';
export const treasury = 'bme006-0-treasury';
export const tokenSale = 'bme010-0-token-sale';
export const resolutionCoordinator = 'bme008-0-resolution-coordinator';
export const scalarStrategyHedge = 'bme032-0-scalar-strategy-hedge';

export const STXUSD = '0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17';
export const BTCUSD = '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43';
export const SOLUSD = '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';
export const ETHUSD = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';

export const bytes = (hex: string) => Buffer.from(hex, 'hex');
export const hex = (buf: Uint8Array) => Buffer.from(buf).toString('hex');

export function metadataHash() {
	const metadata = 'example metadata';
	const metadataHash = sha256(utf8ToBytes(metadata));
	return bytesToHex(metadataHash);
}

export function dataHash(message: string) {
	const metadataHash = sha256(utf8ToBytes(message));
	return bytesToHex(metadataHash);
}

/**
 * Constructs the DAO
 */
export async function constructDao(simnet: Simnet) {
	const proposal = simnet.deployer + '.' + 'bdp000-bootstrap';
	const result = simnet.callPublicFn(
		'bigmarket-dao', // Replace with actual contract name
		'construct',
		[Cl.principal(proposal)],
		simnet.deployer
	);
	// console.log("constructDao: ", Cl.prettyPrint(result.result));

	// Ensure the DAO is constructed successfully
	//expect(result.result).toEqual("(ok true)");
	return proposal;
}

export async function assertDataVarNumber(simnet: Simnet, contract: string, varName: string, value: number | undefined) {
	let result = Number((simnet.getDataVar(contract, varName) as any).value);
	expect(result).toEqual(value);
}
export async function assertMapEntry(simnet: Simnet, contract: string, mapName: string, mapKey: ClarityValue, value: string) {
	let result = simnet.getMapEntry(contract, mapName, mapKey) as ClarityValue;
	console.log('assertMapEntry: ', Cl.prettyPrint(result));
	expect(result).toEqual(value);
}
export async function assertContractBalance(simnet: Simnet, contract: string, value: bigint | undefined) {
	let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
	//console.log('contractBalance : ' + contract + ' : ' + stxBalances?.get(`${deployer}.${contract}`));
	expect(stxBalances?.get(`${deployer}.${contract}`)).toEqual(value);
}

export async function assertUserBalanceToken(simnet: Simnet, user: string, value: bigint, token: string) {
	let stxBalances = simnet.getAssetsMap().get(token); // Replace if contract's principal
	// console.log('assertUserBalance: ' + user + stxBalances?.get(`${user}`));
	expect(stxBalances?.get(`${user}`)).toEqual(value);
}

export async function assertUserBalance(simnet: Simnet, user: string, value: bigint) {
	let stxBalances = simnet.getAssetsMap().get('STX'); // Replace if contract's principal
	// console.log('assertUserBalance: ' + user + stxBalances?.get(`${user}`));
	expect(stxBalances?.get(`${user}`)).toEqual(value);
}

export async function assertStakeBalance(simnet: Simnet, user: string, againstValue: number, forValue: number) {
	let data = simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-stake-balances', [Cl.uint(0), Cl.principal(user)], alice);
	expect(data.result).toEqual(
		Cl.some(Cl.list([Cl.uint(forValue), Cl.uint(againstValue), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)]))
	);
}

export async function corePropose(simnet: any, proposalName: string) {
	const alice = accounts.get('wallet_1')!;
	const deployer = accounts.get('deployer')!;
	const proposal1 = `${deployer}.${proposalName}`;
	const result = simnet.callPublicFn(coreProposals, 'core-propose', [Cl.principal(proposal1), Cl.uint(simnet.blockHeight + 2), Cl.uint(100), Cl.some(Cl.uint(6600))], alice);
	expect(result.result).toEqual(Cl.ok(Cl.bool(true)));
	return result;
}
//(define-public (core-propose (proposal <proposal-trait>) (start-burn-height uint) (duration uint) (custom-majority (optional uint)))

/**
 * Pass a Proposal by Signals
 */
export async function passProposalByExecutiveSignals(simnet: any, proposalName: string) {
	const proposal = `${deployer}.${proposalName}`;

	// Signal 1 by Alice
	const response2 = simnet.callPublicFn(
		'bme004-0-core-execute', // Replace with actual contract name
		'executive-action',
		[Cl.principal(proposal)],
		alice
	);
	expect(response2.result).toEqual(Cl.ok(Cl.uint(1)));

	// Signal 2 by Bob
	simnet.callPublicFn('bme004-0-core-execute', 'executive-action', [Cl.principal(proposal)], bob);
	expect(response2.result).toEqual(Cl.ok(Cl.uint(1)));

	// Check if the proposal is executed
	const executedAt = simnet.callReadOnlyFn('bigmarket-dao', 'executed-at', [Cl.principal(proposal)], deployer);
	//console.log("executedAt: ", executedAt);
	//expect(executedAt.result).toEqual(Cl.some(Cl.uint(619n)));
	expect(executedAt.result).toMatchObject(/^ok u\d+/); // Expect a valid block height
	return response2;
}

export async function isValidExtension(extension: string) {
	let data = simnet.callReadOnlyFn('bigmarket-dao', 'is-extension', [Cl.principal(extension)], alice);
	expect(data.result).toEqual(Cl.bool(true));
	return true;
}

export function prepareVotes(
	voters: {
		voter: string;
		votingPower: number;
		for: boolean;
		timestamp: number;
	}[]
) {
	return Cl.list(
		voters.map((v) =>
			Cl.tuple({
				message: Cl.tuple({
					voter: Cl.principal(v.voter),
					'voting-power': Cl.uint(v.votingPower),
					for: Cl.bool(v.for),
					timestamp: Cl.uint(v.timestamp)
				}),
				signature: Cl.buffer(new Uint8Array(65).fill(0x01)) // Dummy signature, replace with real signature if available
			})
		)
	);
}

export async function passProposalByCoreVote(proposal: string, errorCode?: number) {
	const coreProposeResponse = simnet.callPublicFn(
		coreProposals,
		'core-propose',
		[Cl.principal(`${deployer}.${proposal}`), Cl.uint(simnet.burnBlockHeight + 20), Cl.uint(100), Cl.some(Cl.uint(6600))],
		alice
	);
	expect(coreProposeResponse.result).toEqual(Cl.ok(Cl.bool(true)));

	// Step 3: Mine 2 empty blocks
	simnet.mineEmptyBurnBlocks(20);

	// Step 4: Vote on the proposal
	const voteResponse = simnet.callPublicFn(proposalVoting, 'vote', [Cl.uint(1000), Cl.bool(true), Cl.principal(`${deployer}.${proposal}`), Cl.none()], bob);
	expect(voteResponse.result).toEqual(Cl.ok(Cl.bool(true)));

	// Step 6: Mine 200 empty blocks to reach the conclusion point
	simnet.mineEmptyBurnBlocks(200);

	// Step 7: Conclude the proposal
	const concludeResponse = simnet.callPublicFn(proposalVoting, 'conclude', [Cl.principal(`${deployer}.${proposal}`)], bob);
	if (errorCode) {
		expect(concludeResponse.result).toEqual(Cl.error(Cl.uint(errorCode)));
	} else {
		expect(concludeResponse.result).toEqual(Cl.ok(Cl.bool(true)));
	}
	return concludeResponse;
}
export async function claimDao(market: string, marketId: number, share: number, code?: number) {
	let response = simnet.callPublicFn('bme006-0-treasury', 'claim-for-dao', [Cl.principal(market), Cl.uint(marketId), Cl.principal(stxToken)], bob);
	if (code) {
		expect(response.result).toEqual(Cl.error(Cl.uint(code)));
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.uint(share)));
	}
}

export async function allowMarketCreators(user: string) {
	const allowedCreators = [alice, bob, tom, betty, wallace];
	const { tree, root } = generateMerkleTreeUsingStandardPrincipal(allowedCreators);
	// console.log('Leaves (Tree):', tree.getLeaves().map(bytesToHex));
	const lookupRootKey = contractId2Key('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bme024-0-market-predicting');
	// console.log('root=' + root);
	// console.log('lookupRootKey=' + lookupRootKey);
	const proposal = `bdp001-gating`;
	await passProposalByCoreVote(proposal);
	let merdat = generateMerkleProof(tree, user);

	return merdat.proof;
}
