;; Title: BDP000 Bootstrap
;; Description:
;; Sets up and configure the DAO
;; Allowed = ["ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W, ST2XHA15V40FAP9QZ0KMR7KBZ4NREV937QHZNT6B4, ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY, ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ, ST3SJD6KV86N90W0MREGRTM1GWXN8Z91PF6W0BQKM"];

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
				{extension: .bme004-0-core-execute, enabled: true}
				{extension: .bme006-0-treasury, enabled: true}
				{extension: .bme010-0-token-sale, enabled: true}
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

		;; Set executive team members.
		(try! (contract-call? .bme004-0-core-execute set-executive-team-member 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W true))
		(try! (contract-call? .bme004-0-core-execute set-executive-team-member 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY true))
		(try! (contract-call? .bme004-0-core-execute set-executive-team-member 'ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ true))
		(try! (contract-call? .bme004-0-core-execute set-signals-required u2)) ;; signal 2 out of 3.

		;; configure prediction markets
		;; allowedCreators = ["ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W, ST2XHA15V40FAP9QZ0KMR7KBZ4NREV937QHZNT6B4, ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY, ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ, ST3SJD6KV86N90W0MREGRTM1GWXN8Z91PF6W0BQKM, STQE3J7XMMK0DN0BWJZHGE6B05VDYQRXRNM0T1J8, ST2RNHHQDTHGHPEVX83291K4AQZVGWEJ7WD7SDHD8"];
		(try! (contract-call? .bme022-0-market-gating set-merkle-root-by-principal .bme024-0-market-predicting 0x9e208b9b0d42a633acf7fd4adc3a24646202c887e476e6f27ecde500ed119587))
		(try! (contract-call? .bme022-0-market-gating set-merkle-root-by-principal .bme024-0-market-scalar-pyth 0x9e208b9b0d42a633acf7fd4adc3a24646202c887e476e6f27ecde500ed119587))
		
		(try! (contract-call? .bme024-0-market-predicting set-resolution-agent 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY))
		(try! (contract-call? .bme024-0-market-predicting set-dev-fund 'ST16RPMHH96463TP1AFEWZKQ12D7CY57YZGRWJR88))
		(try! (contract-call? .bme024-0-market-predicting set-dao-treasury .bme006-0-treasury))
		(try! (contract-call? .bme024-0-market-predicting set-creation-gated true))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W.wrapped-stx true))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token .bme000-0-governance-token true))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token true))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token .tusdh true))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token .tpepe true))
		(try! (contract-call? .bme024-0-market-predicting set-market-fee-bips-max u1000))
		(try! (contract-call? .bme024-0-market-predicting set-token-minimum-seed 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W.wrapped-stx u100000000))
		(try! (contract-call? .bme024-0-market-predicting set-token-minimum-seed 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W.bme000-0-governance-token u100000000))
		(try! (contract-call? .bme024-0-market-predicting set-token-minimum-seed 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W.tpepe u100000000))
		(try! (contract-call? .bme024-0-market-predicting set-token-minimum-seed 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W.tusdh u100000000))
		(try! (contract-call? .bme024-0-market-predicting set-token-minimum-seed 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token u100000000))

		(try! (contract-call? .bme024-0-market-scalar-pyth set-resolution-agent 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-dev-fund 'ST16RPMHH96463TP1AFEWZKQ12D7CY57YZGRWJR88))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-dao-treasury .bme006-0-treasury))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-creation-gated true))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W.wrapped-stx true))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token true))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token .tusdh true))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token .tpepe true))
		;; STXUSD / BTCUSD / SOLUSD / ETHUSD
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17 u2000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43 u100))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d u500))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace u1000))
		
		(try! (contract-call? .bme024-0-market-scalar-pyth set-market-fee-bips-max u1000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-token-minimum-seed 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W.wrapped-stx u100000000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-token-minimum-seed 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W.bme000-0-governance-token u100000000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-token-minimum-seed 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W.tpepe u100000000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-token-minimum-seed 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W.tusdh u100000000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-token-minimum-seed 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token u100000000))

		(try! (contract-call? .bme010-0-token-sale initialize-ido))

		;; core team voting rights unlock over u105120 bitcoin block period 
		(try! (contract-call? .bme000-0-governance-token set-core-team-vesting
			(list
				{recipient: sender, start-block: burn-block-height, duration: u105120}
				{recipient: 'ST2XHA15V40FAP9QZ0KMR7KBZ4NREV937QHZNT6B4, start-block: burn-block-height, duration: u105120} 
				{recipient: 'ST205A56XSM3F65NQBDBNN9FNZF5J9TBFH1MY1TJ1, start-block: burn-block-height, duration: u105120} 
				{recipient: 'ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ, start-block: burn-block-height, duration: u105120}
				{recipient: 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY, start-block: burn-block-height, duration: u105120}
			)
		))
		(try! (contract-call? .bme000-0-governance-token bmg-mint-many
			(list
				{amount: (/ (* u1500 token-supply) u10000), recipient: .bme006-0-treasury}
			)
		))
		(try! (contract-call? .tusdh mint-many
			(list
				{amount: u1000000000000, recipient: .univ2-router}
				{amount: u10000000000, recipient: 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W}
				{amount: u10000000000, recipient: 'ST2MEFKR0BDYC9V8QDMZ13T4B9R7XASKAX24ETX9K}
				{amount: u10000000000, recipient: 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY}
				{amount: u10000000000, recipient: 'ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ}
				{amount: u10000000000, recipient: 'ST3SJD6KV86N90W0MREGRTM1GWXN8Z91PF6W0BQKM}
			)
		))

		(try! (contract-call? .tpepe mint-many
			(list
				{amount: u1000000000000, recipient: .univ2-router}
				{amount: u10000000000, recipient: 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W}
				{amount: u10000000000, recipient: 'ST2MEFKR0BDYC9V8QDMZ13T4B9R7XASKAX24ETX9K}
				{amount: u10000000000, recipient: 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY}
				{amount: u10000000000, recipient: 'ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ}
				{amount: u10000000000, recipient: 'ST3SJD6KV86N90W0MREGRTM1GWXN8Z91PF6W0BQKM}
			)
		))

		(try! (contract-call? .bme030-0-reputation-token set-launch-height))
		;; Entry levels (weight: 1)
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u1 u1))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u2 u1))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u3 u1))

		;; Contributor levels (weight: 2)
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u4 u2))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u5 u2))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u6 u2))

		;; Active community (weight: 3)
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u7 u3))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u8 u3))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u9 u3))

		;; Project leads (weight: 5)
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u10 u5))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u11 u5))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u12 u5))

		;; Strategic contributors (weight: 8)
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u13 u8))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u14 u8))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u15 u8))

		;; Core stewards (weight: 13)
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u16 u13))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u17 u13))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u18 u13))

		;; Founders / exec level (weight: 21)
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u19 u21))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u20 u21))

		(print "BigMarket DAO has risen.")
		(ok true)
	)
)
