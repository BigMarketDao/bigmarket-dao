process.on('unhandledRejection', (reason) => {
	const msg = String(reason ?? '');
	if (msg.includes('value not found')) {
		console.warn('🔇 Ignored late Clarinet WASM rejection');
		return;
	}
	throw reason;
});
const originalWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk: any, ...args: any[]) => {
	if (typeof chunk === 'string' && chunk.includes('completed-deposit')) return true;
	if (typeof chunk === 'string' && chunk.includes('(sbtc-registry:')) return true;
	return originalWrite(chunk, ...args);
};

// swallow the unavoidable late WASM rejection
process.on('unhandledRejection', (reason) => {
	const msg = String(reason ?? '');
	if (msg.includes('value not found')) return; // ignore the Clarinet teardown panic
	throw reason;
});
