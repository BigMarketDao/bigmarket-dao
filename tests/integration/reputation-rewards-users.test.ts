import { ParsedTransactionResult } from '@hirosystems/clarinet-sdk';
import { getPublicKeyFromPrivate } from '@stacks/encryption';
import { Cl, getAddressFromPrivateKey, makeRandomPrivKey } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { bob, constructDao, deployer, liquidityCont, reputationSft } from '../dao_helpers';

const SCALE = 1000000;
let users: Array<Account> = [];
const MAX_BATCH = 100;

/**
 * Tests the rewards system over several epochs
 */

describe('Tests the rewards system over several epochs', () => {
	it('Check batched rewards never award more then reward-per-epoch', async () => {
		// --- CONFIG ---
		users = [];
		const contribAmount = 4000000;
		const accounts = simnet.getAccounts();
		let rewards = new Map<string, number>();
		users.push({ address: accounts.get('wallet_4')! });
		// users.push({ address: accounts.get('wallet_5')! });
		// users.push({ address: accounts.get('wallet_6')! });
		// users.push({ address: accounts.get('wallet_7')! });
		// users.push({ address: accounts.get('wallet_8')! });

		await constructDao(simnet);
		addUsers(50, deployer);

		simnet.mineEmptyBlocks(100000);
		console.log('= EPOCH 0 ================================================================');
		console.log('getEpochData: ', await getEpochData());
		for (let user of users) {
			contributeStx(user, contribAmount);
		}
		let batches = chunkArray(users, MAX_BATCH);
		let totals = { total: 0, count: 0 };
		for (const [i, batchUsers] of batches.entries()) {
			const res = doClaims(batchUsers, i, users.length);
			totals.count += res.count;
			totals.total += res.total;
		}
		expect(totals.total).toBeLessThanOrEqual(0);
		expect(totals.total).toBeGreaterThanOrEqual(0);

		simnet.mineEmptyBlocks(1011);
		console.log('= EPOCH 1 ================================================================');
		addUsers(200, deployer);
		console.log('getEpochData: ', await getEpochData());
		rewards = new Map<string, number>();
		rewards.set(users[0].address, 5000000000);
		rewards.set(users[1].address, 5000000000);
		for (let user of users) {
			contributeStx(user, contribAmount);
		}
		batches = chunkArray(users, MAX_BATCH);
		totals = { total: 0, count: 0 };
		for (const [i, batchUsers] of batches.entries()) {
			const res = doClaims(batchUsers, i, users.length);
			totals.count += res.count;
			totals.total += res.total;
		}
		console.log('= EPOCH 1 totals', totals);

		expect(totals.count).toBe(51);
		expect(totals.total).toBeLessThanOrEqual(10000000000);
		expect(totals.total).toBeGreaterThanOrEqual(9999999000);

		simnet.mineEmptyBlocks(1011);
		console.log('= EPOCH 2 ================================================================');
		addUsers(1200, deployer);
		console.log('getEpochData: ', await getEpochData());
		rewards = new Map<string, number>();
		rewards.set(users[0].address, 4000000000);
		rewards.set(users[1].address, 4000000000);
		rewards.set(users[2].address, 2000000000);
		for (let user of users) {
			contributeStx(user, contribAmount);
		}
		batches = chunkArray(users, MAX_BATCH);
		let overall = 0;
		overall += doClaim(users[131]).total;
		overall += doClaim(users[45]).total;
		overall += doClaim(users[12]).total;
		overall += doClaim(users[18]).total;
		overall += doClaim(users[67]).total;
		overall += doClaim(users[131]).total;
		totals = { total: 0, count: 0 };
		for (const [i, batchUsers] of batches.entries()) {
			const res = doClaims(batchUsers, i, users.length);
			totals.count += res.count;
			totals.total += res.total;
		}
		console.log('= EPOCH 2 totals', totals);
		expect(totals.count + 5).toBe(251);
		expect(totals.total + overall).toBeLessThanOrEqual(10000000000);
		expect(totals.total + overall).toBeGreaterThanOrEqual(9999999000);

		simnet.mineEmptyBlocks(1011);
		console.log('= EPOCH 3 ================================================================');
		addUsers(3600, deployer);
		console.log('getEpochData: ', await getEpochData());
		for (let user of users) {
			contributeStx(user, contribAmount);
		}
		batches = chunkArray(users, MAX_BATCH);
		totals = { total: 0, count: 0 };
		overall = 0;
		overall += doClaim(users[131]).total;
		overall += doClaim(users[45]).total;
		overall += doClaim(users[12]).total;
		overall += doClaim(users[18]).total;
		overall += doClaim(users[67]).total;
		overall += doClaim(users[1450]).total;
		overall += doClaim(users[899]).total;
		overall += doClaim(users[999]).total;
		overall += doClaim(users[777]).total;
		overall += doClaim(users[666]).total;
		for (const [i, batchUsers] of batches.entries()) {
			const res = doClaims(batchUsers, i, users.length);
			totals.count += res.count;
			totals.total += res.total;
		}
		totals.total += overall;
		totals.count += 10;
		console.log('= EPOCH 3 totals', totals);
		expect(totals.count).toBe(1451);
		expect(totals.total).toBeLessThanOrEqual(10000000000);
		expect(totals.total).toBeGreaterThanOrEqual(9999999000);

		//expect(tx.result).toEqual(Cl.ok(Cl.uint(0)));
	}, 20000);
});

async function getEpochUserData(user: string) {
	let data1 = simnet.callReadOnlyFn(reputationSft, 'get-last-claimed-epoch', [Cl.principal(user)], bob);
	const epoch = (data1.result as any).value;

	console.log('getEpochData: ' + epoch);
	return epoch;
}
async function getEpochData() {
	let data = simnet.callReadOnlyFn(reputationSft, 'get-epoch', [], bob);
	const epoch = (data.result as any).value;
	data = simnet.callReadOnlyFn(reputationSft, 'get-latest-claimable-epoch', [], bob);
	const latestClaimableEpoch = (data.result as any).value;
	data = simnet.callReadOnlyFn(reputationSft, 'get-weighted-supply', [], bob);
	const weightedSupply = Number(((data.result as any).value as any).value);

	return { epoch, latestClaimableEpoch, weightedSupply, burnBlockHeight: simnet.burnBlockHeight, blockHeight: simnet.blockHeight, users: users.length };
}
function addUsers(numUsers: number, deployer: string) {
	for (let i = 0; i < numUsers; i++) {
		const user = generateNewAddress();
		simnet.transferSTX(1000000000, user.address, deployer);
		users.push(user);
	}
}
function getBigBalances() {
	const bmgAssetMap = simnet.getAssetsMap().get(`.bme000-0-governance-token.bmg-token`);
	const bmgrAssetMap = simnet.getAssetsMap().get(`.bme030-0-reputation-token.bigr-token`);
	for (let i = 0; i < users.length; i++) {
		const user = users[i];
		const bigAlice = bmgAssetMap?.get(user.address);
		const bigrAlice = bmgrAssetMap?.get(user.address);
		let data = simnet.callReadOnlyFn(reputationSft, 'get-weighted-rep', [Cl.principal(user.address)], bob);
		const weightedUserSupply = Number(((data.result as any).value as any).value);
		console.log('getBigBalance: ' + user.address + ' : bigAlice: ' + bigAlice + ' : bigrAlice: ' + bigrAlice + ' : weightedUserSupply: ' + weightedUserSupply);
	}
}
function checkUserClaims(tx: ParsedTransactionResult, expectedTotal: number, expectedCount: number, expectedPerUser?: Map<string, number>) {
	//console.log('getUserClaims: tx: ', tx);
	let count = 0;
	let total = 0;
	for (let i = 0; i < tx.events.length; i++) {
		const event = tx.events[i];
		const amount = Number((event.data?.value as any)?.value?.share?.value || 0);
		const user = (event.data?.value as any)?.value?.user?.value || 0;
		total += amount;
		if (amount > 0) {
			count++;
			if (expectedPerUser) expect(amount).toBe(expectedPerUser.get(user));
		}
		if (expectedPerUser) console.log('checkUserClaims: user: ' + user + ' : ' + amount);
	}
	expect(total).toBe(expectedTotal);
	expect(count).toBe(expectedCount);
	return { total, count };
}
type Account = {
	privateKey?: string;
	publicKey?: string;
	address: string;
};
function generateNewAddress(): Account {
	const privateKey = makeRandomPrivKey();
	const publicKey = getPublicKeyFromPrivate(privateKey);

	const address = getAddressFromPrivateKey(privateKey, 'testnet');

	return {
		privateKey,
		publicKey,
		address
	};
}
function contributeStx(account: Account, contribAmount: number) {
	// const contribAmount = 100000000;
	// stx-to-bigr-rate default is 10 in your liquidity contract, so:
	let tx;
	if (!account.privateKey) tx = simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(contribAmount)], account.address);
	else tx = simnet.callPublicFn(liquidityCont, 'contribute-stx', [Cl.uint(contribAmount)], account.address);
	const expectedBIGR = Math.floor(Math.sqrt(contribAmount / 1000000));
	//const expectedBIGR = Math.floor(Math.sqrt(contribAmount * 1) / 1);
	//console.log('contributeStx: ', expectedBIGR);
	expect(tx.result).toEqual(Cl.ok(Cl.uint(expectedBIGR)));
}
function chunkArray<T>(array: T[], size: number): T[][] {
	const result = [];
	for (let i = 0; i < array.length; i += size) {
		result.push(array.slice(i, i + size));
	}
	return result;
}
function doClaims(batchUsers: Array<Account>, i: number, total: number): { total: number; count: number } {
	const principals = batchUsers.map((u) => Cl.principal(u.address));

	console.log(`Processing batch ${i + 1} of ${total} (${principals.length} users)`);

	const tx = simnet.callPublicFn(
		reputationSft,
		'claim-big-reward-batch',
		[Cl.list(principals)],
		deployer // or an admin if that’s required
	);

	// optional assertions
	//expect(tx.result).toEqual(Cl.ok(Cl.uint(expectedTotal)));
	return countAmounts(tx);
}
function doClaim(user: Account): { total: number; count: number } {
	const tx = simnet.callPublicFn(
		reputationSft,
		'claim-big-reward',
		[],
		user.address // or an admin if that’s required
	);

	// optional assertions
	//expect(tx.result).toEqual(Cl.ok(Cl.uint(expectedTotal)));
	return countAmounts(tx);
}
function countAmounts(tx: ParsedTransactionResult) {
	//console.log('getUserClaims: tx: ', tx);
	let count = 0;
	let total = 0;
	for (let i = 0; i < tx.events.length; i++) {
		const event = tx.events[i];
		const amount = Number((event.data?.value as any)?.value?.share?.value || 0);
		const user = (event.data?.value as any)?.value?.user?.value || 0;
		total += amount;
		if (amount > 0) {
			count++;
		}
	}
	return { total, count };
}
