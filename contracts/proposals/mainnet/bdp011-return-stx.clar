;; Title: Returns newguy STX from Phase I
;; Author(s): mijoco.btc
;; Returns STX to newguy due to latency of project

(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? 'SP1SCD8ERMTFYE6CK9S0MHWQCP6SY4NAVFJ538A27.bme006-0-treasury stx-transfer u233257209 'SP2YBH2S583CD60NYJHN165WJQDNDMPH69CZAQ78B none))
		(ok true)
	)
)
