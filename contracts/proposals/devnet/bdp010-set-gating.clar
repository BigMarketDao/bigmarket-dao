;; Title: Gating
;; Author(s): Mike Cohen
;; Synopsis:
;; Description:

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		;; Enable genesis extensions.
		(try! (contract-call? .bitcoin-dao set-extensions
			(list
				{extension: .bde021-market-resolution-voting, enabled: true}
				{extension: .bde022-market-gating, enabled: true}
			)
		))
		(print "bde022-market-gating.")
		(ok true)
	)
)
