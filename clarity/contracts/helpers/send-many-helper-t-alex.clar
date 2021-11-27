(impl-trait .trait-ownable.ownable-trait)

;; errors
(define-constant ERR-NOT-AUTHORIZED (err u1000))
(define-constant ERR-TRANSFER-FAILED (err u3000))

(define-data-var CONTRACT-OWNER principal tx-sender)

(define-read-only (get-owner)
  (ok (var-get CONTRACT-OWNER))
)

(define-public (set-owner (owner principal))
  (begin
    (asserts! (is-eq contract-caller (var-get CONTRACT-OWNER)) ERR-NOT-AUTHORIZED)
    (ok (var-set CONTRACT-OWNER owner))
  )
)

(define-private (check-err (result (response bool uint)) (prior (response bool uint)))
    (match prior 
        ok-value result
        err-value (err err-value)
    )
)

(define-private (mint (recipient { to: principal, amount: uint }))
    (ok (and (> (get amount recipient) u0) (unwrap! (contract-call? .token-t-alex-v2 mint (get to recipient) (get amount recipient)) ERR-TRANSFER-FAILED)))
)

(define-public (mint-many (recipients (list 200 { to: principal, amount: uint })))
    (begin
        (asserts! (is-eq contract-caller (var-get CONTRACT-OWNER)) ERR-NOT-AUTHORIZED)
        (fold check-err (map mint recipients) (ok true))
    )
)

