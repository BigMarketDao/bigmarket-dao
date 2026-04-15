(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bme024-0-market-scalar-pyth set-max-conf-bips u1000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-max-staleness u61))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-dao-treasury .bme006-0-treasury))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-max-move-bips u10000))
		(ok true)
	)
)
