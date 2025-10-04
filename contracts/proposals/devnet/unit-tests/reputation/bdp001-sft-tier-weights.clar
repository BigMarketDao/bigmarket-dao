;; Title: Gating
;; Author(s): mijoco.btc
;; Synopsis:
;; Description:

(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u1 u1))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u2 u1))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u3 u1))

		;; Contributor levels (weight: 2)
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u4 u1))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u5 u1))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u6 u1))

		;; Active community (weight: 3)
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u7 u1))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u8 u1))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u9 u1))

		;; Project leads (weight: 5)
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u10 u1))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u11 u1))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u12 u1))

		;; Strategic contributors (weight: 8)
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u13 u1))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u14 u1))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u15 u1))

		;; Core stewards (weight: 13)
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u16 u1))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u17 u1))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u18 u1))

		;; Founders / exec level (weight: 21)
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u19 u1))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u20 u1))
		(ok true)
	)
)
