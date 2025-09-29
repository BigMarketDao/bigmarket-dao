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

    (price (if (is-eq price-feed-id btc-id)
              9500000      ;; $95.000000 with expo -8
              (if (is-eq price-feed-id eth-id)
                  10500000  ;; $105.000000
                  (if (is-eq price-feed-id stx-id)
                      11500000
                      12500000))))
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
