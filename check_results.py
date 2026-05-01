from sheets import connect_sheet
from result_checker import check_and_update_results, ensure_trades_headers
from pnl_report import write_pnl_report

print("Connecting to sheet...")
sheet = connect_sheet()
ensure_trades_headers(sheet)

print("Checking for resolved bets...")
resolved = check_and_update_results(sheet)

if resolved:
    print(f"\n{len(resolved)} bet(s) resolved:")
    for b in resolved:
        label = "WIN" if b["won"] else "LOSS"
        print(f"  {label} | {b['slug']} | side={b['side']} | PnL={b['pnl']:+.4f}")
else:
    print("No new resolved bets.")

print("\nWriting P&L report tab...")
write_pnl_report(sheet)
print("Done! Check your Google Sheet for the new P&L tab.")