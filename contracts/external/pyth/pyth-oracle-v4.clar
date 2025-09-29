;; Title: pyth-oracle
;; Version: v3
;; Check for latest version: https://github.com/Trust-Machines/stacks-pyth-bridge#latest-version
;; Report an issue: https://github.com/Trust-Machines/stacks-pyth-bridge/issues

(use-trait pyth-storage-trait .pyth-traits-v2.storage-trait)

(define-public (get-price
		(price-feed-id (buff 32))
		(pyth-storage-address <pyth-storage-trait>))
	(begin
		;; Check execution flow
		;; Perform contract-call
		(contract-call? pyth-storage-address read-price-with-staleness-check price-feed-id)))
