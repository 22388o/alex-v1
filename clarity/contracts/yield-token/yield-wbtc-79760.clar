(impl-trait .trait-sip-010.sip-010-trait)
(impl-trait .trait-yield-token.yield-token-trait) 

;; Defines ayUSDA which conforms sip010-trait and yield-token-trait. 

(define-fungible-token yield-wbtc-79760)

(define-data-var token-uri (string-utf8 256) u"")
(define-data-var token-expiry uint u7976000000000)
(define-data-var underlying-token principal .token-wbtc)

;; errors
(define-constant err-not-authorized u1000)

;; ---------------------------------------------------------
;; SIP-10 Functions
;; ---------------------------------------------------------

(define-read-only (get-name)
  (ok "yield-wbtc-79760")
)

(define-read-only (get-symbol)
  (ok "yield-wbtc-79760")
)

(define-read-only (get-decimals)
  (ok u8)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance yield-wbtc-79760 account))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply yield-wbtc-79760))
)

(define-public (set-token-uri (value (string-utf8 256)))
  ;; TODO : Authorization Check
  ;;(if (is-eq tx-sender (contract-call? .OWNER))
    (ok (var-set token-uri value))
  ;;  (err ERR-NOT-AUTHORIZED)
  ;;)
)

(define-read-only (get-token-uri)
  (ok (some (var-get token-uri)))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (match (ft-transfer? yield-wbtc-79760 amount sender recipient)
    response (begin
      (print memo)
      (ok response)
    )
    error (err error)
  )
)

;; Mint method for yield-wbtc-79760
(define-public (mint (recipient principal) (amount uint))
  (begin
    (ft-mint? yield-wbtc-79760 amount recipient)
  )
)

;; Burn method for yield-wbtc-79760
(define-public (burn (sender principal) (amount uint))
  (begin
    (ft-burn? yield-wbtc-79760 amount sender)
  )
)

(define-public (get-token)
    (ok (var-get underlying-token))
)

(define-public (get-expiry)
    (ok (var-get token-expiry))
)


;; Initialize the contract for Testing.
(begin
  (try! (ft-mint? yield-wbtc-79760 u1000000000000 tx-sender))
)