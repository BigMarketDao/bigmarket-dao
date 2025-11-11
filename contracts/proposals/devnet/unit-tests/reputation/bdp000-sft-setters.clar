(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bme030-0-reputation-token set-reward-per-epoch u55000))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u1 u101))
		(try! (contract-call? .bme030-0-reputation-token set-tier-weight u1 u101))
		(try! (contract-call? .bme030-0-reputation-token mint 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG u1 u1000))
		(try! (contract-call? .bme030-0-reputation-token burn 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG u1 u100))
		(try! (contract-call? .bme030-0-reputation-token transfer u1 u100 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM))

		(ok true)
	)
)
