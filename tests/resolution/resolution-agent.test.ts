import { boolCV, Cl, ClarityValue, listCV, noneCV, principalCV, someCV, stringAsciiCV, uintCV } from '@stacks/transactions';
import { bufferFromHex } from '@stacks/transactions/dist/cl';
import { describe, expect, it } from 'vitest';
import { alice, betty, bob, constructDao, deployer, metadataHash, passProposalByCoreVote, stxToken, tom } from '../helpers';

async function checkMarket(state: number, concluded: boolean, stakes: Array<number>, outcome: ClarityValue) {
	const data = await simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-market-data', [Cl.uint(0)], alice);
	expect(data.result).toMatchObject(
		Cl.some(
			Cl.tuple({
				creator: principalCV(deployer),
				'market-data-hash': bufferFromHex(metadataHash()),
				// "resolution-burn-height": uintCV(19),
				'resolution-state': uintCV(state),
				concluded: boolCV(concluded),
				stakes: listCV([uintCV(stakes[0]), uintCV(stakes[1]), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
				categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
				outcome: outcome
			})
		)
	);
}
async function checkSignalOutcome(response: any, status: string, label: string, count: number) {
	expect(response.result).toMatchObject(
		Cl.ok(
			Cl.tuple({
				status: stringAsciiCV(status),
				label: stringAsciiCV(label),
				count: uintCV(count)
			})
		)
	);
}
async function createBinaryMarket(marketId: number, creator?: string, token?: string) {
	let response = await simnet.callPublicFn(
		'bme024-0-market-predicting',
		'create-market',
		[
			Cl.list([Cl.stringAscii('nay'), Cl.stringAscii('yay')]),
			Cl.none(),
			Cl.principal(token ? token : stxToken),
			Cl.bufferFromHex(metadataHash()),
			Cl.list([]),
			Cl.principal(`${deployer}.bme022-0-market-gating`),
			Cl.some(uintCV(12)),
			Cl.some(uintCV(11)),
			Cl.uint(100000000),
			Cl.none()
		],
		creator ? creator : deployer
	);
	expect(response.result).toEqual(Cl.ok(Cl.uint(marketId)));
	return response;
}

async function predictCategory(user: string, marketId: number, category: string, amount: number, code: number, token?: string) {
	let response = await simnet.callPublicFn(
		'bme024-0-market-predicting',
		'predict-category',
		[Cl.uint(marketId), Cl.uint(amount), Cl.stringAscii(category), Cl.principal(token ? token : stxToken), Cl.uint(amount * 2)],
		user
	);
	if (code > 10) {
		if (code === 12) {
			expect(response.result).toEqual(Cl.error(Cl.uint(2)));
		} else {
			expect(response.result).toEqual(Cl.error(Cl.uint(code)));
		}
	} else {
		expect(response.result).toEqual(Cl.ok(Cl.uint(code)));
	}
	return response;
}

describe('resolution coordinator', () => {
	it('agent bob can resolve', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(bob, 0, 'nay', 2000000, 0, stxToken);
		response = await predictCategory(alice, 0, 'nay', 2000000, 0, stxToken);
		await simnet.mineEmptyBlocks(23);
		response = await simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('nay')], bob);
		// can resolve after 23 blocks - clear cool down
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
	});

	it('agent can no longer resolve', async () => {
		await constructDao(simnet);
		// set coordinatory as res agent
		await passProposalByCoreVote(`bdp001-0-resolution-coordinator`);

		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(bob, 0, 'nay', 2000000, 0, stxToken);
		response = await predictCategory(alice, 0, 'nay', 2000000, 0, stxToken);
		await simnet.mineEmptyBlocks(23);
		response = await simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('nay')], bob);
		// can resolve after 23 blocks - clear cool down
		expect(response.result).toEqual(Cl.error(Cl.uint(10000)));
	});

	it('ensure bob cant resolve directly', async () => {
		await constructDao(simnet);
		// set coordinatory as res agent
		await passProposalByCoreVote(`bdp001-0-resolution-coordinator`);

		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(bob, 0, 'nay', 2000000, 0, stxToken);
		response = await predictCategory(alice, 0, 'nay', 2000000, 0, stxToken);
		await simnet.mineEmptyBlocks(23);
		response = await simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('nay')], bob);
		// can resolve after 23 blocks - clear cool down
		expect(response.result).toEqual(Cl.error(Cl.uint(10000)));
	});

	it('ensure bob can resolve via coordinator', async () => {
		await constructDao(simnet);
		// set coordinatory as res agent
		await passProposalByCoreVote(`bdp001-0-resolution-coordinator`);

		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(bob, 0, 'nay', 2000000, 0, stxToken);
		response = await predictCategory(alice, 0, 'nay', 2000000, 0, stxToken);
		await simnet.mineEmptyBlocks(23);
		response = await simnet.callPublicFn('bme008-0-resolution-coordinator', 'signal-resolution', [Cl.uint(0), Cl.stringAscii('nay'), Cl.bufferFromHex(metadataHash())], bob);
		console.log('ensure bob can resolve via coordinator', response);
		checkSignalOutcome(response, 'resolved', 'nay', 1);
	});

	it('ensure bob can resolve via coordinator to nay', async () => {
		await constructDao(simnet);
		// set coordinatory as res agent
		await passProposalByCoreVote(`bdp001-0-resolution-coordinator`);

		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(bob, 0, 'nay', 2000000, 0, stxToken);
		response = await predictCategory(alice, 0, 'nay', 2000000, 0, stxToken);
		await simnet.mineEmptyBlocks(23);
		response = await simnet.callPublicFn('bme008-0-resolution-coordinator', 'signal-resolution', [Cl.uint(0), Cl.stringAscii('nay'), Cl.bufferFromHex(metadataHash())], bob);
		console.log('ensure bob can resolve via coordinator', response);
		checkMarket(1, false, [57105131, 50000000], someCV(uintCV(0)));
		checkSignalOutcome(response, 'resolved', 'nay', 1);
	});

	it('ensure bob can resolve via coordinator to yay', async () => {
		await constructDao(simnet);
		// set coordinatory as res agent
		await passProposalByCoreVote(`bdp001-0-resolution-coordinator`);

		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(bob, 0, 'nay', 2000000, 0, stxToken);
		response = await predictCategory(alice, 0, 'nay', 2000000, 0, stxToken);
		await simnet.mineEmptyBlocks(23);
		response = await simnet.callPublicFn('bme008-0-resolution-coordinator', 'signal-resolution', [Cl.uint(0), Cl.stringAscii('yay'), Cl.bufferFromHex(metadataHash())], bob);
		checkMarket(1, false, [57105131, 50000000], someCV(uintCV(1)));
		checkSignalOutcome(response, 'resolved', 'yay', 1);
	});

	it('ensure bob cannot resolve via coordinator when more signals needed', async () => {
		await constructDao(simnet);
		// set coordinatory as res agent
		await passProposalByCoreVote(`bdp001-0-resolution-coordinator`);
		await passProposalByCoreVote(`bdp001-1-resolution-coordinator`);

		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(bob, 0, 'nay', 2000000, 0, stxToken);
		response = await predictCategory(alice, 0, 'nay', 2000000, 0, stxToken);
		await simnet.mineEmptyBlocks(23);
		response = await simnet.callPublicFn('bme008-0-resolution-coordinator', 'signal-resolution', [Cl.uint(0), Cl.stringAscii('yay'), Cl.bufferFromHex(metadataHash())], bob);
		console.log('ensure bob can resolve via coordinator', response);
		checkMarket(0, false, [57105131, 50000000], noneCV());
		checkSignalOutcome(response, 'pending', 'yay', 1);
	});

	it('ensure bob cannot resolve via coordinator when more signals needed', async () => {
		await constructDao(simnet);
		// set coordinatory as res agent
		await passProposalByCoreVote(`bdp001-0-resolution-coordinator`);
		await passProposalByCoreVote(`bdp001-1-resolution-coordinator`);

		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(bob, 0, 'nay', 2000000, 0, stxToken);
		response = await predictCategory(alice, 0, 'nay', 2000000, 0, stxToken);
		await simnet.mineEmptyBlocks(23);
		response = await simnet.callPublicFn('bme008-0-resolution-coordinator', 'signal-resolution', [Cl.uint(0), Cl.stringAscii('yay'), Cl.bufferFromHex(metadataHash())], bob);
		response = await simnet.callPublicFn('bme008-0-resolution-coordinator', 'signal-resolution', [Cl.uint(0), Cl.stringAscii('yay'), Cl.bufferFromHex(metadataHash())], bob);
		response = await simnet.callPublicFn('bme008-0-resolution-coordinator', 'signal-resolution', [Cl.uint(0), Cl.stringAscii('yay'), Cl.bufferFromHex(metadataHash())], bob);
		checkMarket(0, false, [57105131, 50000000], noneCV());
	});

	it('ensure bob tom AND betty can resolve via coordinator when more signals needed', async () => {
		await constructDao(simnet);
		// set coordinatory as res agent
		await passProposalByCoreVote(`bdp001-0-resolution-coordinator`);
		await passProposalByCoreVote(`bdp001-1-resolution-coordinator`);

		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(bob, 0, 'nay', 2000000, 0, stxToken);
		response = await predictCategory(alice, 0, 'nay', 2000000, 0, stxToken);
		await simnet.mineEmptyBlocks(23);
		response = await simnet.callPublicFn('bme008-0-resolution-coordinator', 'signal-resolution', [Cl.uint(0), Cl.stringAscii('yay'), Cl.bufferFromHex(metadataHash())], bob);
		response = await simnet.callPublicFn('bme008-0-resolution-coordinator', 'signal-resolution', [Cl.uint(0), Cl.stringAscii('yay'), Cl.bufferFromHex(metadataHash())], tom);
		//response = await simnet.callPublicFn('bme008-0-resolution-coordinator', 'signal-resolution', [Cl.uint(0), Cl.stringAscii('yay'), Cl.bufferFromHex(metadataHash())], betty);
		console.log('ensure bob can resolve via coordinator', response);
		checkSignalOutcome(response, 'pending', 'yay', 2);
		// expect(response.result).toEqual(Cl.ok(Cl.uint(1)));
		checkMarket(0, false, [57105131, 50000000], noneCV());
	});

	it('ensure bob tom cannot resolve via coordinator', async () => {
		await constructDao(simnet);
		// set coordinatory as res agent
		await passProposalByCoreVote(`bdp001-0-resolution-coordinator`);
		await passProposalByCoreVote(`bdp001-1-resolution-coordinator`);

		let response = await createBinaryMarket(0, deployer, stxToken);
		response = await predictCategory(bob, 0, 'nay', 2000000, 0, stxToken);
		response = await predictCategory(alice, 0, 'nay', 2000000, 0, stxToken);
		await simnet.mineEmptyBlocks(23);
		response = await simnet.callPublicFn('bme008-0-resolution-coordinator', 'signal-resolution', [Cl.uint(0), Cl.stringAscii('yay'), Cl.bufferFromHex(metadataHash())], bob);
		response = await simnet.callPublicFn('bme008-0-resolution-coordinator', 'signal-resolution', [Cl.uint(0), Cl.stringAscii('yay'), Cl.bufferFromHex(metadataHash())], tom);
		response = await simnet.callPublicFn('bme008-0-resolution-coordinator', 'signal-resolution', [Cl.uint(0), Cl.stringAscii('yay'), Cl.bufferFromHex(metadataHash())], betty);
		console.log('ensure bob can resolve via coordinator', response);
		checkSignalOutcome(response, 'resolved', 'yay', 3);
		// expect(response.result).toEqual(Cl.ok(Cl.uint(1)));
		checkMarket(1, false, [57105131, 50000000], someCV(uintCV(1)));
	});
});
