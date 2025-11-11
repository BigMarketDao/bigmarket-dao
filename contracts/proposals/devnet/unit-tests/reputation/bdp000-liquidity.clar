(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bme010-0-liquidity-contribution set-liquidity-reward-params {rate: u2, dampener: u3}))
		(ok true)
	)
)
