# 素材授權清單

| 素材 | 來源 | 授權 | 位置 |
| --- | --- | --- | --- |
| 六名角色造型與動作、球場、介面裝飾、球與特效 | DODGEBORN 原創程序化繪圖 | CC0-1.0 | `apps/web/src/art.ts`、`apps/web/src/main.ts` |
| 投球、接球、命中等合成音效 | DODGEBORN 原創 Web Audio 參數程式 | CC0-1.0 | `apps/web/src/main.ts` |
| 選單、比賽與結算背景音樂 | DODGEBORN 原創旋律與 Web Audio 合成程式 | CC0-1.0 | `apps/web/src/music.ts` |
| 遊戲畫面截圖 | DODGEBORN 自有畫面擷取 | CC0-1.0 | `docs/media/*.png` |
| 遊戲程式碼與數值 | DODGEBORN contributors | MIT | `LICENSE` |

目前沒有第三方圖片、字型、音樂或音效。使用系統字型，未隨專案散布字型檔。程序化角色、音樂與音效是首版原創素材，未宣稱已完成最終逐幀美術。

離線可攜 ZIP 只包含打包後的原創程式與素材，不包含 Phaser、Vite、Vitest、Playwright 或其他 npm 套件。

預定依賴及上游授權：Phaser 4.2.1 為 [MIT](https://github.com/phaserjs/phaser/blob/master/package.json)；[Vite](https://github.com/vitejs/vite/blob/main/packages/vite/LICENSE.md) 與 [Vitest](https://github.com/vitest-dev/vitest) 為 MIT；[Playwright](https://github.com/microsoft/playwright/blob/main/packages/playwright/package.json) 為 Apache-2.0。依賴目前未安裝，完整傳遞依賴清單與打包授權仍待安裝後確認。
