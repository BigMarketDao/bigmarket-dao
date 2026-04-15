(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bme024-0-market-scalar-pyth set-default-hedge-executor 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bme032-0-scalar-strategy-hedge))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-max-staleness u86200000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-max-move-bips u10000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xff0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d u5000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-price-band-width 0xfffd8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d u5))
		(ok true)
	)
)
