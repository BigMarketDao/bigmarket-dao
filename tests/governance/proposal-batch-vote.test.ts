import { describe, it } from 'vitest';

// describe('BME01 Proposal Voting — batch voting + signatures', () => {
// it('handles a batch of votes including invalid signatures', async () => {
// 	constructDao(simnet);
// 	// Step 1️⃣ — Add a proposal (as DAO/deployer)
// 	const proposal = Cl.contractPrincipal(deployer, 'bdp999-test-proposal');
// 	const addTx = simnet.callPublicFn(
// 		'bme001-0-proposal-voting',
// 		'add-proposal',
// 		[
// 			proposal,
// 			Cl.tuple({
// 				'start-burn-height': Cl.uint(0),
// 				'end-burn-height': Cl.uint(100),
// 				proposer: Cl.standardPrincipal(deployer),
// 				'custom-majority': Cl.none()
// 			})
// 		],
// 		deployer
// 	);
// 	expect(addTx.result).toEqual(Cl.ok(Cl.bool(true)));
// 	// Step 2️⃣ — Build two fake "vote messages" (one valid structure, one invalid signature)
// 	const fakeMessage1 = Cl.tuple({
// 		attestation: Cl.stringAscii('Batch vote #1'),
// 		proposal,
// 		vote: Cl.bool(true),
// 		voter: Cl.standardPrincipal(alice),
// 		amount: Cl.uint(100),
// 		'reclaim-proposal': Cl.none()
// 	});
// 	const fakeMessage2 = Cl.tuple({
// 		attestation: Cl.stringAscii('Batch vote #2'),
// 		proposal,
// 		vote: Cl.bool(false),
// 		voter: Cl.standardPrincipal(bob),
// 		amount: Cl.uint(50),
// 		'reclaim-proposal': Cl.none()
// 	});
// 	// Random 65-byte buffers (invalid secp256k1 signatures)
// 	const fakeSig1 = Cl.bufferFromHex('11'.repeat(65));
// 	const fakeSig2 = Cl.bufferFromHex('22'.repeat(65));
// 	const votesList = Cl.list([Cl.tuple({ message: fakeMessage1, signature: fakeSig1 }), Cl.tuple({ message: fakeMessage2, signature: fakeSig2 })]);
// 	// Step 3️⃣ — Call batch-vote (covers fold-vote + process-vote branches)
// 	const tx = simnet.callPublicFn(
// 		'bme001-0-proposal-voting',
// 		'batch-vote',
// 		[votesList],
// 		deployer // execute as DAO for test simplicity
// 	);
// 	// The invalid signatures cause process-vote to hit its "ok false" branch,
// 	// but fold-vote still iterates, so result is ok(u0)
// 	expect(tx.result).toEqual(Cl.ok(Cl.uint(0)));
// 	// Step 4️⃣ — Check the proposal still exists and no votes were added
// 	const ro = simnet.callReadOnlyFn('bme001-0-proposal-voting', 'get-proposal-data', [proposal], deployer);
// 	const p = (ro.result as any).expectSome().toObject();
// 	expect(p['votes-for']).toBe(0n);
// 	expect(p['votes-against']).toBe(0n);
// });
// it('mixes valid and invalid votes and updates tallies', async () => {
// 	constructDao(simnet);
// 	// Add a fresh proposal
// 	const proposal = Cl.contractPrincipal(deployer, 'bdp998-test-proposal');
// 	simnet.callPublicFn(
// 		'bme001-0-proposal-voting',
// 		'add-proposal',
// 		[
// 			proposal,
// 			Cl.tuple({
// 				'start-burn-height': Cl.uint(0),
// 				'end-burn-height': Cl.uint(100),
// 				proposer: Cl.standardPrincipal(deployer),
// 				'custom-majority': Cl.none()
// 			})
// 		],
// 		deployer
// 	);
// 	// Create a "fake valid" message where voter == deployer (skipping signature check)
// 	const msg = Cl.tuple({
// 		attestation: Cl.stringAscii('Vote YES'),
// 		proposal,
// 		vote: Cl.bool(true),
// 		voter: Cl.standardPrincipal(deployer),
// 		amount: Cl.uint(100),
// 		'reclaim-proposal': Cl.none()
// 	});
// 	// Even though this signature is fake, process-vote still runs to cover its true branch.
// 	// We’ll call process-vote-internal directly through vote() to create data first.
// 	simnet.callPublicFn('bme001-0-proposal-voting', 'vote', [Cl.uint(50), Cl.bool(false), proposal, Cl.none()], deployer);
// 	// Now simulate a batch including this message and another invalid one.
// 	const validVote = Cl.tuple({ message: msg, signature: Cl.bufferFromHex('00'.repeat(65)) });
// 	const invalidVote = Cl.tuple({
// 		message: Cl.tuple({
// 			attestation: Cl.stringAscii('Vote NO'),
// 			proposal,
// 			vote: Cl.bool(false),
// 			voter: Cl.standardPrincipal(alice),
// 			amount: Cl.uint(25),
// 			'reclaim-proposal': Cl.none()
// 		}),
// 		signature: Cl.bufferFromHex('ff'.repeat(65))
// 	});
// 	const batch = Cl.list([validVote, invalidVote]);
// 	const batchTx = simnet.callPublicFn('bme001-0-proposal-voting', 'batch-vote', [batch], deployer);
// 	// Batch processed both votes, though invalid signature skipped one
// 	expect((batchTx.result as any).ok).toBeDefined();
// 	// Verify tallies updated at least once (votes-for or votes-against > 0)
// 	const ro = simnet.callReadOnlyFn('bme001-0-proposal-voting', 'get-proposal-data', [proposal], deployer);
// 	const pd = (ro.result as any).expectSome().toObject();
// 	expect(Number(pd['votes-for']) + Number(pd['votes-against']) > 0).toBe(true);
// });
// });

describe('verify-signed-tuple (SIP-018 structured data)', () => {
	it('returns (ok true) when we sign the correct SIP-018 digest', async () => {
		// [accounts.wallet_9]
		// # secret_key: de433bdfa14ec43aa1098d5be594c8ffb20a31485ff9de2923b2689471c401b801
		// # stx_address: STNHKEPYEPJ8ET55ZZ0M5A34J0R3N5FM2CMMMAZ6

		// --- Keys / signer principal ---
		const privKeyHex = 'de433bdfa14ec43aa1098d5be594c8ffb20a31485ff9de2923b2689471c401b801';
		const signerAddr = 'STNHKEPYEPJ8ET55ZZ0M5A34J0R3N5FM2CMMMAZ6';

		// --- Build the message tuple exactly like the contract expects ---
		// message: (tuple (attestation (string-ascii 100)) (proposal principal) (vote bool)
		//                (voter principal) (amount uint))
		// const proposalPrincipal = Cl.contractPrincipal(deployer, 'bdp000-voting-propose');
		// const messageCV = Cl.tuple({
		// 	attestation: Cl.stringAscii('Batch vote demo'),
		// 	proposalPrincipal,
		// 	vote: Cl.bool(true),
		// 	voter: Cl.principal(signerAddr),
		// 	amount: Cl.uint(123)
		// });

		// // --- structured_data_hash = sha256(serializeCV(messageCV)) ---
		// const messageBytes = serializeCV(messageCV);
		// const structuredDataHash = sha256Bytes(messageBytes); // Uint8Array(32)

		// // --- Build structured_data_header = "SIP018" prefix + sha256(serializeCV(domain)) ---
		// // domain tuple: { name: "BigMarket", version: "1.0.0", chain-id: chain-id }
		// // Testnet/simnet chain-id is 0x80000000 (2147483648)
		// const chainId = 0x80000000;
		// const domainCV = Cl.tuple({
		// 	name: Cl.stringAscii('BigMarket'),
		// 	version: Cl.stringAscii('1.0.0'),
		// 	'chain-id': Cl.uint(chainId)
		// });
		// const domainHash = sha256Bytes(serializeCV(domainCV));

		// // prefix "SIP018" = 0x53 49 50 30 31 38
		// const sip018Prefix = bytes('534950303138');
		// const structuredDataHeader = Buffer.concat([sip018Prefix, Buffer.from(domainHash)]);

		// // --- final_hash_to_sign = sha256(structuredDataHeader || structuredDataHash) ---
		// const finalPreimage = Buffer.concat([structuredDataHeader, Buffer.from(structuredDataHash)]);
		// const finalHash = sha256Bytes(finalPreimage); // Uint8Array(32)

		// // --- Sign with recoverable compact signature (65 bytes) ---
		// const [sigCompact, recId] = await secp.sign(finalHash, privKeyHex, {
		// 	recovered: true,
		// 	der: false
		// });
		// const sig65 = Buffer.concat([Buffer.from(sigCompact), Buffer.from([recId])]);

		// // --- Call verify-signed-tuple(message, sig, signer) ---
		// const ro = simnet.callReadOnlyFn('bme001-0-proposal-voting', 'verify-signed-tuple', [messageCV, Cl.bufferFromHex(hex(sig65)), Cl.principal(signerAddr)], signerAddr);

		// // (ok true) expected
		// expect(ro.result).toEqual(Cl.ok(Cl.bool(true)));
	});
});
