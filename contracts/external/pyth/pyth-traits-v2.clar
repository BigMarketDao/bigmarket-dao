;; Title: pyth-traits
;; Version: v2
;; Check for latest version: https://github.com/Trust-Machines/stacks-pyth-bridge#latest-version
;; Report an issue: https://github.com/Trust-Machines/stacks-pyth-bridge/issues


(define-trait storage-trait
	(
		(read-price-with-staleness-check ((buff 32)) (response {
			price: int,
			conf: uint,
			expo: int,
			ema-price: int,
			ema-conf: uint,
			publish-time: uint,
			prev-publish-time: uint,
		} uint))

	)
)
