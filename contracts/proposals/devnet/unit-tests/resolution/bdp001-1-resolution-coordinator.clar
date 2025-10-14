;; Title: Gating
;; Author(s): mijoco.btc
;; Synopsis:
;; Description:

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
	;; tom betty fred
		(try! (contract-call? .bme008-0-resolution-coordinator set-resolution-team-member 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC true))
		(try! (contract-call? .bme008-0-resolution-coordinator set-resolution-team-member 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND true))
		(try! (contract-call? .bme008-0-resolution-coordinator set-resolution-team-member 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB true))
			(try! (contract-call? .bme008-0-resolution-coordinator set-signals-required u3))
	(ok true)
	)
)
