;; Title: BDP000 Bootstrap liquidity
;; Description:
;; Sets up and configure the DAO

(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

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
