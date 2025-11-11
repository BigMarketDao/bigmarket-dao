
(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.tusdh mint-many
			(list
				{amount: u1000000000000000, recipient: .univ2-router}
				{amount: u1000000000000000, recipient: .bme006-0-treasury}
			)
		))
		(try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.tpepe mint-many
			(list
				{amount: u1000000000000000, recipient: .univ2-router}
				{amount: u1000000000000000, recipient: .bme006-0-treasury}
			)
		))
		;; slippage above max threshold 30%
		(try! (contract-call? .bme006-0-treasury swap-tokens-with-slippage 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.tusdh 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.tpepe 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.tusdh 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.tpepe u10000000 u3001)) 
		(ok true)
	)
)