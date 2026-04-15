

(define-trait core-trait
	(
		(parse-and-verify-vaa ((buff 8192)) (response {
			version: uint, 
			guardian-set-id: uint,
			emitter-chain: uint,
			emitter-address: (buff 32),
			sequence: uint,
			payload: (buff 8192),
		} uint))
	)
)