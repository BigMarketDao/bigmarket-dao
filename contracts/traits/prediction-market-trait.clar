(define-trait prediction-market-trait
  (
    (dispute-resolution (uint principal uint) (response bool uint))
    (resolve-market-vote (uint uint) (response bool uint))
  )
)