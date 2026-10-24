# DODGEBORN 開發進度

更新：2026-10-24。狀態依專案內的實際執行結果，而非預定完成度。

| Gate | 狀態 | 已驗證成果 | 尚待處理 |
| --- | --- | --- | --- |
| G0 環境與配置 | PARTIAL | 本機 Git baseline `baseline-canvas-playable`、npm workspaces、Node.js 22.17、靜態本機伺服器與離線建置可用 | 正式依賴與 lockfile 尚未安裝及驗證 |
| G1 獨立模擬核心 | PASS | `npm run test:local`：18/18；60Hz、球權、HP、連續碰撞、去重與勝負 | strict typecheck 待依賴取得 |
| G2 可玩循環 | PASS | 2026-10-24 真實 Chrome 重測選角、操控、暫停、重開、雙人入口與完整比賽；離線 ZIP 直接開啟也通過 | 標準 Vite 伺服器未驗證 |
| G3 必殺與回饋 | PASS | 六技能碰撞／軌跡測試、接球反擊、閃避、合成音效、原創背景音樂、打擊定格、擊退與特效 | 音樂、音效與動作的最終品質驗收未完成 |
| G4 正式內容 | PARTIAL | 六角色、六必殺、三難度、雙人同機、AI FSM＋效用分數及較清楚的介面 | Hard AI 20/20 對戰到時間上限；美術仍屬程序化預覽版 |
| G5 開源 Release Candidate | PARTIAL | MIT、中英日 README、素材清單、CI 配置、乾淨來源 ZIP、離線可攜 ZIP 與 Chrome 回歸；Vercel 靜態設定已備妥 | GitHub repo 與 Vercel 站尚未建立；TypeScript/Vite/Vitest、Firefox/WebKit、完整依賴授權尚未完成 |

## 主要執行紀錄

- 正式 npm 依賴尚未在本機安裝；正式工具鏈驗證未完成。
- `npm run test:local`：PASS，18/18。
- `npm run build:local`：PASS，寫入 `dist/`。
- `npm run test:browser:built`：PASS，實際 Chrome/Playwright；完整自動對戰模擬到 10,800 ticks（180 秒上限），無頁面錯誤。
- `npm run typecheck`、`npm test`、`npm run build`：FAIL，所需 `tsc`／`vitest` 尚未安裝。
- 五份 `package.json` 唯讀查核：外部套件皆為預設 npm Registry 來源，無自訂 Registry、安裝生命週期腳本、`file:`、Git 或 URL 依賴；沒有 `.npmrc` 或 lockfile。
- `git commit -m "baseline: playable Canvas DODGEBORN"`：PASS，初始提交 `cfdb3fa1a500cd66e4969008997ebb0b3a2709ff`；`git tag -a baseline-canvas-playable`：PASS；沒有 remote，提交後工作樹乾淨。
- 正式依賴安裝尚待具體網路權限及安全檢查；目前可攜版不需要 npm 套件。
- 2026-10-24 `npm run test:local`：PASS，18/18；`npm run test:browser:local`：PASS，真實 Chrome 無頁面錯誤。
- 60 場 AI 樣本（每難度 20 個種子）：Easy 平均 99.6 秒，Normal 14/20 到時間上限，Hard 20/20 到時間上限；G4 平衡列為待改善。
- 2026-10-24 原創背景音樂版：`npm run test:local`：PASS，18/18；`npm run build:local`：PASS；`npm run test:browser:built`：PASS，真實 Chrome 完成一場比賽，沒有頁面錯誤。
- `npm run package:portable`：PASS，產生 `release/DODGEBORN-0.1.0-portable-preview.zip`，20,825 bytes，SHA-256 `dcd7c7fae792af62864e86af67c06a0ae10609cbc6e19e934077f2e57de5df5b`。全新解壓目錄 `release/verify-music-20261024/` 內五個檔案與雜湊均核對通過。
- `npm run test:portable -- release/verify-music-20261024/DODGEBORN.html`：PASS，真實 Chrome 離線 `file://` 的音樂播放／靜音、選單、必殺、暫停、重新開始、雙人控制與完整比賽全部通過；外部請求 0，頁面錯誤 0。
- 公開工作檔已移除個人絕對路徑及工具環境硬編碼；`docs/PROGRESS.md` 與 `docs/ACCEPTANCE.md` 依要求保留並清理。舊 Git 提交仍有舊路徑紀錄，公開 Git 歷史前須另行處理。
- 2026-10-24 開源準備：中英日 README 已加入命名由來、截圖、操作、架構、授權與 Vercel 示範站說明；`vercel.json` 設為 Node 22.x 的離線靜態建置，實際雲端部署尚未驗證。
- `npm run package:source`：PASS，將白名單來源匯出為不含 `.git`、快取、憑證與建置產物的本機來源 ZIP。全新解壓後 48 個檔案雜湊、`npm run test:local` 18/18、`npm run build:local` 與真實 Chrome 建置版完整比賽均通過。
- 依目前發布順序，先保留本機開源包；尚未建立 GitHub repo、推送或進行 Vercel 部署。

下一步：完成 GitHub 登入後，可從乾淨來源快照建立公開倉庫，再由使用者在 Vercel 網頁匯入並部署。正式工具鏈、跨瀏覽器、AI 對戰節奏及美術仍待後續驗收；Canvas 版本保持完整，Phaser 重構需另行評估。
