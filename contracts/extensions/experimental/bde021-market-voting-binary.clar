;; Title: BDE021 Opinion Polling
;; Author: mijoco.btc
;; Depends-On: 
;; Synopsis:
;; Enables quick opinion polling functionality.
;; Description:
;; A more streamlined type of voting designed to quickly gauge community opinion.
;; Unlike DAO proposals, opinion polls cannot change the configuration of the DAO.

(impl-trait .extension-trait.extension-trait)
(use-trait nft-trait .sip009-nft-trait.nft-trait)
(use-trait ft-trait .sip010-ft-trait.sip010-ft-trait)
(use-trait prediction-market-trait .prediction-market-trait.prediction-market-trait)

(define-constant err-unauthorised (err u2100))
(define-constant err-poll-already-exists (err u2102))
(define-constant err-unknown-proposal (err u2103))
(define-constant err-proposal-inactive (err u2105))
(define-constant err-already-voted (err u2106))
(define-constant err-proposal-start-no-reached (err u2109))
(define-constant err-expecting-root (err u2110))
(define-constant err-invalid-signature (err u2111))
(define-constant err-proposal-already-concluded (err u2112))
(define-constant err-end-burn-height-not-reached (err u2113))
(define-constant err-no-votes-to-return (err u2114))
(define-constant err-not-concluded (err u2115))

(define-constant structured-data-prefix 0x534950303138)
(define-constant message-domain-hash (sha256 (unwrap! (to-consensus-buff?
	{
		name: "BigMarket",
		version: "1.0.0",
		chain-id: chain-id
	}
    ) err-unauthorised)
))

(define-constant structured-data-header (concat structured-data-prefix message-domain-hash))
(define-constant custom-majority-upper u10000)

(define-data-var custom-majority (optional uint) none)
(define-data-var voting-duration uint u72)

(define-map resolution-polls
	uint
	{
		market-data-hash: (buff 32),
		votes-for: uint,
		votes-against: uint,
		end-burn-height: uint,
		proposer: principal,
		concluded: bool,
		passed: bool,
	}
)
(define-map member-total-votes {market-id: uint, voter: principal} uint)

;; --- Authorisation check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .bitcoin-dao) (contract-call? .bitcoin-dao is-extension contract-caller)) err-unauthorised))
)

;; --- Internal DAO functions
(define-public (set-voting-duration (new-duration uint))
  (begin
    (try! (is-dao-or-extension))
    (var-set voting-duration new-duration)
    (ok true)
  )
)
(define-public (set-custom-majority (new-majority (optional uint)))
  (begin
    (try! (is-dao-or-extension))
    (var-set custom-majority new-majority)
    (ok true)
  )
)

;; Proposals

;; called by a staker in a market to begin dispute resolution process
(define-public (create-market-vote
    (market <prediction-market-trait>)
    (market-id uint)
    (market-data-hash (buff 32))
  )
  (let
    (
      (original-sender tx-sender)
    )
    (asserts! (is-none (map-get? resolution-polls market-id)) err-poll-already-exists)
		;; a user with stake can propose but only for a market in the correct state in bde023. 
    (try! (as-contract (contract-call? market dispute-resolution market-id market-data-hash original-sender)))

    ;; Register the poll
    (map-set resolution-polls market-id
      {market-data-hash: market-data-hash,
      votes-for: u0,
      votes-against: u0,
      end-burn-height: (+ burn-block-height (var-get voting-duration)),
      proposer: tx-sender,
      concluded: false,
      passed: false})

    ;; Emit an event for the new poll
    (print {event: "create-market-vote", market-id: market-id, market-data-hash: market-data-hash, proposer: tx-sender})
    (ok true)
  )
)

;; --- Public functions

(define-read-only (get-poll-data (market-id uint))
	(map-get? resolution-polls market-id)
)


;; Votes

(define-public (vote
    (market-id uint)
    (market-data-hash (buff 32)) 
    (for bool)  
    (amount uint) 
    (prev-market-id (optional uint))
  )
  ;; Process the vote using shared logic
  (process-market-vote market-id market-data-hash tx-sender for amount false prev-market-id)
)


(define-public (batch-vote (votes (list 50 {message: (tuple 
                                                (market-id uint)
                                                (market-data-hash (buff 32))
                                                (attestation (string-ascii 100)) 
                                                (timestamp uint) 
                                                (vote bool)
                                                (amount uint)
                                                (voter principal)
                                                (prev-market-id (optional uint))),
                                   signature: (buff 65)})))
  (begin
    (ok (fold fold-vote votes u0))
  )
)

(define-private (fold-vote  (input-vote {message: (tuple 
                                                (market-id uint)
                                                (market-data-hash (buff 32))
                                                (attestation (string-ascii 100)) 
                                                (timestamp uint) 
                                                (vote bool)
                                                (amount uint)
                                                (voter principal)
                                                (prev-market-id (optional uint))),
                                     signature: (buff 65)}) (current uint))
  (let
    (
      (vote-result (process-vote input-vote))
    )
    (if (is-ok vote-result)
        (if (unwrap! vote-result u0)
            (+ current u1)
            current) 
        current)
  )
)

(define-private (process-vote
    (input-vote {message: (tuple 
                            (market-id uint)
                            (market-data-hash (buff 32))
                            (attestation (string-ascii 100)) 
                            (timestamp uint) 
                            (vote bool)
                            (amount uint)
                            (voter principal)
                            (prev-market-id (optional uint))),
                 signature: (buff 65)}))
  (let
      (
        ;; Extract relevant fields from the message
        (message-data (get message input-vote))
        (meta-hash (get market-data-hash message-data))
        (attestation (get attestation message-data))
        (timestamp (get timestamp message-data))
        (market-id (get market-id message-data))
        (voter (get voter message-data))
        (for (get vote message-data))
        (amount (get amount message-data))
        ;; Verify the signature
        (message (tuple (attestation attestation) (market-id market-id) (timestamp timestamp) (vote (get vote message-data))))
        (structured-data-hash (sha256 (unwrap! (to-consensus-buff? message) err-unauthorised)))
        (is-valid-sig (verify-signed-structured-data structured-data-hash (get signature input-vote) voter))
      )
    (if is-valid-sig
        (process-market-vote market-id meta-hash voter for amount true (get prev-market-id message-data) )
        (ok false)) ;; Invalid signature
  ))


(define-private (process-market-vote
    (market-id uint)  ;; The poll ID
    (market-data-hash (buff 32))  ;; hash of off chain poll data
    (voter principal)         ;; The voter's principal
    (for bool)                ;; Vote "for" or "against"
    (amount uint)                ;; voting power
    (sip18 bool)                ;; sip18 message vote or tx vote
    (prev-market-id (optional uint))
  )
  (let
      (
        ;; Fetch the poll data
        (poll-data (unwrap! (map-get? resolution-polls market-id) err-unknown-proposal))
      )
    (begin
      ;; reclaim previously locked tokens
  		(if (is-some prev-market-id) (try! (reclaim-votes prev-market-id)) true)

      ;; Ensure the voting period is active
      (asserts! (< burn-block-height (get end-burn-height poll-data)) err-proposal-inactive)

      ;; Record the vote
      (map-set member-total-votes {market-id: market-id, voter: voter}
        (+ (get-current-total-votes market-id voter) amount)
      )

      ;; update market voting power
      (map-set resolution-polls market-id
        (if for
          (merge poll-data {votes-for: (+ (get votes-for poll-data) amount)})
          (merge poll-data {votes-against: (+ (get votes-against poll-data) amount)})
        )
      )

      ;; Emit an event for the vote
      (print {event: "market-vote", market-id: market-id, voter: voter, for: for, sip18: sip18, amount: amount, prev-market-id: prev-market-id})

		  (contract-call? .bde000-governance-token bdg-lock amount voter)
    )
  ))


(define-read-only (get-current-total-votes (market-id uint) (voter principal))
	(default-to u0 (map-get? member-total-votes {market-id: market-id, voter: voter}))
)

(define-read-only (verify-signature (hash (buff 32)) (signature (buff 65)) (signer principal))
	(is-eq (principal-of? (unwrap! (secp256k1-recover? hash signature) false)) (ok signer))
)

(define-read-only (verify-signed-structured-data (structured-data-hash (buff 32)) (signature (buff 65)) (signer principal))
	(verify-signature (sha256 (concat structured-data-header structured-data-hash)) signature signer)
)

;; Conclusion

(define-read-only (get-poll-status (market-id uint))
    (let
        (
            (poll-data (unwrap! (map-get? resolution-polls market-id) err-unknown-proposal))
            (is-active (< burn-block-height (get end-burn-height poll-data)))
            (passed (> (get votes-for poll-data) (get votes-against poll-data)))
        )
        (ok {active: is-active, passed: passed})
    )
) 
    

(define-public (conclude-market-vote (market <prediction-market-trait>) (market-id uint))
	(let
		(
      (poll-data (unwrap! (map-get? resolution-polls market-id) err-unknown-proposal))
      (market-data-hash (get market-data-hash poll-data))
      (is-active (< burn-block-height (get end-burn-height poll-data)))
			(passed
				(match (var-get custom-majority)
					majority (> (* (get votes-for poll-data) custom-majority-upper) (* (+ (get votes-for poll-data) (get votes-against poll-data)) majority))
					(> (get votes-for poll-data) (get votes-against poll-data))
				)
			)
      (result (try! (contract-call? market resolve-market-vote market-id market-data-hash passed)))
		)
		(asserts! (not (get concluded poll-data)) err-proposal-already-concluded)
		(asserts! (>= burn-block-height (get end-burn-height poll-data)) err-end-burn-height-not-reached)
		(map-set resolution-polls market-id (merge poll-data {concluded: true, passed: passed}))
		(print {event: "conclude-market-vote", market-id: market-id, passed: passed, result: result})
		(ok passed)
	)
)

(define-public (reclaim-votes (id (optional uint)))
	(let
		(
			(market-id (unwrap! id err-unknown-proposal))
      (poll-data (unwrap! (map-get? resolution-polls market-id) err-unknown-proposal))
			(votes (unwrap! (map-get? member-total-votes {market-id: market-id, voter: tx-sender}) err-no-votes-to-return))
		)
		(asserts! (get concluded poll-data) err-not-concluded)
		(map-delete member-total-votes {market-id: market-id, voter: tx-sender})
		(contract-call? .bde000-governance-token bdg-unlock votes tx-sender)
	)
)

;; --- Extension callback
(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
