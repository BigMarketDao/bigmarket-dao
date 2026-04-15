
(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.tusdh mint-many
			(list
				{amount: u1000000000000000, recipient: .univ2-router}
				{amount: u1000000000000000, recipient: .bme006-0-treasury}
			)
		))
		(try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.simple-nft mint .bme006-0-treasury))
		(try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.simple-nft mint .bme006-0-treasury))
		(try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.simple-nft mint .bme006-0-treasury))

		(try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bme030-0-reputation-token mint .bme006-0-treasury u1 u1000))
		(try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bme030-0-reputation-token mint .bme006-0-treasury u2 u1000))

		(try! (contract-call? .bme006-0-treasury stx-transfer u1000 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG none))
		(try! (contract-call? .bme006-0-treasury stx-transfer-many (list
				{amount: u100, recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM, memo: none}
				{amount: u100, recipient: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5, memo: none}
				{amount: u100, recipient: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG, memo: none}
				{amount: u100, recipient: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC, memo: none}
				{amount: u100, recipient: 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND, memo: none}
				{amount: u100, recipient: 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP, memo: none})
		))
		(try! (contract-call? .bme006-0-treasury sip009-transfer u1 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG .simple-nft))
		(try! (contract-call? .bme006-0-treasury sip009-transfer-many (list
				{token-id: u2, recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM}
				{token-id: u3, recipient: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5}) .simple-nft)
		)
		(try! (contract-call? .bme006-0-treasury sip010-transfer u1000 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG none .tusdh))
		(try! (contract-call? .bme006-0-treasury sip010-transfer-many (list
				{amount: u1000, recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM, memo: none}
				{amount: u1000, recipient: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5, memo: none}) .tusdh)
		)
		(try! (contract-call? .bme006-0-treasury sip013-transfer u2 u1000 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG none 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bme030-0-reputation-token))
		(try! (contract-call? .bme006-0-treasury sip013-transfer-many (list
				{token-id: u1, amount: u100, sender: .bme006-0-treasury, recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM}
				{token-id: u1, amount: u100, sender: .bme006-0-treasury, recipient: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5}) .bme030-0-reputation-token)
		)
		(try! (contract-call? .bme006-0-treasury sip013-transfer-many-memo (list
				{token-id: u1, amount: u100, sender: .bme006-0-treasury, recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM, memo: 0x0a}
				{token-id: u1, amount: u100, sender: .bme006-0-treasury, recipient: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5, memo: 0x0a}) .bme030-0-reputation-token)
		)
		(ok true)
	)
)
