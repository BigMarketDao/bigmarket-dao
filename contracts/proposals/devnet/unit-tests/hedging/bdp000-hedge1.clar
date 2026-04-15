(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bme032-0-scalar-strategy-hedge set-swap-token-pair 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace .tpepe .tusdh .tpepe .tusdh))
		(try! (contract-call? .bme032-0-scalar-strategy-hedge set-swap-token-pair 0x26067618f71da1da6fa33c9b7f8d989b87f71ade892e1c55ce3b46ac79a7e64e .tpepe .tusdh .tusdh .tpepe))
		(try! (contract-call? .bme032-0-scalar-strategy-hedge set-hedge-slippage u500))
		(try! (contract-call? .bme032-0-scalar-strategy-hedge set-hedge-cooldown u5))
		(try! (contract-call? .bme032-0-scalar-strategy-hedge set-hedge-min-trade u5000000))
		(try! (contract-call? .bme032-0-scalar-strategy-hedge set-hedge-caps u500 u5000000)) ;; 5% 5 tokens
		;; note incorrect calling contracts
		(try! (contract-call? .bme032-0-scalar-strategy-hedge set-hedge-multipliers (list u100 u100 u100 u100 u100 u100)))
		(try! (contract-call? .bme032-0-scalar-strategy-hedge set-hedge-scalar-contract .bme024-0-market-predicting))
		(try! (contract-call? .bme032-0-scalar-strategy-hedge set-hedge-market-contract .bme024-0-market-scalar-pyth))
		(try! (contract-call? .bme024-0-market-predicting set-default-hedge-executor .bme032-0-scalar-strategy-hedge))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-default-hedge-executor .bme032-0-scalar-strategy-hedge))
		(ok true)
	)
)
