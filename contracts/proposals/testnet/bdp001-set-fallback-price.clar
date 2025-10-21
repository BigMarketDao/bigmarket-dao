;; Title: Gating
;; Author(s): mijoco.btc
;; Synopsis:
;; Description:

(impl-trait  .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		;; Enable genesis extensions.
		;; [alice, bob, tom, betty, wallace];
		(try! (contract-call? .bme024-0-market-scalar-pyth set-manual-price u0 u109075))
		(ok true)
	)
)
