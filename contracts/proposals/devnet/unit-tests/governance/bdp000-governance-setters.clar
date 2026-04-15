
(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bme000-0-governance-token set-token-price u100))
		(try! (contract-call? .bme000-0-governance-token set-transfers-active true))
		(try! (contract-call? .bme000-0-governance-token bmg-transfer u55 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG))
		(try! (contract-call? .bme000-0-governance-token bmg-lock u25 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
		(try! (contract-call? .bme000-0-governance-token bmg-unlock u25 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
		(try! (contract-call? .bme000-0-governance-token bmg-mint u25 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
		(try! (contract-call? .bme000-0-governance-token bmg-burn u25 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
		(try! (contract-call? .bme000-0-governance-token set-name "TOKEN"))
		(try! (contract-call? .bme000-0-governance-token set-symbol "SYMBOL"))
		(try! (contract-call? .bme000-0-governance-token set-decimals u8))
		;;(try! (contract-call? .bme000-0-governance-token set-token-uri u"URI"))
		(ok true)
	)
)