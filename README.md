# 小小英雄冒險王國 (Little Idiom Heroes)

針對台灣國小三、四年級設計的網頁版遊戲化學習平台。把成語、自然、數學等課本內容包裝成 12 種小遊戲，讓孩子用「闖關 + 收集星星」的方式邊玩邊複習。

無框架純 ES6 模組，整個專案不需建置工具，丟到任何靜態網頁伺服器就能跑。

---

## 目錄

- [快速開始](#快速開始)
- [整體架構](#整體架構)
- [使用者流程](#使用者流程)
- [檔案結構](#檔案結構)
- [核心模組](#核心模組)
- [資料模型](#資料模型)
  - [textbooks.json](#textbooksjson)
  - [world-config.json](#world-configjson)
  - [題庫檔（data/{subject}/*.json）](#題庫檔)
- [新增內容的做法](#新增內容的做法)
  - [新增一本課本](#新增一本課本)
  - [新增章節 / 關卡](#新增章節--關卡)
  - [問題類型參考](#問題類型參考)
- [遊戲列表](#遊戲列表)
- [錯題檢討](#錯題檢討)
- [校對模式（隱藏功能）](#校對模式隱藏功能)
- [儲存的本地資料](#儲存的本地資料)
- [常見維護任務](#常見維護任務)

---

## 快速開始

不需要 npm install。在專案根目錄起一個靜態檔伺服器即可：

```bash
# 任選一種
npx serve .
python3 -m http.server 8000
```

然後打開 `http://localhost:8000`。

> 不能直接 file:// 開啟，因為 ES6 模組與 fetch 都需要 HTTP context。

---

## 整體架構

```
┌─────────────────────────────────────────────┐
│ index.html  ──  載入 css/* 與 js/app.js     │
└─────────────┬───────────────────────────────┘
              │ App 啟動
              ▼
   ┌──────────────────────────────────┐
   │  ScreenManager                    │  ←─── 切換畫面（Title / TextbookSelect / WorldMap / ...）
   ├──────────────────────────────────┤
   │  ContentLoader   （fetch + cache）│
   │  GameRegistry    （遊戲定義表）   │
   │  GameSelector    （挑遊戲）       │
   │  AudioManager    （BGM / SFX）    │
   │  Progress        （星星 / 解鎖）  │  ←─── localStorage 持久化
   │  Settings        （使用者設定）   │  ←─── localStorage 持久化
   └──────────────────────────────────┘
```

設計重點：

- **資料驅動**：關卡內容由 `data/world-config.json` + 各題庫 JSON 描述，不需要改 JS。
- **Screen-based MVC**：每個畫面是一個 class（`enter`/`exit`），由 `ScreenManager` 統一切換。
- **遊戲與資料分離**：遊戲只負責「給我一組題目陣列」，題庫格式統一，不同遊戲都吃同樣的資料。

---

## 使用者流程

```
標題 (Title)
   │
   ├─ 開始冒險 ──────► 選課本 (TextbookSelect)
   │                       │
   │                       └─► 章節地圖 (WorldMap)
   │                              │
   │                              └─► 關卡介紹 (LevelIntro)
   │                                     │
   │                                     └─► 遊戲 (Game)
   │                                            │
   │                                            └─► 結算 (Result)
   │                                                   │
   │                                                   └─► 回到地圖
   │
   ├─ 考前練習區 ────► ExamPractice ──► Game ──► Result
   │
   └─ ⚙ (隱藏) ─────► Settings ──► ContentReview（題目校對）
```

`Title → TextbookSelect → WorldMap` 是新版三層導覽：

- **TextbookSelect** 把 `world-config.zones` 依 `textbookId` 分組成「課本卡」。每張卡可能對應多個 zone（章節）。
- **WorldMap** 接收 `textbookId`，只渲染屬於該課本的章節分頁。

---

## 檔案結構

```
.
├── index.html                  入口
├── audio/                      音樂與音效（BGM_*.mp3, SFX_*.mp3）
├── css/
│   ├── main.css                共用樣式（按鈕、動畫、提示燈泡）
│   ├── title.css               標題畫面
│   ├── textbook-select.css     選課本畫面
│   ├── world-map.css           章節地圖
│   ├── settings.css            設定
│   ├── content-review.css      題目校對（隱藏功能）
│   ├── result.css              結算畫面
│   ├── exam-practice.css       考前練習
│   └── games/                  各遊戲樣式
├── data/
│   ├── textbooks.json          課本後設資料
│   ├── world-config.json       章節 / 關卡定義 + 考前練習區
│   ├── assets/                 art-manifest / audio-manifest
│   ├── chinese/                國文題庫（成語）
│   ├── science/                自然題庫
│   ├── english/                英文題庫
│   └── math/                   數學題庫
├── img/                        圖片（角色、場景）
└── js/
    ├── app.js                  入口控制器
    ├── core/                   無 UI 的核心模組
    │   ├── screen-manager.js
    │   ├── content-loader.js
    │   ├── game-registry.js
    │   ├── game-selector.js
    │   ├── audio-manager.js
    │   ├── progress.js
    │   └── settings.js
    ├── screens/                每個畫面一個檔
    │   ├── title-screen.js
    │   ├── textbook-select.js
    │   ├── world-map.js
    │   ├── level-intro.js
    │   ├── result-screen.js
    │   ├── settings-screen.js
    │   ├── content-review.js   題目校對畫面
    │   └── exam-practice-screen.js
    └── games/                  12 個遊戲，每個 extends BaseGame
```

---

## 核心模組

### `ScreenManager` — `js/core/screen-manager.js`
極簡的畫面切換器。每個畫面物件實作 `async enter(container, data)` 與 `async exit()`。`switchTo(name, data)` 會清空容器再 `enter`。

### `ContentLoader` — `js/core/content-loader.js`
- `load(path)`：fetch `data/{path}` 並快取。
- `prepareQuestions(content, challenge)`：依 `challenge.questionType` 過濾、依 `questionCount` 抽題、依 `answerMode === 'pair-select'` 去重答案、依題型補上選項（從題庫其他答案當干擾項）。
- `_normalizeQuestion`：把不同題型統一成一致的物件結構。

### `GameRegistry` + `GameSelector`
`GameRegistry` 是 12 個遊戲的靜態定義表，每個遊戲標明支援哪些 `questionType` / `answerMode`。`GameSelector.resolve(challenge)` 會挑出實際要跑的遊戲：

- `selectionMode: 'fixed'` → 直接用 `gameId` 指定的遊戲。
- 其他 → 從 `getCompatible()` 撈出相容的遊戲，再依 `weight` 隨機。

### `Progress`
記錄每個 `challengeId` 的星星數，提供 `isUnlocked(id, unlockRequire)` 給 WorldMap 判斷鎖頭顯示。資料存 `localStorage` key `little-heroes-progress`。

### `Settings`
玩家設定（提示開關、計時、題目數量覆寫、考前練習出全部、錯題檢討開關、`developerMode`）。資料存 `localStorage` key `little-heroes-settings`。

### `AudioManager`
依 `data/assets/audio-manifest.json` 載入 BGM / SFX。BGM 可依 `themeElement` 切換氛圍音樂（fire / water / earth / lightning）。

---

## 資料模型

### `textbooks.json`

定義所有課本的後設資料。新增課本時加一筆即可：

```json
{
  "schemaVersion": 1,
  "textbooks": [
    {
      "textbookId": "tw-g3-s2-chinese-final",
      "grade": "國小三年級",
      "term": "下學期",
      "subject": "國文",
      "displayName": "三下成語期末複習",
      "themeElement": "fire"
    }
  ]
}
```

| 欄位 | 用途 |
|---|---|
| `textbookId` | 課本主鍵，被 zone 與題庫檔反向參照 |
| `displayName` | TextbookSelect 卡片上的標題 |
| `themeElement` | `fire` / `water` / `earth` / `lightning`，影響卡片邊框色與 BGM 風格 |

### `world-config.json`

關卡藍圖。`zones` 是按課本分組的章節，`examPractice` 是獨立的考前練習區。

```jsonc
{
  "schemaVersion": 2,
  "zones": [
    {
      "id": "zone-final-flame-1",
      "name": "成語期末（一）",
      "icon": "🔥",
      "description": "三下成語期末複習（一）。",
      "themeElement": "fire",
      "textbookId": "tw-g3-s2-chinese-final",
      "enabled": true,
      "challenges": [
        {
          "id": "z3-1",
          "name": "成語闖關",
          "selectionMode": "fixed",      // 或省略改用相容性自動配對
          "gameId": "boss-fight",         // selectionMode=fixed 時必填
          "questionType": "choice",       // choice / true-false / fill-blank / multi-select / ordering
          "answerMode": "drag-select",    // 與所選遊戲的支援模式相對應
          "content": "chinese/g3-s2-final-1.json",  // 相對 data/ 的題庫路徑
          "questionCount": 10,
          "unlockRequire": null            // 或前一關的 challenge.id；首關用 null
        }
      ]
    }
  ],
  "examPractice": {
    "title": "考前練習區",
    "challenges": [ /* 同上格式，但會略過 questionCountOverride */ ]
  }
}
```

重要規則：

- **同一個 `textbookId` 下的所有 zones** 會在 TextbookSelect 合成一張卡片，進到 WorldMap 後變成多個分頁（章節）。
- **`unlockRequire`** 是線性解鎖：填上一關的 `challenge.id` 就會被鎖到上一關完成。`null` 表示第一關。
- **`enabled: false`** 會在 WorldMap 變灰、不可點。

### 題庫檔

每個科目資料夾下的 JSON。基本架構：

```jsonc
{
  "subject": "chinese",
  "textbookId": "tw-g3-s2-chinese-final",   // 對齊 textbooks.json
  "unit": "三下成語期末複習（一）",
  "version": 1,
  "questions": [
    {
      "id": "g3s2f1-001",                   // 全域唯一，建議用前綴+序號
      "stem": "形容見得多、聽得多而慢慢受到影響",   // 題幹（顯示給玩家）
      "answer": "耳濡目染",                  // 正確答案
      "hint": "他生長在書香世家，從小 _____。", // 例句 / 提示句
      "playerHint": "耳朵聽、眼睛看…",       // 燈泡提示
      "questionCategory": "choice-sampled"   // 純註記，目前不參與邏輯
    }
  ]
}
```

特殊題型額外欄位：

| 題型 | 必要欄位 |
|---|---|
| `true-false` | `answer` 用 `true/false` 或 `'O'/'X'`、`'是'/'否'`；自動轉成 `O/X` |
| `multi-select` | `correctAnswers: []`、`options: []` |
| `ordering` | `correctOrder: []` |
| `fill-blank` | 可額外給 `acceptableAnswers: []`，第一個會當主答案 |
| `choice`（預設） | 不必給 `options`，會從題庫其他答案自動補成 4 選 1 |

`prepareQuestions` 會自動：

1. 依 `questionType` 過濾（沒有相符的會 fallback 全部）。
2. 隨機抽 `questionCount` 題。
3. 為選擇題自動湊滿 4 個選項（題庫其他答案當干擾項）。
4. `answerMode === 'pair-select'`（連連看 / 記憶翻牌）會先依 `answer` 去重，避免兩張同樣的卡。

---

## 新增內容的做法

### 新增一本課本

1. `data/textbooks.json` 加一筆 `textbookId`。
2. `data/{subject}/` 建立題庫 JSON。
3. `data/world-config.json` 加一個或多個 `zone`，`textbookId` 指向新課本。
4. 重新整理瀏覽器，TextbookSelect 會自動冒出新卡片。

### 新增章節 / 關卡

「章節」就是同一個 `textbookId` 下的多個 `zone`；「關卡」就是 `zone.challenges`。

要在現有章節加一關：在該 zone 的 `challenges` 陣列尾巴加一筆，記得：
- 給新關卡一個獨特的 `id`
- `unlockRequire` 設成上一關的 `id`（除非要無解鎖）
- `gameId` 對應的遊戲必須支援你寫的 `questionType` + `answerMode`

可以參考 `js/core/game-registry.js` 看每個遊戲的 `supportsQuestionTypes` / `supportsAnswerModes`。

### 問題類型參考

| `questionType` | 適用遊戲 | 答題互動 |
|---|---|---|
| `choice` | boss-fight, racing, match3, connect, whack-a-mole, fishing, memory-flip, balloon-pop, space-shooter | 4 選 1 |
| `true-false` | boss-fight, racing, bomb-defusal, whack-a-mole, fishing, balloon-pop, space-shooter | O / X |
| `fill-blank` | connect, memory-flip | 配對題目與答案 |
| `multi-select` | lab-experiment | 多選 |
| `ordering` | card-ordering | 排序 |

---

## 遊戲列表

12 個遊戲皆位於 `js/games/`，每個是一個 class，預設 export，和 BaseGame 同介面（`init / start / onComplete / destroy`）。

| ID | 名稱 | 互動 | 支援題型 |
|---|---|---|---|
| `boss-fight` | ⚔️ 魔王戰 | 拖劍攻擊 | choice / true-false |
| `racing` | 🏎️ 賽車問答 | 點選 | choice / true-false |
| `match3` | 💎 寶石消除 | 點選 | choice |
| `connect` | 🃏 連連看 | 配對 | choice / fill-blank |
| `bomb-defusal` | 💣 拆彈專家 | 點選 | true-false |
| `lab-experiment` | 🧪 實驗室 | 多選拖曳 | multi-select |
| `card-ordering` | 🃏 排排站 | 排序 | ordering |
| `whack-a-mole` | 🔨 打地鼠 | 點選 | choice / true-false |
| `fishing` | 🎣 釣魚達人 | 點選 | choice / true-false |
| `memory-flip` | 🃏 記憶翻牌 | 配對 | choice / fill-blank |
| `balloon-pop` | 🎈 氣球射擊 | 點選 | choice / true-false |
| `space-shooter` | 🚀 太空射擊 | 點選 | choice / true-false |

要新增遊戲：
1. 在 `js/games/` 寫一個 class，預設 export，介面與其他遊戲相同。
2. 加進 `js/core/game-registry.js` 的 `GAME_DEFINITIONS`。
3. 加 CSS 到 `css/games/` 並在 `index.html` 引入。

---

## 錯題檢討

關卡結束後，結算畫面下方會自動列出本次答錯的題目，方便孩子複習：每題顯示題幹、正解，以及孩子當下選的錯誤答案（劃刪除線）。

- 設定開關：`設定 → 關卡結束顯示錯題檢討`，預設 **開啟**。
- 對應 `Settings` key：`showWrongAnswerReview`（boolean）。
- 來源：`BaseGame._wrongAnswers` 陣列；每個遊戲在答錯路徑呼叫 `this._recordWrong(question, picked)`，會以 `question.id` 去重。
- 已串接的遊戲：boss-fight、racing、match3、connect、bomb-defusal、lab-experiment、card-ordering、fishing、space-shooter。
- **未串接**（這些遊戲設計上「答錯就再試」，題目最終都會答對，沒有「答錯的題目」可記）：whack-a-mole、balloon-pop、memory-flip。
- 新遊戲若有「答錯後跳下一題」的流程，記得在錯誤分支呼叫 `this._recordWrong(currentQuestion, pickedAnswer)`，自動就能在結算畫面出現。

---

## 校對模式（隱藏功能）

這是給內容維護者使用的後台，**正式環境一般使用者看不到入口**。

### 開啟方法

在標題畫面快速點擊「**小小英雄冒險王國**」logo **5 下**（2.5 秒內）。畫面會顯示「校對模式：已開啟」，右下角的 ⚙ 設定齒輪即出現。再點 5 下可關閉。

設定狀態存於 `localStorage` 的 `little-heroes-settings.developerMode`。

### 校對畫面在做什麼

設定 → 「📖 題目校對」：

1. 列出所有有題庫的課本卡片。
2. 點選後，把該課本下所有 zone 的所有題庫檔載入並列出每一題。
3. 每題顯示：`id`、題型、題幹、正確答案、例句、小提示。
4. 上方搜尋框可即時過濾（搜尋成語、題幹、例句）。

設計目的：方便針對單一課本一次校對所有題目，發現錯字或答案錯誤直接改對應的 `data/{subject}/*.json`，重新整理就生效。

---

## 儲存的本地資料

兩支 `localStorage` key（重置遊戲只要清掉這兩個）：

| Key | 內容 |
|---|---|
| `little-heroes-progress` | 每關星星數、總星星 |
| `little-heroes-settings` | 提示 / 計時 / 題目數量覆寫 / 考前練習設定 / 錯題檢討開關 / `developerMode` |

---

## 常見維護任務

| 想做什麼 | 改哪裡 |
|---|---|
| 修正一題答案 | `data/{subject}/*.json` 的 `questions[*]` |
| 改某關題目數 | `world-config.json` 的 `challenge.questionCount` |
| 換某關用的遊戲 | `world-config.json` 的 `challenge.gameId`（檢查相容性） |
| 解鎖順序調整 | `world-config.json` 的 `challenge.unlockRequire` |
| 把一個 zone 暫時關掉 | `world-config.json` 的 `zone.enabled: false` |
| 新增 BGM / SFX | 把音檔放進 `audio/`，編 `data/assets/audio-manifest.json` |
| 開啟校對後台 | 標題 logo 連點 5 下 |
| 關閉孩子看到的錯題檢討 | 設定 → 關卡結束顯示錯題檢討（預設開） |
| 在新遊戲加入錯題追蹤 | 在錯誤分支呼叫 `this._recordWrong(currentQuestion, pickedAnswer)` |
| 重置玩家進度 | DevTools → Application → Local Storage → 清掉兩個 key |
