## 2026-09-01 - Input Validation for Financial Operations
**Vulnerability:** Unvalidated `amount` parameter in `bankTransfer` allowed non-positive numbers (negative or zero) and non-finite values (`NaN`, `Infinity`).
**Learning:** Game logic handling currency or balance transfers must strictly enforce `Number.isFinite(amount) && amount > 0` at the method boundary before applying source/destination calculations to avoid infinite money generation or corrupted balances.
**Prevention:** Always validate all incoming numerical inputs (transfer amounts, trades, deposits) with strict range and finiteness checks prior to state updates.
