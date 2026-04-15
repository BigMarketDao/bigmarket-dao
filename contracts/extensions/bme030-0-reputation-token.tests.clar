(define-read-only (invariant-rep-weighted-supply-consistent)
  (let (
        ;; constant list of the 20 tiers
        (tiers (list u1 u2 u3 u4 u5 u6 u7 u8 u9 u10
                     u11 u12 u13 u14 u15 u16 u17 u18 u19 u20))

        ;; recompute weighted supply
        (computed-weighted
          (fold compute-tier-weighted tiers u0))

        (stored-weighted (var-get weighted-supply))
        (stored-overall (var-get overall-supply))
        (stored-launch (var-get launch-height))
      )

    (and
      ;; weighted supply must equal sum(tier_supply * tier_weight)
      (is-eq computed-weighted stored-weighted)

      ;; overall-supply must equal sum(supplies[tier]) across 1..20
      (is-eq stored-overall (fold compute-tier-supply tiers u0))

      ;; launch-height cannot decrease or reset
      (or (is-eq stored-launch u0) (<= stored-launch burn-block-height))
    )
  )
)

(define-private (compute-tier-weighted (tier uint) (acc uint))
  (let (
        (supply (default-to u0 (map-get? supplies tier)))
        (weight (default-to u1 (map-get? tier-weights tier)))
      )
    (+ acc (* supply weight))
  )
)

(define-private (compute-tier-supply (tier uint) (acc uint))
  (+ acc (default-to u0 (map-get? supplies tier)))
)

;; Property-based tests
;; fails for -872923360
(define-public (test-mint-increases-user-total-rep
      (user principal)
      (token-id uint)
      (amount uint))
  (let (
        ;; Pre-state
        (before (default-to u0 (map-get? user-total-rep { who: user })))
        (weight (default-to u1 (map-get? tier-weights token-id)))
      )

    ;; Preconditions for fuzz inputs
    (asserts! (> amount u0) (ok false))
    (asserts! (> token-id u0) (ok false))
    (asserts! (<= token-id max-tier) (ok false))

    ;; Run mint-core (no DAO check)
    (let ((result (mint-core user token-id amount)))
      (asserts! (is-ok result) (err u450))

      ;; Post-state
      (let ((after (default-to u0 (map-get? user-total-rep { who: user }))))
        (asserts!
          (is-eq after (+ before (* amount weight)))
          (err u499))
      )

      (ok true)
    )
  )
)

(define-public (test-burn-decreases-user-total-rep
      (user principal)
      (token-id uint)
      (amount uint))
  (let (
        (weight (default-to u1 (map-get? tier-weights token-id)))
        (weighted-amount (* amount weight))
        (before (default-to u0 (map-get? user-total-rep { who: user })))
      )

    ;; Preconditions
    (asserts! (> amount u0) (ok false))
    (asserts! (> token-id u0) (ok false))
    (asserts! (<= token-id max-tier) (ok false))
    ;; user must have enough rep (otherwise burn-core fails)
    (asserts! (>= before (* amount weight)) (ok false))

    ;; Run burn
    (let ((result (burn-core user token-id amount)))
      (asserts! (is-ok result) (ok false))

      (let ((after (default-to u0 (map-get? user-total-rep { who: user }))))
        ;; subtract amount*weight, but clamp at 0 just like code
        (asserts!
          (is-eq
             after
             (if (> before weighted-amount)
                 (- before weighted-amount)
                 u0))
          (err u599))
      )
      (ok true)
    )
  )
)

(define-public (test-transfer-updates-user-total-rep
      (sender principal)
      (recipient principal)
      (token-id uint)
      (amount uint))
  (let (
        (weight (default-to u1 (map-get? tier-weights token-id)))
        (weighted-amount (* amount weight))
        ;; Pre-state
        (sender-rep-before (default-to u0 (map-get? user-total-rep { who: sender })))
        (recipient-rep-before (default-to u0 (map-get? user-total-rep { who: recipient })))
        (sender-bal (default-to u0 (map-get? balances { token-id: token-id, owner: sender })))
      )

    ;; Preconditions
    (asserts! (> amount u0) (ok false))
    (asserts! (> token-id u0) (ok false))
    (asserts! (<= token-id max-tier) (ok false))
    (asserts! (not (is-eq sender recipient)) (ok false))
    ;; sender must have enough fungible tokens to transfer
    (asserts! (>= sender-bal amount) (ok false))
    ;; sender must also have enough rep
    (asserts! (>= sender-rep-before weighted-amount) (ok false))

    ;; Execute transfer-core
    (let ((result (transfer-core token-id amount sender recipient)))
      (asserts! (is-ok result) (err u650))

      ;; Post-state
      (let (
            (sender-rep-after (default-to u0 (map-get? user-total-rep { who: sender })))
            (recipient-rep-after (default-to u0 (map-get? user-total-rep { who: recipient })))
           )

        ;; Sender rep decreases
        (asserts!
           (is-eq
             sender-rep-after
             (if (> sender-rep-before weighted-amount)
                 (- sender-rep-before weighted-amount)
                 u0))
           (err u698))

        ;; Recipient rep increases
        (asserts!
           (is-eq
             recipient-rep-after
             (+ recipient-rep-before weighted-amount))
           (err u699))
      )
      (ok true)
    )
  )
)

(define-read-only (rep-of (user principal))
  (default-to u0 (map-get? user-total-rep { who: user }))
)

(define-read-only (bal-of (token-id uint) (user principal))
  (default-to u0 (map-get? balances { token-id: token-id, owner: user }))
)

(define-read-only (tier-weight-of (token-id uint))
  (default-to u1 (map-get? tier-weights token-id))
)

(define-read-only (safe-supply-of (token-id uint))
  (default-to u0 (map-get? supplies token-id))
)

(define-public (test-mint-increases-rep
      (user principal)
      (token-id uint)
      (amount uint))
  (let (
        (before-rep (rep-of user))
        (weight (tier-weight-of token-id))
      )

    ;; Preconditions reject fuzz garbage
    (asserts! (> amount u0) (ok false))
    (asserts! (> token-id u0) (ok false))
    (asserts! (<= token-id max-tier) (ok false))

    ;; Exercise code
    (let ((result (mint-core user token-id amount)))
      (asserts! (is-ok result) (err u1050))

      ;; Expected
      (let (
            (after-rep (rep-of user))
            (expected (+ before-rep (* amount weight)))
           )
        (asserts! (is-eq after-rep expected) (err u1099))
      )

      (ok true)
    )
  )
)

(define-public (test-mint-increases-weighted-supply
      (user principal)
      (token-id uint)
      (amount uint))
  (let (
        (before (var-get weighted-supply))
        (weight (tier-weight-of token-id))
        (delta (* amount weight))
      )

    ;; Preconditions
    (asserts! (> token-id u0) (ok false))
    (asserts! (<= token-id max-tier) (ok false))
    (asserts! (> amount u0) (ok false))

    (let ((result (mint-core user token-id amount)))
      (asserts! (is-ok result) (err u1150))

      (let ((after (var-get weighted-supply)))
        (asserts! (is-eq after (+ before delta)) (err u1199))
      )
      (ok true)
    )
  )
)

(define-public (test-mint-increases-balance
      (user principal)
      (token-id uint)
      (amount uint))
  (let (
        (before (bal-of token-id user))
      )

    ;; Preconditions
    (asserts! (> amount u0) (ok false))
    (asserts! (> token-id u0) (ok false))
    (asserts! (<= token-id max-tier) (ok false))

    (let ((result (mint-core user token-id amount)))
      (asserts! (is-ok result) (err u1250))

      (let ((after (bal-of token-id user)))
        (asserts! (is-eq after (+ before amount)) (err u1299))
      )
      (ok true)
    )
  )
)

(define-public (test-burn-decreases-rep
      (user principal)
      (token-id uint)
      (amount uint))
  (let (
        (weight (tier-weight-of token-id))
        (weighted (* amount weight))
        (before (rep-of user))
      )

    ;; Preconditions
    (asserts! (> amount u0) (ok false))
    (asserts! (> token-id u0) (ok false))
    (asserts! (<= token-id max-tier) (ok false))
    ;; must have enough rep
    (asserts! (>= before weighted) (ok false))
    (asserts! (> (bal-of token-id user) amount) (ok false))

    (let ((result (burn-core user token-id amount)))
      (asserts! (is-ok result) (ok false))

      (let ((after (rep-of user)))
        (asserts!
           (is-eq after (- before weighted))
           (err u1399))
      )
      (ok true)
    )
  )
)

(define-public (test-burn-decreases-balance
      (user principal)
      (token-id uint)
      (amount uint))
  (let (
        (before (bal-of token-id user))
      )

    ;; Preconditions
    (asserts! (> amount u0) (ok false))
    (asserts! (> token-id u0) (ok false))
    (asserts! (<= token-id max-tier) (ok false))
    (asserts! (>= before amount) (ok false))
    (asserts! (>= (bal-of token-id user) amount) (ok false))

    (let ((result (burn-core user token-id amount)))
      (asserts! (is-ok result) (ok false))

      (let ((after (bal-of token-id user)))
        (asserts! (is-eq after (- before amount)) (err u1499))
      )
      (ok true)
    )
  )
)
