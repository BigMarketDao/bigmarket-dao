(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bigmarket-dao request-extension-callback 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bme000-0-governance-token 0x0A))
		(try! (contract-call? .bigmarket-dao set-extension .bme000-0-governance-token true))
		(ok true)
	)
)
