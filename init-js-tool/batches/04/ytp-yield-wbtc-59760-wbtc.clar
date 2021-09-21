(impl-trait .trait-sip-010.sip-010-trait)
(impl-trait .trait-pool-token.pool-token-trait)

(define-fungible-token yield-wbtc-59760-wbtc)

(define-data-var token-uri (string-utf8 256) u"")
(define-data-var contract-owner principal tx-sender)

;; errors
(define-constant ERR-NOT-AUTHORIZED (err u1000))


(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (match (ft-transfer? yield-wbtc-59760-wbtc amount sender recipient)
    response (begin
      (print memo)
      (ok response)
    )
    error (err error)
  )
)

(define-read-only (get-name)
  (ok "yield-wbtc-59760-wbtc")
)

(define-read-only (get-symbol)
  (ok "yield-wbtc-59760-wbtc")
)

(define-read-only (get-expiry)
  (ok 5976000000000)
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (owner principal))
  (ok (ft-get-balance yield-wbtc-59760-wbtc owner))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply yield-wbtc-59760-wbtc))
)

(define-read-only (get-token-uri)
  (ok (some u"https://docs.alexgo.io/"))
)


;; one stop function to gather all the data relevant to the LP token in one call
(define-read-only (get-data (owner principal))
  (ok {
    name: (unwrap-panic (get-name)),
    symbol: (unwrap-panic (get-symbol)),
    decimals: (unwrap-panic (get-decimals)),
    uri: (unwrap-panic (get-token-uri)),
    supply: (unwrap-panic (get-total-supply)),
    balance: (unwrap-panic (get-balance owner))
  })
)

;; the extra mint method used when adding liquidity
;; can only be used by arkadiko swap main contract
(define-public (mint (recipient principal) (amount uint))
  (begin
    (print "usda-token-swap.mint")
    (print contract-caller)
    (print amount)
    ;; TODO - make dynamic
    ;; (asserts! (is-eq contract-caller .arkadiko-swap-v1-1) (err ERR-NOT-AUTHORIZED))
    (ft-mint? yield-wbtc-59760-wbtc amount recipient)
  )
)


;; the extra burn method used when removing liquidity
;; can only be used by arkadiko swap main contract
(define-public (burn (recipient principal) (amount uint))
  (begin
    (print "usda-token-swap.burn")
    (print contract-caller)
    (print amount)
    ;; TODO - make dynamic
    ;; (asserts! (is-eq contract-caller .arkadiko-swap-v1-1) (err ERR-NOT-AUTHORIZED))
    (ft-burn? yield-wbtc-59760-wbtc amount recipient)
  )
)