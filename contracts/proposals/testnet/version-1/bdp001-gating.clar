;; Title: Gating
;; Author(s): mijoco.btc
;; Synopsis:
;; Description:

(impl-trait  .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		;; Enable genesis extensions.
		;; [alice, bob, tom, betty, wallace];
		(try! (contract-call? .bme022-0-market-gating set-merkle-root-by-principal .bme024-0-market-predicting 0x9e208b9b0d42a633acf7fd4adc3a24646202c887e476e6f27ecde500ed119587))
		(try! (contract-call? .bme022-0-market-gating set-merkle-root-by-principal .bme024-0-market-scalar-pyth 0x9e208b9b0d42a633acf7fd4adc3a24646202c887e476e6f27ecde500ed119587))
		(ok true)
	)
)
