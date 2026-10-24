# DODGEBORN

[繁體中文](README.md) · [English](README.en.md) · [日本語](README.ja.md)

> 一個週末把躲避球做得太認真的 2D 街機小專案：衝刺、跳投、接球反擊，還有會拐彎的必殺球。

**名字先說清楚：**這項運動的英文是 **dodgeball**，專案卻叫 **DODGEBORN**。當初把名字打歪，發現時第一顆球都已經飛出去了。於是將錯就錯：球已出生，名字也正式登錄。遊戲玩法仍是躲避球；這不是新的英文拼法。🏐

**線上示範：**由 Vercel 從 GitHub 倉庫部署；目前尚未部署，取得真實網址後會補在這裡。設定與操作見[部署說明](docs/DEPLOYMENT.md)。

![DODGEBORN 主選單：原創像素角色與街機選單](docs/media/menu.png)

| 選擇角色 | 球場對戰 |
| --- | --- |
| ![六名原創角色的選角畫面](docs/media/select.png) | ![六對六躲避球比賽畫面](docs/media/match.png) |

## 這個週末做出了什麼

- **六對六**：每隊三名內野、三名外野；內野 HP 歸零淘汰，三人全倒即落敗。
- **六名原創角色、六種必殺球**：助跑、跳起、抓準時機出手；每種球路都有碰撞與反制。
- **接球與反擊**：精準接球強化下一球；閃避、傳球、補位都有實際用途。
- **單人與雙人同機**：Easy、Normal、Hard AI，以及兩組鍵盤操作。
- **像素街機感**：480×270 畫布、程序化角色與特效、原創 Web Audio 音樂和音效。

## 玩起來

朋友只想玩：使用[離線可攜包說明](docs/PACKAGING.md)製作 ZIP；解壓後雙擊 `DODGEBORN.html`，在 Windows 桌面版 Chrome 或 Edge 開啟。接收者不需要 Node.js、登入或網路。這是瀏覽器可攜版，不是原生安裝程式。

想改程式：需要 Node.js 22.17 以上；在專案根目錄執行：

```powershell
npm run dev:local
```

然後開啟 `http://127.0.0.1:4173`。這條路徑不用安裝 npm 依賴；正式工具鏈命令見[驗收記錄](docs/ACCEPTANCE.md)。

| 動作 | 玩家 1 | 玩家 2 |
| --- | --- | --- |
| 移動 | WASD | 方向鍵 |
| 衝刺 | 左 Shift | 右 Shift |
| 跳躍 | R | I |
| 投球 | F／空白 | K／Enter |
| 接球 | G | L |
| 閃避 | Q | O |
| 傳球 | E | U |

`Esc` 或 `P` 暫停；`M` 或畫面上的 MUSIC 按鈕開關背景音樂。瀏覽器會在第一次按鍵或點擊後播放音樂。助跑後跳投就是必殺球的起手式。

## 技術架構

| 部分 | 做什麼 |
| --- | --- |
| [`apps/web`](apps/web) | Canvas 2D 畫面、鍵盤／滑鼠輸入、介面與 Web Audio |
| [`packages/core`](packages/core) | 獨立於瀏覽器的固定 60 Hz 規則、球權、連續碰撞、傷害與 AI |
| [`packages/content`](packages/content) | 角色、必殺球、球場及平衡數值 |
| [`packages/shared`](packages/shared) | 共用型別與事件 |
| [`tests`](tests) | 核心、整合、AI 與瀏覽器測試 |

瀏覽器負責畫與聽；核心負責判定球到底有沒有打中。詳細規則見[遊戲設計](docs/GAME_DESIGN.md)。目前渲染器是 Canvas 2D；Phaser 重構尚未決定。[設計決策](docs/DECISIONS.md)與[已知問題](docs/KNOWN_ISSUES.md)記下了取捨。

## 驗證與開源

```powershell
npm run test:local
npm run build:local
```

離線建置與真實 Chrome 回歸已通過；正式 TypeScript、Vitest、Vite 與跨瀏覽器驗收仍待依賴安裝後完成。**可玩預覽版不等於正式 Release Candidate。** 進度見[驗收記錄](docs/ACCEPTANCE.md)。Vercel 示範站使用靜態 `dist/`，由你在 Vercel 網頁匯入 GitHub 倉庫後部署；這個倉庫本身不會自動公開上線。

程式碼採 [MIT](LICENSE)；原創程序化美術、截圖、音樂與音效依[素材授權清單](docs/ASSET_LICENSES.md)標示。歡迎閱讀[貢獻指南](CONTRIBUTING.md)與[安全政策](SECURITY.md)。球可以飛出界，憑證不行。
