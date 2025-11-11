;; Title: BME010 Token Sale
;; Synopsis:
;; Enables token sale for govenernance tokens.
;; Description:
;; Allows to token sale over 6 stages with token price set at each stage by the current DAO.
;; Contract allows any stage to be cancelled and for tokens to be reclaimed.
;; Listing via a DEX is not supported but can be enabled at any stage
;; 

(impl-trait 'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.extension-trait.extension-trait)

(define-constant err-unauthorised (err u5000))
(define-constant err-invalid-stage (err u5001))
(define-constant err-stage-sold-out (err u5002))
(define-constant err-nothing-to-claim (err u5003))
(define-constant err-no-more-stages (err u5005))
(define-constant err-already-cancelled (err u5006))
(define-constant err-no-purchase (err u5007))
(define-constant err-stage-not-cancelled (err u5008))
(define-constant err-stage-cancelled (err u5009))
(define-constant err-user-limit-reached (err u5010))

(define-constant SCALE u1000000)
(define-constant MICROSTX u1000000)

(define-data-var current-stage uint u1) ;; IDO starts at Stage 1
(define-data-var current-stage-start uint burn-block-height) ;; Tracks burn-block-height when stage begins
(define-data-var max-user-ido-purchase uint u500000000000)

(define-map ido-stage-details uint 
  {price: uint, max-supply: uint, tokens-sold: uint, cancelled: bool})
(define-map ido-purchases {stage: uint, buyer: principal} uint) ;; Tracks purchases

;; --- Authorisation check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .bigmarket-dao) (contract-call? .bigmarket-dao is-extension contract-caller)) err-unauthorised))
)

(define-public (set-max-user-ido-purchase (ido-purchase-limit uint))
  (begin
    (try! (is-dao-or-extension))
    (var-set max-user-ido-purchase ido-purchase-limit)
    (ok true)
  )
)

(define-read-only (get-ido-stages)
  (list
    (map-get? ido-stage-details u1)
    (map-get? ido-stage-details u2)
    (map-get? ido-stage-details u3)
    (map-get? ido-stage-details u4)
    (map-get? ido-stage-details u5)
    (map-get? ido-stage-details u6)
  )
)

(define-read-only (get-ido-user-for-stage (stage uint) (who principal))
  (map-get? ido-purchases {stage: stage, buyer: who})
)

(define-read-only (get-ido-user (who principal))
  (list 
    (match (map-get? ido-purchases {stage: u1, buyer: who}) value value u0 )
    (match (map-get? ido-purchases {stage: u2, buyer: who}) value value u0 )
    (match (map-get? ido-purchases {stage: u3, buyer: who}) value value u0 )
    (match (map-get? ido-purchases {stage: u4, buyer: who}) value value u0 )
    (match (map-get? ido-purchases {stage: u5, buyer: who}) value value u0 )
    (match (map-get? ido-purchases {stage: u6, buyer: who}) value value u0 )
  )
)

;; --- Internal DAO functions

(define-public (initialize-ido)
  (begin
    (try! (is-dao-or-extension))

    ;; Set up each stage
  (map-set ido-stage-details u1 {price: (* u5 SCALE),  max-supply: u6000000000000, tokens-sold: u0, cancelled: false})
  (map-set ido-stage-details u2 {price: (* u6 SCALE),  max-supply: u8333330000000, tokens-sold: u0, cancelled: false})
  (map-set ido-stage-details u3 {price: (* u7 SCALE),  max-supply: u10714290000000, tokens-sold: u0, cancelled: false})
  (map-set ido-stage-details u4 {price: (* u8 SCALE),  max-supply: u12500000000000, tokens-sold: u0, cancelled: false})
  (map-set ido-stage-details u5 {price: (* u10 SCALE), max-supply: u15000000000000, tokens-sold: u0, cancelled: false})
  (map-set ido-stage-details u6 {price: (* u20 SCALE), max-supply: u10000000000000, tokens-sold: u0, cancelled: false})

    (print {event: "ido-initialized"})
    (ok true)
  )
)

(define-public (buy-ido-tokens (stx-amount uint))
  (let (
    (stage (var-get current-stage))
    (stage-info (unwrap! (map-get? ido-stage-details stage) err-invalid-stage))
    (bmg-price (get price stage-info))
    (max-supply (get max-supply stage-info))
    (tokens-sold (get tokens-sold stage-info))
    (sender tx-sender)
		(cancelled (get cancelled stage-info))
    (current-stake (default-to u0 (map-get? ido-purchases {stage: stage, buyer: tx-sender})))
    (stx-in-stx (/ (* stx-amount SCALE) MICROSTX))
    (tokens-to-buy (/ (* stx-in-stx bmg-price) SCALE))

	)
    ;; assert account limit not reached
    (asserts! (<= (+ current-stake tokens-to-buy) (var-get max-user-ido-purchase)) err-user-limit-reached)
    ;; Ensure enough supply remains
    (asserts! (<= (+ tokens-sold tokens-to-buy) max-supply) err-stage-sold-out)
    (asserts! (not cancelled) err-stage-cancelled)

    ;; Accept STX payment
    (try! (stx-transfer? stx-amount tx-sender .bme006-0-treasury))

    ;; Mint tokens directly to the buyer
    (try! (as-contract (contract-call? .bme000-0-governance-token bmg-mint tokens-to-buy sender)))

    ;; Update stage details
    (map-set ido-stage-details stage (merge stage-info {tokens-sold: (+ tokens-sold tokens-to-buy)}))
    (map-set ido-purchases {stage: stage, buyer: tx-sender} (+ current-stake tokens-to-buy))

    (print {event: "ido-purchase", buyer: tx-sender, stage: stage, tokens: tokens-to-buy, stx-amount: stx-amount})

    (ok tokens-to-buy)
  )
)

(define-public (advance-ido-stage)
  (begin
    (try! (is-dao-or-extension))
    (let (
      (stage (var-get current-stage))
      (stage-info (unwrap! (map-get? ido-stage-details stage) err-invalid-stage))
    )
      
    (asserts! (not (get cancelled stage-info)) err-already-cancelled) ;; Ensure not already cancelled
    (asserts! (< stage u6) err-no-more-stages) ;; Can't go past stage 6
    (var-set current-stage (+ u1 stage)) ;; Move to the next stage

    ;; Use burn-block-height to track when the stage starts
    (var-set current-stage-start burn-block-height)

    (print {event: "ido-stage-advanced", new-stage: (var-get current-stage), burn-start: burn-block-height})
    (ok stage)
    )

  )
)

(define-public (cancel-ido-stage)
  (begin
    (try! (is-dao-or-extension))

    (let ((stage (var-get current-stage))
          (stage-info (unwrap! (map-get? ido-stage-details stage) err-invalid-stage)))
      
      (asserts! (not (get cancelled stage-info)) err-already-cancelled) ;; Ensure not already cancelled
      
      ;; Update the stage's cancelled flag
      (map-set ido-stage-details stage (merge stage-info {cancelled: true}))

      (print {event: "cancel-ido-stage", stage: stage})
      (ok true)
    )
  )
)

(define-public (claim-ido-refund)
  (let ((stage (var-get current-stage))
        (purchase-amount (unwrap! (map-get? ido-purchases {stage: stage, buyer: tx-sender}) err-no-purchase))
        (stage-info (unwrap! (map-get? ido-stage-details stage) err-invalid-stage))
        (price (get price stage-info))
        (sender tx-sender)
        (refund (/ (* purchase-amount price) SCALE))
	)
    ;; Ensure stage is actually cancelled
    (asserts! (get cancelled stage-info) err-stage-not-cancelled)
    ;; Transfer STX back to the buyer / burn the bdg
    (try! (as-contract (contract-call? .bme006-0-treasury stx-transfer refund sender none)))
    (try! (as-contract (contract-call? .bme000-0-governance-token bmg-burn purchase-amount sender)))
    ;; Remove the purchase record
    (map-delete ido-purchases {stage: stage, buyer: tx-sender})
    (print {event: "ido-refund", buyer: tx-sender, refunded: purchase-amount, stage: stage})
    (ok purchase-amount)
  )
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
