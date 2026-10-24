# 驗收記錄

更新：2026-10-24。PASS 表示該項所列的本機驗證已通過；PARTIAL 表示有替代路徑通過，但正式路徑未完成。

| 項目 | 狀態 | 實際證據 |
| --- | --- | --- |
| TypeScript strict typecheck | FAIL | `npm run typecheck`：`tsc` not recognized，npm 套件未安裝 |
| 單元與整合測試 | PARTIAL | 2026-10-24 `npm run test:local`：18/18；正式 `npm test` 因 `vitest` 未安裝仍未通過 |
| AI 模擬測試 | PASS | Easy、Normal、Hard 各跑到勝負或 180 秒；持球、連傳、球場界線及決策狀態測試通過 |
| Production Build | PARTIAL | `npm run build:local` 成功產生 `dist/`；`npm run build` 因缺少 `tsc` 失敗 |
| 真實 Chromium E2E | PARTIAL | 2026-10-24 Chrome 建置版與全新解壓 ZIP 的離線 `file://` 測試通過，音樂開關、暫停與完整比賽正常，外部請求及頁面錯誤皆為 0；正式 `@playwright/test`／Vite E2E 仍未執行 |
| 完整一場比賽 | PASS | Chrome 中加速執行相同 60Hz 核心至 10,800 ticks，結果畫面顯示勝負 |
| 雙人同機 | PASS | 可攜 ZIP 解壓後以 Chrome 鍵盤同時操作 P1 右移及 P2 左移，各自位置改變；核心整合測試通過 |
| 暫停與重新開始 | PASS | Chrome 暫停後 tick 不變；按暫停選單重新開始後 tick 歸零 |
| 六種必殺球 | PASS | 六技能啟動、雷電轉向、疾風蛇行、幻影真假、重力爆震、流星多球與傷害去重測試通過；Chrome 觸發技能 |
| 接球與反制 | PASS | 完美接球轉移球權並強化下一球；閃避無傷；球路可被反制 |
| 離線可攜 ZIP | PASS | `release/DODGEBORN-0.1.0-portable-preview.zip`，20,825 bytes，SHA-256 `dcd7c7fae792af62864e86af67c06a0ae10609cbc6e19e934077f2e57de5df5b`；五個檔案完整性與新解壓版 Chrome 離線測試通過；僅限可攜預覽版 |
| 乾淨開源來源包 | PASS | `npm run package:source` 匯出 48 個白名單檔案；ZIP 不含 `.git`、快取或建置產物；全新解壓後 48 個雜湊核對、18/18 核心測試、離線建置與 Chrome 完整比賽通過 |
| Vercel 示範站 | NOT STARTED | `vercel.json` 的 Node 22.x／靜態 `dist` 設定已在本機檢查；尚未建立或部署 Vercel 專案，沒有可驗證的站點 URL |
| Git 狀態 | PARTIAL | 本機 baseline 標籤保留且無遠端；本輪變更尚未提交；舊 Git 提交含機器路徑，已另備無歷史來源包；目前暫不建庫 |
| 原創與第三方授權 | PARTIAL | 未加入外部圖片、字型或音效；原創素材清單已建立，Phaser/Vite/Vitest/Playwright 上游授權已核對；傳遞依賴待安裝後審核 |
| 跨瀏覽器 | NOT STARTED | CI 已設定 Chromium、Firefox、WebKit；目前本機只執行 Chrome |

未完成的 Release Candidate 門檻不以離線建置、可攜 ZIP 或 Chrome 結果冒充完成。
