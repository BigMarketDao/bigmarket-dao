;; Title: BDE003 Core Proposals
;; Author: mijoco.btc (based upon work of Marvin Janssen)
;; Depends-On: BDE001
;; Synopsis:
;; This extension allows for the creation of core proposals by a few trusted
;; principals.
;; Description:
;; Only a list of trusted principals, designated as the
;; "core team", can create core proposals. The core proposal
;; extension has an optional ~3 month sunset period, after which no more core
;; proposals can be made - set it to 0 to disable. The core team members, sunset period, and 
;; core vote duration can be changed by means of a future proposal.

(impl-trait 'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.extension-trait.extension-trait)
(use-trait proposal-trait 'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-data-var core-team-sunset-height uint u0) ;; does not expire by default - can be changed by proposal

(define-constant err-unauthorised (err u3300))
(define-constant err-not-core-team-member (err u3301))
(define-constant err-sunset-height-reached (err u3302))
(define-constant err-sunset-height-in-past (err u3303))

(define-map core-team principal bool)

;; --- Authorisation check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .bitcoin-dao) (contract-call? .bitcoin-dao is-extension contract-caller)) err-unauthorised))
)

;; --- Internal DAO functions

(define-public (set-core-team-sunset-height (height uint))
	(begin
		(try! (is-dao-or-extension))
		(asserts! (> height burn-block-height) err-sunset-height-in-past)
		(ok (var-set core-team-sunset-height height))
	)
)

(define-public (set-core-team-member (who principal) (member bool))
	(begin
		(try! (is-dao-or-extension))
		(print {event: "set-core-team-member", who: who, member: member})
		(ok (map-set core-team who member))
	)
)

;; --- Public functions

(define-read-only (is-core-team-member (who principal))
	(default-to false (map-get? core-team who))
)

(define-public (core-propose (proposal <proposal-trait>) (start-burn-height uint) (duration uint) (custom-majority (optional uint)))
	(begin
		(asserts! (is-core-team-member tx-sender) err-not-core-team-member)
		(asserts! (or (is-eq (var-get core-team-sunset-height) u0) (< burn-block-height (var-get core-team-sunset-height))) err-sunset-height-reached)
		(contract-call? .bde001-proposal-voting-tokenised add-proposal proposal
			{
				start-burn-height: start-burn-height,
				end-burn-height: (+ start-burn-height duration),
				custom-majority: custom-majority,
				proposer: tx-sender ;; change to original submitter
			}
		)
	)
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
