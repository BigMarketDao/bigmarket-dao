;; Title: Add address to merkle root
;; Author(s): mijoco.btc

(impl-trait  .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bme022-0-market-gating set-merkle-root-by-principal .bme024-0-market-predicting 0xf661e4bb4ab75e36c77e588c07b0836f0628fb533d9f97e66a5566a038e1f45e))
		(try! (contract-call? .bme022-0-market-gating set-merkle-root-by-principal .bme024-0-market-scalar-pyth 0xf661e4bb4ab75e36c77e588c07b0836f0628fb533d9f97e66a5566a038e1f45e))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-dispute-window-length u3))
		(try! (contract-call? .bme024-0-market-predicting set-dispute-window-length u3))
		(try! (contract-call? .bme021-0-market-voting set-voting-duration u3))
		(try! (contract-call? .bme021-0-market-voting set-voting-duration u3))
		(ok true)
	)
)
