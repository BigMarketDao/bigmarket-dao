import { ParsedTransactionResult } from '@hirosystems/clarinet-sdk';
import { getPublicKeyFromPrivate } from '@stacks/encryption';
import { Cl, ClarityValue, getAddressFromPrivateKey, makeRandomPrivKey } from '@stacks/transactions';
import { describe, expect, it } from 'vitest';
import { bob, constructDao, deployer, liquidityCont, passProposalByCoreVote, reputationSft } from '../dao_helpers';

const SCALE = 1000000;
let users: Array<Account> = [];
const MAX_BATCH = 100;

/**
 * Tests the rewards system over several epochs
 */

describe('Tests the rewards system over several epochs', () => {
	it('Check liquidity providers earn correct rewards', async () => {
		// --- CONFIG ---
		users = [];
		const NUM_USERS = 1; // or 1000 if you want to stress test
		const EPOCHS = 3;
		const contribAmount = 4000000;
		const accounts = simnet.getAccounts();
		let rewards = new Map<string, number>();
		users.push({ address: accounts.get('wallet_4')! });
		// users.push({ address: accounts.get('wallet_5')! });
		// users.push({ address: accounts.get('wallet_6')! });
		// users.push({ address: accounts.get('wallet_7')! });
		// users.push({ address: accounts.get('wallet_8')! });

		await constructDao(simnet);
		addUsers(NUM_USERS, deployer);

		simnet.mineEmptyBlocks(100000);
		console.log('= EPOCH 0 ================================================================');
		console.log('getEpochData: ', await getEpochData());
		for (let user of users) {
			contributeStx(user, contribAmount);
		}
		let batch: ClarityValue[] = users.map((u) => Cl.principal(u.address));
		let tx = simnet.callPublicFn(reputationSft, 'claim-big-reward-batch', [Cl.list(batch)], deployer);
		rewards.set(accounts.get('wallet_4')!, 0);
		checkUserClaims(tx, 0, 0, rewards);
		expect(tx.result).toEqual(Cl.ok(Cl.uint(0)));
		getBigBalances();

		simnet.mineEmptyBlocks(1011);
		console.log('= EPOCH 1 ================================================================');
		addUsers(NUM_USERS, deployer);
		console.log('getEpochData: ', await getEpochData());
		rewards = new Map<string, number>();
		rewards.set(users[0].address, 5000000000);
		rewards.set(users[1].address, 5000000000);
		for (let user of users) {
			contributeStx(user, contribAmount);
		}
		batch = users.map((u) => Cl.principal(u.address));
		tx = simnet.callPublicFn(reputationSft, 'claim-big-reward-batch', [Cl.list(batch)], deployer);
		expect(tx.result).toEqual(Cl.ok(Cl.uint(10000000000)));
		checkUserClaims(tx, 10000000000, 2, rewards);
		getBigBalances();

		simnet.mineEmptyBlocks(1011);
		console.log('= EPOCH 2 ================================================================');
		addUsers(NUM_USERS, deployer);
		console.log('getEpochData: ', await getEpochData());
		rewards = new Map<string, number>();
		rewards.set(users[0].address, 4000000000);
		rewards.set(users[1].address, 4000000000);
		rewards.set(users[2].address, 2000000000);
		for (let user of users) {
			contributeStx(user, contribAmount);
		}
		batch = users.map((u) => Cl.principal(u.address));
		tx = simnet.callPublicFn(reputationSft, 'claim-big-reward-batch', [Cl.list(batch)], deployer);
		expect(tx.result).toEqual(Cl.ok(Cl.uint(10000000000)));
		expect(users.length).toEqual(4);
		checkUserClaims(tx, 10000000000, 3, rewards);
		getBigBalances();

		simnet.mineEmptyBlocks(1011);
		console.log('= EPOCH 3 ================================================================');
		addUsers(NUM_USERS, deployer);
		console.log('getEpochData: ', await getEpochData());
		rewards = new Map<string, number>();
		rewards.set(users[0].address, 3333333333);
		rewards.set(users[1].address, 3333333333);
		rewards.set(users[2].address, 2222222222);
		rewards.set(users[3].address, 1111111111);
		for (let user of users) {
			contributeStx(user, contribAmount);
		}
		batch = users.map((u) => Cl.principal(u.address));
		tx = simnet.callPublicFn(reputationSft, 'claim-big-reward-batch', [Cl.list(batch)], deployer);
		expect(tx.result).toEqual(Cl.ok(Cl.uint(9999999999)));
		expect(users.length).toEqual(5);
		checkUserClaims(tx, 9999999999, 4, rewards);
		getBigBalances();

		//expect(tx.result).toEqual(Cl.ok(Cl.uint(0)));
	});
	it('Check effect of teir weight changes', async () => {
		// --- CONFIG ---
		users = [];
		const NUM_USERS = 1; // or 1000 if you want to stress test
		const EPOCHS = 3;
		const contribAmount = 4000000;
		const accounts = simnet.getAccounts();
		let rewards = new Map<string, number>();
		users.push({ address: accounts.get('wallet_4')! });
		// users.push({ address: accounts.get('wallet_5')! });
		// users.push({ address: accounts.get('wallet_6')! });
		// users.push({ address: accounts.get('wallet_7')! });
		// users.push({ address: accounts.get('wallet_8')! });

		await constructDao(simnet);
		addUsers(NUM_USERS, deployer);

		simnet.mineEmptyBlocks(100000);
		console.log('= EPOCH 0 ================================================================');
		console.log('getEpochData: ', await getEpochData());
		for (let user of users) {
			contributeStx(user, contribAmount);
		}
		let batch: ClarityValue[] = users.map((u) => Cl.principal(u.address));
		let tx = simnet.callPublicFn(reputationSft, 'claim-big-reward-batch', [Cl.list(batch)], deployer);
		rewards.set(accounts.get('wallet_4')!, 0);
		checkUserClaims(tx, 0, 0, rewards);
		expect(tx.result).toEqual(Cl.ok(Cl.uint(0)));
		getBigBalances();

		simnet.mineEmptyBlocks(1011);
		console.log('= EPOCH 1 ================================================================');
		addUsers(NUM_USERS, deployer);
		console.log('getEpochData: ', await getEpochData());
		rewards = new Map<string, number>();
		rewards.set(users[0].address, 5000000000);
		rewards.set(users[1].address, 5000000000);
		for (let user of users) {
			contributeStx(user, contribAmount);
		}
		batch = users.map((u) => Cl.principal(u.address));
		tx = simnet.callPublicFn(reputationSft, 'claim-big-reward-batch', [Cl.list(batch)], deployer);
		expect(tx.result).toEqual(Cl.ok(Cl.uint(10000000000)));
		checkUserClaims(tx, 10000000000, 2, rewards);
		getBigBalances();

		simnet.mineEmptyBlocks(1011);
		console.log('= EPOCH 2 ================================================================');
		addUsers(NUM_USERS, deployer);
		console.log('getEpochData: ', await getEpochData());
		rewards = new Map<string, number>();
		rewards.set(users[0].address, 4000000000);
		rewards.set(users[1].address, 4000000000);
		rewards.set(users[2].address, 2000000000);
		for (let user of users) {
			contributeStx(user, contribAmount);
		}
		batch = users.map((u) => Cl.principal(u.address));
		tx = simnet.callPublicFn(reputationSft, 'claim-big-reward-batch', [Cl.list(batch)], deployer);
		expect(tx.result).toEqual(Cl.ok(Cl.uint(10000000000)));
		expect(users.length).toEqual(4);
		checkUserClaims(tx, 10000000000, 3, rewards);
		getBigBalances();

		// NOTE: proposal introduces other rewards!
		passProposalByCoreVote('bdp000-sft-tier-weights');
		users.push({ address: accounts.get('deployer')! });
		users.push({ address: accounts.get('wallet_1')! });
		users.push({ address: accounts.get('wallet_2')! });

		simnet.mineEmptyBlocks(1011);
		console.log('= EPOCH 3 ================================================================');
		addUsers(NUM_USERS, deployer);
		console.log('getEpochData: ', await getEpochData());
		rewards = new Map<string, number>();
		rewards.set(users[0].address, 2352941176);
		rewards.set(users[1].address, 2352941176);
		rewards.set(users[2].address, 1568627450);
		rewards.set(users[3].address, 784313725);
		rewards.set(users[4].address, 2941176470);
		rewards.set(users[5].address, 2941176470);
		rewards.set(users[6].address, 2941176470);
		for (let user of users) {
			contributeStx(user, contribAmount);
		}
		batch = users.map((u) => Cl.principal(u.address));
		tx = simnet.callPublicFn(reputationSft, 'claim-big-reward-batch', [Cl.list(batch)], deployer);
		expect(tx.result).toEqual(Cl.ok(Cl.uint(9999999997)));
		expect(users.length).toEqual(8);
		checkUserClaims(tx, 9999999997, 5, rewards);
		getBigBalances();

		simnet.mineEmptyBlocks(1011);
		console.log('= EPOCH 4 ================================================================');
		addUsers(NUM_USERS, deployer);
		rewards.set(users[0].address, 1516587677);
		rewards.set(users[1].address, 1516587677);
		rewards.set(users[2].address, 1327014218);
		rewards.set(users[3].address, 1137440758);
		rewards.set(users[4].address, 947867298);
		rewards.set(users[5].address, 947867298);
		rewards.set(users[6].address, 1658767772);
		rewards.set(users[7].address, 947867298);
		for (let user of users) {
			contributeStx(user, contribAmount);
		}
		batch = users.map((u) => Cl.principal(u.address));
		tx = simnet.callPublicFn(reputationSft, 'claim-big-reward-batch', [Cl.list(batch)], deployer);
		expect(tx.result).toEqual(Cl.ok(Cl.uint(9999999996)));
		expect(users.length).toEqual(9);
		checkUserClaims(tx, 9999999996, 8, rewards);
		getBigBalances();

		//expect(tx.result).toEqual(Cl.ok(Cl.uint(0)));
	});
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
		if (amount > 0 && user) {
			total += amount;
			count++;
			if (expectedPerUser) expect(amount).toBe(expectedPerUser.get(user));
			console.log(`checkUserClaims: user: ${user}/${expectedCount} : ${amount}`);
		}
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
