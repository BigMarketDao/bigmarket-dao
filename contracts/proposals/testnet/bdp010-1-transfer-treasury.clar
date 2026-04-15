;; Title: Move treasury and disable DAO
;; Author(s): mijoco.btc
;; Move V1 treasury to V2 DAO and close down the dao

(impl-trait  .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		
		(try! (contract-call? 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bme006-0-treasury stx-transfer u67604061 'ST1CV2YGRJA5X8BWS0GP31J9HF56M06CQK8998TSX.bme006-0-treasury none))

		(try! (contract-call? 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bigmarket-dao set-extensions
			(list
				{extension: 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bme000-0-governance-token, enabled: false}
				;;{extension: 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bme001-0-proposal-voting, enabled: false}
				{extension: 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bme003-0-core-proposals, enabled: false}
				{extension: 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bme006-0-treasury, enabled: false}
				{extension: 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bme010-0-liquidity-contribution, enabled: false}
				{extension: 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bme021-0-market-voting, enabled: false}
				{extension: 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bme022-0-market-gating, enabled: false}
				{extension: 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bme024-0-market-scalar-pyth, enabled: false}
				{extension: 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bme024-0-market-predicting, enabled: false}
				{extension: 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bme030-0-reputation-token, enabled: false}
				{extension: 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bme032-0-scalar-strategy-hedge, enabled: false}
				{extension: 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bme040-0-shares-marketplace, enabled: false}
			)
		))
		(ok true)
	)
)
