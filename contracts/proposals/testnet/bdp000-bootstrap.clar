;; Title: BDP000 Bootstrap
;; Description:
;; Sets up and configure the DAO
;; Allowed = ["ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W, ST2XHA15V40FAP9QZ0KMR7KBZ4NREV937QHZNT6B4, ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY, ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ, ST3SJD6KV86N90W0MREGRTM1GWXN8Z91PF6W0BQKM", "STEZD95XQ194X67C1QJW4PHKDG8F5D66ZCYFX27A"];

(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-constant token-supply u100000000000000)

(define-public (execute (sender principal))
	(begin
		;; Enable genesis extensions.
		(try! (contract-call? .bigmarket-dao set-extensions
			(list
				{extension: .bme000-0-governance-token, enabled: true}
				{extension: .bme001-0-proposal-voting, enabled: true}
				{extension: .bme003-0-core-proposals, enabled: true}
				{extension: .bme006-0-treasury, enabled: true}
				{extension: .bme010-0-liquidity-contribution, enabled: true}
				{extension: .bme021-0-market-voting, enabled: true}
				{extension: .bme022-0-market-gating, enabled: true}
				{extension: .bme024-0-market-scalar-pyth, enabled: true}
				{extension: .bme024-0-market-predicting, enabled: true}
				{extension: .bme030-0-reputation-token, enabled: true}
				{extension: .bme032-0-scalar-strategy-hedge, enabled: true}
				{extension: .bme040-0-shares-marketplace, enabled: true}
			)
		))
		;; Set core team members.
		(try! (contract-call? .bme003-0-core-proposals set-core-team-member 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY true))
		(try! (contract-call? .bme003-0-core-proposals set-core-team-member 'ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ true))
		(try! (contract-call? .bme003-0-core-proposals set-core-team-member 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W true))
		(try! (contract-call? .bme003-0-core-proposals set-core-team-member 'ST3SJD6KV86N90W0MREGRTM1GWXN8Z91PF6W0BQKM true))

		;; configure prediction markets
		;; allowedCreators = ["ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W, ST2XHA15V40FAP9QZ0KMR7KBZ4NREV937QHZNT6B4, ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY, ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ, ST3SJD6KV86N90W0MREGRTM1GWXN8Z91PF6W0BQKM", "STEZD95XQ194X67C1QJW4PHKDG8F5D66ZCYFX27A"];
		(try! (contract-call? .bme022-0-market-gating set-merkle-root-by-principal .bme024-0-market-predicting 0xf661e4bb4ab75e36c77e588c07b0836f0628fb533d9f97e66a5566a038e1f45e))
		(try! (contract-call? .bme022-0-market-gating set-merkle-root-by-principal .bme024-0-market-scalar-pyth 0xf661e4bb4ab75e36c77e588c07b0836f0628fb533d9f97e66a5566a038e1f45e))
		
		(try! (contract-call? .bme024-0-market-predicting set-resolution-agent 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY))
		(try! (contract-call? .bme024-0-market-predicting set-dev-fund 'ST16RPMHH96463TP1AFEWZKQ12D7CY57YZGRWJR88))
		(try! (contract-call? .bme024-0-market-predicting set-dao-treasury .bme006-0-treasury))
		(try! (contract-call? .bme024-0-market-predicting set-creation-gated true))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token 'ST2X0FMCBMBK3F41WVS8PKN75PF9H5ZDRJB7H600B.wrapped-stx false))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token .big-play true))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token .bme000-0-governance-token false))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token false))
		(try! (contract-call? .bme024-0-market-predicting set-market-fee-bips-max u1000))
		(try! (contract-call? .bme024-0-market-predicting set-token-minimum-seed 'ST2X0FMCBMBK3F41WVS8PKN75PF9H5ZDRJB7H600B.wrapped-stx u100000000))
		(try! (contract-call? .bme024-0-market-predicting set-token-minimum-seed 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W.bme000-0-governance-token u100000000))
		(try! (contract-call? .bme024-0-market-predicting set-token-minimum-seed 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W.big-play u100000000))
		(try! (contract-call? .bme024-0-market-predicting set-token-minimum-seed 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token u100000000))

		(try! (contract-call? .bme024-0-market-scalar-pyth set-resolution-agent 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-dev-fund 'ST16RPMHH96463TP1AFEWZKQ12D7CY57YZGRWJR88))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-dao-treasury .bme006-0-treasury))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-creation-gated true))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token .big-play true))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token 'ST2X0FMCBMBK3F41WVS8PKN75PF9H5ZDRJB7H600B.wrapped-stx false))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token .bme000-0-governance-token false))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token false))
		;; STXUSD / BTCUSD / SOLUSD / ETHUSD
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17 u2000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43 u100))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d u500))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace u1000))
		
		(try! (contract-call? .bme024-0-market-scalar-pyth set-market-fee-bips-max u1000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-token-minimum-seed 'ST2X0FMCBMBK3F41WVS8PKN75PF9H5ZDRJB7H600B.wrapped-stx u100000000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-token-minimum-seed 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W.bme000-0-governance-token u100000000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-token-minimum-seed 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W.big-play u100000000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-token-minimum-seed 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token u100000000))

		(try! (contract-call? .bme000-0-governance-token bmg-mint-many
			(list
				{amount: (/ (* u1500 token-supply) u10000), recipient: .bme006-0-treasury}
			)
		))

		(try! (contract-call? .bme030-0-reputation-token set-launch-height))
		
		(print "BigMarket DAO has risen.")
		(ok true)
	)
)
