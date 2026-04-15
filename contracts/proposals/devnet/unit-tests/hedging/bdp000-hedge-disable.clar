(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bme024-0-market-predicting set-hedging-enabled false))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-hedging-enabled false))
		(ok true)
	)
)
