# 已知問題與限制

1. 依賴與 lockfile 尚未產生；strict TypeScript typecheck、Vitest、Vite build 與正式 Playwright 流程尚未驗證。離線測試與封包流程可用，但不能代替正式工具鏈。
2. `phaser@4.2.1` 已列為預定依賴，目前可玩畫面仍使用 Canvas 2D。需在正式測試後評估重構成本與效益。
3. 本機 Chrome 煙霧測試以 Playwright 路由攔截讀取專案資產，尚未以正式 Vite 伺服器執行 E2E。
4. 本機尚未執行 Firefox 和 WebKit。GitHub Actions 已準備安裝三種瀏覽器，但沒有遠端 repository 或 CI 執行紀錄。
5. 程序化角色、合成音效與背景音樂是原創首版素材，尚未製作最終逐幀像素圖與音訊母帶。角色待機、移動、衝刺、跳躍、投球、接球、受擊與倒地已有程序化姿態。
6. 2026-10-24 每難度 20 個種子的 AI 對戰：Easy 平均 99.6 秒，Normal 14/20、Hard 20/20 打到 180 秒上限。Hard 容易僵持；正式平衡需要調整及真人遊玩回饋。
7. 尚未建立遠端 GitHub repository、push 或正式部署；目前只有本機交付。
8. 離線 ZIP 是解壓雙擊 HTML 的可攜預覽版，不是原生 `.exe` 或簽署安裝程式。接收者需 Windows 桌面版 Edge／Chrome；Firefox、macOS、Linux 與安全產品誤報尚未驗證。SHA-256 只能協助完整性檢查，不能證明發行者身分。
9. 目前工作檔已清除個人絕對路徑；本機舊 Git 提交仍有機器路徑及工具環境紀錄。公開既有 Git 歷史前，須先完成歷史清理或改用乾淨的來源快照，並重新檢查敏感資訊。
