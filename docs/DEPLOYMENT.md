# Vercel 示範站交接

GitHub 倉庫是原始碼與截圖的公開入口；**Vercel 網站是 README 裡的線上示範站**。目前尚未部署，因此 README 不放未驗證的示範網址。使用者會在 Vercel 網頁匯入 GitHub 倉庫並完成首次部署；本專案不會自行呼叫 Vercel CLI 或建立部署。

## 已放進倉庫的設定

根目錄的 [`vercel.json`](../vercel.json) 選用 `Other` 框架、`npm run build:local` 建置、`dist` 輸出，並以空的 `installCommand` 略過 npm 依賴安裝。根 [`package.json`](../package.json) 指定 Node.js 22.x；離線建置使用 Node.js 內建的 TypeScript 語法移除功能，不依賴尚未安裝的 Vite 或 Phaser。這項設定依 [Vercel 專案設定](https://vercel.com/docs/project-configuration/vercel-json)與 [Node.js 版本文件](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)撰寫。

本機已驗證 `npm run build:local` 與真實 Chrome 的建置版測試；**尚未在 Vercel 執行**，因此首次雲端建置仍須由使用者確認。

## 在 Vercel 網頁部署

1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)，選擇 **Add New → Project**，匯入 DODGEBORN 的 GitHub 倉庫。
2. **Root Directory** 保持倉庫根目錄；確認 Framework Preset 為 **Other**，Node.js 為 **22.x**。倉庫內的 `vercel.json` 已指定 Build Command 和 Output Directory。
3. 檢查預覽設定後，由你按 **Deploy**。Vercel 會對連接的 Git 倉庫建立部署；後續推送也可能觸發新部署，見 [Vercel Git 建置說明](https://vercel.com/docs/builds)。
4. 在真實網址測試主選單、音樂、完整比賽、雙人模式、暫停與重新開始。確認後，將**實際成功開啟的** Vercel URL 加到 `README.md`、`README.en.md`、`README.ja.md` 的「線上示範」段落及 GitHub 倉庫的 Website 欄位。

靜態輸出不含登入、後端或資料收集；部署網站與傳給朋友的[離線 ZIP](PACKAGING.md)是兩個交付方式。ZIP 不會被 Vercel 發布。

## 發布前限制

- 正式 TypeScript、Vitest、Vite 和跨瀏覽器測試仍待完成。Vercel 使用經 Chrome 驗證的離線建置路徑作為預覽站，不代表完整 Release Candidate 驗收。
- 尚未在 Vercel 實際執行建置，也沒有可驗證的示範網址。
- 公開 GitHub 倉庫應使用清理後的來源快照；舊本機 Git 歷史含機器路徑，不應直接推送。
