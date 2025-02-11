;; Title: BDP000 Bootstrap
;; Author: mijoco.btc
;; Description:
;; Sets up and configure the DAO

(impl-trait 'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-constant token-supply u10000000000000)

(define-public (execute (sender principal))
	(begin
		;; Enable genesis extensions.
		(try! (contract-call? .bitcoin-dao set-extensions
			(list
				{extension: .bde000-governance-token, enabled: true}
				{extension: .bde001-proposal-voting-tokenised, enabled: true}
				{extension: .bde003-core-proposals-tokenised, enabled: true}
				{extension: .bde004-core-execute, enabled: true}
				{extension: .bde006-treasury, enabled: true}
				{extension: .bde010-token-sale, enabled: true}
				{extension: .bde021-market-voting, enabled: true}
				{extension: .bde022-market-gating, enabled: true}
				{extension: .bde023-market-predicting, enabled: true}
			)
		))
		;; Set core team members.
		(try! (contract-call? .bde003-core-proposals-tokenised set-core-team-member 'ST2CS5XAA3FNHEQZRDVF6YY0NTAK7JFV7PKF1CPVM true))
		(try! (contract-call? .bde003-core-proposals-tokenised set-core-team-member 'ST1W59M686N2VZE37TGJYJCYMR018NSZJV05WZ4CY true))

		;; Set executive team members.
		(try! (contract-call? .bde004-core-execute set-executive-team-member 'ST2CS5XAA3FNHEQZRDVF6YY0NTAK7JFV7PKF1CPVM true))
		(try! (contract-call? .bde004-core-execute set-executive-team-member 'ST1W59M686N2VZE37TGJYJCYMR018NSZJV05WZ4CY true))
		(try! (contract-call? .bde004-core-execute set-executive-team-member 'STPBQA353JF9PC2T9NHEF0P155MNM7SMJ8KDGB09 true))
		(try! (contract-call? .bde004-core-execute set-executive-team-member 'ST2Z6MAFHXQ2ARTSZYNGE1HGJPKE1JDS6EMCTXX94 true))
		(try! (contract-call? .bde004-core-execute set-signals-required u2)) ;; signal from 3 out of 4 team members requied.

		;; configure prediction markets
		;; allowedCreators = ["ST2CS5XAA3FNHEQZRDVF6YY0NTAK7JFV7PKF1CPVM", "ST1W59M686N2VZE37TGJYJCYMR018NSZJV05WZ4CY", "ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY", "ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ"];
		(try! (contract-call? .bde022-market-gating set-merkle-root-by-principal .bde023-market-predicting 0xe6b0a3652319a9d8735f2fde4f36e578abc6eeb3c5eab85dbc994afc034ae8ee))
		(try! (contract-call? .bde023-market-predicting set-resolution-agent 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY))
		(try! (contract-call? .bde023-market-predicting set-dev-fund 'ST2Z6MAFHXQ2ARTSZYNGE1HGJPKE1JDS6EMCTXX94))
		(try! (contract-call? .bde023-market-predicting set-creation-gated true))
		(try! (contract-call? .bde023-market-predicting set-dao-treasury .bde006-treasury))
		(try! (contract-call? .bde023-market-predicting set-market-create-fee u1000000))
		(try! (contract-call? .bde023-market-predicting set-market-fee-bips-max u1000))
		(try! (contract-call? .bde023-market-predicting set-dev-fee-bips u200))
		(try! (contract-call? .bde023-market-predicting set-dao-fee-bips u200))
		(try! (contract-call? .bde023-market-predicting set-dispute-window-length u6))
		(try! (contract-call? .bde023-market-predicting set-allowed-token 'ST11804SFNTNRKZQBWB1R3F5YHEXSTXXEWZDXTMH6.wrapped-stx true))
		(try! (contract-call? .bde023-market-predicting set-allowed-token 'ST11804SFNTNRKZQBWB1R3F5YHEXSTXXEWZDXTMH6.sbtc true))
		(try! (contract-call? .bde023-market-predicting set-allowed-token 'ST11804SFNTNRKZQBWB1R3F5YHEXSTXXEWZDXTMH6.bde000-governance-token true))

		(try! (contract-call? .bde021-market-voting set-voting-duration u12))
		(try! (contract-call? .bde010-token-sale initialize-ido))

		;; Fake sbtc mint.
		(try! (contract-call? 'ST11804SFNTNRKZQBWB1R3F5YHEXSTXXEWZDXTMH6.sbtc sbtc-mint-many
			(list
				{amount: u1000000000000000, recipient: 'ST2CS5XAA3FNHEQZRDVF6YY0NTAK7JFV7PKF1CPVM}
				{amount: u1000000000000000, recipient: 'ST1W59M686N2VZE37TGJYJCYMR018NSZJV05WZ4CY}
				{amount: u1000000000000000, recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM}
				{amount: u1000000000000000, recipient: 'STPBQA353JF9PC2T9NHEF0P155MNM7SMJ8KDGB09}
				{amount: u1000000000000000, recipient: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC}
				{amount: u1000000000000000, recipient: 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND}
				{amount: u1000000000000000, recipient: 'ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ}
			)
		))
		;; core team voting rights unlock over u105120 bitcoin block period 
		(try! (contract-call? .bde000-governance-token set-core-team-vesting
			(list
				{recipient: sender, start-block: burn-block-height, duration: u105120}
				{recipient: 'ST1W59M686N2VZE37TGJYJCYMR018NSZJV05WZ4CY, start-block: burn-block-height, duration: u105120} 
				{recipient: 'STPBQA353JF9PC2T9NHEF0P155MNM7SMJ8KDGB09, start-block: burn-block-height, duration: u105120} 
				{recipient: 'ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ, start-block: burn-block-height, duration: u105120}
				{recipient: 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY, start-block: burn-block-height, duration: u105120}
			)
		))
		(try! (contract-call? .bde000-governance-token bdg-mint-many
			(list
				{amount: (/ (* u1000 token-supply) u10000), recipient: .bde006-treasury}
			)
		))

		(print "Bitcoin DAO has risen.")
		(ok true)
	)
)
