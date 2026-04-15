;; Title: Upgrade Scalar Markets to Pyth V4
;; Author(s): mijoco.btc
;; Synopsis: Oracle Pyth V4 is now available
;; Description: This proposal upgrades BigMarket scalar markets to use V4 Pyth Oracles
;; It also 

(impl-trait  .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bigmarket-dao set-extensions
			(list
				{extension: .bme024-0-market-scalar-pyth, enabled: false}
				{extension: .bme024-0-market-scalar-pyth, enabled: true}
			)
		))
		(try! (contract-call? .bme010-0-liquidity-contribution set-liquidity-reward-params {rate: u10, dampener: u10}))
		(try! (contract-call? .bme032-0-scalar-strategy-hedge set-hedge-scalar-contract .bme024-0-market-scalar-pyth))
		(ok true)
	)
)
