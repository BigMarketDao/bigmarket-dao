;; Title: Upgrade Scalar Markets to Pyth V4
;; Author(s): mijoco.btc
;; Synopsis: Oracle Pyth V4 is now available
;; Description: This proposal upgrades BigMarket scalar markets to use V4 Pyth Oracles
;; It also 

(impl-trait  .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bme010-0-liquidity-contribution set-liquidity-reward-params {rate: u10, dampener: u10}))
		(try! (contract-call? .bme032-0-scalar-strategy-hedge set-hedge-scalar-contract .bme024-0-market-scalar-pyth))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17 u2000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43 u100))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d u500))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace u1000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744 u1000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0x8963217838ab4cf5cadc172203c1f0b763fbaa45f346d8ee50ba994bbcac3026 u1000))
		(ok true)
	)
)
