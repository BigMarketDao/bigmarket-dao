;; Title: Gating
;; Author(s): mijoco.btc
;; Synopsis:
;; Description:

(impl-trait  .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		;; Enable genesis extensions.
		;; [alice, bob, tom, betty, wallace];
		(try! (contract-call? .bme024-0-market-predicting set-creation-gated true))
		;; see metadataHash()
		(try! (contract-call? .bme022-0-market-gating set-merkle-root 0xfe57bb961c647d98656cc35801e52d3eed46f3cdcc8e840df7af8bd3a04312d5 0x5f24649277af2f6364faf35827dffe12b85f2f1dca5ae92733c72af91455aa64))
		(try! (contract-call? .bme022-0-market-gating set-merkle-root-by-principal .bme024-0-market-predicting 0x5f24649277af2f6364faf35827dffe12b85f2f1dca5ae92733c72af91455aa64))

		;; mint nft 1 ro bob
		(try! (contract-call? .simple-nft mint 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG))

		(ok true)
	)
)
