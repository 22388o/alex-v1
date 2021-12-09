
;; helper functions:

(define-read-only (get-staker-at-cycle-or-default-by-tx-sender (reward-cycle uint))
  (contract-call? .alex-reserve-pool get-staker-at-cycle-or-default .token-t-alex reward-cycle (default-to u0 (contract-call? .alex-reserve-pool get-user-id .token-t-alex tx-sender)))
)
(define-read-only (get-staked (reward-cycles (list 2000 uint)))
  (map get-staker-at-cycle-or-default-by-tx-sender reward-cycles)
)
(define-read-only (get-staking-reward-by-tx-sender (target-cycle uint))
  (contract-call? .alex-reserve-pool get-staking-reward .token-t-alex (default-to u0 (contract-call? .alex-reserve-pool get-user-id .token-t-alex tx-sender)) target-cycle)
)
(define-read-only (get-staking-rewards (reward-cycles (list 2000 uint)))
  (map get-staking-reward-by-tx-sender reward-cycles)
)
(define-public (claim-staking-reward-by-tx-sender (reward-cycle uint))
  (contract-call? .alex-reserve-pool claim-staking-reward .token-t-alex reward-cycle)
)
(define-public (claim-staking-reward (reward-cycles (list 2000 uint)))
  (ok (map claim-staking-reward-by-tx-sender reward-cycles))
)