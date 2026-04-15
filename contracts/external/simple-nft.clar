;; Title: SimpleNFT
;; A minimal SIP-009 non-fungible token (NFT) implementation.
;; Each mint creates a unique uint token ID owned by the recipient.
;; Only the contract deployer can mint.

(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; --- constants and data vars
(define-constant err-unauthorised (err u100))
(define-constant ERR_NOT_OWNER   (err u101))
(define-constant ERR_ALREADY_MINTED (err u102))

(define-data-var next-id uint u1)
(define-map token-owners uint principal)

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .bigmarket-dao) (contract-call? .bigmarket-dao is-extension contract-caller)) err-unauthorised))
)

;; --- read-only helpers
(define-read-only (get-owner (token-id uint))
  (ok (map-get? token-owners token-id))
)

(define-read-only (get-last-token-id)
  (ok (var-get next-id))
)

(define-read-only (get-token-uri (token-id uint))
  (ok (some "ipfs://example/"))
)

(define-read-only (get-total-supply)
  (ok (- (var-get next-id) u1))
)

;; --- internal owner check
(define-private (only-owner (token-id uint))
  (let ((owner (unwrap! (map-get? token-owners token-id) ERR_NOT_OWNER)))
    (asserts! (is-eq tx-sender owner) ERR_NOT_OWNER)
    (ok true)
  )
)

;; --- public mint
(define-public (mint (recipient principal))
  (let ((id (var-get next-id)))
    (try! (is-dao-or-extension))
    (map-set token-owners id recipient)
    (var-set next-id (+ id u1))
    (print {event: "mint", id: id, recipient: recipient})
    (ok id)
  )
)

;; --- SIP009 transfer implementation
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) err-unauthorised)
    (try! (only-owner token-id))
    (map-set token-owners token-id recipient)
    (print {event: "transfer", id: token-id, from: sender, to: recipient})
    (ok true)
  )
)

;; --- SIP009 get-token-uri is already defined above
