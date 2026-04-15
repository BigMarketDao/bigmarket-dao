// tests/setup.ts
process.on('unhandledRejection', (reason) => {
	const msg = String(reason ?? '');
	// swallow only the late Clarity WASM noise
	if (msg.includes('value not found')) {
		console.warn('🔇 Swallowed late Clarity WASM "value not found" rejection');
		return;
	}
	// Re-throw everything else so real bugs still fail the suite
	throw reason;
});
