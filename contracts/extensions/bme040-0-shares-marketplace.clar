;; Title: BME040 - Marketplace DAO Extension for Share Trading
;; Description: Enables CPMM Backed .
;; create a share order to sell market shares - note ths dao can be be enable to automatically fullfil orders
;; under certain conditions which means we can model 'sell-shares' without impacting market liquidity

(use-trait prediction-market-trait .prediction-market-trait.prediction-market-trait)
(use-trait ft-token 'SP2AKWJYC7BNY18W1XXKPGP0YVEK63QJG4793Z2D4.sip-010-trait-ft-standard.sip-010-trait)
(impl-trait 'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.extension-trait.extension-trait)

;; Errors
(define-constant err-order-exists (err u40001))
(define-constant err-expiry-invalid (err u40002))
(define-constant err-order-not-found (err u40003))
(define-constant err-order-expired (err u40004))
(define-constant err-payment-failed (err u40005))
(define-constant err-share-transfer-failed (err u40006))
(define-constant err-invalid-token (err u40007))


(define-map share-orders
  { market: principal, market-id: uint, outcome: uint, seller: principal }
  { amount: uint, expiry-block: uint }
)

(define-public (create-share-order
  (market <prediction-market-trait>)
  (market-id uint)
  (outcome uint)
  (amount uint)
  (expires-after uint)
)
  (begin
    (asserts! (> expires-after u10) err-expiry-invalid)
    (asserts! (is-none (map-get? share-orders {market: (contract-of market), market-id: market-id, outcome: outcome, seller: tx-sender})) err-order-exists)

    ;; Only store the order no share transfer
    (map-set share-orders {market: (contract-of market), market-id: market-id, outcome: outcome, seller: tx-sender}
      {amount: amount, expiry-block: (+ burn-block-height expires-after)})

    (print {event: "create-share-order", market: (contract-of market), market-id: market-id, outcome: outcome, amount: amount, seller: tx-sender, expiry-block: (+ burn-block-height expires-after)})
    (ok true)
  )
)

;; fullfil a share sell order but adhere to market conditions - ie pay same market fee and cost the sake on the curve
(define-public (fill-share-order
  (market <prediction-market-trait>)
  (market-id uint)
  (outcome uint)
  (seller principal)
  (token <ft-token>)
)
  (let (
    (order-key {market: (contract-of market), market-id: market-id, outcome: outcome, seller: seller})
    (order (unwrap! (map-get? share-orders order-key) err-order-not-found))
    (amount (get amount order))
  )
    (asserts! (< burn-block-height (get expiry-block order)) err-order-expired)

    ;; work of transfer in the market contract
    (try! (contract-call? market transfer-shares market-id outcome seller tx-sender amount token))
    (map-delete share-orders order-key)
    (print {event: "fill-share-order", market: (contract-of market), market-id: market-id, outcome: outcome, buyer: tx-sender, seller: seller, amount: amount})
    (ok true)
  )
)

;; Public: cancel a listing (returns shares to seller)
(define-public (cancel-share-order (market <prediction-market-trait>) (market-id uint) (outcome uint))
  (let ((order (unwrap! (map-get? share-orders {market: (contract-of market), market-id: market-id, outcome: outcome, seller: tx-sender}) err-order-not-found)))
    (map-delete share-orders {market: (contract-of market), market-id: market-id, outcome: outcome, seller: tx-sender})
    (print {event: "cancel-share-order", market: (contract-of market), market-id: market-id, outcome: outcome, seller: tx-sender})
    (ok true)
  )
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
