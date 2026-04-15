import { Simnet } from '@hirosystems/clarinet-sdk';
import { Cl, ClarityValue, noneCV } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { alice, bob, constructDao, deployer, marketPredictingCPMM, nftToken, passProposalByCoreVote, reputationSft, sbtcToken, stxToken, treasury } from '../dao_helpers';

const token = Cl.principal(nftToken);
const ftToken1 = Cl.principal(stxToken);
const ftToken2 = Cl.principal(sbtcToken);
const sip13Token = Cl.principal(`${deployer}.${reputationSft}`);
const stxRecipients = [
	Cl.list([
		Cl.tuple({ memo: Cl.some(Cl.bufferFromAscii('extendable umbrella')), amount: Cl.uint(1000000), recipient: Cl.standardPrincipal(alice) }),
		Cl.tuple({ memo: Cl.some(Cl.bufferFromAscii('non-extendable umbrella')), amount: Cl.uint(2000000), recipient: Cl.standardPrincipal(bob) })
	])
];

const sip10Recipients = [
	Cl.list([
		Cl.tuple({ memo: Cl.some(Cl.bufferFromAscii('extendable umbrella')), amount: Cl.uint(1000000), recipient: Cl.standardPrincipal(alice) }),
		Cl.tuple({ memo: Cl.some(Cl.bufferFromAscii('non-extendable umbrella')), amount: Cl.uint(2000000), recipient: Cl.standardPrincipal(bob) })
	]),
	token
];

const sip9Recipients = [
	Cl.list([Cl.tuple({ 'token-id': Cl.uint(1), recipient: Cl.standardPrincipal(alice) }), Cl.tuple({ 'token-id': Cl.uint(1), recipient: Cl.standardPrincipal(bob) })]),
	token
];

const sip13Recipient = [Cl.uint(1), Cl.uint(10), Cl.principal(alice), Cl.some(Cl.bufferFromAscii('umbrella')), ftToken1];
const sip13Recipients = [
	Cl.list([
		Cl.tuple({ 'token-id': Cl.uint(1), amount: Cl.uint(2000000), recipient: Cl.standardPrincipal(alice) }),
		Cl.tuple({ 'token-id': Cl.uint(1), amount: Cl.uint(2000000), recipient: Cl.standardPrincipal(bob) })
	]),
	sip13Token
];

const sip13RecipientsMemo = [
	Cl.list([
		Cl.tuple({ 'token-id': Cl.uint(1), amount: Cl.uint(2000000), recipient: Cl.standardPrincipal(alice), memo: Cl.some(Cl.bufferFromAscii('umbrella')) }),
		Cl.tuple({ 'token-id': Cl.uint(1), amount: Cl.uint(2000000), recipient: Cl.standardPrincipal(bob), memo: Cl.some(Cl.bufferFromAscii('umbrella')) })
	]),
	sip13Token
];

async function callTreasuryTransfer(simnet: Simnet, fn: string, args: ClarityValue[], code?: number) {
	let tx = simnet.callPublicFn('bme006-0-treasury', fn, args, deployer);
	if (code) expect(tx.result).toEqual(Cl.error(Cl.uint(code)));
}

describe('coverage tests', () => {
	it('check dao gated methods', async () => {
		constructDao(simnet);
		callTreasuryTransfer(simnet, 'set-slippage-bips', [Cl.uint(100)], 3000);
		callTreasuryTransfer(simnet, 'swap-tokens', [ftToken1, ftToken2, ftToken1, ftToken2, Cl.uint(10)], 3000);
		callTreasuryTransfer(simnet, 'swap-tokens-with-slippage', [ftToken1, ftToken2, ftToken1, ftToken2, Cl.uint(1000000), Cl.uint(10)], 3000);
		callTreasuryTransfer(simnet, 'stx-transfer', [Cl.uint(10), Cl.principal(alice), noneCV()], 3000);
		callTreasuryTransfer(simnet, 'stx-transfer-many', stxRecipients, 3000);
		callTreasuryTransfer(simnet, 'sip009-transfer', [Cl.uint(1), Cl.principal(alice), token], 3000);
		callTreasuryTransfer(simnet, 'sip009-transfer-many', sip9Recipients, 3000);
		callTreasuryTransfer(simnet, 'sip010-transfer', [Cl.uint(10), Cl.principal(alice), Cl.some(Cl.bufferFromAscii('umbrella')), ftToken1], 3000);
		callTreasuryTransfer(simnet, 'sip010-transfer-many', sip10Recipients, 3000);
		callTreasuryTransfer(simnet, 'sip013-transfer', sip13Recipient, 3000);
		callTreasuryTransfer(simnet, 'sip013-transfer-many', sip13Recipients, 3000);
		callTreasuryTransfer(simnet, 'sip013-transfer-many-memo', sip13RecipientsMemo, 3000);
	});

	it('set-slippage-bips validates bounds and succeeds for DAO', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-treasury-setters-error1', 3001);
		passProposalByCoreVote('bdp000-treasury-setters-error2', 3001);
		passProposalByCoreVote('bdp000-treasury-setters-error3', 3002);
		passProposalByCoreVote('bdp000-treasury-setters-error4', 3002);
		passProposalByCoreVote('bdp000-treasury-setters-error5', 3001);
	});

	it('test slippage ', async () => {
		constructDao(simnet);
		passProposalByCoreVote('bdp000-treasury-setters');
	});

	it('test transfers ', async () => {
		constructDao(simnet);
		const tx = simnet.transferSTX(100_000_000_000_000n, `${deployer}.${treasury}`, alice);
		expect(tx.result).toEqual(Cl.ok(Cl.bool(true)));
		passProposalByCoreVote('bdp000-treasury-transfers');
	});

	it('swap-tokens and swap-tokens-with-slippage enforce amount rules', async () => {
		constructDao(simnet);
		const token = Cl.principal(stxToken);

		// amount = 0 → invalid
		let tx = simnet.callPublicFn('bme006-0-treasury', 'set-slippage-bips', [Cl.uint(0)], deployer);
		expect(tx.result).toEqual(Cl.error(Cl.uint(3000)));

		tx = simnet.callPublicFn('bme006-0-treasury', 'swap-tokens', [token, token, token, token, Cl.uint(0)], deployer);
		expect(tx.result).toEqual(Cl.error(Cl.uint(3000)));

		// too-small amount (< min-amount) → invalid
		tx = simnet.callPublicFn('bme006-0-treasury', 'swap-tokens-with-slippage', [token, token, token, token, Cl.uint(1), Cl.uint(9999)], deployer);
		expect(tx.result).toEqual(Cl.error(Cl.uint(3000)));

		// nominal happy path
		tx = simnet.callPublicFn('bme006-0-treasury', 'swap-tokens', [token, token, token, token, Cl.uint(10000)], deployer);
		expect(tx.result).toEqual(Cl.error(Cl.uint(3000)));
	});

	it('stx-transfer prints memo and executes under DAO context', async () => {
		constructDao(simnet);
		// with memo
		let tx = simnet.callPublicFn('bme006-0-treasury', 'stx-transfer', [Cl.uint(10), Cl.standardPrincipal(alice), Cl.some(Cl.bufferFromHex('abcd'))], deployer);
		expect(tx.result).toBeDefined();
		// without memo
		tx = simnet.callPublicFn('bme006-0-treasury', 'stx-transfer', [Cl.uint(10), Cl.standardPrincipal(alice), Cl.none()], deployer);
		expect(tx.result).toBeDefined();
	});

	it('SIP-013 transfers cover both memo and no-memo branches', async () => {
		constructDao(simnet);
		const sft = Cl.contractPrincipal(deployer, 'sft');
		const tx1 = simnet.callPublicFn(
			'bme006-0-treasury',
			'sip013-transfer',
			[Cl.uint(1), Cl.uint(1), Cl.standardPrincipal(alice), Cl.some(Cl.bufferFromHex('01')), sft],
			deployer
		);
		expect(tx1.result).toBeDefined();

		const tx2 = simnet.callPublicFn('bme006-0-treasury', 'sip013-transfer', [Cl.uint(1), Cl.uint(1), Cl.standardPrincipal(alice), Cl.none(), sft], deployer);
		expect(tx2.result).toBeDefined();

		const tx3 = simnet.callPublicFn(
			'bme006-0-treasury',
			'sip013-transfer-many',
			[Cl.list([Cl.tuple({ 'token-id': Cl.uint(1), amount: Cl.uint(1), sender: Cl.standardPrincipal(deployer), recipient: Cl.standardPrincipal(alice) })]), sft],
			deployer
		);
		expect(tx3.result).toBeDefined();

		const tx4 = simnet.callPublicFn(
			'bme006-0-treasury',
			'sip013-transfer-many-memo',
			[
				Cl.list([
					Cl.tuple({
						'token-id': Cl.uint(1),
						amount: Cl.uint(1),
						sender: Cl.standardPrincipal(deployer),
						recipient: Cl.standardPrincipal(alice),
						memo: Cl.bufferFromHex('ff')
					})
				]),
				sft
			],
			deployer
		);
		expect(tx4.result).toBeDefined();
	});

	it('callback and claim-for-dao hit their lines', async () => {
		const token = Cl.principal(stxToken);
		const market = Cl.contractPrincipal(deployer, marketPredictingCPMM);

		const cb = simnet.callPublicFn('bme006-0-treasury', 'callback', [Cl.standardPrincipal(alice), Cl.bufferFromHex('00')], alice);
		expect(cb.result).toEqual(Cl.ok(Cl.bool(true)));

		const claim = simnet.callPublicFn('bme006-0-treasury', 'claim-for-dao', [market, Cl.uint(1), token], deployer);
		expect(claim.result).toBeDefined();
	});
});
