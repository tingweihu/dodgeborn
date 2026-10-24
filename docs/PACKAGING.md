# 離線可攜版與安全驗證

目前交付型態是 **Windows 桌面瀏覽器可攜版**：朋友解壓 ZIP，雙擊 `DODGEBORN.html` 即可在 Edge 或 Chrome 遊玩。它不是原生 `.exe` 或需要系統權限的安裝程式。接收者不需要 Node.js、npm、帳號或網路。

## 製作

在本專案根目錄使用 Node.js 22.17 以上及 Windows PowerShell：

```powershell
npm run package:portable
```

指令使用 Node.js 內建 TypeScript 語法移除功能，將遊戲原始碼與原創 Web Audio 音樂依相依順序合為一份 HTML，並透過 Windows `Compress-Archive` 建立 `release/DODGEBORN-0.1.0-portable-preview.zip`。不執行 `npm install`，不包含 npm 套件、`node_modules`、快取或開發工具。ZIP 只含遊戲 HTML、操作說明、MIT 授權、素材授權及檔案 SHA-256 清單。ZIP 的 SHA-256 在同目錄的 `.zip.sha256` 檔。

## 驗證

```powershell
npm run test:local
npm run test:browser:local
npm run test:portable
```

瀏覽器測試需要 Playwright；若它安裝在專案外，可用環境變數 `DODGEBORN_PLAYWRIGHT_MODULE` 指向其模組目錄。製作 ZIP 本身不需要 Playwright 或 npm 套件。

交付前還應把 ZIP 解壓至專案內另一個目錄，再對解壓出的 `DODGEBORN.html` 執行 `npm run test:portable -- <檔案路徑>`，並比對 `SHA256SUMS.txt`。可攜版測試使用真實 Chrome 的 `file://` 路徑、離線瀏覽器環境，檢查背景音樂與靜音、主選單、必殺、暫停、重開、雙人控制、完整比賽、頁面錯誤及外部網路請求。

## 安全界線

- HTML 內嵌程式與樣式使用 SHA-256 Content Security Policy；`connect-src 'none'` 禁止對外連線，沒有遠端資源或更新服務。
- 沒有安裝腳本、管理員權限需求、背景服務、登入或資料收集。
- 來源為本倉庫原創程式、程序化美術與音樂。可攜包不含第三方圖片、字型、音樂或 npm 套件。
- SHA-256 可檢查收到後檔案是否變動；它不是發行者身分簽章。傳送雜湊值時應使用可信任的獨立管道。
- 本版仍是 Canvas 2D 預覽版。正式 TypeScript、Vitest、Vite、跨瀏覽器和真人遊玩驗收尚未完成；不能稱為已簽署的原生安裝程式。
