import { Cl } from '@stacks/transactions';
import { expect } from 'vitest';
import { bob } from '../dao_helpers';

export async function resolveUndisputed(marketId: number, outcome: boolean) {
	simnet.mineEmptyBlocks(288);
	let response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market', [Cl.uint(marketId), Cl.stringAscii(outcome ? 'yay' : 'nay')], bob);
	expect(response.result).toEqual(Cl.ok(Cl.uint(outcome ? 1 : 0)));
	simnet.mineEmptyBlocks(145);
	response = simnet.callPublicFn('bme024-0-market-predicting', 'resolve-market-undisputed', [Cl.uint(marketId)], bob);
	expect(response.result).toEqual(Cl.ok(Cl.bool(true)));
}
