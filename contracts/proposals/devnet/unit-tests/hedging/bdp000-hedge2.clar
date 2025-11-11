(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		;; correct the allowed calling contracts
		(try! (contract-call? .bme032-0-scalar-strategy-hedge set-hedge-market-contract .bme024-0-market-predicting))
		(try! (contract-call? .bme032-0-scalar-strategy-hedge set-hedge-scalar-contract .bme024-0-market-scalar-pyth))
		(ok true)
	)
)
