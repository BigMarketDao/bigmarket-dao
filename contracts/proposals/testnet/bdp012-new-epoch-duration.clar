;; Title: Allowed tokens
;; Author(s): mijoco.btc
;; Description: Includes some major tokens for use in prediction markets 

(impl-trait  'ST31A25YBK50KFJ2QS0EQK9FNXEQJD4PR0828789R.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? 'ST1CV2YGRJA5X8BWS0GP31J9HF56M06CQK8998TSX.bme030-0-reputation-token set-epoch-duration u100))
		(ok true)
	)
)
