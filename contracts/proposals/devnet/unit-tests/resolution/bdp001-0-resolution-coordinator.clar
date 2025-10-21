;; Title: Gating
;; Author(s): mijoco.btc
;; Synopsis:
;; Description:

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		;; Enable genesis extensions.
		;; [alice, bob, tom, betty, wallace];
		(try! (contract-call? .bigmarket-dao set-extensions
			(list
				{extension: .bme008-0-resolution-coordinator, enabled: true}
			)
		))
		(try! (contract-call? .bme021-0-market-voting set-voting-duration u3))
		(try! (contract-call? .bme024-0-market-predicting set-dispute-window-length u3))
		(try! (contract-call? .bme024-0-market-predicting set-resolution-agent .bme008-0-resolution-coordinator))
		(try! (contract-call? .bme008-0-resolution-coordinator set-resolution-team-member 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG true))
		(try! (contract-call? .bme008-0-resolution-coordinator set-signals-required u1))
		(ok true)
	)
)
