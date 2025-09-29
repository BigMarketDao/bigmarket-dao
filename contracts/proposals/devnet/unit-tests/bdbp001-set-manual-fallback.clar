;; Title: Gating
;; Author(s): mijoco.btc
;; Synopsis:
;; Description:

(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bme024-0-market-scalar-pyth set-manual-price u0 u9500000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-manual-price u1 u9500000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-manual-price u2 u9500000))
		(ok true)
	)
)
