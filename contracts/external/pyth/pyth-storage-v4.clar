;; contracts/external/pyth/pyth-storage-v4.clar
;; Title: pyth-storage (mock)
;; Version: v4 (mocked to satisfy the v2 storage trait)

(impl-trait .pyth-traits-v2.storage-trait)

(define-data-var mock-price int 100000000)           ;; 1.00000000 with expo -8
(define-data-var mock-conf  uint u200000)             ;; 0.00200000 with expo -8
(define-data-var mock-expo  int -8)
(define-data-var mock-ema-price int 100000000)
(define-data-var mock-ema-conf  uint u200000)
(define-data-var mock-publish-time uint u1700000000)
(define-data-var mock-prev-publish-time uint u1699999900)

(impl-trait .pyth-traits-v2.storage-trait)

(define-public (read-price-with-staleness-check (price-feed-id (buff 32)))
  (let (
    (btc-id 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43)
    (eth-id 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace)
    (stx-id 0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17)
    (sol-id 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d)
    (big-id 0xff0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d)
    (bigr-id 0xfffd8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d)

    (price (if (is-eq price-feed-id btc-id)
              9500000      ;; $95.000000 with expo -8
              (if (is-eq price-feed-id eth-id)
                  10500000  ;; $105.000000
                  (if (is-eq price-feed-id stx-id)
                      11500000
                      (if (is-eq price-feed-id big-id) 0 (if (is-eq price-feed-id bigr-id) 1000000000 12500000))))))
    )
    (ok {
      price: price,     ;; = 100.000000 with expo -8
      conf: u1,              ;; = 0.000001 with expo -8  0.001% error
      expo: -8,
      ema-price: 100000000,
      ema-conf: u1,
      publish-time: u1000,   ;; recent enough
      prev-publish-time: u999
    })
))
;; Title: pyth-storage
;; Version: v4
;; Check for latest version: https://github.com/Trust-Machines/stacks-pyth-bridge#latest-version
;; Report an issue: https://github.com/Trust-Machines/stacks-pyth-bridge/issues

(impl-trait .pyth-traits-v2.storage-trait)

(define-constant ERR_NEWER_PRICE_AVAILABLE (err u5001))
(define-constant ERR_STALE_PRICE (err u5002))
(define-constant ERR_RESTRICTED_TO_TESTNET (err u5003))
(define-constant ERR_PRICE_FEED_NOT_FOUND (err u5004))

(define-constant STACKS_BLOCK_TIME u5)

(define-map prices (buff 32) {
	price: int,
	conf: uint,
	expo: int,
	ema-price: int,
	ema-conf: uint,
	publish-time: uint,
	prev-publish-time: uint,
})

(define-map timestamps (buff 32) uint)

(define-public (set-price-testnet
	(data {
		price-identifier: (buff 32),
		price: int,
		conf: uint,
		expo: int,
		ema-price: int,
		ema-conf: uint,
		publish-time: uint,
		prev-publish-time: uint,
	}))
	(begin
		(asserts! (not is-in-mainnet) ERR_RESTRICTED_TO_TESTNET)
		(ok (write-batch-entry data))
	)
)

(define-public (read (price-identifier (buff 32)))
	(let ((entry (unwrap! (map-get? prices price-identifier) ERR_PRICE_FEED_NOT_FOUND)))
		(ok entry)))

(define-read-only (get-price (price-identifier (buff 32)))
	(let ((entry (unwrap! (map-get? prices price-identifier) ERR_PRICE_FEED_NOT_FOUND)))
		(ok entry)))

;; (define-read-only (read-price-with-staleness-check (price-identifier (buff 32)))
;; 	(let ((entry (unwrap! (map-get? prices price-identifier) ERR_PRICE_FEED_NOT_FOUND))
;; 			(stale-price-threshold (contract-call? .pyth-governance-v3 get-stale-price-threshold))
;; 			(latest-stacks-timestamp (unwrap! (get-stacks-block-info? time (- stacks-block-height u1)) ERR_STALE_PRICE)))
;; 		(asserts! (>= (get publish-time entry) (+ (- latest-stacks-timestamp stale-price-threshold) STACKS_BLOCK_TIME)) ERR_STALE_PRICE)
;; 		(ok entry)))

(define-public (write (batch-updates (list 64 {
		price-identifier: (buff 32),
		price: int,
		conf: uint,
		expo: int,
		ema-price: int,
		ema-conf: uint,
		publish-time: uint,
		prev-publish-time: uint,
	})))
	(let ((successful-updates (map unwrapped-entry (filter only-ok-entry (map write-batch-entry batch-updates)))))
		;; Ensure that updates are always coming from the right contract
		;;(try! (contract-call? .pyth-governance-v3 check-execution-flow contract-caller none))
		(ok successful-updates)))

(define-private (write-batch-entry (entry {
		price-identifier: (buff 32),
		price: int,
		conf: uint,
		expo: int,
		ema-price: int,
		ema-conf: uint,
		publish-time: uint,
		prev-publish-time: uint,
	}))
	(let ((stale-price-threshold u100)
			(latest-stacks-timestamp (unwrap! (get-stacks-block-info? time (- stacks-block-height u1)) ERR_STALE_PRICE))
			(publish-time (get publish-time entry)))
		;; Ensure that we have not processed a newer price
		(asserts! (is-price-update-more-recent (get price-identifier entry) publish-time) ERR_NEWER_PRICE_AVAILABLE)
		;; Ensure that price is not stale
		(asserts! (>= publish-time (+ (- latest-stacks-timestamp stale-price-threshold) STACKS_BLOCK_TIME)) ERR_STALE_PRICE)
		;; Update storage
		(map-set prices 
			(get price-identifier entry) 
			{
				price: (get price entry),
				conf: (get conf entry),
				expo: (get expo entry),
				ema-price: (get ema-price entry),
				ema-conf: (get ema-conf entry),
				publish-time: publish-time,
				prev-publish-time: (get prev-publish-time entry)
			})
		;; Emit event
		(print {
			type: "price-feed", 
			action: "updated", 
			data: entry
		})
		;; Update timestamps tracking
		(map-set timestamps (get price-identifier entry) (get publish-time entry))
		(ok entry)))

(define-private (only-ok-entry (entry (response {
		price-identifier: (buff 32),
		price: int,
		conf: uint,
		expo: int,
		ema-price: int,
		ema-conf: uint,
		publish-time: uint,
		prev-publish-time: uint,
	} uint))) (is-ok entry))

(define-private (unwrapped-entry (entry (response {
		price-identifier: (buff 32),
		price: int,
		conf: uint,
		expo: int,
		ema-price: int,
		ema-conf: uint,
		publish-time: uint,
		prev-publish-time: uint,
	} uint))) (unwrap-panic entry))

(define-private (is-price-update-more-recent (price-identifier (buff 32)) (publish-time uint))
	(> publish-time (default-to u0 (map-get? timestamps price-identifier))))