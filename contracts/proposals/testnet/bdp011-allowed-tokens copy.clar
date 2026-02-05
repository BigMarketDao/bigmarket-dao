;; Title: Allowed tokens
;; Author(s): mijoco.btc
;; Description: Includes some major tokens for use in prediction markets 

(impl-trait  'ST31A25YBK50KFJ2QS0EQK9FNXEQJD4PR0828789R.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token 'ST2X0FMCBMBK3F41WVS8PKN75PF9H5ZDRJB7H600B.wrapped-stx true))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token 'ST1CV2YGRJA5X8BWS0GP31J9HF56M06CQK8998TSX.bme000-0-governance-token true))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token true))

		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token 'ST2X0FMCBMBK3F41WVS8PKN75PF9H5ZDRJB7H600B.wrapped-stx true))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token 'ST1CV2YGRJA5X8BWS0GP31J9HF56M06CQK8998TSX.bme000-0-governance-token true))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token true))
		(ok true)
	)
)
