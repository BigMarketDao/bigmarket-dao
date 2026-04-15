;; reputation-trait.clar
;; Trait for BigMarket Reputation Token (BIGR)

(define-trait reputation-trait
  (
    (mint (principal uint uint) (response bool uint))
    (burn (principal uint uint) (response bool uint))
    (transfer (uint uint principal principal) (response bool uint))

    ;; --- Rewards claim ---
    (claim-big-reward () (response uint uint))
    (claim-big-reward-batch ((list 100 principal)) (response uint uint))

    ;; --- Useful read-only queries ---
    (get-weighted-rep (principal) (response uint uint))
    (get-weighted-supply () (response uint uint))
    (get-epoch () (response uint uint))
  )
)
