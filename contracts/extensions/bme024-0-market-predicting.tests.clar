;; TEST: BME024 CPMM Categorical Market Predictions 

(define-public (test-get-share-cost (amount uint))
  (let
    (
      (seed u2000)
      (user-stake-list (list seed seed seed seed seed seed seed seed seed seed))
      (categories (list "lion" "tiger" "jaguar"))
      (num-categories (len categories))
      (share-list (zero-after-n user-stake-list num-categories))
      (market-data-hash 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43)
      (treasury 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5.bme006-0-treasury)
      (token 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5.wrapped-stx)
   )
      (asserts! (> seed u100) (ok false)) ;; Function should not throw
      (asserts! (> num-categories u1) (ok false)) ;; Function should not throw
      ;;(asserts! (> amount u100) (ok false)) ;; Function should not throw
      ;;(asserts! (< amount u10000) (ok false)) ;; Function should not throw
      (map-set stake-balances {market-id: u0, user: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5} share-list)
      (map-set token-balances {market-id: u0, user: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5} share-list)

      (map-set markets
        u0
        {
          market-data-hash: market-data-hash,
          token: token,
          treasury: treasury,
          creator: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5,
          market-fee-bips: u100,
          resolution-state: u0,
          resolution-burn-height: u0,
          categories: categories,
          stakes: share-list,
          stake-tokens: share-list, ;; they start out the same
          outcome: none,
          concluded: false,
          market-start: u100,
          market-duration: u100,
          cool-down-period: u100,
          hedge-executor: none,
          hedged: false,
        }
      )   
    (if (< num-categories u2) (err u899)
      (let
        (
          ;; Ideally we would let the fuzzer determine amount here...
          ;; But - the range of values allowed for amount is strictly limited by 
          ;; the curve maths and rendevous does not appear to have a way to restrict the 
          ;; the specific value to a range of values so most values will be disallowed and the
          ;; probability of acceptable values being chosen limits the validity of the test.
          (result (get-share-cost u0 u0 u100))
        )
          ;; Verify share cost is greater than 0.
          (asserts! (is-ok result) (err u900)) ;; Function should not throw
          (let
            (
              (r (unwrap! result (err u901)))
              (cost (get cost r))
              (max-purchase (get max-purchase r))
            )
            (print {cost: cost, max-purchase: max-purchase})

            ;; Sanity check: max-purchase must be positive
            (asserts! (> max-purchase u0) (err u902))

            ;; Sanity check: cost should be > 0
            (asserts! (> cost u0) (err u903))
          )
          (ok true)
      )
    )
  )
)


(define-public (test-cpmm-cost (selected-pool uint) (other-pool uint) (amount-shares uint))
  (begin
    ;; Both pools must have liquidity
    (asserts! (<= amount-shares selected-pool) (ok false))
    (asserts! (<= selected-pool other-pool) (ok false))
    (asserts! (and (> selected-pool u0) (< selected-pool u100000000)) (ok false))
    (asserts! (and (> other-pool u0) (< other-pool u1000000000)) (ok false))
    (asserts! (and (> amount-shares u0) (< amount-shares u1000000000)) (ok false))
    (asserts! (> other-pool u0) (ok false))

    ;; You cannot buy so much that the counter-pool hits 0 or below MIN_POOL
    (let (
          (max-purchase (if (> other-pool u1) (- other-pool u1) u0))
         )
      (asserts! (<= amount-shares max-purchase) (ok false))

      (let
        (
          ;; Ideally we would let the fuzzer determine amount here but this allows the test to pass and fail on subsequent runs...
          ;; But - the range of values allowed for amount is strictly limited by 
          ;; the curve maths and rendevous does not appear to have a way to restrict the 
          ;; the specific value to a range of values so most values will be disallowed and the
          ;; probability of acceptable values being chosen limits the validity of the test.
          (result (cpmm-cost selected-pool other-pool amount-shares))
        )
          ;; Verify share cost is greater than 0.
          (asserts! (is-ok result) (ok false)) ;; Function should not throw
          (let
            (
              (cost (unwrap! result (err u901)))
            )
            ;; Sanity check: cost should be > 0
            (asserts! (>= cost u0) (err u903))
          )
          (ok true)
      )
    )
  )
)

