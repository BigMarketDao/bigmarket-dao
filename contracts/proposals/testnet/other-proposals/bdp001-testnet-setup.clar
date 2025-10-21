;; Title: BDP000 account gating
;; Description:
;; GENERATE TESTNET MERKLE ROOTS FOR MARKET CREATION

(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		;; ["ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0", "ST2XFH8D1MM2G11C0S6AZRSNP031RAY92XFABDE58", "ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY", "ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ"];
		(try! (contract-call? .bme022-0-market-gating set-merkle-root-by-principal .bme024-0-market-predicting 0x32052e1600fb0b2cf53566c79b129a1c0aea9b5f254de08ad26eb7fbfbaffbf3))

		(print "Merkle root for account gating updated.")
		(ok true)
	)
)
