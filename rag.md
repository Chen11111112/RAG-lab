這裡將您提供的資料整理為適合語意檢索與 RAG（Retrieval-Augmented Generation）Embedding Chunking（文本切塊）的格式。

在 Embedding 切塊實務中，為了確保向量檢索的高精準度與語意完整性，本整理遵循以下原則：

1. **單一語意獨立性**：每個 Chunk 控制在 400～800 字之間，確保檢索時不會跨主題混淆。
2. **脈絡前綴補全（Context Header Enrichment）**：為每一個 Chunk 補上「文檔來源」、「主題大綱」與「關鍵字」，解決向量搜尋時缺少上下文的盲點。
3. **消除雜訊與格式標準化**：去除冗餘的表格語法，將數據轉化為內聯鍵值對或條列式，並統一採用 Markdown 結構。

---

# 📚 Scrum 與敏捷知識庫（Chunking 格式化版本）

---

### [CHUNK-001]

* **Doc Source**: Scrum 敏捷框架入門 (v1, 2026/9/4)
* **Section**: 元數據與著作權聲明
* **Keywords**: Scrum, 敏捷框架, Atlassian, Hy.C 陳毓, 版權聲明

#### 內文：

本文件為《Scrum 敏捷框架入門 Introduction to the Scrum Agile Framework》（版本：2026/9/4 - v1），由 Hy.C 陳毓編著。

* **依據來源**：敏捷宣言 (Agile Manifesto)、less.works、scrum.org、Atlassian 敏捷方法論官方文獻。
* **主要對象**：多團隊高效協作密技（Large Scale Scrum）、專案團隊、Scrum 團隊與管理者。
* **著作權條款**：Copyright © Hy.C 陳毓 CC BY-NC-SA 4.0｜禁止商業用途、轉載須標記出處、改編作品必須在相同條款下分享。

---

### [CHUNK-002]

* **Doc Source**: Scrum 敏捷框架入門
* **Section**: 一、Scrum 的起源與敏捷核心思維
* **Keywords**: Scrum, 漸進式開發, 經驗主義, 透明度, 檢視, 適應, 瀑布式比較

#### 內文：

Scrum 是當今敏捷方法論 (Agile Methodology) 中最受歡迎且被廣泛應用的漸進式產品開發框架。Scrum 的本質是一個輕量級的框架 (Lightweight Framework)，不提供死板的指令，而是通過一組簡單的核心角色、儀式和工件，協助團隊在面對複雜和不確定的專案環境時，進行高效的自我管理、持續交付與快速適應。

相較於傳統「瀑布式 (Waterfall)」各部門在隔絕環境下埋頭苦幹、最後才進行大交接的架構，Scrum 跨功能團隊的並行運作與頻繁交付，使團隊能以最低代價將市場變更與客戶反饋融入下一個迭代。

Scrum 建立在**經驗主義 (Empiricism) 的三大核心支柱**之上：

1. **透明度 (Transparency)**：專案的所有資訊、進度與阻礙對所有人完全公開，確保團隊、PO 與利益關係人沒有資訊壁壘。
2. **檢視 (Inspection)**：團隊必須定期、頻繁地檢視開發進度、工作增量 (Increment) 與團隊流程，及時發現偏差與潛在問題。
3. **適應 (Adaptation)**：一旦發現進度偏差或收到新反饋，團隊必須立即調整產品待辦清單或開發流程，以確保交付最大價值。

敏捷與 Scrum 的成功，取決於團隊是否真正擁抱「緊密反饋循環 (Tight Feedback Cycles)」與「持續改進」的核心文化。

---

### [CHUNK-003]

* **Doc Source**: Scrum 敏捷框架入門
* **Section**: 二、Scrum 的三大核心角色與職責
* **Keywords**: 角色分工, Product Owner, Scrum Master, Development Team, 產品負責人, 僕人式領導

#### 內文：

Scrum 將團隊精煉為三個核心角色，各司其職、互相制衡並緊密協作：

1. **產品負責人 (Product Owner, PO) - 決定「要做什麼 (What)」**
* **核心專注**：產品價值 & 優先順序。
* **關鍵職責**：定義產品願景、維護產品待辦清單 (Product Backlog)、決定需求優先順序並驗收成果。PO 代表客戶、終端用戶與業務部門的聲音。PO 擁有安排 Backlog 優先順序的絕對決定權。
* **實戰建議**：必須與客戶保持持續合作，確保 Backlog 始終反映真實價值。


2. **Scrum Master (SM) - 團隊的僕人式領導者與守護者**
* **核心專注**：敏捷流程 & 障礙消除。
* **關鍵職責**：促進儀式順暢進行、協助團隊消除阻礙 (Impediments)、保護團隊免受外部干擾。SM 是流程教練，絕非傳統的專案經理；SM 不進行微觀管理，不指派任務，也不承擔進度決策壓力。
* **實戰建議**：絕對不能退化為 micro-management 的管理者，要賦予團隊自主權。


3. **開發團隊 (Development Team) - 決定「如何實現 (How)」**
* **核心專注**：高質量交付 & 技術實現。
* **關鍵職責**：由跨功能專業人員組成的自組織小組，自主決定技術實現路徑，將 Product Backlog 轉化為可工作的產品增量，對交付成果共同承擔責任。開發團隊不設內部頭銜，所有人皆為平等的開發者。
* **實戰建議**：團隊應自我管理與跨功能協作，避免依賴單一專家的孤島效應。



---

### [CHUNK-004]

* **Doc Source**: Scrum 敏捷框架入門
* **Section**: 三、Scrum 的四大活動 (Ceremonies)
* **Keywords**: Scrum 儀式, 衝刺規劃會議, 每日站立會議, 衝刺檢視會議, 衝刺回顧會議, Timebox

#### 內文：

Scrum 通過四個結構化且有時間盒 (Timebox) 限制的儀式，建立穩定的運作節奏 (衝刺週期通常為 1 至 4 週)：

1. **衝刺規劃會議 (Sprint Planning) - 建立承諾與目標**
* 召開時間：衝刺第一天，Timebox 不超過 8 小時。
* 參與者：PO、SM 與開發團隊。
* 內容：挑選高優先級故事，定義明確的衝刺目標 (Sprint Goal)，並將故事拆解成任務放入衝刺待辦清單 (Sprint Backlog)。


2. **每日站立會議 (Daily Standup) - 每日 15 分鐘的對齊與微調**
* 限制時間：15 分鐘內，每日召開，由開發團隊主導。
* 內容：成員分享昨天的完成項目、今天的計畫以及遇到的阻礙。站會並非向管理者匯報的狀態會議，而是自我管理與對齊的協調工具。


3. **衝刺檢視會議 (Sprint Review) - 產品增量展示與反饋收集**
* 召開時間：衝刺結束時。
* 內容：向 PO 與利益關係人展示符合「完成定義 (DoD)」的可運作成果，收集真實反饋以即時調整 Product Backlog。


4. **衝刺回顧會議 (Sprint Retrospective) - 持續改進的引擎**
* 召開時間：衝刺最後召開，全隊 (PO, SM, 開發團隊) 參與。
* 內容：反思人際協作、流程與工具。討論優點與痛點，並制定出 1-2 項在下期衝刺中落地的具體改善行動 (Action Items)。



---

### [CHUNK-005]

* **Doc Source**: Scrum 敏捷框架入門
* **Section**: 四、Scrum 的三大核心工件 (Artifacts)
* **Keywords**: 工件, Product Backlog, Sprint Backlog, Product Increment, 完成定義, DoD

#### 內文：

Scrum 定義了三個工件，用以在各個儀式中提供高度的透明度：

1. **產品待辦清單 (Product Backlog) - 需求的單一動態來源**
* 由 PO 維護與排序的動態需求清單，會隨客戶反饋、技術發展與市場變化持續演進與細化 (Refinement/Grooming)。


2. **衝刺待辦清單 (Sprint Backlog) - 本期衝刺的具體任務**
* 由開發團隊在衝刺規劃中承諾完成的項目，是開發團隊的即時工作清單，會在衝刺期間隨時更新。


3. **產品增量 (Product Increment) - 潛在可交付的成果物**
* 每次衝刺結束時交付的具體成果，必須符合「完成定義 (Definition of Done, DoD)」。DoD 是團隊對質量的共識標準，確保增量隨時可以安全發布給終端用戶。



---

### [CHUNK-006]

* **Doc Source**: Scrum 敏捷框架入門
* **Section**: 五、敏捷指標與實戰應用 (Metrics & Tools)
* **Keywords**: Velocity, 速率, Burndown Chart, 燃盡圖, Scrum of Scrums, 遠端敏捷, Confluence, DoD

#### 內文：

Scrum 導入核心數據指標與管理實踐以客觀檢視進度：

* **速率 (Velocity)**：團隊單個衝刺平均完成的故事點數 (Story Points)。速率是歷史數據，用於預估未來產能與規劃產品路線圖，嚴禁用於績效考核與懲罰。
* **燃盡圖 (Burndown Chart)**：每日更新，追蹤剩餘工作量 (y 軸) 隨時間 (x 軸) 遞減趨勢，用以提早發現進度落後或範圍蔓延 (Scope creep)。
* **大規模敏捷擴展 - Scrum of Scrums (SoS)**：當多團隊協同開發時，各隊派出代表 (通常為 SM 或資深開發者) 定期召開 SoS 會議，焦點為協調技術相依性 (Dependencies)、對齊集成標準並消除跨團隊阻礙。
* **遠端與分散式團隊敏捷法則**：
1. 非同步溝通與文檔化：將決策與規格清楚記錄於 Confluence。
2. 數位看板與自動化：使用 Scrum Board 與自動化狀態變更。
3. 信任文化：不考核工時，以符合 DoD 的「實際產品增量」衡量效能。


* **完成定義 (DoD) 的重要性**：未達 DoD 的代碼皆為技術債，敏捷強調持續、高質量、可預測的交付。

---

### [CHUNK-007]

* **Doc Source**: 五大敏捷因素：團隊雷達 (2026/9/6)
* **Section**: 團隊動力研究與社會生產力 (Social Productivity)
* **Keywords**: 團隊動力, VSEs, 極小型軟體企業, 社會生產力, 動機, 社會資本

#### 內文：

本篇研究由 Hy.C 陳毓整理，基於 Basri, Yilmaz, Stettina, Moe, Salas, Pearce 等學者文獻：

* **極小型企業 (VSEs) 團隊動力學** (Basri & O'Connor, 2011)：
* 對愛爾蘭 VSEs (1-25人) 研究發現，其組織結構扁平且無固定階級，溝通高度非正式（喝咖啡討論、短站會、Skype/Email）。
* 依賴同儕編程 (Pair Programming) 與資深指導，流程演進多為 ad-hoc 驅動。雖然小團隊凝聚力強，但員工惰性與隨意變更為潛在隱憂。


* **社會生產力 (Social Productivity) 模型** (Yilmaz & O'Connor, 2011)：
* 定義：在最大化社會關係的前提下，軟體開發的生產速率。
* 關鍵因子：動機 (Motivation, 0.87) 與過程 (0.79) 是生產力最強觀測因子。資訊意識 (0.85)、溝通 (0.85)、集體成果 (0.76) 與團隊領導 (0.73) 是社會生產力強指標。
* **核心學術發現**：社會資本與軟體實際生產力呈極高正相關 (0.90 與 0.86)。關注團隊內部社會關係、透明溝通與定期會議，可直接顯著提升實際生產力。



---

### [CHUNK-008]

* **Doc Source**: 五大敏捷因素：團隊雷達
* **Section**: 印象管理問題與團隊雷達工具背景
* **Keywords**: 包裝性管理, 印象管理, Impression Management, 防禦機制, 團隊雷達, 自我反思

#### 內文：

隨著敏捷開發將決策權轉向「協作式自組織團隊」，生產力與創新力高度依賴於人際互動與社會資本。

然而在真實企業環境中，敏捷團隊為保護自己免受管理層指責，常發展出「包裝性管理 (Impression Management)」的病灶：

* 成員刻意向外部營造「團隊運作完美、毫無問題」的假象。
* 此種報喜不報憂的防禦機制會導致團隊在 Retrospective (回顧會議) 中失敗，無法坦誠討論痛點與學習，阻礙持續改進。

為了打破沉默，Stettina 等人借鑑心理學「五大性格特質 (Big Five)」，開發出匿名的定量評估工具——**「五大敏捷因素團隊雷達」**，協助團隊進行客觀的自我反思 (Self-reflection)。

---

### [CHUNK-009]

* **Doc Source**: 五大敏捷因素：團隊雷達
* **Section**: 五大敏捷因素的核心維度與定義 (1-3)
* **Keywords**: 共享領導力, 團隊導向, 冗餘性, 跨功能多專長, Backup Behavior, 備援行為

#### 內文：

影響敏捷團隊自組織與防障能力的五大核心維度（前三項）：

1. **共享領導力 (Shared Leadership)**
* **定義**：領導權與決策權不固化於單一主管或架構師，而是根據任務當下所需知識與能力，在成員間動態輪轉與分享。
* **警示**：傳統強勢主管包攬決策會使成員產生挫折與不問責心態；缺乏決策對齊則會導致自組織陷入混亂。


2. **團隊導向 (Team Orientation)**
* **定義**：團隊目標高於個人目標。透過高頻率非正式溝通與建設性反饋促進凝聚力，對抗「社會懈怠 (Social Loafing)」、「責任分散」與「傻瓜效應 (Sucker Effects)」。
* **警示**：缺乏團隊導向時，成員以個人利益優先，不願協助同儕，團隊退化為個體集合。


3. **冗餘性 / 跨功能多專長 (Redundancy / Multi-skilling)**
* **定義**：等同 Salas 模型中的「備援行為 (Backup Behavior)」。成員具備多元技能 (Multiskilling)，在同儕遇瓶頸或請假時能無縫轉移負載與互助。
* **警示**：高度專業分工且缺乏冗餘性時（如僅單一成員懂核心模組），關鍵人員離職或下線將使該組件成為系統瓶頸。



---

### [CHUNK-010]

* **Doc Source**: 五大敏捷因素：團隊雷達
* **Section**: 五大敏捷因素的核心維度與定義 (4-5)
* **Keywords**: 持續學習, 自主權, 團隊自組織, 外部干擾, Retrospective

#### 內文：

影響敏捷團隊自組織與防障能力的五大核心維度（後兩項）：

4. **持續學習 (Learning)**
* **定義**：源自「多重學習 (Multi-learning)」。團隊在發現瓶頸或缺陷時，主動跨學科獲取知識、檢視自我，並修訂營運規則與規範的自適應能力。
* **警示**：缺乏學習機制的團隊會重演錯誤。常見原因為將 Retrospective 會議當作抱怨大會或形式工作，未將痛點轉化為具體的改善行動計畫 (Action Plan)。


5. **自主權 (Autonomy)**
* **定義**：團隊能獨立規制與調控衝刺內的工作規劃，免受外部主管、利益關係人的干預與直接控制。這是自組織的最核心前提。
* **警示**：缺乏自主權（如主管任意抽調人手、強塞需求或修改優先級）會徹底破壞團隊心理安全感與承諾，導致高加班、高 Bug 率與成員倦怠 (Burnout)。



---

### [CHUNK-011]

* **Doc Source**: 五大敏捷因素：團隊雷達
* **Section**: 全球 8 個 Scrum 團隊實驗數據與導讀
* **Keywords**: 團隊雷達實驗, 實證數據, 自主權低迷, 團隊共識度, 變異數

#### 內文：

Stettina & Heijstek (2011) 對全球 13 國 79 名敏捷從業者及 8 個代表性 Scrum 團隊進行調查（成員包含開發者 47%、SM 18%、PO 8%、QA 6% 等）。

**全球團隊雷達數據與趨勢總結**：

* **核心數據趨勢**：在所有團隊中，**「自主權 (Autonomy)」的分數普遍最低**，而「持續學習 (Learning)」與「團隊導向 (Team Orientation)」分數普遍最高。
* **組織性病灶（自主權低迷）**：即使在高度對齊的 T1 團隊，自主權僅 3.50；T6 團隊更跌至 2.78。這顯示外部主管隨意抽調資源或干擾衝刺決策，是破壞自組織承諾與引發倦怠的主因。
* **冗餘性面臨抗拒**：冗餘性分數普遍第二低，成員常認為跨領域學習是浪費資源，導致「專業孤島」。
* **團隊共識度 (回答變異數 $\sigma^2$)**：
* 高度同地協作 (Collocated) 且規劃緊密的團隊（如 T1, T7），其變異數極低 ($\sigma^2$ 為 0.06 與 0.08)，對現狀共識極高。
* 多地點、角色邊界過於固化的團隊（如挪威 T4 $\sigma^2=0.33$、紐西蘭 T8 $\sigma^2=0.25$），內部出現顯著認知分裂。



---

### [CHUNK-012]

* **Doc Source**: 五大敏捷因素：團隊雷達
* **Section**: 六、團隊雷達評估方法與量化公式
* **Keywords**: Likert 量表, 反向扣分題, 團隊共識度公式, 變異數, Variance, 認知對齊

#### 內文：

為克服團隊「印象管理」與不好意思當面糾正同儕的盲區，標準化評估機制如下：

1. **線上匿名問卷與 Likert 量表設計**：
* 定期（建議每兩個月）進行匿名問卷。包含 18 個以「我感覺… (I feel)」開頭的陳述句，採用 standard 5 點 Likert 量表 (1=強烈反對 ~ 5=強烈同意)。
* **防偽裝設計**：加入「反向扣分題」（如：「我感覺成員會在不諮詢他人下做重要決策」），以篩選出真實隱憂，避免全員勾選強烈同意。


2. **團隊共識度（變異數 $\sigma^2$）計算公式**：
* 公式：
$$\sigma^2 = \frac{\sum (X - \mu)^2}{N}$$



（$X$ 為單員評分，$\mu$ 為團隊平均值，$N$ 為有效問卷份數）。
* **解讀標準**：
* $\sigma^2 = 0$：代表團隊完全達成 100% 絕對共識。
* $\sigma^2 > 0.25$：代表團隊內部出現顯著認知分裂，必須在 Retrospective (回顧會議) 中提出進行深度對齊。





---

### [CHUNK-013]

* **Doc Source**: 系統分析與開發實踐手冊 (2026/9/7)
* **Section**: 一、破題與需求定義
* **Keywords**: 需求定義, User Story, Essential Use Cases, 80/20法則, Timeboxing, 時間盒

#### 內文：

本手冊由 Hy.C 陳毓整理，取材自 Alan Dennis 等人《SYSTEMS ANALYSIS & DESIGN An Object-Oriented Approach with UML》，適用於黑客松與快速開發。

**需求定義階段的三大原則**：

1. **撰寫「使用者故事 (User Stories)」**：使用便利貼卡片寫下「作為 [角色]，我想要 [功能]，以便於 [創造價值]」。必須寫出非功能性需求（如：Demo 載入資料需在 2 秒內完成）。
2. **篩選「核心交易 (Essential Use Cases)」**：奉行 80/20 法則（使用者 80% 時間僅用 20% 功能）。無情剔除 80% 的「有了會更好 (Nice-to-have)」次要功能，僅保留 20% 能解決業務痛點的「止痛藥功能 (Painkillers)」。
3. **強制執行「時間盒 (Timeboxing)」**：截止時間絕對不可變動。若發現無法按時完成，絕不延後時間，而是採取**調降功能範圍 (De-scope)**，將次要功能移至 Backlog，確保 MVP 準時交付。

---

### [CHUNK-014]

* **Doc Source**: 系統分析與開發實踐手冊
* **Section**: 二、架構設計與平行分工
* **Keywords**: 系統分層, HCI, Problem Domain, Data Management, Stubs, 椿程式, Mock Data, 拋棄式原型

#### 內文：

為實現前端、後端與資料庫人員完全平行開發，架構設計規範如下：

1. **建立系統分層 (Layers) 與模組化**：
* **人機互動層 (HCI Layer)**：前端頁面、UI 控制器。
* **問題領域層 (Problem Domain Layer)**：核心業務邏輯與實體，嚴禁含有特定 SQL 語法或 UI 代碼。
* **資料管理層 (Data Management Layer)**：負責將物件持久化到資料庫，或對應到 Mock Data。


2. **善用「椿程式 (Stubs)」避免等待**：
* 後端在 Data Management Layer 撰寫 Stub（佔位符），寫死 (Hardcoded) 回傳預設 JSON/Mock Data。前端可立刻串接 API 渲染畫面，後端同步於 Problem Domain 層寫邏輯，無需互相等待。


3. **避開「研究型開發」**：
* 避免在限時專案中臨時引入不熟悉的「尖端技術 (Bleeding-edge tools)」。應選擇團隊最熟悉的技術棧；若必須引入新技術，需先建立「拋棄式設計原型 (Throwaway Design Prototype)」進行試探。



---

### [CHUNK-015]

* **Doc Source**: 系統分析與開發實踐手冊
* **Section**: 三至六、建置測試、Demo 流程與 Stubs 範例
* **Keywords**: KISS 原則, 代碼凍結, Code Freeze, 定向使用案例測試, Demo 流程, Python Stub 範例

#### 內文：

**並行建置與測試 Demo 實務**：

* **程式碼控制與 KISS 原則**：實施 Git 分支管理與 Code Review。貫徹 KISS 原則，不進行過度設計 (Over-engineering) 或提早優化效能。
* **代碼凍結 (Code Freeze) 與環境隔離**：Demo 前 1-2 小時凍結代碼，隔離 Dev 與 Prod/Demo 環境。 Prod 環境發現 Bug 嚴禁現場 Hot-fix，必須在 Dev 修改驗證後才同步至 Prod。
* **定向使用案例測試 (Use-case Testing)**：依照 Demo 3-5 分鐘劇本，針對簡報者會點擊的按鈕與預設資料進行反覆驗證。

**Demo 流程四階段**：

1. 開場與鋪陳：背景說明與提問規則設定。
2. 核心演示：價值導向（先示核心價值，再講細節），說故事而非讀說明書。留 5-10 秒空白讓觀眾吸收；若出錯簡單解釋並迅速跳轉，切勿現場 Debug。
3. 互動與問答：主動引導反饋；誠實回答未開發功能的時間規劃。

**Python Stub 實現範例**：

```python
# Repository 層 Stub 範例
class BookRepository:
    def get_all_books(self):
        # Stub: 寫死 Mock Data，不連資料庫
        return [
            {"id": 1, "title": "Clean Code", "author": "Robert C. Martin", "available": True},
            {"id": 2, "title": "Design Patterns", "author": "Erich Gamma", "available": False}
        ]

```

---

### [CHUNK-016]

* **Doc Source**: Scrum@Scale (SaS) 框架實戰導讀指南 (2026/9/5)
* **Section**: 一與二、S@S 起源、哲學與參考模型
* **Keywords**: Scrum@Scale, Jeff Sutherland, 線性可擴展性, 商業敏捷性, 最小可行官僚機構, MVB, 參考模型

#### 內文：

Scrum@Scale (S@S) 由 Scrum 共同創始人 Dr. Jeff Sutherland 開發，旨在讓多團隊網絡在遵循 Scrum 指南下處理複雜問題。

**S@S 的核心目標與哲學**：

1. **解決規模化兩大病灶**：防止團隊增多導致的「生產力與品質衰退」（溝通開銷大、依賴性高）以及「傳統層級管理失效」。
2. **兩大核心目的**：
* **線性可擴展性 (Linear Scalability)**：交付成果隨團隊增加呈比例線性成長。
* **商業敏捷性 (Business Agility)**：快速適應並調整穩定配置。


3. **最小可行官僚機構 (Minimum Viable Bureaucracy, MVB)**：以最少限度的治理組織與流程，將決策延遲 (Decision Latency) 降至最低。
4. **參考模型 (Reference Model)**：規模化起點。先由少數團隊建立能流暢交付整合增量的參考模型，作為複製與擴充的 prototype，並在小規模時修正工程或政策缺陷。

---

### [CHUNK-017]

* **Doc Source**: Scrum@Scale (SaS) 框架實戰導讀指南
* **Section**: 三、Scrum Master 循環與 EAT 樞紐
* **Keywords**: Scrum Master 循環, SoS, Scaled Daily Scrum, SDS, SoSM, EAT, 執行行動團隊, 敏捷作業系統

#### 內文：

Scrum Master 循環專注於流程、持續改進與障礙排除（解決「HOW to」工作）：

* **Scrum of Scrums (SoS)**：最佳團隊組成數為 4 到 5 個團隊 (平均 4.6 人)。SoS 需在每期衝刺交付完全整合且潛在可發布的增量。大規模時可再擴展為 SoSoS。
* **關鍵規模化事件**：
* **Scaled Daily Scrum (SDS)**：15 分鐘內，各隊代表參加，核心為檢查跨團隊依賴與排除阻礙。
* **Scaled Retrospective**：各隊 SM 聚集，分享改進實驗結果並推廣成功標準。


* **Scrum of Scrums Master (SoSM)**：SoS 的領導者，對多團隊聯合發布負責，致力於降低成本、提升吞吐量與消除依賴。
* **運作樞紐：執行行動團隊 (Executive Action Team, EAT)**：
* **定位**：最高層級的 Scrum Master 團隊，負責建立組織的「敏捷作業系統」。
* **權力保障**：必須由具備**政治與財務實權**的人員組成，才能消除跨部門與政策阻礙。
* **翻譯層功能 (Translation Layer)**：制定營運指南，作為敏捷團隊與傳統非敏捷部門間的協調翻譯。
* **運作方式**：EAT 本身也是一個 Scrum 團隊，維護一份動態的 EAT Backlog。



---

### [CHUNK-018]

* **Doc Source**: Scrum@Scale (SaS) 框架實戰導讀指南
* **Section**: 四、Product Owner 循環與 EMS 樞紐
* **Keywords**: Product Owner 循環, PO Team, CPO, 首席產品負責人, EMS, 執行元 Scrum 會議, Shared Common Backlog

#### 內文：

Product Owner 循環專注於產品戰略、願景與 Backlog 優先順序（解決「WHAT to」工作）：

* **PO Team (PO 團隊)**：由各隊 PO 組成，共同維護一份**共享的共同待辦清單 (Shared common backlog)**，橫向同步優先級。各隊 PO 仍保有自家 Sprint Backlog 的管轄權。
* **首席產品負責人 (Chief Product Owner, CPO)**：領導 PO 團隊，設定總體產品願景，建立單一排序的 Backlog，並主持 EMS 會議。
* **運作樞紐：執行元 Scrum 會議 (Executive MetaScrum, EMS)**：
* **定位**：PO 循環的最高決策樞紐，由 CPO、各隊 PO、高階主管 (Executives) 與利益關係人組成。
* **核心職能**：主管談判 Backlog 優先級、修改預算與重組團隊的**唯一官方論壇**。高階主管不得於衝刺期間在 EMS 之外隨意發布指令。每期衝刺至少召開一次。


* **PO 循環四大元素**：1. 戰略願景 $\rightarrow$ 2. Backlog 優先級 $\rightarrow$ 3. 待辦清單拆解與精煉 $\rightarrow$ 4. 發布規劃 (Release Planning)。

---

### [CHUNK-019]

* **Doc Source**: Scrum@Scale (SaS) 框架實戰導讀指南
* **Section**: 五與六、雙軌交會點、數據指標與對照矩陣
* **Keywords**: S@S 雙軌交會, 生產力, 價值交付, 質量, 可持續性, 決策延遲, S@S 對照表

#### 內文：

**雙軌循環 (SM 循環 vs PO 循環) 的三交會點與四數據指標**：

* **三大交會點**：
1. **團隊運作流程 (Team Process)**：兩軌共同作用於團隊，提升效能。
2. **回饋機制 (Feedback)**：增量交付後，PO 收集「產品回饋」調整 Backlog，SM 收集「發布回饋」改進工程實踐。
3. **指標與透明度 (Metrics & Transparency)**：以極致透明降低決策延遲。


* **四大核心衡量維度**：
1. **生產力 (Productivity)**：衝刺中符合 DoD 的增量數量趨勢。
2. **價值交付 (Value Delivery)**：單位付出獲得的商業價值回報。
3. **質量 (Quality)**：缺陷率 (Defect Rate) 與停機時間。
4. **可持續性 (Sustainability)**：成員幸福度與工作滿意度。



**SM 循環與 PO 循環對照簡表**：

* **SM 循環 (How)**：關注敏捷作業系統流程與持續改進；最高樞紐為 EAT (具實權排除組織障礙)；關鍵角色為 SoSM/SoSoSM；事件為 SDS 與 Scaled Retrospective。
* **PO 循環 (What)**：關注產品願景、Backlog 排序與發布規劃；最高樞紐為 EMS (預算與優先級談判)；關鍵角色為 CPO；事件為 Executive MetaScrum 與 Scaled Review。

---

### [CHUNK-020]

* **Doc Source**: 敏捷基礎導讀與實戰情境手冊 (2026/9/4)
* **Section**: 一、敏捷宣言與核心思維轉變
* **Keywords**: 敏捷宣言, Agile Manifesto, 敏捷四大核心價值, 跨功能團隊

#### 內文：

敏捷方法論 (Agile Methodology) 誕生於 2001 年敏捷宣言 (Agile Manifesto)，是以人為本、強調適應力與持續進步的思維模式。它打破了瀑布式 (Waterfall) 各部門獨立運作與遞交的模式，提倡跨功能協同團隊。

**敏捷宣言四大核心價值 (Agile Core Values)**：

1. **個人與互動 (Individuals & Interactions)** 重於 流程與工具 (Processes & Tools)
2. **可運作的解決方案 (Working Solutions)** 重於 詳盡的檔案 (Comprehensive Documentation)
3. **客戶合作 (Customer Collaboration)** 重於 契約談判 (Contract Negotiation)
4. **回應變化 (Responding to Change)** 重於 遵循計劃 (Following a Plan)

**核心結論**：真實的人際互動與團隊合作比工具更關鍵；為客戶解決實際痛點並產出可工作軟體，遠勝過無效的規格檔案。