;; Title: BDP000 Bootstrap
;; Description:
;; Sets up and configure the BigMarket DAO

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
			)
		))
		;; Set core team members.
		(try! (contract-call? .bme003-0-core-proposals set-core-team-member 'SP2TQ069HEM31JMBNSMBP7MQDKDTB56F6M2B632JJ true))
		(try! (contract-call? .bme003-0-core-proposals set-core-team-member 'SPEZD95XQ194X67C1QJW4PHKDG8F5D66ZCT8BY29 true))
		(try! (contract-call? .bme003-0-core-proposals set-core-team-member 'SP2XHA15V40FAP9QZ0KMR7KBZ4NREV937QH668MB9 true))
		(try! (contract-call? .bme003-0-core-proposals set-core-team-member 'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z true))

		;; configure prediction markets
		;; Allowed = ["SP2TQ069HEM31JMBNSMBP7MQDKDTB56F6M2B632JJ", "SPEZD95XQ194X67C1QJW4PHKDG8F5D66ZCT8BY29", "SP2XHA15V40FAP9QZ0KMR7KBZ4NREV937QH668MB9", "SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z"];
		(try! (contract-call? .bme022-0-market-gating set-merkle-root-by-principal .bme024-0-market-predicting 0x9e208b9b0d42a633acf7fd4adc3a24646202c887e476e6f27ecde500ed119587))
		(try! (contract-call? .bme022-0-market-gating set-merkle-root-by-principal .bme024-0-market-scalar-pyth 0x9e208b9b0d42a633acf7fd4adc3a24646202c887e476e6f27ecde500ed119587))
		
		;; Category contract setting
		(try! (contract-call? .bme024-0-market-predicting set-resolution-agent 'SP3NS9010CQ9AK3M6XN3XD9EHNTDZVGYSMFWZ288Z))
		(try! (contract-call? .bme024-0-market-predicting set-dev-fund 'SM38XBR119DCN8D3WTBGWYYXC3K8X0FY0F9TSD8AF))
		(try! (contract-call? .bme024-0-market-predicting set-dao-treasury .bme006-0-treasury))
		(try! (contract-call? .bme024-0-market-predicting set-creation-gated true))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token 'SP2TQ069HEM31JMBNSMBP7MQDKDTB56F6M2B632JJ.wrapped-stx true))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token true))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token .bme000-0-governance-token true))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token .big-play true))

		(try! (contract-call? .bme024-0-market-predicting set-market-fee-bips-max u1000))
		(try! (contract-call? .bme024-0-market-predicting set-token-minimum-seed 'SP2TQ069HEM31JMBNSMBP7MQDKDTB56F6M2B632JJ.wrapped-stx u50000000))
		(try! (contract-call? .bme024-0-market-predicting set-token-minimum-seed 'SP2TQ069HEM31JMBNSMBP7MQDKDTB56F6M2B632JJ.bme000-0-governance-token u50000000))
		(try! (contract-call? .bme024-0-market-predicting set-token-minimum-seed 'SP2TQ069HEM31JMBNSMBP7MQDKDTB56F6M2B632JJ.big-play u100000000))
		(try! (contract-call? .bme024-0-market-predicting set-token-minimum-seed 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token u10000))

		;; Scalar contract setting
		(try! (contract-call? .bme024-0-market-scalar-pyth set-resolution-agent 'SP3NS9010CQ9AK3M6XN3XD9EHNTDZVGYSMFWZ288Z))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-dev-fund 'SM38XBR119DCN8D3WTBGWYYXC3K8X0FY0F9TSD8AF))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-dao-treasury .bme006-0-treasury))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-creation-gated true))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token 'SP2TQ069HEM31JMBNSMBP7MQDKDTB56F6M2B632JJ.wrapped-stx true))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token true))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token .bme000-0-governance-token true))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token .big-play true))
		;; STXUSD / BTCUSD / SOLUSD / ETHUSD / SUIUSD / TONUSD
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17 u2000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43 u100))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d u500))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace u1000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744 u900))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0x8963217838ab4cf5cadc172203c1f0b763fbaa45f346d8ee50ba994bbcac3026 u600))
		
		
		(try! (contract-call? .bme024-0-market-scalar-pyth set-market-fee-bips-max u1000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-token-minimum-seed 'SP2TQ069HEM31JMBNSMBP7MQDKDTB56F6M2B632JJ.wrapped-stx u50000000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-token-minimum-seed 'SP2TQ069HEM31JMBNSMBP7MQDKDTB56F6M2B632JJ.bme000-0-governance-token u50000000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-token-minimum-seed 'SP2TQ069HEM31JMBNSMBP7MQDKDTB56F6M2B632JJ.big-play u100000000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-token-minimum-seed 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token u10000))

		;;(try! (contract-call? .bme010-0-token-sale initialize-ido))

		;; core team voting rights unlock over u105120 bitcoin block period 
		;;(try! (contract-call? .bme000-0-governance-token set-core-team-vesting
		;;	(list
		;;		{recipient: sender, start-block: burn-block-height, duration: u105120}
		;;		{recipient: 'ST2XHA15V40FAP9QZ0KMR7KBZ4NREV937QHZNT6B4, start-block: burn-block-height, duration: u105120} 
		;;		{recipient: 'ST205A56XSM3F65NQBDBNN9FNZF5J9TBFH1MY1TJ1, start-block: burn-block-height, duration: u105120} 
		;;		{recipient: 'ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ, start-block: burn-block-height, duration: u105120}
		;;		{recipient: 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY, start-block: burn-block-height, duration: u105120}
		;;	)
		;;))
		(try! (contract-call? .bme000-0-governance-token bmg-mint-many
			(list
				{amount: (/ (* u1500 token-supply) u10000), recipient: .bme006-0-treasury}
				{amount: u1000000000, recipient: 'ST2TQ069HEM31JMBNSMBP7MQDKDTB56F6M0AKT00W}
				{amount: u1000000000, recipient: 'ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ}
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
