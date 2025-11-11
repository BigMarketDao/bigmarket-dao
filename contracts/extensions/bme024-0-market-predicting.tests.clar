;; TEST: BME024 CPMM Categorical Market Predictions 

(define-public (test-get-share-cost
    (categories (list 10 (string-ascii 64))) 
  )
  (let
    (
      (seed u200)
      (user-stake-list (list seed seed seed seed seed seed seed seed seed seed))
      (num-categories (len categories))
      (share-list (zero-after-n user-stake-list num-categories))
      (market-data-hash 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43)
      (treasury 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5.bme006-0-treasury)
      (token 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5.wrapped-stx)
   )
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
    (if (or (< num-categories u2) (> num-categories u10)) (ok false)
    (let
      (
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


(define-public (test-get-share-cost
    (categories (list 10 (string-ascii 64)))
  )
  (let
    (
      (seed u200)
      (user-stake-list (list seed seed seed seed seed seed seed seed seed seed))
      (num-categories (len categories))
      (share-list (zero-after-n user-stake-list num-categories))
      (market-data-hash 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43)
      (treasury 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5.bme006-0-treasury)
      (token 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5.wrapped-stx)
   )
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
    (if (or (< num-categories u2) (> num-categories u10)) (ok false)
    (let
      (
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
