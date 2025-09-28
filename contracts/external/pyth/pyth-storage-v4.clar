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

;; Optional setter to tweak in tests

(define-read-only (read (price-identifier (buff 32)))
  (ok {
    price: (var-get mock-price),
    conf: (var-get mock-conf),
    expo: (var-get mock-expo),
    ema-price: (var-get mock-ema-price),
    ema-conf: (var-get mock-ema-conf),
    publish-time: (var-get mock-publish-time),
    prev-publish-time: (var-get mock-prev-publish-time)
  })
)

