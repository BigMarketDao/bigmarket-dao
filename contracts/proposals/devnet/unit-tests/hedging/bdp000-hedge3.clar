(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		;; Note: USD0 feed id
		(try! (contract-call? .bme032-0-scalar-strategy-hedge set-swap-token-pair 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43 .tpepe .tusdh .tpepe .tusdh))
		(ok true)
	)
)
