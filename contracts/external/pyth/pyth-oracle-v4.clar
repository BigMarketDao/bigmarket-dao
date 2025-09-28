;; Title: pyth-oracle
;; Version: v3
;; Check for latest version: https://github.com/Trust-Machines/stacks-pyth-bridge#latest-version
;; Report an issue: https://github.com/Trust-Machines/stacks-pyth-bridge/issues

(use-trait pyth-storage-trait .pyth-traits-v2.storage-trait)

(define-public (get-price (price-feed-id (buff 32)))
  (let (
    (btc-id 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43)
    (eth-id 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace)
    (stx-id 0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17)
    (sol-id 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d)
    (price (if (is-eq price-feed-id btc-id)
              95
              (if (is-eq price-feed-id eth-id)
                  105
                  (if (is-eq price-feed-id stx-id)
                      115
                      125))))
    )
    (ok {
      price: price,
      conf: u100,
      expo: -8,
      ema-price: price,
      ema-conf: u10,
      publish-time: u10,
      prev-publish-time: u9
    })
))

