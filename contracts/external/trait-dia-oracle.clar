(define-trait dia-oracle-trait
  (
    (get-value ((string-ascii 32)) (response { value: uint, timestamp: uint } uint))
  )
)