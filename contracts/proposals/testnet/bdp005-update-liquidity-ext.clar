;; Title: Updates the liquidity extension to version 1
;; Author(s): mijoco.btc
;; Description: improves conversion calculation of STX to BIGR to align with other reward actions

(impl-trait  .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bigmarket-dao set-extensions
			(list
				{extension: .bme010-0-liquidity-contribution, enabled: false}
				{extension: .bme010-1-liquidity-contribution, enabled: true}
			)
		))
		(ok true)
	)
)
