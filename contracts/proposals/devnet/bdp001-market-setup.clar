;; Title: Gating
;; Author(s): mijoco.btc
;; Synopsis:
;; Description:

(impl-trait 'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bde023-market-predicting set-market-fee-bips-max u300))
		(try! (contract-call? .bde023-market-predicting set-market-create-fee u150000000))
		(try! (contract-call? .bde023-market-predicting set-dev-fee-bips u175))
		(try! (contract-call? .bde023-market-predicting set-dao-fee-bips u150))
		(try! (contract-call? .bde022-market-gating set-merkle-root-by-principal .bde023-market-predicting 0x5f24649277af2f6364faf35827dffe12b85f2f1dca5ae92733c72af91455aa64))
		(try! (contract-call? .bde023-market-predicting set-dispute-window-length u24))
		(try! (contract-call? .bde021-market-voting set-voting-duration u24))
		(ok true)
	)
)
