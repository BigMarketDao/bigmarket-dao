import { Simnet } from '@hirosystems/clarinet-sdk';
import { Cl, ClarityValue } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { alice, constructDao, deployer, passProposalByCoreVote, tokenSale } from '../dao_helpers';

async function callSetter(simnet: Simnet, fn: string, args: ClarityValue[], code?: number) {
	let tx = simnet.callPublicFn(tokenSale, fn, args, deployer);
	if (code) expect(tx.result).toEqual(Cl.error(Cl.uint(code)));
}

describe('coverage tests', () => {
	it('check dao gated methods', async () => {
		constructDao(simnet);
		callSetter(simnet, 'set-max-user-ido-purchase', [Cl.uint(100000000)], 5000);
		callSetter(simnet, 'initialize-ido', [], 5000);
		callSetter(simnet, 'advance-ido-stage', [], 5000);
		callSetter(simnet, 'cancel-ido-stage', [], 5000);
	});
	it('set-max-user-ido-purchase - none', async () => {
		constructDao(simnet);
		//passProposalByCoreVote('bdp000-token-sale');
		let response = simnet.callReadOnlyFn(tokenSale, 'get-ido-stages', [], deployer);
		expect(response.result).toMatchObject(Cl.list([Cl.none(), Cl.none(), Cl.none(), Cl.none(), Cl.none(), Cl.none()]));
	});
	it('set-max-user-ido-purchase - some', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp001-initialise-token-sale');
		// passProposalByCoreVote('bdp000-token-sale');
		let response = simnet.callReadOnlyFn(tokenSale, 'get-ido-stages', [], deployer);
		expect(response.result).toMatchObject(
			Cl.list([
				Cl.some(Cl.tuple({ cancelled: Cl.bool(false), 'max-supply': Cl.uint(6000000000000), price: Cl.uint(5000000), 'tokens-sold': Cl.uint(0) })),
				Cl.some(Cl.tuple({ cancelled: Cl.bool(false), 'max-supply': Cl.uint(8333330000000), price: Cl.uint(6000000), 'tokens-sold': Cl.uint(0) })),
				Cl.some(Cl.tuple({ cancelled: Cl.bool(false), 'max-supply': Cl.uint(10714290000000), price: Cl.uint(7000000), 'tokens-sold': Cl.uint(0) })),
				Cl.some(Cl.tuple({ cancelled: Cl.bool(false), 'max-supply': Cl.uint(12500000000000), price: Cl.uint(8000000), 'tokens-sold': Cl.uint(0) })),
				Cl.some(Cl.tuple({ cancelled: Cl.bool(false), 'max-supply': Cl.uint(15000000000000), price: Cl.uint(10000000), 'tokens-sold': Cl.uint(0) })),
				Cl.some(Cl.tuple({ cancelled: Cl.bool(false), 'max-supply': Cl.uint(10000000000000), price: Cl.uint(20000000), 'tokens-sold': Cl.uint(0) }))
			])
		);
	});
	it('get-ido-user-for-stage', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp001-initialise-token-sale');
		// passProposalByCoreVote('bdp000-token-sale');
		let response = simnet.callReadOnlyFn(tokenSale, 'get-ido-user-for-stage', [Cl.uint(1), Cl.principal(alice)], deployer);
		expect(response.result).toMatchObject(Cl.none());
	});
	it('get-ido-user ', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp001-initialise-token-sale');
		// passProposalByCoreVote('bdp000-token-sale');
		let response = simnet.callReadOnlyFn(tokenSale, 'get-ido-user', [Cl.principal(alice)], deployer);
		//expect(response.result).toMatchObject(Cl.list([Cl.tuple({ amount: Cl.uint(0) }), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)]));
		expect(response.result).toMatchObject(Cl.list([Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)]));
	});
});
