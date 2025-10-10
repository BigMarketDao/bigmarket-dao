;; Title: bdp023-set-market-data
;; Synopsis:
;; Update prediction market variables.
;; Description:
;; sets the testnet addresses - overriding devnet values.

(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bigmarket-dao set-extensions
			(list
				{extension: .bme023-0-market-bitcoin, enabled: true}
			)
		))
		(try! (contract-call? .bme004-0-core-execute set-signals-required u1)) ;; signal 1 out of 4 for development speed pre mainnet.
		(try! (contract-call? .bme022-0-market-gating set-merkle-root-by-principal .bme023-0-market-bitcoin 0x70a06106d0aaecb26ab15155dc1d958422d991a5367d446699f9a978e80f12f0))
		;; bcrt1q4zymxl8934vvle2ppzw0j6tkwz3d7qw4f0esme
		(try! (contract-call? .bme023-0-market-bitcoin set-market-wallet 0x00 0xa889b37ce58d58cfe541089cf9697670a2df01d5))
		(try! (contract-call? .bme023-0-market-bitcoin set-resolution-agent 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY))
		(try! (contract-call? .bme023-0-market-bitcoin set-dev-fund 'ST16RPMHH96463TP1AFEWZKQ12D7CY57YZGRWJR88))
		(try! (contract-call? .bme023-0-market-bitcoin set-dao-treasury .bme006-0-treasury))
		(try! (contract-call? .bme023-0-market-bitcoin set-creation-gated true))
		(try! (contract-call? .bme023-0-market-bitcoin set-market-fee-bips-max u300))
		(try! (contract-call? .bme023-0-market-bitcoin set-market-create-fee u1000000))
		(try! (contract-call? .bme023-0-market-bitcoin set-dev-fee-bips u100))
		(try! (contract-call? .bme023-0-market-bitcoin set-dispute-window-length u24))

		(try! (contract-call? .bme024-0-market-predicting set-token-minimum-seed 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.wrapped-stx u100000000))
		(try! (contract-call? .bme024-0-market-predicting set-token-minimum-seed 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sbtc u100000000))

		(print "BigMarket DAO bitcoin markets are enabled.")
		(ok true)
	)
)
