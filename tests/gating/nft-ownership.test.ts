import { Cl } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { alice, betty, bob, constructDao, marketGating, metadataHash, nftToken, passProposalByCoreVote, stxToken, tom, wallace } from '../dao_helpers';
import { generateMerkleProof, generateMerkleTreeUsingStandardPrincipal, proofToClarityValue } from './gating';

const getProof = () => {
	//const lookupRootKey = contractId2Key('ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5.bme021-0-market-voting');
	const allowedCreators = [alice, bob, tom, betty, wallace];
	const { tree } = generateMerkleTreeUsingStandardPrincipal(allowedCreators);
	const { proof } = generateMerkleProof(tree, bob);

	//let data = simnet.callReadOnlyFn('bme022-0-market-gating', 'get-merkle-root', [Cl.bufferFromHex(lookupRootKey)], alice);
	//expect(data.result).toEqual(Cl.none());

	return proofToClarityValue(proof);
};
const ftargs = [Cl.bufferFromHex(metadataHash()), Cl.none(), Cl.some(Cl.principal(stxToken)), Cl.none(), getProof(), Cl.uint(1)];

describe('nft gating market  coverage', () => {
	it('err-expecting-merkle-root-for-poll', async () => {
		await constructDao(simnet);

		// (market-data-hash (buff 32)) (nft-contract (optional <nft-trait>)) (ft-contract (optional <ft-trait>))  (token-id (optional uint))
		// (proof (list 10 (tuple (position bool) (hash (buff 32)))))  (quantity uint)
		const args = [Cl.bufferFromHex(metadataHash()), Cl.some(Cl.principal(nftToken)), Cl.none(), Cl.some(Cl.uint(1)), getProof(), Cl.uint(1)];

		const cb = simnet.callPublicFn(marketGating, 'can-access-by-ownership', args, alice);
		expect(cb.result).toEqual(Cl.error(Cl.uint(2212)));
	});
	it('err-not-nft-owner', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-gating');

		// (market-data-hash (buff 32)) (nft-contract (optional <nft-trait>)) (ft-contract (optional <ft-trait>))  (token-id (optional uint))
		// (proof (list 10 (tuple (position bool) (hash (buff 32)))))  (quantity uint)
		const args = [Cl.bufferFromHex(metadataHash()), Cl.some(Cl.principal(nftToken)), Cl.none(), Cl.some(Cl.uint(2)), getProof(), Cl.uint(1)];
		console.log(metadataHash());
		const cb = simnet.callPublicFn(marketGating, 'can-access-by-ownership', args, alice);
		expect(cb.result).toEqual(Cl.error(Cl.uint(2207)));
	});
	it('err-ownership-proof-invalid', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-gating');

		// (market-data-hash (buff 32)) (nft-contract (optional <nft-trait>)) (ft-contract (optional <ft-trait>))  (token-id (optional uint))
		// (proof (list 10 (tuple (position bool) (hash (buff 32)))))  (quantity uint)
		const args = [Cl.bufferFromHex(metadataHash()), Cl.some(Cl.principal(nftToken)), Cl.none(), Cl.some(Cl.uint(1)), getProof(), Cl.uint(1)];
		console.log(metadataHash());
		const cb = simnet.callPublicFn(marketGating, 'can-access-by-ownership', args, alice);
		expect(cb.result).toEqual(Cl.error(Cl.uint(2215)));
	});
	it('err-ownership-proof-invalid', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-gating');

		// (market-data-hash (buff 32)) (nft-contract (optional <nft-trait>)) (ft-contract (optional <ft-trait>))  (token-id (optional uint))
		// (proof (list 10 (tuple (position bool) (hash (buff 32)))))  (quantity uint)
		const args = [Cl.bufferFromHex(metadataHash()), Cl.some(Cl.principal(nftToken)), Cl.none(), Cl.some(Cl.uint(1)), getProof(), Cl.uint(1)];
		console.log(metadataHash());
		const cb = simnet.callPublicFn(marketGating, 'can-access-by-ownership', args, bob);
		expect(cb.result).toEqual(Cl.error(Cl.uint(2215)));
	});
});

describe('ft gating market  coverage', () => {
	it('err-expecting-merkle-root-for-poll', async () => {
		await constructDao(simnet);

		// (market-data-hash (buff 32)) (nft-contract (optional <nft-trait>)) (ft-contract (optional <ft-trait>))  (token-id (optional uint))
		// (proof (list 10 (tuple (position bool) (hash (buff 32)))))  (quantity uint)

		const cb = simnet.callPublicFn(marketGating, 'can-access-by-ownership', ftargs, alice);
		expect(cb.result).toEqual(Cl.error(Cl.uint(2212)));
	});
	it('err-not-nft-owner', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-gating');
		const cb = simnet.callPublicFn(marketGating, 'can-access-by-ownership', ftargs, alice);
		expect(cb.result).toEqual(Cl.error(Cl.uint(2215)));
	});
	it('err-ownership-proof-invalid', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-gating');
		const cb = simnet.callPublicFn(marketGating, 'can-access-by-ownership', ftargs, alice);
		expect(cb.result).toEqual(Cl.error(Cl.uint(2215)));
	});
	it('err-ownership-proof-invalid', async () => {
		await constructDao(simnet);
		await passProposalByCoreVote('bdp001-gating');

		// (market-data-hash (buff 32)) (nft-contract (optional <nft-trait>)) (ft-contract (optional <ft-trait>))  (token-id (optional uint))
		// (proof (list 10 (tuple (position bool) (hash (buff 32)))))  (quantity uint)
		const cb = simnet.callPublicFn(marketGating, 'can-access-by-ownership', ftargs, bob);
		expect(cb.result).toEqual(Cl.error(Cl.uint(2215)));
	});
});
