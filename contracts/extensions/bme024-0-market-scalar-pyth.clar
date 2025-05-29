;; Title: BME024 CPMM  Scalar Market Predictions
;; Synopsis:
;; Implements CPMM scalar prediciton markets with pyth oracle resolution.
;; Description:
;; Scalar markets differ from binary/categorical markets (see bme024-0-market-predicting)
;; in the type of categories and the mechanism for resolution:
;; Firstly, the categories are contiguous ranges of numbers with a min and max value. The winning
;; category is decided by the range that the outcome selects. Secondly, scalar market outcomes
;; are determined by on-chain oracles. 
;; This contract uses the Pyth oracle for selecting from possible outcomes.

(use-trait ft-token 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(impl-trait .prediction-market-trait.prediction-market-trait)

;; ---------------- CONSTANTS & TYPES ----------------
;; Market Types (2 => range based markets)
(define-constant MARKET_TYPE u2)

;; TODO Update resolve-market to reference correct pyth contract and remove local pyth from deployment
;; PYTH_ORACLE 'ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.pyth-storage-v3
;; PYTH_ORACLE 'SP3R4F6C1J3JQWWCVZ3S7FRRYPMYG6ZW6RZK31FXY.pyth-storage-v3

(define-constant DEFAULT_MARKET_DURATION u144) ;; ~1 day in Bitcoin blocks
(define-constant DEFAULT_COOL_DOWN_PERIOD u144) ;; ~1 day in Bitcoin blocks

(define-constant RESOLUTION_OPEN u0)
(define-constant RESOLUTION_RESOLVING u1)
(define-constant RESOLUTION_DISPUTED u2)
(define-constant RESOLUTION_RESOLVED u3)

(define-constant err-unauthorised (err u10000))
(define-constant err-invalid-market-type (err u10001))
(define-constant err-amount-too-low (err u10002))
(define-constant err-wrong-market-type (err u10003))
(define-constant err-already-concluded (err u10004))
(define-constant err-market-not-found (err u10005))
(define-constant err-user-not-winner-or-claimed (err u10006))
(define-constant err-user-not-staked (err u10008))
(define-constant err-market-not-concluded (err u10009))
(define-constant err-insufficient-balance (err u10011))
(define-constant err-insufficient-contract-balance (err u10012))
(define-constant err-user-share-is-zero (err u10013))
(define-constant err-dao-fee-bips-is-zero (err u10014))
(define-constant err-disputer-must-have-stake (err u10015))
(define-constant err-dispute-window-elapsed (err u10016))
(define-constant err-market-not-resolving (err u10017))
(define-constant err-market-not-open (err u10018))
(define-constant err-dispute-window-not-elapsed (err u10019))
(define-constant err-market-wrong-state (err u10020))
(define-constant err-invalid-token (err u10021))
(define-constant err-max-market-fee-bips-exceeded (err u10022))
(define-constant err-category-not-found (err u10023))
(define-constant err-too-few-categories (err u10024))
(define-constant err-element-expected (err u10025))
(define-constant err-winning-stake-not-zero (err u10026))
(define-constant err-losing-stake-is-zero (err u10027))
(define-constant err-amount-too-high (err u10029))
(define-constant err-fee-too-high (err u10030))
(define-constant err-slippage-too-high (err u10031))
(define-constant err-seed-amount-not-divisible (err u10032))
(define-constant err-overbuy (err u10034))
(define-constant err-token-not-configured (err u10035))
(define-constant err-seed-too-small (err u10036))

(define-constant marketplace .bme040-0-shares-marketplace)

(define-data-var market-counter uint u0)
(define-data-var dispute-window-length uint u144)
(define-data-var dev-fee-bips uint u200)
(define-data-var dao-fee-bips uint u200)
(define-data-var market-fee-bips-max uint u1000)
(define-data-var dev-fund principal tx-sender)
(define-data-var resolution-agent principal tx-sender)
(define-data-var dao-treasury principal tx-sender)
(define-data-var creation-gated bool true)
(define-data-var resolution-timeout uint u1000) ;; 1000 blocks (~9 days)

;; Data structure for each Market
;; outcome: winning category
(define-map markets
  uint
  {
		market-data-hash: (buff 32),
    token: principal, 
    treasury: principal,
    creator: principal,
    market-fee-bips: uint,
    resolution-state: uint, ;; "open", "resolving", "disputed", "concluded"
    categories: (list 10 {min: uint, max: uint}), ;; Min (inclusive) and Max (exclusive)
    stakes: (list 10 uint), ;; Total staked per category - shares
    stake-tokens: (list 10 uint), ;; Total staked per category - tokens
    outcome: (optional uint),
    concluded: bool,
    market-start: uint,
    market-duration: uint,
    cool-down-period: uint,
    price-feed-id: (buff 32), ;; Pyth price feed ID
    price-outcome: (optional uint)
  }
)
;; defines the minimum liquidity a market creator needs to provide
(define-map token-minimum-seed {token: principal} uint)

;; tracks the amount of shares the user owns per market / category
(define-map stake-balances
  { market-id: uint, user: principal }
  (list 10 uint)
)
;; tracks the cost of shares to the user per market / category
(define-map token-balances
  { market-id: uint, user: principal }
  (list 10 uint)
)
(define-map allowed-tokens principal bool)

;; ---------------- access control ----------------
(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .bigmarket-dao) (contract-call? .bigmarket-dao is-extension contract-caller)) err-unauthorised))
)

;; ---------------- getters / setters ----------------
(define-public (set-allowed-token (token principal) (enabled bool))
	(begin
		(try! (is-dao-or-extension))
		(print {event: "allowed-token", token: token, enabled: enabled})
		(ok (map-set allowed-tokens token enabled))
	)
)
(define-read-only (is-allowed-token (token principal))
	(default-to false (map-get? allowed-tokens token))
)

(define-public (set-dispute-window-length (length uint))
  (begin
    (try! (is-dao-or-extension))
    (var-set dispute-window-length length)
    (ok true)
  )
)

(define-public (set-creation-gated (gated bool))
  (begin
    (try! (is-dao-or-extension))
    (var-set creation-gated gated)
    (ok true)
  )
)

(define-public (set-resolution-agent (new-agent principal))
  (begin
    (try! (is-dao-or-extension))
    (var-set resolution-agent new-agent)
    (ok true)
  )
)

(define-public (set-dev-fee-bips (new-fee uint))
  (begin
		(asserts! (<= new-fee u1000) err-max-market-fee-bips-exceeded)
    (try! (is-dao-or-extension))
    (var-set dev-fee-bips new-fee)
    (ok true)
  )
)

(define-public (set-dao-fee-bips (new-fee uint))
  (begin
		(asserts! (<= new-fee u1000) err-max-market-fee-bips-exceeded)
    (try! (is-dao-or-extension))
    (var-set dao-fee-bips new-fee)
    (ok true)
  )
)

(define-public (set-market-fee-bips-max (new-fee uint))
  (begin
		(asserts! (<= new-fee u1000) err-max-market-fee-bips-exceeded)
    (try! (is-dao-or-extension))
    (var-set market-fee-bips-max new-fee)
    (ok true)
  )
)

(define-public (set-token-minimum-seed (token principal) (min uint))
  (begin
    (try! (is-dao-or-extension))
    (map-set token-minimum-seed {token: token} min)
    (ok true)
  )
)

(define-public (set-dev-fund (new-dev-fund principal))
  (begin
    (try! (is-dao-or-extension))
    (var-set dev-fund new-dev-fund)
    (ok true)
  )
)

(define-public (set-dao-treasury (new-dao-treasury principal))
  (begin
    (try! (is-dao-or-extension))
    (var-set dao-treasury new-dao-treasury)
    (ok true)
  )
)

(define-read-only (get-market-data (market-id uint))
	(map-get? markets market-id)
)

(define-read-only (get-stake-balances (market-id uint) (user principal))
  (ok (default-to (list u0 u0 u0 u0 u0 u0 u0 u0 u0 u0) (map-get? stake-balances {market-id: market-id, user: user})))
)

(define-read-only (get-token-balances (market-id uint) (user principal))
  (ok (default-to (list u0 u0 u0 u0 u0 u0 u0 u0 u0 u0) (map-get? token-balances {market-id: market-id, user: user})))
)

;; ---------------- public functions ----------------

(define-public (create-market 
  (categories (list 10 {min: uint, max: uint})) 
  (fee-bips (optional uint)) 
  (token <ft-token>) 
  (market-data-hash (buff 32)) 
  (proof (list 10 (tuple (position bool) (hash (buff 32))))) 
  (treasury principal) 
  (market-duration (optional uint)) 
  (cool-down-period (optional uint))
  (price-feed-id (buff 32))
  (seed-amount uint))
    (let (
        (sender tx-sender)
        (new-id (var-get market-counter))
        (market-fee-bips (default-to u0 fee-bips))
        (market-duration-final (default-to DEFAULT_MARKET_DURATION market-duration))
        (cool-down-final (default-to DEFAULT_COOL_DOWN_PERIOD cool-down-period))
        (current-block burn-block-height)
        (num-categories (len categories))
        ;; NOTE: seed is evenly divided with rounding error discarded
        (seed (/ seed-amount num-categories))
        (user-stake-list (list seed seed seed seed seed seed seed seed seed seed))
        (share-list (zero-after-n user-stake-list num-categories))
      )
      (asserts! (> market-duration-final u10) err-market-not-found)
      (asserts! (> cool-down-final u10) err-market-not-found)

		  (asserts! (> (len categories) u1) err-too-few-categories)
		  (asserts! (<= market-fee-bips (var-get market-fee-bips-max)) err-max-market-fee-bips-exceeded)
      ;; ensure the trading token is allowed 
		  (asserts! (is-allowed-token (contract-of token)) err-invalid-token)

      ;; ensure enough liquidity
      (asserts! (>= seed-amount (unwrap! (map-get? token-minimum-seed {token: (contract-of token)}) err-token-not-configured)) err-seed-too-small)

      ;; Transfer single winning portion of seed to market contract to fund claims
      (try! (contract-call? token transfer seed-amount tx-sender (as-contract tx-sender) none))

      ;; ensure the user is allowed to create if gating by merkle proof is required
      (if (var-get creation-gated) (try! (as-contract (contract-call? .bme022-0-market-gating can-access-by-account sender proof))) true)
      
      ;; dao is assigned the seed liquidity - share and tokens 1:1 at kick off
      (map-set stake-balances {market-id: new-id, user: (var-get dao-treasury)} share-list)
      (map-set token-balances {market-id: new-id, user: (var-get dao-treasury)} share-list)

      (map-set markets
        new-id
        {
          market-data-hash: market-data-hash,
          token: (contract-of token),
          treasury: treasury,
          creator: tx-sender,
          market-fee-bips: market-fee-bips,
          resolution-state: RESOLUTION_OPEN,
          categories: categories,
          stakes: share-list,
          stake-tokens: share-list, ;; they start out the same
          outcome: none,
          concluded: false,
          market-start: current-block,
          market-duration: market-duration-final,
          cool-down-period: cool-down-final,
          price-feed-id: price-feed-id,
          price-outcome: none
        }
      )
      (var-set market-counter (+ new-id u1))
      (try! (contract-call? .bme030-0-reputation-token mint tx-sender u6 u4))
      (print {event: "create-market", market-id: new-id, categories: categories, market-fee-bips: market-fee-bips, token: token, market-data-hash: market-data-hash, creator: tx-sender, seed-amount: seed-amount})
      (ok new-id)
  )
)

;; Read-only: get current price to buy `amount` shares in a category
(define-read-only (get-share-cost (market-id uint) (index uint) (amount-shares uint))
  (let (
    (market-data (unwrap-panic (map-get? markets market-id)))
    (stake-list (get stakes market-data))
    (selected-pool (unwrap-panic (element-at? stake-list index)))
    (total-pool (fold + stake-list u0))
    (other-pool (- total-pool selected-pool))
    (cost (unwrap-panic (cpmm-cost selected-pool other-pool amount-shares)))
    (max-purchase (if (> other-pool u0) (- other-pool u1) u0))
  )
    (ok { cost: cost, max-purchase: max-purchase })
  )
)

;; Helper: compute CPMM cost for buying dy shares
(define-private (cpmm-cost (selected-pool uint) (other-pool uint) (amount-shares uint))
  (if (>= amount-shares other-pool)
    (err err-overbuy) ;; Prevent underflow before subtracting
    (let (
      (new-y (- other-pool amount-shares))
      (new-x (/ (* selected-pool other-pool) new-y))
      (cost (- new-x selected-pool))
    )
      (ok cost)
    )
  )
)

;; Read-only: get current price to buy `amount` shares in a category
(define-read-only (get-max-shares (market-id uint) (index uint) (total-cost uint))
  (let (
    (fee (/ (* total-cost (var-get dev-fee-bips)) u10000))
    (cost-of-shares (- total-cost fee))
    (market-data (unwrap-panic (map-get? markets market-id)))
    (stake-list (get stakes market-data))
    (selected-pool (unwrap-panic (element-at? stake-list index)))
    (total-pool (fold + stake-list u0))
    (other-pool (- total-pool selected-pool))
    (shares (unwrap-panic (cpmm-shares selected-pool other-pool cost-of-shares)))
  )
    (ok { shares: shares, fee: fee, cost-of-shares: cost-of-shares })
  )
)
(define-private (cpmm-shares (selected-pool uint) (other-pool uint) (cost uint))
  (if (is-eq cost u0)
    (ok u0)
    (let (
      (numerator (* selected-pool other-pool))
      (denominator (+ selected-pool cost))
      (new-y (/ numerator denominator))
      (shares (- other-pool new-y))
    )
      (ok shares)
    )
  )
)

;; Predict category with CPMM pricing
(define-public (predict-category (market-id uint) (min-shares uint) (index uint) (token <ft-token>) (max-cost uint))
  (let (
        (md (unwrap! (map-get? markets market-id) err-market-not-found))
        (categories (get categories md))
        (stake-tokens-list (get stake-tokens md))
        (selected-token-pool (unwrap! (element-at? stake-tokens-list index) err-category-not-found))
        (stake-list (get stakes md))
        (selected-pool (unwrap! (element-at? stake-list index) err-category-not-found))
        (total-pool (fold + stake-list u0))
        (other-pool (- total-pool selected-pool))
        (sender-balance (unwrap! (contract-call? token get-balance tx-sender) err-insufficient-balance))
        (fee (/ (* max-cost (var-get dev-fee-bips)) u10000))
        (cost-of-shares (if (> max-cost fee) (- max-cost fee) u0))
        (amount-shares (unwrap! (cpmm-shares selected-pool other-pool cost-of-shares) err-insufficient-balance))
        (max-purchase (if (> other-pool u0) (- other-pool u1) u0))
        (max-cost-of-shares (unwrap! (cpmm-cost selected-pool other-pool max-purchase) err-overbuy))
        (market-end (+ (get market-start md) (get market-duration md)))
  )
    ;; Validate token and market state
    (asserts! (< index (len categories)) err-category-not-found)
    (asserts! (is-eq (get token md) (contract-of token)) err-invalid-token)
    (asserts! (not (get concluded md)) err-market-not-concluded)
    (asserts! (is-eq (get resolution-state md) RESOLUTION_OPEN) err-market-not-open)
    (asserts! (>= max-cost u100) err-amount-too-low)
    (asserts! (>= sender-balance max-cost) err-insufficient-balance)
    (asserts! (<= max-cost u50000000000000) err-amount-too-high)
    (asserts! (< burn-block-height market-end) err-market-not-open)
    ;; ensure the user cannot overpay for shares - this can skew liquidity in other pools
    (asserts! (<= cost-of-shares max-cost-of-shares) err-overbuy)
    (asserts! (< amount-shares other-pool) err-overbuy)
    (asserts! (>= amount-shares min-shares) err-slippage-too-high)
    
    ;; --- Token Transfers ---
    (try! (contract-call? token transfer cost-of-shares tx-sender (as-contract tx-sender) none))
    (if (> fee u0)
      (try! (contract-call? token transfer fee tx-sender (var-get dev-fund) none))
      true
    )

    ;; --- Update Market State ---
    (let (
      (updated-stakes (unwrap! (replace-at? stake-list index (+ selected-pool amount-shares)) err-category-not-found))
      (updated-token-stakes (unwrap! (replace-at? stake-tokens-list index (+ selected-token-pool cost-of-shares)) err-category-not-found))
    )
      (map-set markets market-id (merge md {stakes: updated-stakes, stake-tokens: updated-token-stakes}))
    )

    ;; --- Update User Balances ---
    (let (
      (current-token-balances (default-to (list u0 u0 u0 u0 u0 u0 u0 u0 u0 u0) (map-get? token-balances {market-id: market-id, user: tx-sender})))
      (token-current (unwrap! (element-at? current-token-balances index) err-category-not-found))
      (user-token-updated (unwrap! (replace-at? current-token-balances index (+ token-current cost-of-shares)) err-category-not-found))

      (current-stake-balances (default-to (list u0 u0 u0 u0 u0 u0 u0 u0 u0 u0) (map-get? stake-balances {market-id: market-id, user: tx-sender})))
      (user-current (unwrap! (element-at? current-stake-balances index) err-category-not-found))
      (user-stake-updated (unwrap! (replace-at? current-stake-balances index (+ user-current amount-shares)) err-category-not-found))
    )
      (map-set stake-balances {market-id: market-id, user: tx-sender} user-stake-updated)
      (map-set token-balances {market-id: market-id, user: tx-sender} user-token-updated)
      (try! (contract-call? .bme030-0-reputation-token mint tx-sender u4 u3))
      (print {event: "market-stake", market-id: market-id, index: index, amount: amount-shares, cost: cost-of-shares, fee: fee, voter: tx-sender, max-cost: max-cost})
      (ok index)
    )
  )
)

;; Resolve a market invoked by ai-agent.
(define-public (resolve-market (market-id uint))
  (let (
      (md (unwrap! (map-get? markets market-id) err-market-not-found))
      (market-end (+ (get market-start md) (get market-duration md)))
      (resolution-burn-block (+ market-end (get cool-down-period md)))
      (price-feed-id (get price-feed-id md))
      (current-block-height burn-block-height)
      (price-data (unwrap! (contract-call? .pyth-oracle-v3 read-price-feed price-feed-id .pyth-storage-v3) err-category-not-found))
      (parsed-price (to-uint (get price price-data)))
      (categories (get categories md))
      (first-category (unwrap! (element-at? categories u0) err-category-not-found))
      (winning-category-index
        (get winning-index
          (fold select-winner-pyth categories
            {current-index: u0, winning-index: none, price: parsed-price}
          )
        )
      )
      (final-index
        (if (is-some winning-category-index)
            winning-category-index
            (if (< parsed-price (get min first-category))
                (some u0)  ;; If price < first category min, assign first category
                (some (- (len categories) u1))  ;; If price >= last category max, assign last category
            )
        )
      )
    )
    (asserts! (is-eq tx-sender (var-get resolution-agent)) err-unauthorised)
    (asserts! (>= current-block-height resolution-burn-block) err-market-wrong-state)
    (asserts! (is-some final-index) err-category-not-found) ;; Ensure category was assigned

      ;; Store the result
    (map-set markets market-id
      (merge md
        { outcome: final-index, price-outcome: (some parsed-price), resolution-state: RESOLUTION_RESOLVING }
      )
    )
    (print {event: "resolve-market", market-id: market-id, outcome: final-index, resolver: tx-sender, price: parsed-price})
    (ok final-index)
  )
)

(define-private (select-winner-pyth 
      (category (tuple (min uint) (max uint)))
      (acc {current-index: uint, winning-index: (optional uint), price: uint}))
  (let (
      (price (get price acc))
      (min-price (get min category))
      (max-price (get max category))
      (current-index (get current-index acc))
    )
    ;; Check if the price falls within this category's range
    (if (and (>= price min-price) (< price max-price) (is-none (get winning-index acc)))
        {current-index: (+ current-index u1), winning-index: (some current-index), price: price}
        {current-index: (+ current-index u1), winning-index: (get winning-index acc), price: price}
    )
  )
)

(define-public (resolve-market-undisputed (market-id uint))
  (let (
      (md (unwrap! (map-get? markets market-id) err-market-not-found))
      (market-end (+ (get market-start md) (get market-duration md)))
      (resolution-burn-block (+ market-end (get cool-down-period md))) ;; Market resolution block

    )
    (asserts! (> burn-block-height (+ resolution-burn-block (var-get dispute-window-length))) err-dispute-window-not-elapsed)
    (asserts! (is-eq (get resolution-state md) RESOLUTION_RESOLVING) err-market-not-open)

    (map-set markets market-id
      (merge md
        { concluded: true, resolution-state: RESOLUTION_RESOLVED }
      )
    )
    (print {event: "resolve-market-undisputed", market-id: market-id, resolution-burn-height: burn-block-height, resolution-state: RESOLUTION_RESOLVED})
    (ok true)
  )
)

;; concludes a market that has been disputed. This method has to be called at least
;; dispute-window-length blocks after the dispute was raised - the voting window.
;; a proposal with 0 votes will close the market with the outcome false
(define-public (resolve-market-vote (market-id uint) (outcome uint))
  (let (
        (md (unwrap! (map-get? markets market-id) err-market-not-found))
    )
    (try! (is-dao-or-extension))
    (asserts! (< outcome (len (get categories md))) err-market-not-found)
    (asserts! (or (is-eq (get resolution-state md) RESOLUTION_DISPUTED) (is-eq (get resolution-state md) RESOLUTION_RESOLVING)) err-market-wrong-state)

    (map-set markets market-id
      (merge md
        { concluded: true, outcome: (some outcome), resolution-state: RESOLUTION_RESOLVED }
      )
    )
    (print {event: "resolve-market-vote", market-id: market-id, resolver: contract-caller, outcome: outcome, resolution-state: RESOLUTION_RESOLVED})
    (ok true)
  )
)

;; Allows a user with a stake in market to contest the resolution
;; the call is made via the voting contract 'create-market-vote' function
(define-public (dispute-resolution (market-id uint) (disputer principal) (num-categories uint))
  (let (
      (md (unwrap! (map-get? markets market-id) err-market-not-found)) 
      (stake-data (unwrap! (map-get? stake-balances { market-id: market-id, user: disputer }) err-disputer-must-have-stake)) 
      (market-end (+ (get market-start md) (get market-duration md)))
      (resolution-burn-block (+ market-end (get cool-down-period md))) ;; Market resolution block
    )
    ;; user call create-market-vote in the voting contract to start a dispute
    (try! (is-dao-or-extension))

    (asserts! (is-eq num-categories (len (get categories md))) err-too-few-categories)
    ;; prevent market getting locked in unresolved state
    (asserts! (<= burn-block-height (+ resolution-burn-block (var-get dispute-window-length))) err-dispute-window-elapsed)

    (asserts! (is-eq (get resolution-state md) RESOLUTION_RESOLVING) err-market-not-resolving) 

    (map-set markets market-id
      (merge md { resolution-state: RESOLUTION_DISPUTED }))
    (print {event: "dispute-resolution", market-id: market-id, disputer: disputer, resolution-state: RESOLUTION_DISPUTED})
    (ok true)
  )
)
(define-public (force-resolve-market (market-id uint))
  (let (
    (md (unwrap! (map-get? markets market-id) err-market-not-found))
    (market-end (+ (get market-start md) (get market-duration md)))
    (resolution-burn-block (+ market-end (get cool-down-period md))) ;; Market resolution block
    (elapsed (- burn-block-height resolution-burn-block))
  )
  (begin
    (asserts! (> elapsed (var-get resolution-timeout)) err-market-wrong-state)
    (asserts! (is-eq (get resolution-state md) RESOLUTION_DISPUTED) err-market-wrong-state)

    (map-set markets market-id
      (merge md { resolution-state: RESOLUTION_RESOLVED, concluded: true })
    )
    (print {event: "force-resolve", market-id: market-id, resolution-state: RESOLUTION_RESOLVED})
    (ok true)
  ))
)

;; Proportional payout with market fee only
(define-public (claim-winnings (market-id uint) (token <ft-token>))
  (let (
    (md (unwrap! (map-get? markets market-id) err-market-not-found))
    (index-won (unwrap! (get outcome md) err-market-not-concluded))
    (marketfee-bips (get market-fee-bips md))
    (treasury (get treasury md))
    (original-sender tx-sender)

    (user-stake-list (unwrap! (map-get? stake-balances {market-id: market-id, user: tx-sender}) err-user-not-staked))
    (user-shares (unwrap! (element-at? user-stake-list index-won) err-user-not-staked))
    (stake-list (get stakes md))
    (winning-pool (unwrap! (element-at? stake-list index-won) err-market-not-concluded))
    (total-share-pool (fold + stake-list u0))

    (staked-tokens (get stake-tokens md))
    (total-token-pool (fold + staked-tokens u0))

    ;; CPMM Payout: the proportion of the total tokens staked to the shares won
    (gross-refund (if (> winning-pool u0) (/ (* user-shares total-token-pool) winning-pool) u0))

    (marketfee (/ (* gross-refund marketfee-bips) u10000))
    (net-refund (- gross-refund marketfee))
  )
    ;; Check resolved and non zero payout
    (asserts! (is-eq (get resolution-state md) RESOLUTION_RESOLVED) err-market-not-concluded)
    (asserts! (get concluded md) err-market-not-concluded)
    (asserts! (> user-shares u0) err-user-not-winner-or-claimed)
    (asserts! (> winning-pool u0) err-amount-too-low)
    (asserts! (> net-refund u0) err-user-share-is-zero)

    ;; Transfer winnings and market fee
    (as-contract
      (begin
        (if (> marketfee u0)
            (try! (contract-call? token transfer marketfee tx-sender treasury none))
          true
        )
        (try! (contract-call? token transfer net-refund tx-sender original-sender none))
      )
    )

    ;; Zero out stake
    (map-set token-balances {market-id: market-id, user: tx-sender} (list u0 u0 u0 u0 u0 u0 u0 u0 u0 u0))
    (map-set stake-balances {market-id: market-id, user: tx-sender} (list u0 u0 u0 u0 u0 u0 u0 u0 u0 u0))
    (try! (contract-call? .bme030-0-reputation-token mint tx-sender u6 u2))
    (print {event: "claim-winnings", market-id: market-id, index-won: index-won, claimer: tx-sender, user-stake: user-shares, refund: net-refund, net: net-refund, marketfee: marketfee, winning-pool: winning-pool, total-pool: total-share-pool})
    (ok net-refund)
  )
)

(define-read-only (get-expected-payout (market-id uint) (index uint) (user principal))
  (let (
    (md (unwrap-panic (map-get? markets market-id)))
    (stake-list (get stakes md))
    (stake-tokens-list (get stake-tokens md))
    (user-stake-list (unwrap-panic (map-get? stake-balances {market-id: market-id, user: user})))
    (user-shares (unwrap-panic (element-at? user-stake-list index)))
    (winning-pool (unwrap-panic (element-at? stake-list index)))
    (token-pool (fold + stake-tokens-list u0))
    (marketfee-bips (get market-fee-bips md))
    (gross-refund (if (> winning-pool u0) (/ (* user-shares token-pool) winning-pool) u0))
    (marketfee (/ (* gross-refund marketfee-bips) u10000))
    (net-refund (- gross-refund marketfee))
  )
    (if (and (> user-shares u0) (> winning-pool u0) (> net-refund u0))
      (ok { net-refund: net-refund, marketfee: marketfee-bips })
      (err u1) ;; not eligible or payout = 0
    )
  )
)

;; marketplace transfer function to move shares - dao extension callable
;; note - an automated dao function that fulfils orders functions as a 'sell-shares' feature
(define-public (transfer-shares 
  (market-id uint)
  (outcome uint)
  (seller principal)
  (buyer principal)
  (amount uint)
  (token <ft-token>)
)
  (let (
    (md (unwrap! (map-get? markets market-id) err-market-not-found))
    (stake-list (get stakes md))
    (market-token (get token md))
    (selected-pool (unwrap! (element-at? stake-list outcome) err-category-not-found))
    (other-pools (- (fold + stake-list u0) selected-pool))

    ;; Pricing
    (price (unwrap! (cpmm-cost selected-pool other-pools amount) err-overbuy))
    (marketfee-bips (get market-fee-bips md))
    (treasury (get treasury md))
    (fee (/ (* price marketfee-bips) u10000))
    (net-price (- price fee))
    (reduced-fee (/ fee u2))

    ;; Share balances
    (seller-balances (unwrap! (map-get? stake-balances {market-id: market-id, user: seller}) err-user-not-staked))
    (seller-shares (unwrap! (element-at? seller-balances outcome) err-user-not-staked))
    (buyer-balances (default-to (list u0 u0 u0 u0 u0 u0 u0 u0 u0 u0) (map-get? stake-balances {market-id: market-id, user: buyer})))
    (buyer-shares (unwrap! (element-at? buyer-balances outcome) err-category-not-found))
  )
    ;; dao extension callable only
    (try! (is-dao-or-extension))
    ;; Ensure seller has enough shares
    (asserts! (>= seller-shares amount) err-user-share-is-zero)
    (asserts! (is-eq market-token (contract-of token)) err-invalid-token)
    (asserts! (is-eq (get resolution-state md) RESOLUTION_OPEN) err-market-wrong-state)

    ;; Perform share transfer
    ;; Note: we do not update `stakes` here because total pool liquidity remains unchanged.
    (let (
        (buyer-updated (unwrap! (replace-at? buyer-balances outcome (+ buyer-shares amount)) err-category-not-found))
        (seller-updated (unwrap! (replace-at? seller-balances outcome (- seller-shares amount)) err-category-not-found))
      )
      ;; Update state
      (map-set stake-balances {market-id: market-id, user: buyer} buyer-updated)
      (map-set stake-balances {market-id: market-id, user: seller} seller-updated)

      ;; Transfer cost and fee from buyer to seller
      (begin
        (if (> reduced-fee u0)
          ;; buyer pays reduced fee as p2p incentive
          (try! (contract-call? token transfer reduced-fee buyer treasury none))
          true
        )
        (try! (contract-call? token transfer net-price buyer seller none))
      )
      (try! (contract-call? .bme030-0-reputation-token mint buyer u4 u3))
      (try! (contract-call? .bme030-0-reputation-token mint seller u4 u3))
      (print {event: "transfer-shares", market-id: market-id, outcome: outcome, buyer: buyer, seller: seller, amount: amount, price: net-price, fee: fee })
      (ok price)
    )
  )
)

;; Helper function to create a list with zeros after index N
(define-private (zero-after-n (original-list (list 10 uint)) (n uint))
  (let (
    (element-0 (if (<= u0 n) (unwrap-panic (element-at? original-list u0)) u0))
    (element-1 (if (< u1 n) (unwrap-panic (element-at? original-list u1)) u0))
    (element-2 (if (< u2 n) (unwrap-panic (element-at? original-list u2)) u0))
    (element-3 (if (< u3 n) (unwrap-panic (element-at? original-list u3)) u0))
    (element-4 (if (< u4 n) (unwrap-panic (element-at? original-list u4)) u0))
    (element-5 (if (< u5 n) (unwrap-panic (element-at? original-list u5)) u0))
    (element-6 (if (< u6 n) (unwrap-panic (element-at? original-list u6)) u0))
    (element-7 (if (< u7 n) (unwrap-panic (element-at? original-list u7)) u0))
    (element-8 (if (< u8 n) (unwrap-panic (element-at? original-list u8)) u0))
    (element-9 (if (< u9 n) (unwrap-panic (element-at? original-list u9)) u0))
  )
    (list element-0 element-1 element-2 element-3 element-4 element-5 element-6 element-7 element-8 element-9)
  )
)
