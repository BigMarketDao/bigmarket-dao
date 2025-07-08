import { describe, expect, it } from 'vitest';
import { boolCV, Cl, listCV, noneCV, principalCV, someCV, stringAsciiCV, uintCV } from '@stacks/transactions';
import { alice, bob, constructDao, deployer, marketPredictingCPMM, reputationSft, setupSimnet, stxToken, tom } from '../helpers';
import { createBinaryMarket, predictCategory } from '../categorical/categorical.test';

const simnet = await setupSimnet();
async function assertBalance(user: string, tier: number, balance: number) {
	let bal = simnet.callReadOnlyFn(`${deployer}.${reputationSft}`, 'get-balance', [Cl.uint(tier), Cl.principal(user)], user);
	expect(bal.result).toEqual(Cl.ok(Cl.uint(balance * 2)));
}

/*
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/

async function assertMarketData() {
	const data = await simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-market-data', [Cl.uint(0)], tom);
	return data;
}

async function assertVotingData(proposer: string, votesFor: number, votesAg: number, concluded: boolean, passed: boolean, testName?: string) {
	if (testName) console.log(testName);
	const data = await simnet.callReadOnlyFn('bme021-0-market-voting', 'get-poll-data', [Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0)], tom);
	return data;
}

async function setUpmarketAndResolve(resolve: boolean) {
	await constructDao(simnet);
	let response = await createBinaryMarket(0);
	expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
	let md = await assertMarketData();
	expect(md.result).toMatchObject(
		Cl.some(
			Cl.tuple({
				creator: principalCV(deployer),
				stakes: listCV([uintCV(50000000), uintCV(50000000), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
				categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
				outcome: noneCV(),
				'resolution-state': uintCV(0),
				concluded: boolCV(false),
				token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx')
			})
		)
	);

	response = await predictCategory(bob, 0, 'nay', 2000000, 0, stxToken);

	response = await predictCategory(alice, 0, 'yay', 5000, 1, stxToken);

	simnet.mineEmptyBlocks(288);
	response = await simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('yay')], bob);
	expect(response.result).toEqual(Cl.ok(Cl.uint(1)));
	return response;
}

describe('voting on resolution', () => {
	it('err-disputer-must-have-stake', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = await predictCategory(bob, 0, 'nay', 2000000, 0, stxToken);
		simnet.mineEmptyBlocks(288);
		response = await simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('yay')], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(1)));
		response = await simnet.callPublicFn('bme024-0-market-predicting', 'dispute-resolution', [Cl.uint(0), Cl.principal(alice), Cl.uint(2)], bob);
		expect(response.result).toEqual(Cl.error(Cl.uint(10015)));
		let md = await assertMarketData();
		expect(md.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),

					stakes: listCV([uintCV(53669385n), uintCV(50000000n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(1)),
					'resolution-state': uintCV(1),
					concluded: boolCV(false),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx')
				})
			)
		);
	});

	it('err-unauthorised - dao function', async () => {
		await constructDao(simnet);
		let response = await createBinaryMarket(0);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		response = await predictCategory(bob, 0, 'nay', 2000000, 0, stxToken);

		response = await predictCategory(alice, 0, 'yay', 5000, 1, stxToken);

		simnet.mineEmptyBlocks(288);
		response = await simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('yay')], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(1)));

		response = await simnet.callPublicFn('bme024-0-market-predicting', 'dispute-resolution', [Cl.uint(0), Cl.principal(alice), Cl.uint(2)], bob);
		expect(response.result).toEqual(Cl.error(Cl.uint(10000)));
	});

	it('staker can create market vote', async () => {
		await setUpmarketAndResolve(true);
		let response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'create-market-vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.list([Cl.uint(0), Cl.uint(0)]), Cl.uint(2)],
			alice
		);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
	});

	it('staker can create market vote', async () => {
		await setUpmarketAndResolve(true);
		let response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'create-market-vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.list([Cl.uint(0), Cl.uint(0)]), Cl.uint(2)],
			alice
		);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
		let md = await assertMarketData();
		expect(md.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					stakes: listCV([uintCV(53669385n), uintCV(50010625n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(1)),

					'resolution-state': uintCV(2),
					concluded: boolCV(false),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx')
				})
			)
		);
		let vd = await assertVotingData(alice, 0, 0, false, false);
		expect(vd.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					votes: listCV([uintCV(0), uintCV(0)]),
					'num-categories': uintCV(2),
					'winning-category': noneCV(),
					proposer: principalCV(alice),
					concluded: boolCV(false)
				})
			)
		);
	});

	it('vote cant close before voting window', async () => {
		await setUpmarketAndResolve(true);
		let response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'create-market-vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.list([Cl.uint(0), Cl.uint(0)]), Cl.uint(2)],
			alice
		);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
		let md = await assertMarketData();
		expect(md.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					stakes: listCV([uintCV(53669385n), uintCV(50010625n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(1)),

					'resolution-state': uintCV(2),
					concluded: boolCV(false),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx')
				})
			)
		);

		let vd = await assertVotingData(alice, 0, 0, false, false);
		expect(vd.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					votes: listCV([uintCV(0), uintCV(0)]),
					'num-categories': uintCV(2),
					'winning-category': noneCV(),
					proposer: principalCV(alice),
					concluded: boolCV(false)
				})
			)
		);
		response = await simnet.callPublicFn('bme021-0-market-voting', 'conclude-market-vote', [Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0)], alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(2113)));
	});

	it('vote can close after voting window with no votes', async () => {
		await setUpmarketAndResolve(true);
		let response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'create-market-vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.list([Cl.uint(0), Cl.uint(0)]), Cl.uint(2)],
			alice
		);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
		let md = await assertMarketData();
		expect(md.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					stakes: listCV([uintCV(53669385n), uintCV(50010625n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(1)),

					'resolution-state': uintCV(2),
					concluded: boolCV(false),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx')
				})
			)
		);
		let vd = await assertVotingData(alice, 0, 0, false, false);
		expect(vd.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					proposer: principalCV(alice),
					votes: listCV([uintCV(0), uintCV(0)]),
					'num-categories': uintCV(2),
					'winning-category': noneCV(),
					concluded: boolCV(false)
				})
			)
		);
		await simnet.mineEmptyBlocks(11);
		response = await simnet.callPublicFn('bme021-0-market-voting', 'conclude-market-vote', [Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0)], alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(2113)));

		await simnet.mineEmptyBlocks(25);
		response = await simnet.callPublicFn('bme021-0-market-voting', 'conclude-market-vote', [Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		md = await assertMarketData();
		expect(md.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					stakes: listCV([uintCV(53669385n), uintCV(50010625n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(0)),

					'resolution-state': uintCV(3),
					concluded: boolCV(true),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx')
				})
			)
		);
		vd = await assertVotingData(alice, 0, 0, true, false);
		expect(vd.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					proposer: principalCV(alice),
					concluded: boolCV(true),
					votes: listCV([uintCV(0), uintCV(0)]),
					'num-categories': uintCV(2),
					'winning-category': someCV(uintCV(0))
				})
			)
		);
	});

	it('vote cant vote after end', async () => {
		await setUpmarketAndResolve(false);
		let response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'create-market-vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.list([Cl.uint(0), Cl.uint(0)]), Cl.uint(2)],
			alice
		);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
		let md = await assertMarketData();
		expect(md.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					stakes: listCV([uintCV(53669385n), uintCV(50010625n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(1)),

					'resolution-state': uintCV(2),
					concluded: boolCV(false),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx')
				})
			)
		);
		let vd = await assertVotingData(alice, 0, 0, false, false);
		expect(vd.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					proposer: principalCV(alice),
					concluded: boolCV(false),
					votes: listCV([uintCV(0), uintCV(0)]),
					'num-categories': uintCV(2),
					'winning-category': noneCV()
				})
			)
		);

		await simnet.mineEmptyBlocks(25);

		response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.uint(1), Cl.uint(100), Cl.none()],
			alice
		);
		expect(response.result).toEqual(Cl.error(Cl.uint(2105)));
		md = await assertMarketData();
		vd = await assertVotingData(alice, 0, 0, false, false);
		expect(vd.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					proposer: principalCV(alice),
					concluded: boolCV(false),
					votes: listCV([uintCV(0), uintCV(0)]),
					'num-categories': uintCV(2),
					'winning-category': noneCV()
				})
			)
		);
	});

	it('cant vote with more than current unlocked bdg balance', async () => {
		await setUpmarketAndResolve(false);
		await assertBalance(deployer, 0, 0);
		let response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'create-market-vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.list([Cl.uint(0), Cl.uint(0)]), Cl.uint(2)],
			alice
		);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
		let md = await assertMarketData();
		expect(md.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					stakes: listCV([uintCV(53669385n), uintCV(50010625n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(1)),

					'resolution-state': uintCV(2),
					concluded: boolCV(false),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx')
				})
			)
		);
		let vd = await assertVotingData(alice, 0, 0, false, false);
		expect(vd.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					proposer: principalCV(alice),
					concluded: boolCV(false),
					votes: listCV([uintCV(0), uintCV(0)]),
					'num-categories': uintCV(2),
					'winning-category': noneCV()
				})
			)
		);

		response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.uint(1), Cl.uint(100), Cl.none()],
			alice
		);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
		response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.uint(1), Cl.uint(1000000000), Cl.none()],
			alice
		);
		// vote exceeds
		expect(response.result).toEqual(Cl.error(Cl.uint(1)));

		md = await assertMarketData();
		expect(md.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					stakes: listCV([uintCV(53669385n), uintCV(50010625n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(1)),

					'resolution-state': uintCV(2),
					concluded: boolCV(false),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx')
				})
			)
		);
		vd = await assertVotingData(alice, 1, 0, false, false);
		expect(vd.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					proposer: principalCV(alice),
					concluded: boolCV(false),
					votes: listCV([uintCV(0), uintCV(100)]),
					'num-categories': uintCV(2),
					'winning-category': noneCV()
				})
			)
		);
	});

	it('can vote before end', async () => {
		await setUpmarketAndResolve(false);
		let response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'create-market-vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.list([Cl.uint(0), Cl.uint(0)]), Cl.uint(2)],
			alice
		);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
		let md = await assertMarketData();
		expect(md.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					stakes: listCV([uintCV(53669385n), uintCV(50010625n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(1)),

					'resolution-state': uintCV(2),
					concluded: boolCV(false),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx')
				})
			)
		);
		let vd = await assertVotingData(alice, 0, 0, false, false);
		expect(vd.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					proposer: principalCV(alice),
					concluded: boolCV(false),
					votes: listCV([uintCV(0), uintCV(0)]),
					'num-categories': uintCV(2),
					'winning-category': noneCV()
				})
			)
		);

		response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.uint(1), Cl.uint(100), Cl.none()],
			alice
		);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
		response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.uint(0), Cl.uint(100), Cl.none()],
			tom
		);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
		response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.uint(0), Cl.uint(100), Cl.none()],
			deployer
		);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
		md = await assertMarketData();
		expect(md.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					stakes: listCV([uintCV(53669385n), uintCV(50010625n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(1)),

					'resolution-state': uintCV(2),
					concluded: boolCV(false),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx')
				})
			)
		);
		vd = await assertVotingData(alice, 1, 2, false, false);
		expect(vd.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					proposer: principalCV(alice),
					concluded: boolCV(false),
					votes: listCV([uintCV(200), uintCV(100)]),
					'num-categories': uintCV(2),
					'winning-category': noneCV()
				})
			)
		);
	});

	it('vote closes true with for votes', async () => {
		await setUpmarketAndResolve(true);
		let response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'create-market-vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.list([Cl.uint(0), Cl.uint(0)]), Cl.uint(2)],
			alice
		);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
		let md = await assertMarketData();
		expect(md.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					stakes: listCV([uintCV(53669385n), uintCV(50010625n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(1)),

					'resolution-state': uintCV(2),
					concluded: boolCV(false),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx')
				})
			)
		);
		let vd = await assertVotingData(alice, 0, 0, false, false);
		expect(vd.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					proposer: principalCV(alice),
					concluded: boolCV(false),
					votes: listCV([uintCV(0), uintCV(0)]),
					'num-categories': uintCV(2),
					'winning-category': noneCV()
				})
			)
		);

		response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.uint(1), Cl.uint(100), Cl.none()],
			alice
		);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
		md = await assertMarketData();
		expect(md.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					stakes: listCV([uintCV(53669385n), uintCV(50010625n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(1)),

					'resolution-state': uintCV(2),
					concluded: boolCV(false),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx')
				})
			)
		);
		vd = await assertVotingData(alice, 1, 0, false, false);
		expect(vd.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					proposer: principalCV(alice),
					concluded: boolCV(false),
					votes: listCV([uintCV(0), uintCV(100)]),
					'num-categories': uintCV(2),
					'winning-category': noneCV()
				})
			)
		);

		await simnet.mineEmptyBlocks(25);
		response = await simnet.callPublicFn('bme021-0-market-voting', 'conclude-market-vote', [Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(1)));
		await assertBalance(alice, 3, 3);
		md = await assertMarketData();
		expect(md.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					stakes: listCV([uintCV(53669385n), uintCV(50010625n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(1)),

					'resolution-state': uintCV(3),
					concluded: boolCV(true),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx')
				})
			)
		);
		vd = await assertVotingData(alice, 1, 0, true, true);
		expect(vd.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					proposer: principalCV(alice),
					concluded: boolCV(true),
					votes: listCV([uintCV(0), uintCV(100)]),
					'num-categories': uintCV(2),
					'winning-category': someCV(uintCV(1))
				})
			)
		);
	});

	it('vote closes true with against votes', async () => {
		await setUpmarketAndResolve(true);
		let response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'create-market-vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.list([Cl.uint(0), Cl.uint(0)]), Cl.uint(2)],
			alice
		);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
		let md = await assertMarketData();
		expect(md.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					stakes: listCV([uintCV(53669385n), uintCV(50010625n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(1)),

					'resolution-state': uintCV(2),
					concluded: boolCV(false),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx')
				})
			)
		);
		let vd = await assertVotingData(alice, 0, 0, false, false);

		expect(vd.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					proposer: principalCV(alice),
					concluded: boolCV(false),
					votes: listCV([uintCV(0), uintCV(0)]),
					'num-categories': uintCV(2),
					'winning-category': noneCV()
				})
			)
		);

		response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.uint(1), Cl.uint(100), Cl.none()],
			alice
		);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
		response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.uint(0), Cl.uint(100), Cl.none()],
			tom
		);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
		response = await simnet.callPublicFn(
			'bme021-0-market-voting',
			'vote',
			[Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0), Cl.uint(0), Cl.uint(100), Cl.none()],
			deployer
		);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
		md = await assertMarketData();
		expect(md.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					stakes: listCV([uintCV(53669385n), uintCV(50010625n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(1)),

					'resolution-state': uintCV(2),
					concluded: boolCV(false),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx')
				})
			)
		);
		vd = await assertVotingData(alice, 1, 2, false, true);
		expect(vd.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					proposer: principalCV(alice),
					concluded: boolCV(false),
					votes: listCV([uintCV(200), uintCV(100)]),
					'num-categories': uintCV(2),
					'winning-category': noneCV()
				})
			)
		);

		await simnet.mineEmptyBlocks(25);
		response = await simnet.callPublicFn('bme021-0-market-voting', 'conclude-market-vote', [Cl.principal(`${deployer}.${marketPredictingCPMM}`), Cl.uint(0)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
		md = await assertMarketData();
		expect(md.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					creator: principalCV(deployer),
					stakes: listCV([uintCV(53669385n), uintCV(50010625n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
					categories: listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
					outcome: someCV(uintCV(0)),

					'resolution-state': uintCV(3),
					concluded: boolCV(true),
					token: Cl.contractPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wrapped-stx')
				})
			)
		);
		vd = await assertVotingData(alice, 1, 2, false, true);
		expect(vd.result).toMatchObject(
			Cl.some(
				Cl.tuple({
					proposer: principalCV(alice),
					concluded: boolCV(true),
					votes: listCV([uintCV(200), uintCV(100)]),
					'num-categories': uintCV(2),
					'winning-category': someCV(uintCV(0))
				})
			)
		);
	});
});
