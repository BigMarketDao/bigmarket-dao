import { boolCV, Cl, listCV, principalCV, someCV, stringAsciiCV, uintCV } from '@stacks/transactions';
import { bufferFromHex } from '@stacks/transactions/dist/cl';
import { describe, expect, it } from 'vitest';
import { createBinaryMarket, predictCategory } from '../categorical/categorical.test';
import { alice, bob, constructDao, deployer, metadataHash, stxToken, tom } from '../dao_helpers';
import { resolveUndisputed } from './helpers_staking';

// process.on('unhandledRejection', (reason, promise) => {
// 	console.error('⚠️ UNHANDLED REJECTION:', reason);
// 	console.error('Stack trace:', reason?.stack);
// });
process.on('unhandledRejection', (reason) => {
	const msg = String(reason);
	// swallow only the late Clarity unwrap noise
	if (msg.includes('value not found')) {
		console.warn('🔇 Swallowed late Clarity WASM "value not found" rejection');
		return;
	}
	throw reason;
});

describe('resolving errors', () => {
	it('only dev can resolve', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
		// not deployer
		response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('nay')], alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(10000)));
		// not bob
		response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('nay')], tom);
		expect(response.result).toEqual(Cl.error(Cl.uint(10000)));
		// only alice
		simnet.mineEmptyBlocks(288);
		response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('nay')], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
	});

	it('err-market-not-found', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
		response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(2), Cl.stringAscii('nay')], deployer);
		expect(response.result).toEqual(Cl.error(Cl.uint(10005)));
	});

	it('err-already-concluded', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
		simnet.mineEmptyBlocks(288);
		response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('yay')], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(1)));
		response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('nay')], bob);
		expect(response.result).toEqual(Cl.error(Cl.uint(10020)));
	});
});

describe('resolve market', () => {
	it('resolve market yes', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(alice, 0, 'yay', 2000000, 1);
		response = await predictCategory(bob, 0, 'nay', 2000000, 0);
		await resolveUndisputed(0, true);

		const data = simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-market-data', [Cl.uint(0)], alice);
		expect(data.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					'market-data-hash': bufferFromHex(metadataHash()),
					// "resolution-burn-height": uintCV(19),
					'resolution-state': uintCV(3),
					concluded: boolCV(true),
					stakes: listCV([uintCV(53938672n), uintCV(53669384n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(1))
				})
			)
		);
	});

	it('resolve market no bids', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);

		await resolveUndisputed(0, false);

		let data = simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-market-data', [Cl.uint(0)], alice);
		expect(data.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					'market-data-hash': bufferFromHex(metadataHash()),
					stakes: listCV([uintCV(50000000n), uintCV(50000000n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(0)),
					'resolution-state': uintCV(3),
					concluded: boolCV(true)
				})
			)
		);

		response = await createBinaryMarket(1, deployer, stxToken);
		await resolveUndisputed(1, true);
		data = simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-market-data', [Cl.uint(1)], alice);
		expect(data.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					'market-data-hash': bufferFromHex(metadataHash()),
					stakes: listCV([uintCV(50000000n), uintCV(50000000n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(1)),
					'resolution-state': uintCV(3),
					concluded: boolCV(true)
				})
			)
		);
	});
});
