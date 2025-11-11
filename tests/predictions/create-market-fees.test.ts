import { Cl } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { createBinaryMarket, createBinaryMarketWithErrorCode, createBinaryMarketWithGating } from '../categorical/categorical.test';
import {
	alice,
	allowMarketCreators,
	assertContractBalance,
	assertDataVarNumber,
	assertUserBalance,
	betty,
	bob,
	constructDao,
	deployer,
	fred,
	marketPredictingCPMM,
	metadataHash,
	passProposalByExecutiveSignals,
	stxToken,
	tom,
	wallace
} from '../dao_helpers';
import { proofToClarityValue } from '../gating/gating';

describe('prediction contract', () => {
	it('ensure creation fee is paid', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-gating-false');
		await passProposalByExecutiveSignals(simnet, 'bdp001-market-fees');

		await assertDataVarNumber(simnet, marketPredictingCPMM, 'dev-fee-bips', 500);
		await assertDataVarNumber(simnet, marketPredictingCPMM, 'market-fee-bips-max', 1000);

		let response = await createBinaryMarket(0, betty, stxToken);
		// console.log(response.events[0].data)
		expect(response.events[0].data).toMatchObject({
			amount: '100000000',
			memo: '',
			recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bme024-0-market-predicting',
			sender: 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND'
		});
	});

	it('ensure create market fee is paid', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-market-fees');

		await assertDataVarNumber(simnet, marketPredictingCPMM, 'dev-fee-bips', 500);
		await assertDataVarNumber(simnet, marketPredictingCPMM, 'market-fee-bips-max', 1000);

		let response = await createBinaryMarket(0, deployer, stxToken);
		// console.log(response.events[0].data)
		expect(response.events[0].data).toMatchObject({
			amount: '100000000',
			memo: '',
			recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bme024-0-market-predicting',
			sender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
		});

		await passProposalByExecutiveSignals(simnet, 'bdp001-market-fees-1');

		await assertDataVarNumber(simnet, marketPredictingCPMM, 'dev-fee-bips', 500);
		await assertDataVarNumber(simnet, marketPredictingCPMM, 'market-fee-bips-max', 0);
	});

	it('ensure market fee cant exceed max', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-market-fees');
		let response = createBinaryMarketWithErrorCode(10022, 1001);
	});

	it('ensure betty pays the market creat fee of 1000 but receives 10% of alice winnings', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-market-fees');
		await assertDataVarNumber(simnet, marketPredictingCPMM, 'dev-fee-bips', 500);
		await assertDataVarNumber(simnet, marketPredictingCPMM, 'market-fee-bips-max', 1000);
		await assertUserBalance(simnet, deployer, 100000000000000n);

		const proof = await allowMarketCreators(betty);

		let response = await createBinaryMarketWithGating(0, proofToClarityValue(proof), metadataHash(), betty, stxToken, 1000);
		response = await predictCategory(alice, 0, 'yay', 10000, 1);
		simnet.mineEmptyBlocks(288);
		expect(response.result).toEqual(Cl.ok(Cl.uint(1)));
		response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('yay')], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(1)));

		simnet.mineEmptyBlocks(146);
		response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market-undisputed', [Cl.uint(0)], deployer);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));

		await assertStakeBalance(alice, 1385512, 0);
		await assertContractBalance(simnet, marketPredictingCPMM, 101425000n);

		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(2461258)));

		// betty pays thed market creat fee of 1000 but receives 10% of alice winnings
		await assertUserBalance(simnet, alice, 100000000961258n);
		await assertUserBalance(simnet, `${deployer}.bme022-0-market-gating`, 273473n);
		await assertUserBalance(simnet, deployer, 100000000000000n);
		await assertStakeBalance(alice, 0, 0);
		await assertContractBalance(simnet, marketPredictingCPMM, 98690269n);
	});

	it('ensure fees are correct with 4 users', async () => {
		await constructDao(simnet);
		await passProposalByExecutiveSignals(simnet, 'bdp001-market-fees');
		await assertDataVarNumber(simnet, marketPredictingCPMM, 'dev-fee-bips', 500);
		await assertDataVarNumber(simnet, marketPredictingCPMM, 'market-fee-bips-max', 1000);
		assertUserBalance(simnet, deployer, 100000000000000n);

		const proof = await allowMarketCreators(betty);

		let response = await createBinaryMarketWithGating(0, proofToClarityValue(proof), metadataHash(), betty, stxToken);
		// ----- staking ------------------------
		response = await predictCategory(alice, 0, 'yay', 100_000, 1);
		response = await predictCategory(bob, 0, 'yay', 100_000, 1);
		response = await predictCategory(tom, 0, 'nay', 100_000, 12);
		response = await predictCategory(fred, 0, 'nay', 100_000, 0);
		response = await predictCategory(wallace, 0, 'nay', 100_000, 0);
		// ----- resolving ------------------------
		simnet.mineEmptyBlocks(288);
		response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(0), Cl.stringAscii('nay')], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(0)));

		simnet.mineEmptyBlocks(146);
		response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market-undisputed', [Cl.uint(0)], deployer);
		expect(response.result).toEqual(Cl.ok(Cl.bool(true)));

		await assertStakeBalance(alice, 11089494, 0);
		await assertContractBalance(simnet, marketPredictingCPMM, 157000000n);

		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(10006)));
		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], bob);
		expect(response.result).toEqual(Cl.error(Cl.uint(10006)));

		await assertStakeBalance(alice, 11089494, 0);
		await assertStakeBalance(bob, 9457191, 0);
		await assertStakeBalance(fred, 0, 15646541);
		await assertStakeBalance(wallace, 0, 12582400);

		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], fred);
		expect(response.result).toEqual(Cl.ok(Cl.uint(31401510n)));
		response = simnet.callPublicFn('bme024-0-market-predicting', 'claim-winnings', [Cl.uint(0), Cl.principal(stxToken)], wallace);
		expect(response.result).toEqual(Cl.ok(Cl.uint(25251994n)));

		// betty pays thed market creat fee of 1000 but receives 10% of alice winnings
		await assertUserBalance(simnet, alice, 99999985000000n);
		await assertUserBalance(simnet, betty, 99999900000000n);
		await assertUserBalance(simnet, deployer, 100000000000000n);
		await assertStakeBalance(alice, 11089494, 0);
		await assertStakeBalance(bob, 9457191, 0);
		await assertStakeBalance(fred, 0, 0);
		await assertStakeBalance(wallace, 0, 0);
		await assertContractBalance(simnet, marketPredictingCPMM, 100346496n);
	});
});

async function assertStakeBalance(user: string, againstValue: number, forValue: number) {
	let data = simnet.callReadOnlyFn('bme024-0-market-predicting', 'get-stake-balances', [Cl.uint(0), Cl.principal(user)], alice);
	expect(data.result).toEqual(
		Cl.ok(Cl.list([Cl.uint(forValue), Cl.uint(againstValue), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)]))
	);
}
async function predictCategory(user: string, marketId: number, category: string, amount: number, code: number, token?: string) {
	let response = simnet.callPublicFn(
		'bme024-0-market-predicting',
		'predict-category',
		[Cl.uint(marketId), Cl.uint(amount), Cl.stringAscii(category), Cl.principal(token ? token : stxToken), Cl.uint(amount * 150)],
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
