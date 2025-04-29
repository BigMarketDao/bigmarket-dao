import { describe, expect, it } from 'vitest';
import { Cl } from '@stacks/transactions';
import { alice, betty, bob, constructDao, deployer, passProposalByCoreVote, setupSimnet } from '../helpers';

const simnet = await setupSimnet();

async function checkIsNotRecipient(user: string) {
	let response = await simnet.callReadOnlyFn('bme000-0-governance-token', 'get-vesting-schedule', [Cl.principal(betty)], deployer);
	expect(response.result).toEqual(Cl.none());
}

async function buyIdoTokensError(user: string, amount: number, code: number) {
	let response = await simnet.callPublicFn('bme010-0-token-sale', 'buy-ido-tokens', [Cl.uint(amount)], user);
	expect(response.result).toMatchObject(Cl.error(Cl.uint(code)));
	return response;
}

async function initialize() {
	let response = await simnet.callPublicFn('bme010-0-token-sale', 'initialize-ido', [], deployer);
	expect(response.result).toMatchObject(Cl.error(Cl.uint(5000)));
	return response;
}

describe('initial distribution', () => {
	it('buying is blocked before initialisation', async () => {
		let response = await buyIdoTokensError(deployer, 300000000000, 5001);
	});

	it('cannot directly initialisate', async () => {
		constructDao(simnet);
		let response = await initialize();
	});

	it('check initial variables', async () => {
		constructDao(simnet);
		await passProposalByCoreVote('bdp001-initialise-token-sale');
		let response = await simnet.getDataVar(`${deployer}.bme010-0-token-sale`, 'current-stage');
		expect(response).toEqual(Cl.uint(1));
		response = await simnet.getDataVar(`${deployer}.bme010-0-token-sale`, 'current-stage-start');
		//expect(response).toEqual(Cl.uint(0));
		response = await simnet.getMapEntry(`${deployer}.bme010-0-token-sale`, 'ido-stage-details', Cl.uint(1));
		expect(response).toMatchObject(Cl.some(Cl.tuple({ price: Cl.uint(5), 'max-supply': Cl.uint(600000000000), 'tokens-sold': Cl.uint(0), cancelled: Cl.bool(false) })));
		response = await simnet.getMapEntry(`${deployer}.bme010-0-token-sale`, 'ido-stage-details', Cl.uint(6));
		expect(response).toMatchObject(Cl.some(Cl.tuple({ price: Cl.uint(20), 'max-supply': Cl.uint(1000000000000), 'tokens-sold': Cl.uint(0), cancelled: Cl.bool(false) })));
	});

	it('cannot claim before initialisation', async () => {
		constructDao(simnet);
		await passProposalByCoreVote('bdp001-initialise-token-sale');
		let response = await simnet.callPublicFn(`${deployer}.bme010-0-token-sale`, 'claim-ido-refund', [], alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(5007)));
	});

	it('only dao can advance stage', async () => {
		constructDao(simnet);
		await passProposalByCoreVote('bdp001-initialise-token-sale');
		let response = await simnet.callPublicFn(`${deployer}.bme010-0-token-sale`, 'advance-ido-stage', [], alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(5000)));
		//await passProposalByCoreVote('bdp001-advance-stage-1')
		let response1 = await simnet.getDataVar(`${deployer}.bme010-0-token-sale`, 'current-stage');
		expect(response1).toEqual(Cl.uint(1));
	});

	it('cannot advance beyond last stage', async () => {
		constructDao(simnet);
		await passProposalByCoreVote('bdp001-initialise-token-sale');
		let response = await simnet.callPublicFn(`${deployer}.bme010-0-token-sale`, 'advance-ido-stage', [], alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(5000)));

		//response = await passProposalByCoreVote('bdp001-advance-stage-1')
		let response1 = await simnet.getDataVar(`${deployer}.bme010-0-token-sale`, 'current-stage');
		expect(response1).toEqual(Cl.uint(1));
		let data = await simnet.getMapEntry(`${deployer}.bme010-0-token-sale`, 'ido-stage-details', Cl.uint(1));
		expect(data).toMatchObject(Cl.some(Cl.tuple({ price: Cl.uint(5), 'max-supply': Cl.uint(600000000000), 'tokens-sold': Cl.uint(0), cancelled: Cl.bool(false) })));

		response = await passProposalByCoreVote('bdp001-advance-stage-2');
		response1 = await simnet.getDataVar(`${deployer}.bme010-0-token-sale`, 'current-stage');
		expect(response1).toEqual(Cl.uint(2));
		data = await simnet.getMapEntry(`${deployer}.bme010-0-token-sale`, 'ido-stage-details', Cl.uint(2));
		expect(data).toMatchObject(Cl.some(Cl.tuple({ price: Cl.uint(6), 'max-supply': Cl.uint(833333000000), 'tokens-sold': Cl.uint(0), cancelled: Cl.bool(false) })));

		response = await passProposalByCoreVote('bdp001-advance-stage-3');
		response1 = await simnet.getDataVar(`${deployer}.bme010-0-token-sale`, 'current-stage');
		expect(response1).toEqual(Cl.uint(3));
		response = await passProposalByCoreVote('bdp001-advance-stage-4');
		response1 = await simnet.getDataVar(`${deployer}.bme010-0-token-sale`, 'current-stage');
		expect(response1).toEqual(Cl.uint(4));
		response = await passProposalByCoreVote('bdp001-advance-stage-5');
		response1 = await simnet.getDataVar(`${deployer}.bme010-0-token-sale`, 'current-stage');
		expect(response1).toEqual(Cl.uint(5));
		response = await passProposalByCoreVote('bdp001-advance-stage-6');
		response1 = await simnet.getDataVar(`${deployer}.bme010-0-token-sale`, 'current-stage');
		expect(response1).toEqual(Cl.uint(6));
		try {
			response = await passProposalByCoreVote('bdp001-advance-stage-7');
			expect(response).toBe('exception expected');
		} catch (err) {
			// ok
		}
	});

	it('cannot exceed stage limit', async () => {
		constructDao(simnet);
		await passProposalByCoreVote('bdp001-initialise-token-sale');
		//let response = await passProposalByCoreVote('bdp001-advance-stage-1')
		let response1 = await simnet.getDataVar(`${deployer}.bme010-0-token-sale`, 'current-stage');
		expect(response1).toEqual(Cl.uint(1));

		let response = simnet.callPublicFn(`${deployer}.bme010-0-token-sale`, 'buy-ido-tokens', [Cl.uint(500000000)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(500000000 * 5)));
		let data = await simnet.getMapEntry(`${deployer}.bme010-0-token-sale`, 'ido-stage-details', Cl.uint(1));
		expect(data).toMatchObject(Cl.some(Cl.tuple({ price: Cl.uint(5), 'max-supply': Cl.uint(600000000000), 'tokens-sold': Cl.uint(2500000000), cancelled: Cl.bool(false) })));

		response = simnet.callPublicFn(`${deployer}.bme010-0-token-sale`, 'buy-ido-tokens', [Cl.uint(5 * 600000000000)], bob);
		expect(response.result).toEqual(Cl.error(Cl.uint(5010)));
	});

	it('payout is determined by stage ratio', async () => {
		constructDao(simnet);
		await passProposalByCoreVote('bdp001-initialise-token-sale');
		//let response = await passProposalByCoreVote('bdp001-advance-stage-1')
		let response1 = await simnet.getDataVar(`${deployer}.bme010-0-token-sale`, 'current-stage');
		expect(response1).toEqual(Cl.uint(1));

		let response = simnet.callPublicFn(`${deployer}.bme010-0-token-sale`, 'buy-ido-tokens', [Cl.uint(500000000)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(500000000 * 5)));
		let data = await simnet.getMapEntry(`${deployer}.bme010-0-token-sale`, 'ido-stage-details', Cl.uint(1));
		expect(data).toMatchObject(Cl.some(Cl.tuple({ price: Cl.uint(5), 'max-supply': Cl.uint(600000000000), 'tokens-sold': Cl.uint(2500000000n), cancelled: Cl.bool(false) })));

		response = await passProposalByCoreVote('bdp001-advance-stage-2');
		response = simnet.callPublicFn(`${deployer}.bme010-0-token-sale`, 'buy-ido-tokens', [Cl.uint(500000000)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(500000000n * 6n)));

		response = await passProposalByCoreVote('bdp001-advance-stage-3');
		response = simnet.callPublicFn(`${deployer}.bme010-0-token-sale`, 'buy-ido-tokens', [Cl.uint(500000000)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(500000000n * 7n)));

		response = await passProposalByCoreVote('bdp001-advance-stage-4');
		response = simnet.callPublicFn(`${deployer}.bme010-0-token-sale`, 'buy-ido-tokens', [Cl.uint(500000000)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(500000000n * 8n)));

		response = await passProposalByCoreVote('bdp001-advance-stage-5');
		response = simnet.callPublicFn(`${deployer}.bme010-0-token-sale`, 'buy-ido-tokens', [Cl.uint(500000000)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(500000000n * 10n)));

		response = await passProposalByCoreVote('bdp001-advance-stage-6');
		response = simnet.callPublicFn(`${deployer}.bme010-0-token-sale`, 'buy-ido-tokens', [Cl.uint(500000000)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(500000000n * 20n)));
	});

	it('cancel prevent buy', async () => {
		constructDao(simnet);
		await passProposalByCoreVote('bdp001-initialise-token-sale');
		//let response = await passProposalByCoreVote('bdp001-advance-stage-1')
		let response1 = await simnet.getDataVar(`${deployer}.bme010-0-token-sale`, 'current-stage');
		expect(response1).toEqual(Cl.uint(1));

		let response = await passProposalByCoreVote('bdp001-cancel-stage');
		response = simnet.callPublicFn(`${deployer}.bme010-0-token-sale`, 'buy-ido-tokens', [Cl.uint(500000000)], alice);
		expect(response.result).toEqual(Cl.error(Cl.uint(5009)));
	});

	it('cancel enable refund', async () => {
		constructDao(simnet);
		await passProposalByCoreVote('bdp001-initialise-token-sale');
		//let response = await passProposalByCoreVote('bdp001-advance-stage-1')
		let response1 = await simnet.getDataVar(`${deployer}.bme010-0-token-sale`, 'current-stage');
		expect(response1).toEqual(Cl.uint(1));

		let response = simnet.callPublicFn(`${deployer}.bme010-0-token-sale`, 'buy-ido-tokens', [Cl.uint(5000)], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000n * 5n)));

		const bal = simnet.callReadOnlyFn(`${deployer}.bme000-0-governance-token`, 'get-balance', [Cl.principal(alice)], alice);
		console.log('balance: bdg: ', bal.result.value?.value);
		let idoPurchase = simnet.getMapEntry(`${deployer}.bme010-0-token-sale`, 'ido-purchases', Cl.tuple({ stage: Cl.uint(1), buyer: Cl.principal(alice) }));
		console.log('balance: idoPurchase: ', idoPurchase);
		console.log('balance: stx: ' + simnet.getAssetsMap().get('STX')?.get(alice));
		idoPurchase = simnet.getMapEntry(`${deployer}.bme010-0-token-sale`, 'ido-purchases', Cl.tuple({ stage: Cl.uint(1), buyer: Cl.principal(alice) }));
		console.log('balance: idoPurchase: ', idoPurchase);

		response = simnet.callPublicFn(`${deployer}.bme010-0-token-sale`, 'buy-ido-tokens', [Cl.uint(300000)], bob);
		expect(response.result).toEqual(Cl.ok(Cl.uint(300000n * 5n)));

		response = await passProposalByCoreVote('bdp001-cancel-stage');

		response = simnet.callPublicFn(`${deployer}.bme010-0-token-sale`, 'claim-ido-refund', [], alice);
		expect(response.result).toEqual(Cl.ok(Cl.uint(5000n * 5n)));

		response = simnet.callPublicFn(`${deployer}.bme010-0-token-sale`, 'claim-ido-refund', [], bob);
		expect(response.result).toEqual(Cl.error(Cl.uint(1)));
	});
});
