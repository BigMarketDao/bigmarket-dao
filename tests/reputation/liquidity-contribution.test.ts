import { Cl } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { alice, bob, constructDao, deployer, liquidityCont, passProposalByCoreVote } from '../dao_helpers';

describe('error conditions', () => {
	it('dao access', async () => {
		await constructDao(simnet);
		let tx = simnet.callPublicFn(liquidityCont, 'set-liquidity-reward-params', [Cl.tuple({ rate: Cl.uint(10), dampener: Cl.uint(10) })], deployer);
		expect(tx.result).toEqual(Cl.error(Cl.uint(5000)));
	});
	it('err-minimum-stx', async () => {
		await constructDao(simnet);
		let tx = simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(4)], bob);
		expect(tx.result).toEqual(Cl.error(Cl.uint(5002)));
	});
});
describe('setters and data', () => {
	it('set rate and dampener', async () => {
		await constructDao(simnet);
		passProposalByCoreVote('bdp000-liquidity');
		let tx = simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(40000000)], bob);
		expect(tx.result).toEqual(Cl.ok(Cl.uint(4)));

		let data = simnet.callReadOnlyFn(liquidityCont, 'get-liquidity-reward-params', [], alice);
		expect(data.result).toMatchObject(Cl.tuple({ rate: Cl.uint(2), dampener: Cl.uint(3) }));
	});
	it('switch off contributions', async () => {
		await constructDao(simnet);
		passProposalByCoreVote('bdp000-liquidity-zero');
		let tx = simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(40000000)], bob);
		expect(tx.result).toEqual(Cl.ok(Cl.uint(0)));

		let data = simnet.callReadOnlyFn(liquidityCont, 'get-liquidity-reward-params', [], alice);
		expect(data.result).toMatchObject(Cl.tuple({ rate: Cl.uint(0), dampener: Cl.uint(3) }));
	});
});
