;; Title: BME023-3 Market scalar predictions
;; Synopsis:
;; Implements scalar prediciton markets with pyth oracle resolution.
;; Description:
;; Scalar markets differ from binary/categorical markets (see bme023-0-market-predicting)
;; in the type of categories and the mechanism for rsolution:
;; Firstly, the categories are contiguous ranges of numbers with a min and max value. The winning
;; category is decided by the range that the outcome selects. Secondly, scalar market outcomes
;; are determined by on-chain oracles. 
;; This contract uses the Pyth oracle for selecting from possible outcomes.

(use-trait ft-token 'SP2AKWJYC7BNY18W1XXKPGP0YVEK63QJG4793Z2D4.sip-010-trait-ft-standard.sip-010-trait)
(impl-trait .prediction-market-trait.prediction-market-trait)

;; ---------------- CONSTANTS & TYPES ----------------
;; Market Types (2 => range based markets)
(define-constant MARKET_TYPE u2)

;; Price Feeds
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
(define-constant err-unknown-stacks-block (err u10028))
(define-constant err-amount-too-high (err u10029))
(define-constant err-fee-too-high (err u10030))

(define-data-var market-counter uint u0)
(define-data-var dispute-window-length uint u144)
(define-data-var dev-fee-bips uint u200)
(define-data-var dao-fee-bips uint u200)
(define-data-var market-fee-bips-max uint u1000)
(define-data-var market-create-fee uint u100000000)
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
    stakes: (list 10 uint), ;; Total staked per category
    outcome: (optional uint),
    concluded: bool,
    market-start: uint,
    market-duration: uint,
    cool-down-period: uint,
    price-feed-id: (buff 32), ;; Pyth price feed ID
    price-outcome: (optional uint)
  }
)

(define-map stake-balances
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

(define-public (set-market-create-fee (new-fee uint))
  (begin
    (try! (is-dao-or-extension))
    (var-set market-create-fee new-fee)
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
	(map-get? stake-balances { market-id: market-id, user: user })
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
  (price-feed-id (buff 32)))
    (let (
        (sender tx-sender)
        (new-id (var-get market-counter))
        (market-fee-bips (default-to u0 fee-bips))
        (market-duration-final (default-to DEFAULT_MARKET_DURATION market-duration))
        (cool-down-final (default-to DEFAULT_COOL_DOWN_PERIOD cool-down-period))
        (current-block burn-block-height)
      )
      (asserts! (> market-duration-final u10) err-market-not-found)
      (asserts! (> cool-down-final u10) err-market-not-found)

		  (asserts! (> (len categories) u1) err-too-few-categories)
		  (asserts! (<= market-fee-bips (var-get market-fee-bips-max)) err-max-market-fee-bips-exceeded)
      ;; ensure the trading token is allowed 
		  (asserts! (is-allowed-token (contract-of token)) err-invalid-token)
      ;; ensure user pays creation fee if required
      (if (and (not (is-eq tx-sender (var-get resolution-agent))) (> (var-get market-create-fee) u0))
        (try! (stx-transfer? (var-get market-create-fee) tx-sender (var-get dao-treasury)))
        true
      )
      ;; ensure the user is allowed to create if gating by merkle proof is required
      (if (var-get creation-gated) (try! (as-contract (contract-call? .bme022-0-market-gating can-access-by-account sender proof))) true)

      ;; all checks pass - insert market data
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
          stakes: (list u0 u0 u0 u0 u0 u0 u0 u0 u0 u0),
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
      (print {event: "create-market", market-id: new-id, categories: categories, market-fee-bips: market-fee-bips, token: token, market-data-hash: market-data-hash, creator: tx-sender})
      (ok new-id)
  )
)
(define-public (predict-category (market-id uint) (amount uint) (index uint) (token <ft-token>))
  (let (
        (amount-less-fee (try! (process-stake-transfer amount token)))
        (md (unwrap! (map-get? markets market-id) err-market-not-found))
        (categories (get categories md))
        (current-stakes (get stakes md))
        (current-stake (unwrap! (element-at? current-stakes index) err-category-not-found))
        (current-stake-balances (default-to (list u0 u0 u0 u0 u0 u0 u0 u0 u0 u0) (map-get? stake-balances {market-id: market-id, user: tx-sender})))
        (current-user-stake (unwrap! (element-at? current-stake-balances index) err-category-not-found))
        (market-end (+ (get market-start md) (get market-duration md)))
      )
    (asserts! (< index (len categories)) err-category-not-found)
    (asserts! (< burn-block-height market-end) err-market-not-open)
    ;; Ensure correct token
    (asserts! (is-eq (get token md) (contract-of token)) err-invalid-token)
    ;; Ensure market is not concluded
    (asserts! (not (get concluded md)) err-already-concluded)
    ;; Ensure resolution process has not started 
    (asserts! (is-eq (get resolution-state md) RESOLUTION_OPEN) err-market-not-open)

    (map-set markets market-id
      (merge md {stakes: (unwrap! (replace-at? current-stakes index (+ current-stake amount-less-fee)) err-category-not-found)})
    )

    (map-set stake-balances {market-id: market-id, user: tx-sender}
        (unwrap! (replace-at? current-stake-balances index (+ current-user-stake amount-less-fee)) err-category-not-found)
    )

    (try! (contract-call? .bme030-0-reputation-token mint tx-sender u4 u3))
    (print {event: "market-stake", market-id: market-id, index: index, amount: amount-less-fee, voter: tx-sender})
    (ok index)
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
      (price-data (unwrap! (contract-call? .pyth-oracle-v4 read-price-feed price-feed-id .pyth-storage-v4) err-category-not-found))
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

;; Claim winnings (for users who staked on the correct category)
(define-public (claim-winnings (market-id uint) (token <ft-token>))
  (let 
    (
      (market-data (unwrap! (map-get? markets market-id) err-market-not-found))
      (user-stake-list (unwrap! (map-get? stake-balances { market-id: market-id, user: tx-sender }) err-user-not-staked))
      (index-won (unwrap! (get outcome market-data) err-market-wrong-state))
      (user-stake (unwrap! (element-at? user-stake-list index-won) err-user-not-staked))
      (stake-list (get stakes market-data))
      (winning-pool (unwrap! (element-at? stake-list index-won) err-market-wrong-state))
      (total-pool (fold + stake-list u0))
    )

    ;; Ensure correct token
    (asserts! (is-eq (get token market-data) (contract-of token)) err-invalid-token)
    ;; Check if market is concluded
    (asserts! (is-eq (get resolution-state market-data) RESOLUTION_RESOLVED) err-market-not-concluded)
    (asserts! (get concluded market-data) err-market-not-concluded)
    ;; Determine user stake and winning pool
    (asserts! (> user-stake u0) err-user-not-winner-or-claimed)
    (asserts! (> winning-pool u0) err-amount-too-low)

      ;; Claim winnings
    (claim-winnings-internal market-id user-stake winning-pool total-pool index-won token)
  )
)

;; needed for markets with no winner - in this case, tokens accrued are transferred to the dao treasury
(define-public (transfer-losing-stakes (market-id uint) (token <ft-token>))
  (let (
        (md (unwrap! (map-get? markets market-id) err-market-not-found))
        (stakes (get stakes md))
        (winning-index (unwrap! (get outcome md) err-market-not-concluded))
        (balance (fold + stakes u0))
    )
    ;; Ensure market is concluded and winning category is empty
    (asserts! (is-eq (get token md) (contract-of token)) err-invalid-token)
    (asserts! (is-eq (get resolution-state md) RESOLUTION_RESOLVED) err-market-not-concluded)
    (asserts! (is-eq u0 (unwrap! (element-at? stakes winning-index) err-element-expected)) err-winning-stake-not-zero)
    (as-contract
      (begin
        (if (> balance u0)
          (try! (contract-call? token transfer balance tx-sender (var-get dao-treasury) none))
          true
        )
      )
    )
    (print {event: "transfer-losing-stakes", market-id: market-id, balance: balance})
    (ok true)
  )
)

(define-private (claim-winnings-internal 
  (market-id uint)
  (user-stake uint)
  (winning-pool uint)
  (total-pool uint)
  (index-won uint) (token <ft-token>))
  (let (
        (md (unwrap! (map-get? markets market-id) err-market-not-found))
        (original-sender tx-sender)
        (treasury (get treasury md))
        (market-fee-bips (get market-fee-bips md))
        (user-share (if (> winning-pool u0) (/ (* user-stake total-pool) winning-pool) u0))
        (daofee (/ (* user-share (var-get dao-fee-bips)) u10000))
        (marketfee (/ (* user-share market-fee-bips) u10000))
        (user-share-net (- user-share (+ daofee marketfee)))
    )
    (begin
      ;; Ensure inputs are valid
      (asserts! (> winning-pool u0) err-amount-too-low)
      (asserts! (> user-share-net u0) err-user-share-is-zero)
      (asserts! (> daofee u0) err-dao-fee-bips-is-zero)

      ;; Perform transfers
      (as-contract
        (begin
          ;; Transfer user share, capped by initial contract balance

          ;;(try! (stx-transfer? user-share-net tx-sender original-sender))
          ;;(try! (stx-transfer? daofee tx-sender (var-get dao-treasury)))

          (if (> user-share-net u0) 
            (try! (contract-call? token transfer user-share-net tx-sender original-sender none))
            true
          )
          (if (> daofee u0)
            (try! (contract-call? token transfer daofee tx-sender (var-get dao-treasury) none))
            true
          )
          (if (> marketfee u0) 
            (try! (contract-call? token transfer marketfee tx-sender treasury none))
            true
          )
        )
      )

      ;; Zero out user stake
      (map-set stake-balances { market-id: market-id, user: tx-sender } (list u0 u0 u0 u0 u0 u0 u0 u0 u0 u0))

      ;; Log and return user share
      (try! (contract-call? .bme030-0-reputation-token mint tx-sender u6 u2))
      (print {event: "claim-winnings", market-id: market-id, index-won: index-won, claimer: tx-sender, user-stake: user-stake, user-share: user-share-net, marketfee: marketfee, daofee: daofee, winning-pool: winning-pool, total-pool: total-pool})
      (ok user-share-net)
    )
  )
)

(define-private (process-stake-transfer (amount uint) (token <ft-token>))
  (let (
        ;;(sender-balance (stx-get-balance tx-sender))
        (sender-balance (unwrap! (contract-call? token get-balance tx-sender) err-insufficient-balance))
        (fee (calculate-fee amount (var-get dev-fee-bips)))
        (transfer-amount (- amount fee))
       )
    (begin
      (asserts! (> transfer-amount u0) err-amount-too-low)
      ;; Ensure amount is valid
      (asserts! (>= amount u100) err-amount-too-low)
      ;; Check tx-sender's balance
      (asserts! (>= sender-balance amount) err-insufficient-balance)
      (asserts! (<= amount u50000000000000) err-amount-too-high)
      (asserts! (<= (var-get dev-fee-bips) u1000) err-fee-too-high) ;; max 10%
      
      (try! (contract-call? token transfer transfer-amount tx-sender .bme023-0-market-scalar-pyth none))
      (try! (contract-call? token transfer fee tx-sender (var-get dev-fund) none))

      (ok transfer-amount)
    )
  )
)
(define-private (calculate-fee (amount uint) (fee-bips uint))
  (let ((fee (/ (* amount fee-bips) u10000)))
    fee
  )
)
;; Placeholder: staking does not support this
(define-public (transfer-shares (market-id uint) (outcome uint) (from principal) (to principal) (amount uint) (t <ft-token>))
  err-unauthorised
)
