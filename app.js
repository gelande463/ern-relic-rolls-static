(() => {
  "use strict";

  const DATA_URL = "./data/ern_effects_export.json";
  const SAMPLE_URL = "./data/selected_relics.txt";
  const STORAGE_KEY = "ern-relic-rolls-web-state-v1";
  const GUIDE_HIDDEN_KEY = "nightreignrelic.hideUsageGuide";
  const MAX_TABLE_ROWS = 240;
  const MAX_COMBO_RESULTS = 300;
  const RESULT_PAGE_SIZE = 50;

  const MODE_LABELS = {
    base_game: "Base Relics",
    deep_night: "Deep Relics",
    base_tfh_dlc: "Base TFH DLC",
    deep_tfh_dlc: "Deep TFH DLC",
  };

  const RELIC_SET_LABELS = {
    ja_JP: {
      "Base Relics": "通常遺物",
      "Deep Relics": "深層遺物",
      "Base relics": "通常遺物",
      "Deep relics": "深層遺物",
      "Base TFH DLC": "通常遺物・DLC含む",
      "Deep TFH DLC": "深層遺物・DLC含む",
    },
    en_US: {
      "Base Relics": "Base relics",
      "Deep Relics": "Deep relics",
      "Base relics": "Base relics",
      "Deep relics": "Deep relics",
      "Base TFH DLC": "Base TFH DLC",
      "Deep TFH DLC": "Deep TFH DLC",
    },
  };

  const LANG_LABELS = {
    en_US: "English",
    ja_JP: "日本語",
    es_ES: "Español",
    ko_KR: "한국어",
    pt_BR: "Português",
    ru_RU: "Русский",
    zh_CN: "简体中文",
    zh_TW: "繁體中文",
  };

  const COLOR_LABELS = {
    all: "全色",
    red: "赤",
    blue: "青",
    yellow: "黄",
    green: "緑",
  };

  const COLOR_ORDER = ["red", "blue", "yellow", "green"];

  const PAGE_COPY = {
    ja_JP: {
      documentTitle: "ナイトレイン遺物検索 | Nightreign Relic Consultor",
      kicker: "ナイトレイン非公式ファンツール",
      title: "ナイトレイン遺物検索",
      description: "エルデンリング ナイトレインの遺物効果、ロール候補、組み合わせを確認できる非公式ツールです。",
    },
    en_US: {
      documentTitle: "Nightreign Relic Consultor",
      kicker: "Unofficial Nightreign fan tool",
      title: "Nightreign Relic Consultor",
      description: "Check relic effects, sample rolls, and useful combinations for Elden Ring Nightreign.",
    },
  };

  const GUIDE_COPY = {
    ja_JP: {
      title: "使い方",
      items: [
        "名前またはキーワードで、利用可能なすべての遺物効果を選択、検索できます。",
        "無効な組み合わせや入手不可能な組み合わせは、除外され絞り込むことが可能。",
        "遺物効果1〜3を選択して神遺物パターンを絞り込むことが可能。",
      ],
      hideNext: "次回から表示しない",
      closeLabel: "使い方を閉じる",
    },
    en_US: {
      title: "How to use",
      items: [
        "Search and select all available relic effects by name or keyword.",
        "Invalid or unobtainable combinations are excluded so you can narrow down valid rolls.",
        "Select relic effects 1–3 to filter possible god-roll relic patterns.",
      ],
      hideNext: "Do not show again",
      closeLabel: "Close usage guide",
    },
  };

  const initialState = {
    data: null,
    effectsByMode: {},
    debuffs: [],
    labelToKey: new Map(),
    activeTab: "search",
    mode: "base_game",
    locale: "ja_JP",
    saved: [],
    register: {
      color: "red",
      name: "",
      effects: [null, null, null],
      debuffs: [null, null, null],
      effectQueries: ["", "", ""],
      debuffQueries: ["", "", ""],
    },
    search: {
      color: "all",
      effects: [null, null, null],
      debuffs: [null, null, null],
      queries: ["", "", ""],
      debuffQueries: ["", "", ""],
    },
    list: {
      query: "",
      scope: "saved",
      color: "all",
    },
    ui: {
      showGeneratedResults: false,
      generatedVisibleCount: RESULT_PAGE_SIZE,
      usageGuideClosed: false,
    },
    toast: "",
  };

  let state = structuredCloneWithoutMaps(initialState);
  state.labelToKey = new Map();
  const app = document.getElementById("app");

  boot();

  async function boot() {
    wireEvents();
    try {
      const data = await fetchJson(DATA_URL);
      const persisted = loadPersisted();
      state = {
        ...state,
        ...persisted,
        data,
      };
      prepareData();
      normalizeStateShape();
      sanitizeSelections();
      render();
    } catch (error) {
      app.innerHTML = `
        <section class="tool-panel">
          <div class="tool-panel-header"><h2>Data Load Error</h2></div>
          <div class="tool-panel-body">
            <div class="status-box invalid">${esc(error.message || String(error))}</div>
          </div>
        </section>
      `;
    }
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${url}: ${response.status}`);
    }
    return response.json();
  }

  function prepareData() {
    const translations = state.data.translations || {};
    const modes = state.data.modes || {};

    state.effectsByMode = Object.fromEntries(
      Object.entries(modes).map(([mode, effects]) => {
        const records = Object.entries(effects).map(([key, meta]) => ({
          key,
          id: String(meta.id || ""),
          group: String(meta.group || ""),
          category: Number.parseInt(meta.cat || "0", 10),
          loc: String(meta.loc || ""),
          cursed: String(meta.cursed || "false").toLowerCase() === "true",
          labels: labelsFor(key, translations),
        }));
        records.sort(compareEffects);
        return [mode, records];
      })
    );

    state.debuffs = Object.entries(state.data.debuffs || {})
      .map(([key, meta]) => ({
        key,
        id: String(meta.id || ""),
        group: String(meta.group || ""),
        category: String(meta.cat || ""),
        loc: String(meta.loc || ""),
        labels: labelsFor(key, translations),
      }))
      .sort(compareEffects);

    state.labelToKey = buildLabelIndex();
  }

  function labelsFor(key, translations) {
    const labels = { en_US: key };
    for (const locale of Object.keys(LANG_LABELS)) {
      if (locale === "en_US") continue;
      labels[locale] = translations[locale]?.[key] || key;
    }
    return labels;
  }

  function buildLabelIndex() {
    const index = new Map();
    const push = (text, key) => {
      const normalized = normalize(text);
      if (normalized && !index.has(normalized)) {
        index.set(normalized, key);
      }
    };

    for (const effects of Object.values(state.effectsByMode)) {
      for (const effect of effects) {
        push(effect.key, effect.key);
        for (const text of Object.values(effect.labels)) {
          push(text, effect.key);
        }
      }
    }
    for (const debuff of state.debuffs) {
      push(debuff.key, debuff.key);
      for (const text of Object.values(debuff.labels)) {
        push(text, debuff.key);
      }
    }
    return index;
  }

  function compareEffects(a, b) {
    const cat = (a.category || 0) - (b.category || 0);
    if (cat !== 0) return cat;
    return label(a).localeCompare(label(b), "ja");
  }

  function render() {
    updatePageCopy();
    const focus = captureFocus();
    persist();
    app.innerHTML = `
      ${renderTopbar()}
      ${renderUsageGuide()}
      ${renderTabs()}
      <section id="view-list" class="view ${state.activeTab === "list" ? "active" : ""}">
        ${renderListView()}
      </section>
      <section id="view-register" class="view ${state.activeTab === "register" ? "active" : ""}">
        ${renderRegisterView()}
      </section>
      <section id="view-search" class="view ${state.activeTab === "search" ? "active" : ""}">
        ${renderSearchView()}
      </section>
      <div class="toast ${state.toast ? "show" : ""}">${esc(state.toast)}</div>
    `;
    restoreFocus(focus);
  }

  function captureFocus() {
    const active = document.activeElement;
    if (!active || !app.contains(active)) return null;
    const action = active.dataset?.action;
    if (!action) return null;
    return {
      action,
      slot: active.dataset.slot || "",
      start: typeof active.selectionStart === "number" ? active.selectionStart : null,
      end: typeof active.selectionEnd === "number" ? active.selectionEnd : null,
    };
  }

  function restoreFocus(focus) {
    if (!focus) return;
    const selector = `[data-action="${CSS.escape(focus.action)}"]${focus.slot ? `[data-slot="${CSS.escape(focus.slot)}"]` : ""}`;
    const next = app.querySelector(selector);
    if (!next) return;
    next.focus({ preventScroll: true });
    if (focus.start !== null && typeof next.setSelectionRange === "function") {
      next.setSelectionRange(focus.start, focus.end);
    }
  }

  function updatePageCopy() {
    const copy = PAGE_COPY[state.locale] || PAGE_COPY.en_US;
    document.title = copy.documentTitle;

    const kicker = document.getElementById("hero-kicker");
    const title = document.getElementById("hero-title");
    const description = document.getElementById("hero-description");

    if (kicker) kicker.textContent = copy.kicker;
    if (title) title.textContent = copy.title;
    if (description) description.textContent = copy.description;
  }

  function appTitle() {
    return state.locale === "ja_JP" ? "ナイトレイン遺物検索" : "Nightreign Relic Consultor";
  }

  function relicSetLabel(labelText) {
    const labels = RELIC_SET_LABELS[state.locale] || RELIC_SET_LABELS.en_US;
    return labels[labelText] || labelText;
  }

  function modeLabel(mode) {
    return relicSetLabel(MODE_LABELS[mode] || mode);
  }

  function guideCopy() {
    return GUIDE_COPY[state.locale] || GUIDE_COPY.en_US;
  }

  function isUsageGuideHidden() {
    return localStorage.getItem(GUIDE_HIDDEN_KEY) === "true";
  }

  function hideUsageGuidePermanently() {
    localStorage.setItem(GUIDE_HIDDEN_KEY, "true");
  }

  function showUsageGuideAgain() {
    localStorage.removeItem(GUIDE_HIDDEN_KEY);
  }

  function renderTopbar() {
    const modes = Object.keys(MODE_LABELS)
      .map((mode) => option(mode, modeLabel(mode), mode === state.mode))
      .join("");
    const locales = Object.keys(LANG_LABELS)
      .map((locale) => option(locale, LANG_LABELS[locale], locale === state.locale))
      .join("");

    return `
      <header class="topbar">
        <div class="title-lockup">
          <img src="./assets/favicon.png" alt="">
          <div class="title-text">
            <h1>${esc(appTitle())}</h1>
            <span>${esc(modeLabel(state.mode))} / ${esc(LANG_LABELS[state.locale])}</span>
          </div>
        </div>
        <div class="toolbar">
          <label class="sr-only" for="mode-select">Mode</label>
          <select id="mode-select" class="compact-select" data-action="mode">${modes}</select>
          <label class="sr-only" for="locale-select">Language</label>
          <select id="locale-select" class="compact-select" data-action="locale">${locales}</select>
        </div>
      </header>
    `;
  }

  function renderUsageGuide() {
    if (state.ui.usageGuideClosed || isUsageGuideHidden()) {
      return "";
    }

    const copy = guideCopy();
    return `
      <section class="usage-guide" aria-labelledby="usage-guide-title">
        <div class="usage-guide-header">
          <h2 id="usage-guide-title">${esc(copy.title)}</h2>
          <button
            type="button"
            class="usage-guide-close"
            data-action="close-usage-guide"
            aria-label="${attr(copy.closeLabel)}"
          >
            &times;
          </button>
        </div>
        <ul class="usage-guide-list">
          ${copy.items.map((item) => `<li>${esc(item)}</li>`).join("")}
        </ul>
        <label class="usage-guide-checkbox">
          <input type="checkbox" data-action="hide-usage-guide-next-time">
          <span>${esc(copy.hideNext)}</span>
        </label>
      </section>
    `;
  }

  function renderTabs() {
    const tabs = [
      ["list", "一覧"],
      ["register", "登録"],
      ["search", "組み合わせ<br>検索"],
    ];
    return `
      <nav class="tabbar" aria-label="Main">
        ${tabs
          .map(
            ([id, text]) => `
              <button class="tab-button" type="button" data-tab="${id}" aria-selected="${state.activeTab === id}">
                ${text}
              </button>
            `
          )
          .join("")}
      </nav>
    `;
  }

  function renderRegisterView() {
    const validation = validateSelection(state.register);
    const isDeep = isDeepMode(state.mode);
    return `
      <div class="split-layout">
        <section class="tool-panel">
          <div class="tool-panel-header">
            <h2>登録</h2>
            <button class="icon-button" type="button" data-action="copy-register" title="Copy">
              <span class="copy-icon" aria-hidden="true"></span>
              <span class="sr-only">Copy</span>
            </button>
          </div>
          <div class="tool-panel-body">
            <div class="form-grid">
              <div class="form-row">
                <label>色</label>
                ${renderColorPicker("register", state.register.color)}
              </div>
              <div class="form-row">
                <label for="register-name">名称</label>
                <input id="register-name" class="compact-input" type="text" maxlength="48" data-action="register-name" value="${attr(state.register.name)}" placeholder="Relic">
              </div>
              ${[0, 1, 2].map((slot) => renderRegisterEffectSlot(slot)).join("")}
              ${isDeep ? [0, 1, 2].map((slot) => renderRegisterDebuffSlot(slot, validation.requiredDebuffSlots[slot])).join("") : ""}
              <button class="danger-button" type="button" data-action="reset-register">リセット</button>
              <div class="button-row">
                <button class="primary-button" type="button" data-action="save-register" ${validation.valid ? "" : "disabled"}>登録</button>
                <button class="secondary-button" type="button" data-action="share-register">リンク</button>
              </div>
            </div>
          </div>
        </section>
        <aside class="tool-panel">
          <div class="tool-panel-header"><h2>判定</h2></div>
          <div class="tool-panel-body">
            ${renderValidation(validation)}
          </div>
        </aside>
      </div>
    `;
  }

  function renderRegisterEffectSlot(slot) {
    const selected = state.register.effects[slot];
    const disabled = slot > 0 && !canUnlockEffectSlot(slot, state.register);
    const query = state.register.effectQueries[slot] || "";
    const options = getViableEffects(slot, state.register, query, true);
    return `
      <div class="form-row">
        <label for="effect-${slot}">効果${slot + 1}</label>
        <div class="form-grid">
          <input class="search-input" type="search" value="${attr(query)}" data-action="register-effect-query" data-slot="${slot}" placeholder="Search">
          ${renderEffectSelect(`effect-${slot}`, "register-effect", slot, selected, options, disabled)}
        </div>
      </div>
    `;
  }

  function renderRegisterDebuffSlot(slot, required) {
    const selected = state.register.debuffs[slot];
    const effect = getEffectByKey(state.register.effects[slot]);
    const disabled = !effect || !effect.cursed;
    const query = state.register.debuffQueries[slot] || "";
    const options = getAvailableDebuffs(slot, state.register, query);
    return `
      <div class="form-row">
        <label for="debuff-${slot}">弱化${slot + 1}</label>
        <div class="form-grid">
          <input class="search-input" type="search" value="${attr(query)}" data-action="register-debuff-query" data-slot="${slot}" placeholder="${required ? "Required" : "Search"}" ${disabled ? "disabled" : ""}>
          ${renderDebuffSelect(`debuff-${slot}`, "register-debuff", slot, selected, options, disabled, required)}
        </div>
      </div>
    `;
  }

  function renderSearchView() {
    const hasConditions = hasSearchConditions();
    const results = hasConditions ? generateRollResults(state.search, MAX_COMBO_RESULTS) : { items: [], truncated: false };
    return `
      <section class="tool-panel">
        <div class="tool-panel-body">
          <p class="center-label">-絞り込み条件-</p>
          <div class="form-grid">
            <div class="form-row">
              <label>色</label>
              ${renderColorPicker("search", state.search.color)}
            </div>
            ${[0, 1, 2].map((slot) => renderSearchEffectSlot(slot)).join("")}
            ${isDeepMode(state.mode) ? [0, 1, 2].map((slot) => renderSearchDebuffSlot(slot)).join("") : ""}
            <button class="danger-button" type="button" data-action="reset-search">リセット</button>
          </div>
          <div class="status-panel">
            ${renderGeneratedResults(results)}
          </div>
        </div>
      </section>
    `;
  }

  function renderSearchEffectSlot(slot) {
    const query = state.search.queries[slot] || "";
    const selected = state.search.effects[slot];
    const options = getViableEffects(slot, state.search, query, true);
    return `
      <div class="form-row">
        <label for="search-effect-${slot}">効果${slot + 1}</label>
        <div class="form-grid">
          <input class="search-input" type="search" value="${attr(query)}" data-action="search-effect-query" data-slot="${slot}" placeholder="Search">
          ${renderEffectSelect(`search-effect-${slot}`, "search-effect", slot, selected, options, false)}
        </div>
      </div>
    `;
  }

  function renderSearchDebuffSlot(slot) {
    const effect = getEffectByKey(state.search.effects[slot]);
    const enabled = Boolean(effect?.cursed);
    const query = state.search.debuffQueries?.[slot] || "";
    const selected = state.search.debuffs?.[slot] || null;
    const options = getAvailableDebuffs(slot, state.search, query);
    return `
      <div class="form-row">
        <label for="search-debuff-${slot}">弱化${slot + 1}</label>
        <div class="form-grid">
          <input class="search-input" type="search" value="${attr(query)}" data-action="search-debuff-query" data-slot="${slot}" placeholder="${enabled ? "Required" : "---"}" ${enabled ? "" : "disabled"}>
          ${renderDebuffSelect(`search-debuff-${slot}`, "search-debuff", slot, selected, options, !enabled, enabled)}
        </div>
      </div>
    `;
  }

  function renderListView() {
    const saved = filteredListSaved();
    const effects = filteredMasterEffects();
    return `
      <div class="split-layout">
        <section class="tool-panel">
          <div class="tool-panel-header">
            <h2>一覧</h2>
            <div class="button-row">
              <button class="icon-button" type="button" data-action="import-sample" title="Import selected_relics.txt">
                <span class="import-icon" aria-hidden="true"></span>
                <span class="sr-only">Import</span>
              </button>
              <button class="icon-button" type="button" data-action="export-saved" title="Download">
                <span class="download-icon" aria-hidden="true"></span>
                <span class="sr-only">Download</span>
              </button>
              <button class="icon-button" type="button" data-action="clear-saved" title="Delete all">
                <span class="trash-icon" aria-hidden="true"></span>
                <span class="sr-only">Delete all</span>
              </button>
            </div>
          </div>
          <div class="tool-panel-body">
            <div class="table-tools">
              <input class="search-input" type="search" data-action="list-query" value="${attr(state.list.query)}" placeholder="Search">
              <select class="compact-select" data-action="list-scope">
                ${option("saved", "登録済み", state.list.scope === "saved")}
                ${option("effects", "効果一覧", state.list.scope === "effects")}
              </select>
              <select class="compact-select" data-action="list-color" ${state.list.scope === "effects" ? "disabled" : ""}>
                ${["all", ...COLOR_ORDER].map((color) => option(color, COLOR_LABELS[color], state.list.color === color)).join("")}
              </select>
            </div>
            ${state.list.scope === "saved" ? (saved.length ? renderSavedCards(saved) : `<div class="empty-state">登録されている遺物はありません。</div>`) : renderEffectsTable(effects)}
          </div>
        </section>
        <aside class="tool-panel">
          <div class="tool-panel-header"><h2>データ</h2></div>
          <div class="tool-panel-body">
            ${renderDataSummary()}
          </div>
        </aside>
      </div>
    `;
  }

  function renderColorPicker(context, selected) {
    const options = context === "search" ? ["all", ...COLOR_ORDER] : COLOR_ORDER;
    return `
      <div class="color-picker" role="group" aria-label="Color">
        ${options
          .map((color) => {
            if (color === "all") {
              return `<button class="color-button all" type="button" data-action="${context}-color" data-color="all" aria-pressed="${selected === "all"}">全</button>`;
            }
            return `
              <button class="color-button" type="button" data-action="${context}-color" data-color="${color}" aria-pressed="${selected === color}" title="${esc(COLOR_LABELS[color])}">
                <span class="gem ${color}" aria-hidden="true"></span>
                <span class="sr-only">${esc(COLOR_LABELS[color])}</span>
              </button>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderEffectSelect(id, action, slot, selected, options, disabled) {
    const current = selected ? getEffectByKey(selected) : null;
    const optionSet = new Set(options.map((effect) => effect.key));
    const rows = [];
    if (current && !optionSet.has(current.key)) {
      rows.push(option(current.key, label(current), true));
    }
    rows.push(`<option value="">---</option>`);
    rows.push(...options.map((effect) => option(effect.key, label(effect), effect.key === selected)));
    return `
      <div class="select-wrap">
        <select id="${id}" class="select-input" data-action="${action}" data-slot="${slot}" ${disabled ? "disabled" : ""}>
          ${rows.join("")}
        </select>
      </div>
    `;
  }

  function renderDebuffSelect(id, action, slot, selected, options, disabled, required) {
    const current = selected ? getDebuffByKey(selected) : null;
    const optionSet = new Set(options.map((debuff) => debuff.key));
    const rows = [];
    if (current && !optionSet.has(current.key)) {
      rows.push(option(current.key, label(current), true));
    }
    rows.push(`<option value="">${required ? "---Required---" : "---"}</option>`);
    rows.push(...options.map((debuff) => option(debuff.key, label(debuff), debuff.key === selected)));
    return `
      <div class="select-wrap">
        <select id="${id}" class="select-input" data-action="${action}" data-slot="${slot}" ${disabled ? "disabled" : ""}>
          ${rows.join("")}
        </select>
      </div>
    `;
  }

  function renderValidation(validation) {
    const statusText = validation.valid ? "VALID" : validation.complete ? "INVALID" : "SELECT EFFECTS";
    const statusClass = validation.valid ? "valid" : validation.complete ? "invalid" : "";
    const selected = state.register.effects.map((key) => getEffectByKey(key));
    return `
      <div class="status-box ${statusClass}">${statusText}</div>
      <div class="meta-grid" style="margin-top: 10px;">
        ${[0, 1, 2]
          .map((slot) => {
            const effect = selected[slot];
            return `
              <div class="meta-chip">
                <span>Line ${slot + 1}</span>
                <strong>${effect ? esc(effect.category) : "-"}</strong>
                <span>${effect ? esc(effect.group) : "-"}</span>
              </div>
            `;
          })
          .join("")}
      </div>
      ${
        validation.reasons.length
          ? `<ul class="reason-list">${validation.reasons.map((reason) => `<li>${esc(reason)}</li>`).join("")}</ul>`
          : ""
      }
    `;
  }

  function renderSavedCards(items) {
    return `
      <div class="result-list">
        ${items.map(renderSavedCard).join("")}
      </div>
    `;
  }

  function hasSearchConditions() {
    return (
      state.search.color !== "all" ||
      state.search.effects.some(Boolean) ||
      state.search.debuffs.some(Boolean) ||
      state.search.queries.some((query) => query.trim()) ||
      state.search.debuffQueries.some((query) => query.trim())
    );
  }

  function resetGeneratedResultsView() {
    state.ui.showGeneratedResults = false;
    state.ui.generatedVisibleCount = RESULT_PAGE_SIZE;
  }

  function renderGeneratedResults(result) {
    if (!hasSearchConditions()) {
      return `
        <div class="status-box">
          条件未指定のため、ロール候補一覧は非表示です。まずは色または効果を1つ選んでください。
        </div>
      `;
    }

    if (result.reason) {
      return `<div class="status-box invalid">${esc(result.reason)}</div>`;
    }

    if (!result.items.length) {
      return `<div class="empty-state">該当する遺物はありません。</div>`;
    }

    const summary = result.truncated
      ? `${result.items.length}件以上の有効ロールがあります。条件を追加すると絞り込めます。`
      : `${result.items.length}件の有効ロールがあります。`;

    if (!state.ui.showGeneratedResults) {
      return `
        <div class="status-box valid">${esc(summary)}</div>
        <div class="result-actions">
          <button class="secondary-button result-toggle-button" type="button" data-action="toggle-generated-results">
            ロール候補を表示
          </button>
        </div>
      `;
    }

    const visibleItems = result.items.slice(0, state.ui.generatedVisibleCount);
    const hasMoreItems = visibleItems.length < result.items.length;
    const visibleSummary =
      result.truncated || hasMoreItems
        ? `${summary}現在${visibleItems.length}件を表示しています。`
        : summary;

    return `
      <div class="status-box valid">${esc(visibleSummary)}</div>
      <div class="result-actions">
        ${
          hasMoreItems
            ? `<button class="secondary-button" type="button" data-action="show-more-generated-results">さらに50件表示</button>`
            : ""
        }
        <button class="secondary-button" type="button" data-action="toggle-generated-results">ロール候補を閉じる</button>
      </div>
      <div class="result-list" style="margin-top: 8px;">
        ${visibleItems.map(renderGeneratedCard).join("")}
      </div>
    `;
  }

  function renderGeneratedCard(item) {
    const effects = item.effects.map((key) => getEffectByKey(key, item.mode));
    const debuffs = item.debuffs.map((key) => getDebuffByKey(key));
    const cursedCount = effects.filter((effect) => effect?.cursed).length;
    return `
      <article class="relic-card">
        <div class="relic-card-head">
          <span class="pill">valid</span>
          <div>
            <div class="relic-card-title">${esc(item.effects.map((key) => label(getEffectByKey(key, item.mode))).join(" / "))}</div>
            <div class="relic-card-mode">${esc(modeLabel(item.mode))}${cursedCount ? ` / 弱化${cursedCount}枠必須` : ""}</div>
          </div>
          <button class="icon-button" type="button" data-action="copy-generated" data-effects="${attr(item.effects.join("|"))}" title="Copy">
            <span class="copy-icon" aria-hidden="true"></span>
            <span class="sr-only">Copy</span>
          </button>
        </div>
        <ol class="effect-lines">
          ${effects
            .map(
              (effect, index) => `
                <li>
                  <span>効果${index + 1}</span>
                  <div>${effect ? esc(label(effect)) : "-"}${effect?.cursed ? `<br><span>弱化${index + 1}</span> ${debuffs[index] ? esc(label(debuffs[index])) : "任意のネガティブ効果が必須"}` : ""}</div>
                </li>
              `
            )
            .join("")}
        </ol>
      </article>
    `;
  }

  function renderSavedCard(item) {
    const effects = item.effects.map((key) => getEffectByKey(key, item.mode));
    const debuffs = item.debuffs.map((key) => getDebuffByKey(key));
    const title = item.name || `${modeLabel(item.mode)} ${new Date(item.createdAt).toLocaleDateString("ja-JP")}`;
    return `
      <article class="relic-card">
        <div class="relic-card-head">
          <span class="gem ${item.color || "red"}" aria-hidden="true"></span>
          <div>
            <div class="relic-card-title">${esc(title)}</div>
            <div class="relic-card-mode">${esc(modeLabel(item.mode))}</div>
          </div>
          <div class="button-row">
            <button class="icon-button" type="button" data-action="copy-saved" data-id="${attr(item.id)}" title="Copy">
              <span class="copy-icon" aria-hidden="true"></span>
              <span class="sr-only">Copy</span>
            </button>
            <button class="icon-button" type="button" data-action="delete-saved" data-id="${attr(item.id)}" title="Delete">
              <span class="trash-icon" aria-hidden="true"></span>
              <span class="sr-only">Delete</span>
            </button>
          </div>
        </div>
        <ol class="effect-lines">
          ${effects
            .map((effect, index) => {
              const debuff = debuffs[index];
              return `
                <li>
                  <span>効果${index + 1}</span>
                  <div>${effect ? esc(label(effect)) : "-"}${debuff ? `<br><span>弱化${index + 1}</span> ${esc(label(debuff))}` : ""}</div>
                </li>
              `;
            })
            .join("")}
        </ol>
      </article>
    `;
  }

  function renderEffectsTable(effects) {
    const rows = effects.slice(0, MAX_TABLE_ROWS);
    return `
      <div class="effects-table-wrap">
        <table class="effects-table">
          <thead>
            <tr>
              <th>効果</th>
              <th>cat</th>
              <th>group</th>
              <th>id</th>
              <th>type</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (effect) => `
                  <tr>
                    <td class="name-cell">${esc(label(effect))}<br><span class="relic-card-mode">${esc(effect.key)}</span></td>
                    <td>${esc(effect.category)}</td>
                    <td>${esc(effect.group)}</td>
                    <td>${esc(effect.id)}</td>
                    <td>${effect.cursed ? `<span class="pill cursed">cursed</span>` : `<span class="pill">normal</span>`}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      ${effects.length > rows.length ? `<div class="status-box" style="margin-top: 8px;">${rows.length} / ${effects.length}</div>` : ""}
    `;
  }

  function renderDataSummary() {
    const counts = Object.entries(state.effectsByMode)
      .map(([mode, effects]) => `
        <div class="meta-chip">
          <span>${esc(modeLabel(mode))}</span>
          <strong>${effects.length}</strong>
          <span>effects</span>
        </div>
      `)
      .join("");
    return `
      <div class="meta-grid">${counts}</div>
      <div class="meta-grid" style="margin-top: 8px;">
        <div class="meta-chip">
          <span>Debuffs</span>
          <strong>${state.debuffs.length}</strong>
          <span>items</span>
        </div>
        <div class="meta-chip">
          <span>Saved</span>
          <strong>${state.saved.length}</strong>
          <span>relics</span>
        </div>
        <div class="meta-chip">
          <span>Locale</span>
          <strong>${esc(state.locale.replace("_", "-"))}</strong>
          <span>${esc(LANG_LABELS[state.locale])}</span>
        </div>
      </div>
    `;
  }

  function wireEvents() {
    app.addEventListener("click", onClick);
    app.addEventListener("change", onChange);
    app.addEventListener("input", onInput);
  }

  function onClick(event) {
    const target = event.target.closest("[data-action], [data-tab]");
    if (!target) return;

    if (target.dataset.tab) {
      state.activeTab = target.dataset.tab;
      render();
      return;
    }

    const action = target.dataset.action;
    if (action === "close-usage-guide") {
      state.ui.usageGuideClosed = true;
      render();
      return;
    }

    if (action === "hide-usage-guide-next-time") {
      if (target.checked) {
        hideUsageGuidePermanently();
        state.ui.usageGuideClosed = true;
        render();
      }
      return;
    }

    if (action === "toggle-generated-results") {
      state.ui.showGeneratedResults = !state.ui.showGeneratedResults;
      if (state.ui.showGeneratedResults) {
        state.ui.generatedVisibleCount = RESULT_PAGE_SIZE;
      }
      render();
      return;
    }

    if (action === "show-more-generated-results") {
      state.ui.showGeneratedResults = true;
      state.ui.generatedVisibleCount += RESULT_PAGE_SIZE;
      render();
      return;
    }

    if (action === "register-color") {
      state.register.color = target.dataset.color;
      render();
    } else if (action === "search-color") {
      state.search.color = target.dataset.color;
      resetGeneratedResultsView();
      render();
    } else if (action === "reset-register") {
      resetRegister();
      render();
    } else if (action === "reset-search") {
      state.search = structuredCloneWithoutMaps(initialState.search);
      resetGeneratedResultsView();
      render();
    } else if (action === "save-register") {
      saveCurrentRelic();
    } else if (action === "copy-register") {
      copyText(formatRelicText(currentRelicDraft()));
    } else if (action === "share-register") {
      shareCurrentSelection();
    } else if (action === "copy-saved") {
      const item = state.saved.find((saved) => saved.id === target.dataset.id);
      if (item) copyText(formatRelicText(item));
    } else if (action === "copy-generated") {
      const effects = (target.dataset.effects || "").split("|").filter(Boolean);
      copyText(
        formatRelicText({
          id: makeId(),
          createdAt: Date.now(),
          mode: state.mode,
          locale: state.locale,
          color: "red",
          name: "",
          effects,
          debuffs: [...(state.search.debuffs || [null, null, null])],
        })
      );
    } else if (action === "delete-saved") {
      state.saved = state.saved.filter((saved) => saved.id !== target.dataset.id);
      showToast("削除しました。");
      render();
    } else if (action === "clear-saved") {
      state.saved = [];
      showToast("一覧を空にしました。");
      render();
    } else if (action === "export-saved") {
      downloadText("selected_relics_web.txt", state.saved.map(formatRelicText).join("\n"));
    } else if (action === "import-sample") {
      importSampleFile();
    }
  }

  function onChange(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const slot = Number.parseInt(target.dataset.slot || "0", 10);

    if (action === "mode") {
      state.mode = target.value;
      sanitizeSelections();
      resetGeneratedResultsView();
      render();
    } else if (action === "locale") {
      state.locale = target.value;
      render();
    } else if (action === "register-effect") {
      state.register.effects[slot] = target.value || null;
      pruneInvalidEffects(state.register, true);
      render();
    } else if (action === "register-debuff") {
      state.register.debuffs[slot] = target.value || null;
      pruneInvalidEffects(state.register, true);
      render();
    } else if (action === "search-effect") {
      state.search.effects[slot] = target.value || null;
      pruneInvalidEffects(state.search, false);
      clearInactiveSearchDebuffs();
      resetGeneratedResultsView();
      render();
    } else if (action === "search-debuff") {
      state.search.debuffs[slot] = target.value || null;
      resetGeneratedResultsView();
      render();
    } else if (action === "list-scope") {
      state.list.scope = target.value;
      render();
    } else if (action === "list-color") {
      state.list.color = target.value;
      render();
    }
  }

  function onInput(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const slot = Number.parseInt(target.dataset.slot || "0", 10);

    if (action === "register-name") {
      state.register.name = target.value;
      persist();
    } else if (action === "register-effect-query") {
      state.register.effectQueries[slot] = target.value;
      render();
    } else if (action === "register-debuff-query") {
      state.register.debuffQueries[slot] = target.value;
      render();
    } else if (action === "search-effect-query") {
      state.search.queries[slot] = target.value;
      render();
    } else if (action === "search-debuff-query") {
      state.search.debuffQueries[slot] = target.value;
      render();
    } else if (action === "list-query") {
      state.list.query = target.value;
      render();
    }
  }

  function validateSelection(selection) {
    const reasons = [];
    const requiredDebuffSlots = [false, false, false];
    const chosenEffects = selection.effects.map((key) => getEffectByKey(key));
    const complete = chosenEffects.every(Boolean);
    const seenDebuffs = new Set();

    for (let slot = 0; slot < 3; slot += 1) {
      const effect = chosenEffects[slot];
      if (!effect) {
        reasons.push(`効果${slot + 1}が未選択です。`);
        continue;
      }

      if (slot > 0 && !chosenEffects[slot - 1]) {
        reasons.push(`効果${slot + 1}は前の行を選択してから指定してください。`);
      }

      if (isDeepMode(state.mode) && effect.cursed) {
        requiredDebuffSlots[slot] = true;
        const debuffKey = selection.debuffs[slot];
        if (!debuffKey) {
          reasons.push(`効果${slot + 1}には弱化効果が必要です。`);
        }
      }
    }

    if (complete) {
      reasons.push(...effectTripletReasons(chosenEffects));
    }

    for (let slot = 0; slot < 3; slot += 1) {
      const debuffKey = selection.debuffs[slot];
      if (!debuffKey) continue;
      if (seenDebuffs.has(debuffKey)) {
        reasons.push(`弱化${slot + 1}は重複しています。`);
      }
      seenDebuffs.add(debuffKey);
      if (!getDebuffByKey(debuffKey)) {
        reasons.push(`弱化${slot + 1}が見つかりません。`);
      }
    }

    return {
      valid: complete && reasons.length === 0,
      complete,
      reasons,
      requiredDebuffSlots,
    };
  }

  function getViableEffects(slot, selection, query, requireCompletion) {
    if (Array.isArray(selection.debuffs) && slot > 0 && !canUnlockEffectSlot(slot, selection)) {
      return [];
    }

    return getAllEffectsForMode(state.mode, query).filter((effect) => {
      const nextKeys = [...selection.effects];
      nextKeys[slot] = effect.key;
      return requireCompletion ? hasValidCompletion(nextKeys, state.mode) : isValidPartialEffects(nextKeys, state.mode);
    });
  }

  function hasValidCompletion(effectKeys, mode = state.mode) {
    const allEffects = state.effectsByMode[mode] || [];
    const chosen = [];

    const walk = (slot) => {
      if (slot === 3) return true;

      const fixedKey = effectKeys[slot];
      if (fixedKey) {
        const fixed = getEffectByKey(fixedKey, mode);
        if (!fixed || !canAppendEffect(chosen, fixed)) return false;
        chosen.push(fixed);
        const ok = walk(slot + 1);
        chosen.pop();
        return ok;
      }

      for (const effect of allEffects) {
        if (!canAppendEffect(chosen, effect)) continue;
        chosen.push(effect);
        if (walk(slot + 1)) {
          chosen.pop();
          return true;
        }
        chosen.pop();
      }
      return false;
    };

    return walk(0);
  }

  function isValidPartialEffects(effectKeys, mode = state.mode) {
    const chosen = [];
    for (const key of effectKeys) {
      if (!key) continue;
      const effect = getEffectByKey(key, mode);
      if (!effect || !canAppendEffect(chosen, effect)) return false;
      chosen.push(effect);
    }
    return true;
  }

  function canAppendEffect(chosen, effect) {
    const previous = chosen.at(-1);
    if (previous && effect.category < previous.category) return false;
    return chosen.every((other) => !effectsConflict(other, effect));
  }

  function effectsConflict(a, b) {
    return a.key === b.key || a.id === b.id || Boolean(a.group && a.group === b.group);
  }

  function effectTripletReasons(effects) {
    const reasons = [];
    for (let index = 0; index < effects.length; index += 1) {
      const effect = effects[index];
      const previous = effects[index - 1];
      if (previous && effect.category < previous.category) {
        reasons.push(`効果${index + 1}はロール順序が前の効果より手前です。`);
      }

      for (let otherIndex = 0; otherIndex < index; otherIndex += 1) {
        const other = effects[otherIndex];
        if (effect.key === other.key || effect.id === other.id) {
          reasons.push(`効果${index + 1}は重複しています。`);
        } else if (effect.group && effect.group === other.group) {
          reasons.push(`効果${index + 1}は効果${otherIndex + 1}と同じグループのため共存できません。`);
        }
      }
    }
    return reasons;
  }

  function generateRollResults(selection, limit = MAX_COMBO_RESULTS) {
    const allEffects = state.effectsByMode[state.mode] || [];
    const fixed = selection.effects || [null, null, null];
    const items = [];
    const chosen = [];
    let truncated = false;

    const debuffProblem = selectedDebuffProblem(selection);
    if (debuffProblem) {
      return { items: [], truncated: false, reason: debuffProblem };
    }

    const walk = (slot) => {
      if (items.length > limit) {
        truncated = true;
        return;
      }

      if (slot === 3) {
        items.push({
          id: makeId(),
          createdAt: Date.now(),
          mode: state.mode,
          effects: chosen.map((effect) => effect.key),
          debuffs: [...(selection.debuffs || [null, null, null])],
        });
        return;
      }

      const fixedKey = fixed[slot];
      if (fixedKey) {
        const effect = getEffectByKey(fixedKey, state.mode);
        if (!effect || !canAppendEffect(chosen, effect)) return;
        chosen.push(effect);
        walk(slot + 1);
        chosen.pop();
        return;
      }

      for (const effect of allEffects) {
        if (truncated) return;
        if (!canAppendEffect(chosen, effect)) continue;
        chosen.push(effect);
        walk(slot + 1);
        chosen.pop();
      }
    };

    if (!hasValidCompletion(fixed, state.mode)) {
      return { items: [], truncated: false };
    }

    walk(0);
    if (items.length > limit) {
      items.length = limit;
      truncated = true;
    }
    return { items, truncated };
  }

  function selectedDebuffProblem(selection) {
    if (!isDeepMode(state.mode)) return "";

    const debuffs = selection.debuffs || [null, null, null];
    const seen = new Set();
    for (let slot = 0; slot < 3; slot += 1) {
      const effect = getEffectByKey(selection.effects?.[slot]);
      const debuff = debuffs[slot];

      if (effect?.cursed && !debuff) {
        return `効果${slot + 1}にはネガティブ効果が必要です。`;
      }

      if (!effect?.cursed && debuff) {
        debuffs[slot] = null;
        continue;
      }

      if (debuff) {
        if (seen.has(debuff)) {
          return `弱化${slot + 1}は重複しています。`;
        }
        seen.add(debuff);
      }
    }
    return "";
  }

  function getAllEffectsForMode(mode, query = "") {
    const q = normalize(query);
    const effects = state.effectsByMode[mode] || [];
    if (!q) return effects;
    return effects.filter((effect) => matchesRecord(effect, q));
  }

  function getAvailableDebuffs(slot, selection, query) {
    const q = normalize(query);
    const selected = selection.debuffs[slot];
    const other = new Set(selection.debuffs.filter((key, index) => key && index !== slot));
    return state.debuffs.filter((debuff) => {
      if (debuff.key !== selected && other.has(debuff.key)) return false;
      return !q || matchesRecord(debuff, q);
    });
  }

  function canUnlockEffectSlot(slot, selection) {
    for (let index = 0; index < slot; index += 1) {
      const effect = getEffectByKey(selection.effects[index]);
      if (!effect) return false;
      if (isDeepMode(state.mode) && effect.cursed && !selection.debuffs[index]) return false;
    }
    return true;
  }

  function clearSlotsAfterInvalidChange(changedSlot) {
    for (let slot = changedSlot + 1; slot < 3; slot += 1) {
      if (!canUnlockEffectSlot(slot, state.register)) {
        state.register.effects[slot] = null;
        state.register.debuffs[slot] = null;
      }
    }
    for (let slot = 0; slot < 3; slot += 1) {
      const effect = getEffectByKey(state.register.effects[slot]);
      if (!effect || !effect.cursed) {
        state.register.debuffs[slot] = null;
      }
    }
  }

  function pruneInvalidEffects(selection, useDebuffs) {
    for (let slot = 0; slot < 3; slot += 1) {
      const key = selection.effects[slot];
      if (!key) {
        clearAfter(selection, slot);
        break;
      }

      if (slot > 0 && !selection.effects[slot - 1]) {
        clearAfter(selection, slot - 1);
        break;
      }

      if (useDebuffs && slot > 0 && !canUnlockEffectSlot(slot, selection)) {
        clearAfter(selection, slot);
        break;
      }

      const prefix = selection.effects.map((candidate, index) => (index <= slot ? candidate : null));
      if (!hasValidCompletion(prefix, state.mode)) {
        clearAfter(selection, slot - 1);
        break;
      }
    }

    if (useDebuffs) {
      for (let slot = 0; slot < 3; slot += 1) {
        const effect = getEffectByKey(selection.effects[slot]);
        if (!effect || !effect.cursed) {
          selection.debuffs[slot] = null;
        }
      }
    }
  }

  function clearInactiveSearchDebuffs() {
    state.search.debuffs ||= [null, null, null];
    state.search.debuffQueries ||= ["", "", ""];
    for (let slot = 0; slot < 3; slot += 1) {
      const effect = getEffectByKey(state.search.effects[slot]);
      if (!effect?.cursed) {
        state.search.debuffs[slot] = null;
        state.search.debuffQueries[slot] = "";
      }
    }
  }

  function clearAfter(selection, slot) {
    for (let index = Math.max(0, slot + 1); index < 3; index += 1) {
      selection.effects[index] = null;
      if (selection.debuffs) selection.debuffs[index] = null;
    }
  }

  function filteredSaved() {
    return state.saved
      .filter((item) => item.mode === state.mode)
      .filter((item) => state.search.color === "all" || item.color === state.search.color)
      .filter((item) => state.search.effects.every((key, slot) => !key || item.effects[slot] === key))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  function filteredListSaved() {
    const q = normalize(state.list.query);
    return state.saved
      .filter((item) => item.mode === state.mode)
      .filter((item) => state.list.color === "all" || item.color === state.list.color)
      .filter((item) => {
        if (!q) return true;
        const haystack = [
          item.name,
          MODE_LABELS[item.mode],
          modeLabel(item.mode),
          COLOR_LABELS[item.color],
          ...item.effects.map((key) => label(getEffectByKey(key, item.mode))),
          ...item.effects,
          ...item.debuffs.map((key) => label(getDebuffByKey(key))),
        ].join(" ");
        return normalize(haystack).includes(q);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  function filteredMasterEffects() {
    const q = normalize(state.list.query);
    return getAllEffectsForMode(state.mode).filter((effect) => !q || matchesRecord(effect, q));
  }

  function saveCurrentRelic() {
    const validation = validateSelection(state.register);
    if (!validation.valid) {
      showToast("無効な組み合わせです。");
      render();
      return;
    }

    const item = currentRelicDraft();
    const duplicate = state.saved.some(
      (saved) =>
        saved.mode === item.mode &&
        saved.color === item.color &&
        saved.effects.join("\u0001") === item.effects.join("\u0001") &&
        saved.debuffs.join("\u0001") === item.debuffs.join("\u0001")
    );

    if (duplicate) {
      showToast("同じ遺物が登録済みです。");
      render();
      return;
    }

    state.saved.unshift(item);
    showToast("登録しました。");
    render();
  }

  function currentRelicDraft() {
    return {
      id: makeId(),
      createdAt: Date.now(),
      mode: state.mode,
      locale: state.locale,
      color: state.register.color,
      name: state.register.name.trim(),
      effects: [...state.register.effects],
      debuffs: [...state.register.debuffs],
    };
  }

  function resetRegister() {
    state.register = structuredCloneWithoutMaps(initialState.register);
  }

  function sanitizeSelections() {
    const validEffects = new Set((state.effectsByMode[state.mode] || []).map((effect) => effect.key));
    for (const holder of [state.register, state.search]) {
      holder.effects = holder.effects.map((key) => (key && validEffects.has(key) ? key : null));
    }
    pruneInvalidEffects(state.register, true);
    pruneInvalidEffects(state.search, false);
    clearInactiveSearchDebuffs();
  }

  function normalizeStateShape() {
    state.register.effects = normalizeTriple(state.register.effects);
    state.register.debuffs = normalizeTriple(state.register.debuffs);
    state.register.effectQueries = normalizeTriple(state.register.effectQueries, "");
    state.register.debuffQueries = normalizeTriple(state.register.debuffQueries, "");
    state.search.effects = normalizeTriple(state.search.effects);
    state.search.debuffs = normalizeTriple(state.search.debuffs);
    state.search.queries = normalizeTriple(state.search.queries, "");
    state.search.debuffQueries = normalizeTriple(state.search.debuffQueries, "");
    state.ui = {
      showGeneratedResults: Boolean(state.ui?.showGeneratedResults),
      generatedVisibleCount: Number.isFinite(Number(state.ui?.generatedVisibleCount))
        ? Math.max(RESULT_PAGE_SIZE, Number(state.ui.generatedVisibleCount))
        : RESULT_PAGE_SIZE,
      usageGuideClosed: Boolean(state.ui?.usageGuideClosed),
    };
  }

  function normalizeTriple(value, fallback = null) {
    const source = Array.isArray(value) ? value : [];
    return [0, 1, 2].map((index) => source[index] ?? fallback);
  }

  async function importSampleFile() {
    try {
      const response = await fetch(SAMPLE_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`${SAMPLE_URL}: ${response.status}`);
      const text = await response.text();
      const imported = parseSelectedRelics(text);
      let added = 0;
      for (const item of imported) {
        const exists = state.saved.some(
          (saved) =>
            saved.mode === item.mode &&
            saved.effects.join("\u0001") === item.effects.join("\u0001") &&
            saved.debuffs.join("\u0001") === item.debuffs.join("\u0001")
        );
        if (!exists) {
          state.saved.unshift(item);
          added += 1;
        }
      }
      showToast(`${added}件を読み込みました。`);
      render();
    } catch (error) {
      showToast(`読み込みに失敗しました: ${error.message || error}`);
      render();
    }
  }

  function parseSelectedRelics(text) {
    const blocks = text.split(/===\s*(?:Relic Selection|遺物の選択)\s*===/i).map((part) => part.trim()).filter(Boolean);
    return blocks
      .map((block, index) => {
        const modeMatch = block.match(/(?:Mode|モード):\s*(.+)/i);
        const mode = modeFromLabel(modeMatch?.[1] || "") || "base_game";
        const effects = [1, 2, 3].map((slot) => {
          const match = block.match(new RegExp(`(?:Effect|効果)\\s*${slot}:\\s*(.+)`, "i"));
          return keyFromAnyLabel(match?.[1] || "");
        });
        if (!effects.every(Boolean)) return null;
        return {
          id: makeId(),
          createdAt: Date.now() + index,
          mode,
          locale: state.locale,
          color: COLOR_ORDER[index % COLOR_ORDER.length],
          name: "",
          effects,
          debuffs: [null, null, null],
        };
      })
      .filter(Boolean);
  }

  function modeFromLabel(text) {
    const normalized = normalize(text);
    for (const [mode, labelText] of Object.entries(MODE_LABELS)) {
      if (normalize(labelText) === normalized) return mode;
      for (const locale of Object.keys(RELIC_SET_LABELS)) {
        if (normalize(RELIC_SET_LABELS[locale][labelText]) === normalized) return mode;
      }
    }
    return null;
  }

  function keyFromAnyLabel(text) {
    const cleaned = text.trim();
    return state.labelToKey.get(normalize(cleaned)) || null;
  }

  function shareCurrentSelection() {
    const payload = {
      m: state.mode,
      l: state.locale,
      c: state.register.color,
      e: state.register.effects,
      d: state.register.debuffs,
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const url = `${location.origin}${location.pathname}#${encoded}`;
    copyText(url);
  }

  function readSelectionFromHash() {
    if (!location.hash || location.hash.length < 2) return;
    try {
      const payload = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1)))));
      if (payload.m && MODE_LABELS[payload.m]) state.mode = payload.m;
      if (payload.l && LANG_LABELS[payload.l]) state.locale = payload.l;
      if (payload.c && COLOR_ORDER.includes(payload.c)) state.register.color = payload.c;
      if (Array.isArray(payload.e)) state.register.effects = payload.e.slice(0, 3);
      if (Array.isArray(payload.d)) state.register.debuffs = payload.d.slice(0, 3);
    } catch {
      // Ignore malformed shared state.
    }
  }

  function formatRelicText(item) {
    const effects = item.effects.map((key) => getEffectByKey(key, item.mode));
    const debuffs = item.debuffs.map((key) => getDebuffByKey(key));
    const lines = [
      "=== 遺物の選択 ===",
      `モード: ${modeLabel(item.mode)}`,
      `色: ${COLOR_LABELS[item.color] || item.color}`,
    ];
    effects.forEach((effect, index) => {
      lines.push(`効果 ${index + 1}: ${effect ? label(effect) : "---"}`);
      if (debuffs[index]) {
        lines.push(`弱化 ${index + 1}: ${label(debuffs[index])}`);
      }
    });
    return `${lines.join("\n")}\n`;
  }

  function getEffectByKey(key, mode = state.mode) {
    if (!key) return null;
    return (state.effectsByMode[mode] || []).find((effect) => effect.key === key) || null;
  }

  function getDebuffByKey(key) {
    if (!key) return null;
    return state.debuffs.find((debuff) => debuff.key === key) || null;
  }

  function isDeepMode(mode) {
    return mode === "deep_night" || mode === "deep_tfh_dlc";
  }

  function label(record) {
    if (!record) return "";
    return record.labels?.[state.locale] || record.labels?.en_US || record.key || "";
  }

  function matchesRecord(record, normalizedQuery) {
    const texts = [record.key, record.id, record.group, record.category, record.loc, ...Object.values(record.labels || {})];
    return texts.some((text) => normalize(String(text)).includes(normalizedQuery));
  }

  function normalize(text) {
    return String(text || "")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function option(value, text, selected) {
    return `<option value="${attr(value)}" ${selected ? "selected" : ""}>${esc(text)}</option>`;
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function attr(value) {
    return esc(value).replace(/"/g, "&quot;");
  }

  function makeId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("コピーしました。");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      showToast("コピーしました。");
    }
    render();
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast("出力しました。");
    render();
  }

  function showToast(message) {
    state.toast = message;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      state.toast = "";
      render();
    }, 1800);
  }

  function persist() {
    if (!state.data) return;
    const payload = {
      activeTab: state.activeTab,
      mode: state.mode,
      locale: state.locale,
      saved: state.saved,
      register: state.register,
      search: state.search,
      list: state.list,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function loadPersisted() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        ...parsed,
        saved: Array.isArray(parsed.saved) ? parsed.saved : [],
      };
    } catch {
      return {};
    }
  }

  function structuredCloneWithoutMaps(value) {
    return JSON.parse(JSON.stringify(value));
  }

  window.addEventListener("hashchange", () => {
    readSelectionFromHash();
    sanitizeSelections();
    render();
  });

  readSelectionFromHash();
})();
