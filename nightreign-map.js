(() => {
  "use strict";

  const app = document.querySelector("[data-nightreign-map-app]");
  if (!app) return;

  const DATA_BASE = "./data";
  const ASSET_BASE = "./assets";
  const STORAGE_KEY = "nightreign-map.state.v3";
  const GUIDE_KEY = "nightreign-map.hide-guide.v1";
  const MAP_SIZE = 1000;
  const ROWS = 6;
  const COLS = 6;
  const LEFT_BOUND = 507;
  const ACTIVE_WIDTH = 1690;
  const ACTIVE_HEIGHT = 1690;
  const MIN_SCALE = 0.18;
  const MAX_SCALE = 4.6;
  const DESKTOP_QUERY = "(min-width: 921px)";
  const CANDIDATE_PANEL_MARGIN = 12;
  const FILTERABLE_CATEGORIES = new Set(["major", "minor", "boss", "evergaol"]);

  const ICON_SIZES = {
    "Mission_Objective.png": 34,
    "Main_Encampment.png": 42,
    "Great_Church.png": 48,
    "Fort.png": 48,
    "Field_Boss.png": 30,
    "Field_Boss_Red.png": 30,
    "Evergaol.png": 30,
    "Church.png": 28,
    "Castle.png": 52,
    "Buried_Treasure.png": 22,
    "Tunnel_Entrance.png": 22,
    "Township.png": 40,
    "Spiritstream.png": 18,
    "Spectral_Hawk_Tree.png": 24,
    "Sorcerer's_Rise.png": 24,
    "Site_of_Grace.png": 22,
    "Scarab.png": 18,
    "Ruins.png": 42,
    "Event.png": 38,
    "Night_Location.png": 46,
    "Scale_Bearing_Merchant.png": 24,
    "Spawn_Location.png": 54,
    "Spawn_Hawk.png": 56,
  };

  const TYPE_DEFINITIONS = {
    1: { icon: "Ruins.png", ja: "廃墟", en: "Ruins", rank: 20 },
    2: { icon: "Main_Encampment.png", ja: "野営地", en: "Encampment", rank: 21 },
    3: { icon: "Fort.png", ja: "砦", en: "Fort", rank: 22 },
    4: { icon: "Church.png", ja: "教会", en: "Church", rank: 10 },
    7: { icon: "Sorcerer's_Rise.png", ja: "魔術師塔", en: "Sorcerer's Rise", rank: 30 },
    8: { icon: "Township.png", ja: "街", en: "Township", rank: 31 },
    9: { icon: "Evergaol.png", ja: "封牢", en: "Evergaol", rank: 40 },
    10: { icon: "Field_Boss.png", ja: "フィールドボス", en: "Field Boss", rank: 41 },
    11: { icon: "Great_Church.png", ja: "大教会", en: "Great Church", rank: 23 },
    12: { icon: "Spawn_Location.png", ja: "スポーン地点", en: "Spawn Point", rank: 1 },
    13: { icon: "Night_Location.png", ja: "夜の円", en: "Night Circle", rank: 60 },
    14: { icon: "Scale_Bearing_Merchant.png", ja: "スケール持ちの商人", en: "Scale-Bearing Merchant", rank: 61 },
    15: { icon: "Mission_Objective.png", ja: "イベント", en: "Event", rank: 62 },
  };

  const ICON_TYPE_CODES = {
    "Ruins.png": 1,
    "Main_Encampment.png": 2,
    "Fort.png": 3,
    "Church.png": 4,
    "Sorcerer's_Rise.png": 7,
    "Township.png": 8,
    "Evergaol.png": 9,
    "Field_Boss.png": 10,
    "Field_Boss_Red.png": 10,
    "Castle.png": 10,
    "Great_Church.png": 11,
    "Spawn_Location.png": 12,
    "Spawn_Hawk.png": 12,
    "Night_Location.png": 13,
    "Scale_Bearing_Merchant.png": 14,
    "Event.png": 15,
    "Mission_Objective.png": 15,
  };

  const NIGHTLORD_IMAGES = {
    Adel: "adel.png",
    Caligo: "caligo.png",
    Fulghor: "fulghor.png",
    Gladius: "gladius.png",
    Gnoster: "gnoster.png",
    Heolstor: "heolstor.png",
    Libra: "libra.png",
    Maris: "maris.png",
  };

  const COPY = {
    ja: {
      unknownNightlord: "夜の王：???",
      anyNightlord: "夜の王を選択",
      anyEarth: "通常 / すべて",
      anySpawn: "スポーン地点を選択",
      ready: "準備完了",
      loading: "読み込み中...",
      guideKicker: "マップガイド",
      guideTitle: "使い方",
      guide1: "まずスポーン地点のマーカーをクリックして開始します。",
      guide2: "青い丸は教会です。クリックすると教会として選択されます。",
      guide3: "疑問符をクリックすると、その地点のPOI種類を選択できます。",
      hideGuide: "次回から表示しない",
      candidateKicker: "Map Pattern Finder",
      candidateTitle: "候補パターン",
      layoutLabel: "レイアウト",
      nightlordLabel: "夜の王",
      earthLabel: "地変",
      spawnLabel: "スポーン地点",
      copyLink: "リンク",
      displayFilters: "表示フィルター",
      labels: "ラベル",
      clearFilters: "選択をクリア",
      resetFinder: "リセット",
      nightlordChoice: "夜の王を選択",
      mapChoice: "マップを選択",
      selected: "選択中",
      candidates: "候補",
      linkCopied: "リンクをコピーしました",
      none: "なし",
      map: "マップ",
      spawn: "スポーン",
      selectedSpawn: "選択中のスポーン地点",
      special: "特殊イベント",
      pois: "POI",
      spawnStepTitle: "スポーン地点を選択",
      spawnStepBody: "出現地点を示すマーカーをクリックして選択します。",
      poiStepTitle: "POIまたは教会を選択してください",
      poiStepBody: "青い丸をクリックして教会を選択するか、疑問符をクリックしてPOIの種類を選択してください。",
      patternFoundTitle: "パターンが特定されました",
      patternFoundBody: "マップ上に全てのアイコンを表示しています。",
      selectedPoiZero: "選択されたPOIは0件です",
      selectedPoiCount: "{count}件のPOIが選択されました",
      patternMatchCount: "{count}種類のパターンが一致します",
      patternMatchFew: "{count}つのパターンが一致します",
      patternMatchOne: "1種類のパターンが一致しました",
      poiTypeChoice: "POIの種類を選択",
      noPatterns: "一致するパターンがありません",
      selectedFilters: "選択中の条件",
      likelyFilters: "候補地点",
      exactLayout: "固定表示",
      filterByMap: "地図上のマーカーで絞り込み",
      removeFilter: "条件を削除",
      candidateDragHint: "ドラッグで移動。ダブルクリックで初期位置に戻します。",
      candidateOpenAria: "候補パネルを開く",
      candidateCloseAria: "候補パネルを閉じる",
      languageLabel: "言語",
    },
    en: {
      unknownNightlord: "Nightlord: ???",
      anyNightlord: "Unknown Nightlord",
      anyEarth: "Default / Any",
      anySpawn: "Select Spawn Point",
      ready: "Ready",
      loading: "Loading...",
      guideKicker: "Map Guide",
      guideTitle: "How to use",
      guide1: "Click a spawn point marker to start.",
      guide2: "Blue circles are churches. Click one to select Church.",
      guide3: "Click a question mark to choose a POI type for that location.",
      hideGuide: "Do not show again",
      candidateKicker: "Map Pattern Finder",
      candidateTitle: "Pattern Candidates",
      layoutLabel: "Layout",
      nightlordLabel: "Nightlord",
      earthLabel: "Shifting Earth",
      spawnLabel: "Spawn Point",
      copyLink: "Link",
      displayFilters: "Display filters",
      labels: "Labels",
      clearFilters: "Clear",
      resetFinder: "Reset",
      nightlordChoice: "Select Nightlord",
      mapChoice: "Select Map",
      selected: "Selected",
      candidates: "Candidates",
      linkCopied: "Link copied",
      none: "None",
      map: "Map",
      spawn: "Spawn",
      selectedSpawn: "Selected spawn point",
      special: "Special",
      pois: "POIs",
      spawnStepTitle: "Select Spawn Point",
      spawnStepBody: "Click a marker with the spawn point to select it.",
      poiStepTitle: "Select POIs or Churches",
      poiStepBody: "Click blue circles to select churches or question marks to choose POI types.",
      patternFoundTitle: "Pattern found",
      patternFoundBody: "All map icons are now visible.",
      selectedPoiZero: "0 POIs selected",
      selectedPoiCount: "{count} POIs selected",
      patternMatchCount: "{count} patterns match",
      patternMatchFew: "{count} patterns match",
      patternMatchOne: "1 pattern matches",
      poiTypeChoice: "Select POI Type",
      noPatterns: "No patterns match",
      selectedFilters: "Selected filters",
      likelyFilters: "Candidate locations",
      exactLayout: "Pinned layout",
      filterByMap: "Filter from the map markers",
      removeFilter: "Remove filter",
      candidateDragHint: "Drag to move. Double-click to reset.",
      candidateOpenAria: "Open candidate panel",
      candidateCloseAria: "Close candidate panel",
      languageLabel: "Language",
    },
  };

  const NIGHTLORD_LABELS = {
    ja: {
      Adel: "アデル",
      Caligo: "カリゴ",
      Fulghor: "フルゴール",
      Gladius: "グラディウス",
      Gnoster: "グノスター",
      Heolstor: "ヘオルスター",
      Libra: "リブラ",
      Maris: "マリス",
    },
    en: {},
  };
  NIGHTLORD_LABELS.en = Object.fromEntries(Object.keys(NIGHTLORD_LABELS.ja).map((key) => [key, key]));

  const MAP_LABELS = {
    ja: {
      Default: "通常",
      Mountaintop: "山嶺",
      Crater: "クレーター",
      "Rotted Woods": "腐れ森",
      Noklateo: "ノクラテオ",
    },
    en: {
      Default: "Default",
      Mountaintop: "Mountaintop",
      Crater: "Crater",
      "Rotted Woods": "Rotted Woods",
      Noklateo: "Noklateo",
    },
  };

  const CATEGORY_LABELS = {
    ja: {
      major: "大拠点",
      minor: "小拠点",
      boss: "フィールドボス",
      evergaol: "封牢",
      night: "夜の円",
      spawn: "スポーン地点",
      event: "特殊イベント",
      merchant: "商人",
      grace: "祝福",
      traversal: "移動設備",
      scarab: "スカラベ",
      treasure: "宝",
      utility: "設備",
    },
    en: {},
  };

  const SPAWN_LABELS = {
    ja: {
      "Above Stormhill Tunnel Entrance": "嵐丘坑道入口の上",
      "Below Summonwater Hawk": "呼び水村の鷹の下",
      "East of Cavalry Bridge": "騎兵橋の東",
      "Far Southwest": "南西端",
      "Minor Erdtree": "小黄金樹",
      "Northeast of Saintsbridge": "聖人橋の北東",
      "Southeast of Lake": "湖の南東",
      "Stormhill South of Gate": "嵐丘・関門南",
      "West of Warmaster's Shack": "戦学びのボロ家西",
    },
    en: {},
  };

  const LOCATION_LABELS = {
    ja: {
      "Above Stormhill Tunnel Entrance": "嵐丘坑道入口の上",
      "Alexander Spot": "アレキサンダー地点",
      "Artist's Shack": "絵描きのボロ家",
      "Below Summonwater Hawk": "呼び水村の鷹の下",
      Castle: "城",
      "Castle Basement": "城地下",
      "Castle Rooftop": "城屋上",
      "East of Cavalry Bridge": "騎兵橋の東",
      "East of Murkwater Terminus": "曇り川終点の東",
      "Far Southwest": "南西端",
      "Far Southwest of Lake": "湖の南西端",
      Gatefront: "関門前",
      Groveside: "林脇",
      Highroad: "街道",
      Lake: "湖",
      "Lake Field Boss": "湖のフィールドボス",
      "Minor Erdtree": "小黄金樹",
      Mistwood: "霧の森",
      "Murkwater Terminus": "曇り川の終点",
      "Northeast Mistwood": "霧の森北東",
      "Northeast of Saintsbridge": "聖人橋の北東",
      "Northeast Stormhill": "嵐丘北東",
      "Northeast Tunnel Entrance": "北東坑道入口",
      "North of Murkwater Terminus": "曇り川終点の北",
      "North of Stormhill Tunnel Entrance": "嵐丘坑道入口の北",
      "Northwest Mistwood": "霧の森北西",
      "Northwest of Lake": "湖の北西",
      "Northwest of Summonwater": "呼び水村の北西",
      "Northwest Stormhill": "嵐丘北西",
      "Northwest Stormhill Cliffside": "嵐丘北西の崖際",
      "South Lake": "南湖",
      "Southeast of Lake": "湖の南東",
      "Stormhill": "嵐丘",
      "Stormhill North of Gate": "嵐丘・関門北",
      "Stormhill South of Gate": "嵐丘・関門南",
      "Stormhill Spectral Hawk": "嵐丘の霊鷹",
      Summonwater: "呼び水村",
      "Summonwater Approach": "呼び水村への道",
      "Third Church": "第三教会",
      "West of Warmaster's Shack": "戦学びのボロ家西",
    },
    en: {},
  };

  const VALUE_LABELS = {
    ja: {
      "Above Door": "扉の上",
      "Above Door, Teleporting Trees, Missing Statue": "扉の上・転移する木・消えた像",
      "Abductor Virgin": "鉄の処女",
      "Albinauric Archers": "しろがねの弓兵",
      Albinaurics: "しろがね人",
      "Ancient Dragon": "古竜",
      "Ancient Hero of Zamor": "ザミェルの古英雄",
      "Ancient Heroes of Zamor": "ザミェルの古英雄",
      "Ancestor Spirit": "祖霊",
      "Banished Knights": "失地騎士",
      Battlemages: "戦魔術師",
      "Beastly Brigade": "獣の部隊",
      "Beastmen of Farum Azula": "ファルム・アズラの獣人",
      "Bell Bearing Hunter": "鈴玉狩り",
      "Black Blade Kindred": "黒き剣の眷属",
      "Black Knife Assassin": "黒き刃の刺客",
      "Bloodhound Knight": "猟犬騎士",
      "Crucible Knight with Spear": "坩堝の騎士・槍",
      "Crucible Knight with Sword": "坩堝の騎士・剣",
      "Crucible Knights": "坩堝の騎士たち",
      Crystalians: "結晶人",
      "Death Rite Bird": "死儀礼の鳥",
      "Demi-Human Queen": "亜人の女王",
      "Demi-Human Queen and Swordmaster": "亜人の女王と剣聖",
      "Depraved Perfumer": "堕落調香師",
      "Draconic Tree Sentinel": "竜のツリーガード",
      "Dragonkin Soldier": "竜人兵",
      "Elder Lion": "老獅子",
      "Erdtree Avatar": "黄金樹の化身",
      "Erdtree Burial Watchdogs": "還樹の番犬",
      "Fake Building": "偽の建物",
      "Fake Building, Pool Reflection, Second Floor": "偽の建物・水面反射・2階",
      "Fake Building, Right of Door, Unlit Candle": "偽の建物・扉右・灯らぬ燭台",
      "Fire Monk": "火の僧兵",
      "Flame Chariots": "火の戦車",
      "Fleeing Stump": "逃げる切り株",
      "Flying Dragon": "飛竜",
      "Fog Door": "霧の扉",
      "Frenzied Flame Troll": "狂い火のトロル",
      "Godskin Apostle": "神肌の使徒",
      "Godskin Duo": "神肌のふたり",
      "Godskin Noble": "神肌の貴種",
      "Golden Hippopotamus": "黄金カバ",
      "Grafted Scion": "接ぎ木の貴公子",
      "Grave Warden Duelist": "墓守闘士",
      "Guardian Golem": "ガーディアン・ゴーレム",
      "Imp Statue": "インプ像",
      "Imp Statue, Teleporting Trees, Fleeing Stump": "インプ像・転移する木・逃げる切り株",
      "Imp Statue, Windy Trees, Second Floor": "インプ像・風の木・2階",
      "Leonine Misbegotten": "獅子の混種",
      "Lordsworn Captain": "君主軍の隊長",
      "Magma Wyrm": "溶岩土竜",
      "Mausoleum Knight": "霊廟騎士",
      "Miranda Blossom": "ミランダフラワー",
      Morgott: "忌み王、モーゴット",
      "Missing Statue": "消えた像",
      "Night's Cavalry": "夜の騎兵",
      "Normal": "通常",
      "Nox Warriors": "ノクスの剣士",
      Omen: "忌み子",
      "Oracle Envoys": "神託の使者",
      Perfumer: "調香師",
      "Pool Reflection": "水面反射",
      "Rear Withered Trees, Right of Door, Missing Statue": "奥の枯れ木・扉右・消えた像",
      "Red Wolf": "赤狼",
      "Redmane Knights": "赤獅子騎士",
      "Royal Army Knights": "王軍騎士",
      "Royal Carian Knight": "カーリア王家騎士",
      "Royal Revenant": "王族の幽鬼",
      Runebear: "ルーンベア",
      "Sanguine Noble": "血の貴族",
      "Stoneskin Lords": "石肌の王たち",
      Township: "街",
      "Tree Sentinel": "ツリーガード",
      Trolls: "トロルたち",
      "Ulcerated Tree Spirit": "爛れた樹霊",
      "Unlit Candle": "灯らぬ燭台",
      "Windy Trees": "風の木",
      "Withered Trees": "枯れ木",
      Wormface: "ミミズ顔",
    },
    en: {},
  };

  CATEGORY_LABELS.en = {};
  SPAWN_LABELS.en = {};
  LOCATION_LABELS.en = {};
  VALUE_LABELS.en = {};

  const elements = {
    viewport: app.querySelector("[data-nr-map-viewport]"),
    world: app.querySelector("[data-nr-map-world]"),
    tiles: app.querySelector("[data-nr-map-tiles]"),
    poiLayer: app.querySelector("[data-nr-poi-layer]"),
    status: app.querySelector("[data-nr-status]"),
    guide: app.querySelector("[data-nr-guide]"),
    candidatePanel: app.querySelector("[data-nr-candidate-panel]"),
    sheetHandle: app.querySelector("[data-nr-candidate-handle]"),
    candidateGrid: app.querySelector("[data-nr-candidate-grid]"),
    selectedFilters: app.querySelector("[data-nr-selected-filters]"),
    summary: app.querySelector("[data-nr-summary]"),
    categories: app.querySelector("[data-nr-categories]"),
    shiftOrbs: app.querySelector("[data-nr-shift-orbs]"),
    languages: app.querySelector("[data-nr-languages]"),
    nightlordOptions: app.querySelector("[data-nr-nightlord-options]"),
    mapOptions: app.querySelector("[data-nr-map-options]"),
    mapPreview: app.querySelector("[data-nr-map-preview]"),
    nightlordLabel: app.querySelector("[data-nr-nightlord-label]"),
    nightlordGlyph: app.querySelector("[data-nr-nightlord-glyph]"),
    mapLabel: app.querySelector("[data-nr-map-label]"),
    hideGuide: app.querySelector("[data-nr-control='hideGuide']"),
    controls: {
      nightlord: app.querySelector("[data-nr-control='nightlord']"),
      shiftingEarth: app.querySelector("[data-nr-control='shiftingEarth']"),
      spawnPoint: app.querySelector("[data-nr-control='spawnPoint']"),
      layoutNumber: app.querySelector("[data-nr-control='layoutNumber']"),
      showLabels: app.querySelector("[data-nr-control='showLabels']"),
    },
  };

  const state = {
    index: null,
    pattern: null,
    poiCoordinates: new Map(),
    staticPoiCache: new Map(),
    staticPois: [],
    aggregateMarkers: new Map(),
    poiChoice: null,
    requestToken: 0,
    language: "ja",
    nightlord: "",
    shiftingEarth: "",
    spawnPoint: "",
    layoutNumber: 1,
    exactLayout: false,
    selectedLandmarks: new Set(),
    categories: new Set(),
    showLabels: true,
    hideGuide: false,
    candidateOpen: true,
    mapLayout: "",
    scale: 1,
    x: 0,
    y: 0,
    pointers: new Map(),
    drag: null,
    pinch: null,
    candidatePosition: null,
    panelDrag: null,
    initializedView: false,
  };

  boot();

  async function boot() {
    wireEvents();
    try {
      const [index, masterPois] = await Promise.all([
        fetchJson(`${DATA_BASE}/index.json`),
        fetchJson(`${DATA_BASE}/poi_coordinates_with_ids.json`),
      ]);
      state.index = index;
      state.poiCoordinates = new Map(masterPois.map((poi) => [String(poi.id), {
        x: Number(poi.coordinates?.[0]),
        y: Number(poi.coordinates?.[1]),
      }]));
      applyInitialState(readInitialState());
      renderStaticControls();
      renderAllControls();
      updateCopy();
      await loadLayout(state.layoutNumber, { resetView: true });
      setStatus(statusText());
    } catch (error) {
      setStatus(`Map load error: ${error.message || error}`);
    }
  }

  function wireEvents() {
    elements.controls.nightlord.addEventListener("change", () => {
      state.nightlord = elements.controls.nightlord.value;
      state.exactLayout = false;
      state.poiChoice = null;
      syncToFirstMatchingLayout();
    });

    elements.controls.shiftingEarth.addEventListener("change", () => {
      state.shiftingEarth = elements.controls.shiftingEarth.value;
      state.spawnPoint = "";
      state.selectedLandmarks.clear();
      state.exactLayout = false;
      state.poiChoice = null;
      syncToFirstMatchingLayout();
    });

    elements.controls.spawnPoint.addEventListener("change", () => {
      state.spawnPoint = elements.controls.spawnPoint.value;
      state.selectedLandmarks.clear();
      state.exactLayout = false;
      state.poiChoice = null;
      state.candidateOpen = true;
      syncToFirstMatchingLayout();
    });

    elements.controls.layoutNumber.addEventListener("change", () => {
      const layout = findLayout(Number(elements.controls.layoutNumber.value));
      if (!layout) return;
      state.layoutNumber = layout.layoutNumber;
      state.nightlord = layout.nightlord;
      state.shiftingEarth = layout.shiftingEarth;
      state.spawnPoint = layout.spawnPoint;
      state.selectedLandmarks.clear();
      state.exactLayout = true;
      state.poiChoice = null;
      loadLayout(state.layoutNumber);
    });

    elements.controls.showLabels.addEventListener("change", () => {
      state.showLabels = elements.controls.showLabels.checked;
      renderPois();
      persistState();
    });

    elements.hideGuide.addEventListener("change", () => {
      state.hideGuide = elements.hideGuide.checked;
      if (state.hideGuide) elements.guide.hidden = true;
      persistState();
    });

    elements.categories.addEventListener("change", (event) => {
      const input = event.target.closest("[data-nr-category]");
      if (!input) return;
      if (input.checked) state.categories.add(input.value);
      else state.categories.delete(input.value);
      renderPois();
      renderSummary();
      persistState();
    });

    app.addEventListener("click", (event) => {
      const poiType = event.target.closest("[data-nr-poi-type]");
      if (poiType) {
        selectPoiType(poiType.dataset.nrPoiId, Number(poiType.dataset.nrPoiType));
        return;
      }

      const spawnShortcut = event.target.closest("[data-nr-spawn-shortcut]");
      if (spawnShortcut) {
        state.spawnPoint = spawnShortcut.dataset.nrSpawnShortcut;
        state.selectedLandmarks.clear();
        state.exactLayout = false;
        state.poiChoice = null;
        state.candidateOpen = true;
        syncToFirstMatchingLayout();
        return;
      }

      const language = event.target.closest("[data-nr-lang]");
      if (language) {
        state.language = language.dataset.nrLang === "en" ? "en" : "ja";
        updateCopy();
        renderStaticControls();
        renderAllControls();
        renderPois();
        renderCandidatePanel();
        renderSummary();
        persistState();
        return;
      }

      const nightlordChoice = event.target.closest("[data-nr-nightlord]");
      if (nightlordChoice) {
        state.nightlord = nightlordChoice.dataset.nrNightlord;
        state.exactLayout = false;
        closePanels();
        syncToFirstMatchingLayout();
        return;
      }

      const mapChoice = event.target.closest("[data-nr-earth]");
      if (mapChoice) {
        state.shiftingEarth = mapChoice.dataset.nrEarth;
        state.spawnPoint = "";
        state.selectedLandmarks.clear();
        state.exactLayout = false;
        closePanels();
        syncToFirstMatchingLayout();
        return;
      }

      const candidate = event.target.closest("[data-nr-landmark]");
      if (candidate) {
        toggleLandmark(candidate.dataset.nrLandmark);
        state.exactLayout = false;
        syncToFirstMatchingLayout();
        return;
      }

      const chipRemove = event.target.closest("[data-nr-remove-landmark]");
      if (chipRemove) {
        state.selectedLandmarks.delete(chipRemove.dataset.nrRemoveLandmark);
        state.exactLayout = false;
        syncToFirstMatchingLayout();
        return;
      }

      const marker = event.target.closest(".nr-poi");
      if (marker) {
        handleMarkerClick(marker, event);
        return;
      }

      const action = event.target.closest("[data-nr-action]");
      if (action) handleAction(action.dataset.nrAction);
    });

    elements.candidatePanel.addEventListener("pointerdown", onCandidatePanelPointerDown);
    elements.candidatePanel.addEventListener("pointermove", onCandidatePanelPointerMove);
    elements.candidatePanel.addEventListener("pointerup", onCandidatePanelPointerEnd);
    elements.candidatePanel.addEventListener("pointercancel", onCandidatePanelPointerEnd);
    elements.candidatePanel.addEventListener("dblclick", onCandidatePanelDoubleClick);

    elements.viewport.addEventListener("wheel", onWheel, { passive: false });
    elements.viewport.addEventListener("dblclick", (event) => {
      event.preventDefault();
      zoomAt(event.clientX, event.clientY, state.scale * 1.32);
    });
    elements.viewport.addEventListener("pointerdown", onPointerDown);
    elements.viewport.addEventListener("pointermove", onPointerMove);
    elements.viewport.addEventListener("pointerup", onPointerEnd);
    elements.viewport.addEventListener("pointercancel", onPointerEnd);
    window.addEventListener("resize", debounce(() => {
      clampTransform();
      applyTransform();
      applyCandidatePanelPosition();
    }, 120));
  }

  function handleAction(action) {
    if (action === "open-nightlord") {
      togglePanel("nightlord");
    } else if (action === "open-map") {
      togglePanel("map");
    } else if (action === "close-panels") {
      closePanels();
    } else if (action === "close-guide") {
      elements.guide.hidden = true;
      state.hideGuide = elements.hideGuide.checked;
      persistState();
    } else if (action === "toggle-candidates") {
      state.candidateOpen = !state.candidateOpen;
      renderCandidateSheet();
      persistState();
    } else if (action === "finder-reset") {
      resetFinder();
    } else if (action === "clear-landmarks") {
      state.selectedLandmarks.clear();
      state.exactLayout = false;
      state.poiChoice = null;
      syncToFirstMatchingLayout();
    } else if (action === "zoom-in") {
      zoomAtViewportCenter(state.scale * 1.24);
    } else if (action === "zoom-out") {
      zoomAtViewportCenter(state.scale / 1.24);
    } else if (action === "reset-view") {
      resetView();
    } else if (action === "copy-link") {
      copyCurrentLink();
    }
  }

  function handleMarkerClick(marker, event) {
    const category = marker.dataset.category;
    if (category === "spawn") {
      state.spawnPoint = marker.dataset.location || "";
      state.selectedLandmarks.clear();
      state.exactLayout = false;
      state.poiChoice = null;
      state.candidateOpen = true;
      syncToFirstMatchingLayout();
      return;
    }

    const filterId = marker.dataset.filterId;
    if (filterId) {
      const selectedType = marker.dataset.selectedType;
      if (selectedType) {
        state.selectedLandmarks.delete(signatureForType(filterId, Number(selectedType)));
        state.exactLayout = false;
        syncToFirstMatchingLayout();
        return;
      }

      const churchType = marker.dataset.churchType;
      if (churchType) {
        selectPoiType(filterId, Number(churchType));
        return;
      }

      state.poiChoice = { id: filterId };
      renderPois();
      event.stopPropagation();
      return;
    }

    const signature = marker.dataset.landmark;
    if (signature) {
      toggleLandmark(signature);
      state.exactLayout = false;
      syncToFirstMatchingLayout();
      return;
    }

    setStatus(marker.dataset.title || statusText());
  }

  function selectPoiType(id, type) {
    if (!id || !type) return;
    state.selectedLandmarks.add(signatureForType(id, type));
    state.poiChoice = null;
    state.exactLayout = false;
    syncToFirstMatchingLayout();
  }

  function resetFinder() {
    state.spawnPoint = "";
    state.selectedLandmarks.clear();
    state.exactLayout = false;
    state.poiChoice = null;
    state.candidateOpen = true;
    syncToFirstMatchingLayout();
  }

  function syncToFirstMatchingLayout() {
    chooseFirstMatchingLayout();
    renderAllControls();
    if (state.layoutNumber) loadLayout(state.layoutNumber);
    else {
      renderPois();
      renderCandidatePanel();
      renderSummary();
      persistState();
    }
  }

  async function loadLayout(layoutNumber, options = {}) {
    const layout = findLayout(layoutNumber);
    if (!layout) return;

    const token = ++state.requestToken;
    setStatus(t("loading"));
    const pattern = await fetchJson(`${DATA_BASE}/patterns/layout_${pad3(layout.layoutNumber)}.json`);
    const mapInfo = state.index.maps[pattern.mapLayout];
    const staticPois = await loadStaticPois(pattern.mapLayout, mapInfo.staticPoiFile);
    if (token !== state.requestToken) return;

    const mapChanged = state.mapLayout !== pattern.mapLayout;
    state.pattern = pattern;
    state.staticPois = staticPois;
    state.layoutNumber = pattern.layoutNumber;
    state.mapLayout = pattern.mapLayout;

    if (mapChanged || !elements.tiles.children.length) {
      renderTiles(mapInfo.tileDirectory);
      renderMapPreview(mapInfo);
    }

    renderAllControls();
    renderPois();
    renderCandidatePanel();
    renderSummary();
    setStatus(statusText());
    persistState();

    if (options.resetView || mapChanged || !state.initializedView) {
      requestAnimationFrame(() => {
        resetView();
        state.initializedView = true;
      });
    }
  }

  async function loadStaticPois(mapLayout, file) {
    if (state.staticPoiCache.has(mapLayout)) return state.staticPoiCache.get(mapLayout);
    const pois = await fetchJson(`${DATA_BASE}/${file}`);
    state.staticPoiCache.set(mapLayout, pois);
    return pois;
  }

  function renderStaticControls() {
    renderCategoryFilters();
    renderNightlordChoices();
    renderMapChoices();
    renderShiftOrbs();
  }

  function renderAllControls() {
    renderSelects();
    renderOrbs();
    renderLanguageSwitch();
    renderCandidateSheet();
    elements.controls.showLabels.checked = state.showLabels;
    elements.hideGuide.checked = state.hideGuide;
    elements.guide.hidden = state.hideGuide;
    app.classList.toggle("nr-labels-hidden", !state.showLabels);
  }

  function renderSelects() {
    renderSelect(
      elements.controls.nightlord,
      [{ value: "", label: t("anyNightlord") }, ...state.index.nightlords.map((value) => ({ value, label: nightlordLabel(value) }))],
      state.nightlord
    );

    renderSelect(
      elements.controls.shiftingEarth,
      [{ value: "", label: t("anyEarth") }, ...state.index.shiftingEarths.map((value) => ({ value, label: mapLabel(value) }))],
      state.shiftingEarth
    );

    renderSelect(
      elements.controls.spawnPoint,
      [{ value: "", label: t("anySpawn") }, ...state.index.spawnPoints.map((value) => ({ value, label: spawnLabel(value) }))],
      state.spawnPoint
    );

    const matches = getMatchingLayouts();
    const layoutOptions = matches.length
      ? matches.map((layout) => ({ value: String(layout.layoutNumber), label: formatLayoutOption(layout) }))
      : state.index.layouts.map((layout) => ({ value: String(layout.layoutNumber), label: formatLayoutOption(layout) }));
    renderSelect(elements.controls.layoutNumber, layoutOptions, String(state.layoutNumber));
  }

  function renderSelect(select, options, selectedValue) {
    const html = options
      .map((item) => `<option value="${attr(item.value)}"${String(item.value) === String(selectedValue) ? " selected" : ""}>${esc(item.label)}</option>`)
      .join("");
    if (select.innerHTML !== html) select.innerHTML = html;
    if (options.some((item) => String(item.value) === String(selectedValue))) {
      select.value = String(selectedValue);
    }
  }

  function renderOrbs() {
    const nightlord = state.nightlord || "";
    elements.nightlordLabel.textContent = nightlord ? nightlordLabel(nightlord) : t("nightlordLabel");
    if (nightlord && NIGHTLORD_IMAGES[nightlord]) {
      elements.nightlordGlyph.innerHTML = `<img src="${ASSET_BASE}/nightlords/${attr(NIGHTLORD_IMAGES[nightlord])}" alt="${attr(nightlordLabel(nightlord))}">`;
    } else {
      elements.nightlordGlyph.textContent = "?";
    }
    elements.status.textContent = statusText();
    elements.mapLabel.textContent = state.shiftingEarth ? mapLabel(state.shiftingEarth) : mapLabel("Default");

    for (const button of elements.shiftOrbs.querySelectorAll("[data-nr-earth]")) {
      button.classList.toggle("is-active", button.dataset.nrEarth === state.shiftingEarth);
    }
    for (const button of elements.nightlordOptions.querySelectorAll("[data-nr-nightlord]")) {
      button.classList.toggle("is-active", button.dataset.nrNightlord === state.nightlord);
    }
    for (const button of elements.mapOptions.querySelectorAll("[data-nr-earth]")) {
      button.classList.toggle("is-active", button.dataset.nrEarth === state.shiftingEarth);
    }
  }

  function renderNightlordChoices() {
    const choices = [{ value: "", label: t("anyNightlord"), token: "?" }]
      .concat(state.index.nightlords.map((value) => ({ value, label: nightlordLabel(value), token: value.slice(0, 1).toUpperCase() })));
    elements.nightlordOptions.innerHTML = choices.map((choice) => {
      const image = NIGHTLORD_IMAGES[choice.value];
      return `
        <button type="button" class="nr-choice-card" data-nr-nightlord="${attr(choice.value)}">
          <span class="nr-choice-token${image ? " is-image" : ""}">
            ${image ? `<img src="${ASSET_BASE}/nightlords/${attr(image)}" alt="">` : esc(choice.token)}
          </span>
          <span>${esc(choice.label)}</span>
        </button>
      `;
    }).join("");
  }

  function renderMapChoices() {
    const choices = [{ value: "", label: t("anyEarth"), key: "default" }]
      .concat(state.index.shiftingEarths.map((value) => ({ value, label: mapLabel(value), key: mapKeyForEarth(value) })));
    elements.mapOptions.innerHTML = choices.map((choice) => {
      const tile = tileUrl(state.index.maps[choice.key]?.tileDirectory || "default_map_tiles", 2, 3);
      return `
        <button type="button" class="nr-choice-card" data-nr-earth="${attr(choice.value)}">
          <span class="nr-choice-token is-map" style="background-image:url('${attr(tile)}')"></span>
          <span>${esc(choice.label)}</span>
        </button>
      `;
    }).join("");
  }

  function renderShiftOrbs() {
    elements.shiftOrbs.innerHTML = state.index.shiftingEarths.map((earth) => `
      <button type="button" class="nr-shift-button" data-nr-earth="${attr(earth)}" title="${attr(mapLabel(earth))}">
        ${esc(shortMapLabel(earth))}
      </button>
    `).join("");
  }

  function renderMapPreview(mapInfo) {
    const directory = mapInfo?.tileDirectory || "default_map_tiles";
    elements.mapPreview.style.backgroundImage = `url("${tileUrl(directory, 2, 3)}")`;
  }

  function renderCategoryFilters() {
    elements.categories.innerHTML = state.index.categories.map((category) => `
      <label class="nr-category">
        <input type="checkbox" value="${attr(category.id)}" data-nr-category ${state.categories.has(category.id) ? "checked" : ""}>
        <span>${esc(categoryLabel(category))}</span>
      </label>
    `).join("");
  }

  function renderCandidatePanel() {
    const matches = getMatchingLayouts();
    elements.selectedFilters.innerHTML = renderFinderStatus(matches);

    const candidates = candidateLandmarks(matches);
    elements.candidateGrid.innerHTML = candidates.length
      ? candidates.map((candidate) => `
        <button type="button" class="nr-candidate${state.selectedLandmarks.has(candidate.signature) ? " is-selected" : ""}"
          data-nr-landmark="${attr(candidate.signature)}" title="${attr(candidate.label)}">
          <img src="${ASSET_BASE}/icons/${attr(candidate.icon)}" alt="">
          <span class="nr-candidate-count">${candidate.count}</span>
        </button>
      `).join("")
      : renderSpawnShortcuts(matches);

    renderCandidateSheet();
  }

  function renderFinderStatus(matches) {
    const count = matches.length;
    const isExact = state.exactLayout || count === 1;
    if (!state.spawnPoint && !isExact) {
      return `
        <div class="nr-finder-status">
          <h3>${esc(t("spawnStepTitle"))}</h3>
          <p>${esc(t("spawnStepBody"))}</p>
          <strong>${esc(formatPatternCount(count))}</strong>
        </div>
      `;
    }

    if (isExact && count !== 0) {
      return `
        <div class="nr-finder-status is-complete">
          <h3>${esc(t("patternFoundTitle"))}</h3>
          <p>${esc(t("patternFoundBody"))}</p>
          <strong>${esc(formatPatternCount(count))}</strong>
        </div>
        ${renderSelectedFilterChips()}
      `;
    }

    return `
      <div class="nr-finder-status">
        <h3>${esc(t("poiStepTitle"))}</h3>
        <p class="nr-selected-count">${esc(formatSelectedPoiCount(state.selectedLandmarks.size))}</p>
        <p>${esc(t("poiStepBody"))}</p>
        <strong>${esc(count ? formatPatternCount(count) : t("noPatterns"))}</strong>
      </div>
      ${renderSelectedFilterChips()}
    `;
  }

  function renderSelectedFilterChips() {
    if (!state.selectedLandmarks.size) return "";
    return `
      <div class="nr-filter-chip-row" aria-label="${attr(t("selectedFilters"))}">
        ${[...state.selectedLandmarks].map((signature) => `
          <span class="nr-filter-chip">
            ${esc(labelForSignature(signature))}
            <button type="button" data-nr-remove-landmark="${attr(signature)}" aria-label="${attr(t("removeFilter"))}">×</button>
          </span>
        `).join("")}
      </div>
    `;
  }

  function renderSpawnShortcuts(matches) {
    if (state.spawnPoint) return `<div class="nr-filter-chip">${esc(t("none"))}</div>`;
    const validSpawns = validSpawnLocations(matches);
    return state.index.spawnPointDetails
      .filter((spawn) => validSpawns.has(spawn.location))
      .map((spawn) => `
        <button type="button" class="nr-spawn-shortcut" data-nr-spawn-shortcut="${attr(spawn.location)}">
          <img src="${ASSET_BASE}/icons/Spawn_Hawk.png" alt="">
          <span>${esc(spawnLabel(spawn.location))}</span>
        </button>
      `).join("");
  }

  function renderCandidateSheet() {
    const isOpen = state.candidateOpen;
    elements.candidatePanel.classList.toggle("is-open", isOpen);
    if (elements.sheetHandle) {
      elements.sheetHandle.dataset.state = isOpen ? "open" : "closed";
      elements.sheetHandle.setAttribute("aria-label", isOpen ? t("candidateCloseAria") : t("candidateOpenAria"));
      elements.sheetHandle.setAttribute("title", isOpen ? t("candidateCloseAria") : t("candidateOpenAria"));
    }
    applyCandidatePanelPosition();
  }

  function onCandidatePanelPointerDown(event) {
    if (!isDesktopLayout()) return;
    if (event.button !== undefined && event.button !== 0) return;
    if (!event.target.closest(".nr-candidate-header")) return;
    if (event.target.closest("button, select, input, textarea, a, label, summary")) return;

    const shellRect = candidateShellRect();
    const panelRect = elements.candidatePanel.getBoundingClientRect();
    const origin = clampCandidatePosition({
      x: panelRect.left - shellRect.left,
      y: panelRect.top - shellRect.top,
    });

    state.candidatePosition = origin;
    state.panelDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.x,
      originY: origin.y,
      moved: false,
    };

    applyCandidatePanelPosition();
    elements.candidatePanel.classList.add("is-panel-dragging");
    try {
      elements.candidatePanel.setPointerCapture(event.pointerId);
    } catch {
      // Some browsers release capture eagerly for non-primary pointers.
    }
    event.preventDefault();
    event.stopPropagation();
  }

  function onCandidatePanelPointerMove(event) {
    if (!state.panelDrag || state.panelDrag.pointerId !== event.pointerId) return;
    const dx = event.clientX - state.panelDrag.startX;
    const dy = event.clientY - state.panelDrag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) state.panelDrag.moved = true;
    state.candidatePosition = clampCandidatePosition({
      x: state.panelDrag.originX + dx,
      y: state.panelDrag.originY + dy,
    });
    applyCandidatePanelPosition();
    event.preventDefault();
    event.stopPropagation();
  }

  function onCandidatePanelPointerEnd(event) {
    if (!state.panelDrag || state.panelDrag.pointerId !== event.pointerId) return;
    const moved = state.panelDrag.moved;
    state.panelDrag = null;
    elements.candidatePanel.classList.remove("is-panel-dragging");
    try {
      elements.candidatePanel.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released.
    }
    if (moved) persistState();
    event.stopPropagation();
  }

  function onCandidatePanelDoubleClick(event) {
    if (!isDesktopLayout()) return;
    if (!event.target.closest(".nr-candidate-header")) return;
    if (event.target.closest("button, select, input, textarea, a, label, summary")) return;
    state.candidatePosition = null;
    applyCandidatePanelPosition();
    persistState();
    event.preventDefault();
  }

  function applyCandidatePanelPosition() {
    if (!state.candidatePosition || !isDesktopLayout()) {
      elements.candidatePanel.classList.remove("is-positioned");
      elements.candidatePanel.style.removeProperty("left");
      elements.candidatePanel.style.removeProperty("top");
      elements.candidatePanel.style.removeProperty("right");
      elements.candidatePanel.style.removeProperty("bottom");
      return;
    }

    state.candidatePosition = clampCandidatePosition(state.candidatePosition);
    elements.candidatePanel.classList.add("is-positioned");
    elements.candidatePanel.style.left = `${state.candidatePosition.x}px`;
    elements.candidatePanel.style.top = `${state.candidatePosition.y}px`;
    elements.candidatePanel.style.right = "auto";
    elements.candidatePanel.style.bottom = "auto";
  }

  function clampCandidatePosition(position) {
    const shellRect = candidateShellRect();
    const panelWidth = elements.candidatePanel.offsetWidth || 360;
    const panelHeight = elements.candidatePanel.offsetHeight || 320;
    const maxX = Math.max(CANDIDATE_PANEL_MARGIN, shellRect.width - panelWidth - CANDIDATE_PANEL_MARGIN);
    const maxY = Math.max(CANDIDATE_PANEL_MARGIN, shellRect.height - panelHeight - CANDIDATE_PANEL_MARGIN);
    return {
      x: Math.round(clamp(Number(position.x) || 0, CANDIDATE_PANEL_MARGIN, maxX)),
      y: Math.round(clamp(Number(position.y) || 0, CANDIDATE_PANEL_MARGIN, maxY)),
    };
  }

  function candidateShellRect() {
    return (elements.candidatePanel.offsetParent || app).getBoundingClientRect();
  }

  function normalizeCandidatePosition(position) {
    if (!position || typeof position !== "object") return null;
    const x = Number(position.x);
    const y = Number(position.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  }

  function isDesktopViewport() {
    return window.matchMedia(DESKTOP_QUERY).matches;
  }

  function isMobileViewport() {
    return !isDesktopViewport();
  }

  function isDesktopLayout() {
    return isDesktopViewport();
  }

  function renderSummary() {
    if (!state.pattern) return;
    const matches = getMatchingLayouts();
    elements.summary.innerHTML = [
      [t("layoutLabel"), `${state.pattern.layoutNumber} / ${state.pattern.patternId}`],
      [t("nightlordLabel"), nightlordLabel(state.pattern.nightlord)],
      [t("map"), mapLabel(state.pattern.shiftingEarth)],
      [t("spawn"), spawnLabel(state.pattern.spawnPoint)],
      [t("special"), translateValue(state.pattern.specialEvent) || t("none")],
      [t("pois"), `${visiblePoiCount()} / ${state.staticPois.length + state.pattern.dynamicPOIs.length}`],
      [t("candidates"), `${matches.length}`],
    ].map(([label, value]) => `
      <div>
        <dt>${esc(label)}</dt>
        <dd>${esc(value)}</dd>
      </div>
    `).join("");
  }

  function renderPois() {
    if (!state.pattern) return;
    state.aggregateMarkers.clear();

    const matches = getMatchingLayouts();
    const count = matches.length;
    let pois = [];
    const isExact = state.exactLayout || count === 1;

    if (!state.spawnPoint && !isExact) {
      const validSpawns = validSpawnLocations(matches);
      pois = spawnPois().filter((poi) => validSpawns.has(poi.location));
    } else if (isExact && count !== 0) {
      const exactPatternPois = state.pattern.dynamicPOIs;
      const staticPois = state.staticPois.filter((poi) => state.categories.has(poi.category));
      const dynamicPois = exactPatternPois.filter((poi) => state.categories.has(poi.category));
      pois = [...staticPois, ...dynamicPois, ...selectedSpawnPois()];
    } else {
      pois = [...aggregateFilterPois(matches), ...selectedSpawnPois()];
    }

    const validPois = pois.filter((poi) => isFiniteNumber(poi.x) && isFiniteNumber(poi.y));
    elements.poiLayer.innerHTML = validPois.map(renderPoi).join("") + renderPoiChoiceMenu();
    app.classList.toggle("nr-labels-hidden", !state.showLabels);
  }

  function spawnPois() {
    return state.index.spawnPointDetails.map((spawn) => ({
      id: `spawn-${spawn.id}`,
      x: spawn.x,
      y: spawn.y,
      location: spawn.location,
      value: "Spawn Point",
      title: spawn.location,
      icon: "Spawn_Hawk.png",
      category: "spawn",
      source: "spawn-all",
    }));
  }

  function selectedSpawnPois() {
    if (!state.spawnPoint) return [];
    const spawn = state.index.spawnPointDetails.find((item) => item.location === state.spawnPoint);
    if (!spawn) return [];
    return [{
      id: `spawn-selected-${spawn.id}`,
      x: spawn.x,
      y: spawn.y,
      location: spawn.location,
      value: "Spawn Point",
      title: `${spawnLabel(spawn.location)} / ${t("selectedSpawn")}`,
      icon: "Spawn_Hawk.png",
      category: "spawn",
      source: "spawn-selected",
      selected: true,
    }];
  }

  function aggregateFilterPois(matches) {
    const byId = new Map();
    for (const layout of matches) {
      for (const poi of layout.filterLandmarks || []) {
        if (!FILTERABLE_CATEGORIES.has(poi.category)) continue;
        const id = String(poi.id);
        const type = typeCodeForPoi(poi);
        if (!isSelectableType(type)) continue;
        const coordinates = state.poiCoordinates.get(id);
        if (!coordinates || !isFiniteNumber(coordinates.x) || !isFiniteNumber(coordinates.y)) continue;
        const current = byId.get(id) || {
          kind: "filter",
          id,
          x: coordinates.x,
          y: coordinates.y,
          location: poi.location,
          options: new Map(),
        };
        if (!current.options.has(type)) {
          current.options.set(type, {
            type,
            icon: iconForType(type, poi.icon),
            label: typeLabel(type),
            count: 0,
          });
        }
        current.options.get(type).count += 1;
        byId.set(id, current);
      }
    }

    const markers = [...byId.values()].map((marker) => {
      const options = [...marker.options.values()]
        .sort((a, b) => typeRank(a.type) - typeRank(b.type) || b.count - a.count || a.label.localeCompare(b.label));
      const selected = options.find((option) => state.selectedLandmarks.has(signatureForType(marker.id, option.type)));
      const hasChurch = options.some((option) => option.type === 4);
      const normalized = {
        ...marker,
        options,
        selectedType: selected?.type || null,
        selectedIcon: selected?.icon || "",
        hasChurch,
        category: "filter",
        title: selected ? `${locationLabel(marker.location)} / ${selected.label}` : hasChurch ? typeLabel(4) : "POI",
      };
      state.aggregateMarkers.set(marker.id, normalized);
      return normalized;
    });

    return markers.sort((a, b) => Number(a.y) - Number(b.y) || Number(a.x) - Number(b.x));
  }

  function renderPoi(poi, index) {
    const left = ((poi.x - LEFT_BOUND) / ACTIVE_WIDTH) * 100;
    const top = (poi.y / ACTIVE_HEIGHT) * 100;
    const signature = FILTERABLE_CATEGORIES.has(poi.category) ? signatureForLandmark(poi) : "";
    const selected = signature && state.selectedLandmarks.has(signature);
    const isSpawnSelected = poi.category === "spawn" && state.spawnPoint === poi.location;
    const size = poi.category === "spawn"
      ? (isSpawnSelected ? 68 : 56)
      : poi.kind === "filter"
        ? 42
        : Math.round((ICON_SIZES[poi.icon] || 28) * 1.12);
    const label = labelForPoi(poi);
    const classes = ["nr-poi"];
    if (poi.kind === "filter") classes.push("nr-filter-poi");
    if (isSpawnSelected) classes.push("is-selected-spawn");
    if (poi.kind === "filter" && poi.hasChurch && !poi.selectedType) classes.push("is-church-choice");
    if (poi.kind === "filter" && !poi.hasChurch && !poi.selectedType) classes.push("is-question-choice");
    if (selected || poi.selectedType) classes.push("is-filter-selected");

    return `
      <button
        type="button"
        class="${classes.join(" ")}"
        style="left:${left.toFixed(4)}%;top:${top.toFixed(4)}%;--poi-size:${size}px;z-index:${zIndexForPoi(poi, index)}"
        data-category="${attr(poi.category)}"
        data-location="${attr(poi.location || "")}"
        data-landmark="${attr(signature)}"
        data-filter-id="${attr(poi.kind === "filter" ? poi.id : "")}"
        data-selected-type="${attr(poi.selectedType || "")}"
        data-church-type="${attr(poi.kind === "filter" && poi.hasChurch && !poi.selectedType ? "4" : "")}"
        data-title="${attr(compactTitle(poi))}"
        title="${attr(compactTitle(poi))}"
      >
        ${renderPoiIcon(poi)}
        <span class="nr-poi-label">${esc(label)}</span>
      </button>
    `;
  }

  function renderPoiIcon(poi) {
    if (poi.category === "spawn") {
      return `<img src="${ASSET_BASE}/icons/Spawn_Hawk.png" alt="">`;
    }

    if (poi.kind === "filter") {
      if (poi.selectedType) {
        return `<img src="${ASSET_BASE}/icons/${attr(poi.selectedIcon)}" alt="">`;
      }
      if (poi.hasChurch) {
        return `<span class="nr-church-marker" aria-hidden="true"></span>`;
      }
      return `<span class="nr-question-marker">?</span>`;
    }
    return `<img src="${ASSET_BASE}/icons/${attr(poi.icon)}" alt="">`;
  }

  function renderPoiChoiceMenu() {
    if (!state.poiChoice) return "";
    const marker = state.aggregateMarkers.get(String(state.poiChoice.id));
    if (!marker || marker.hasChurch) return "";
    const left = ((marker.x - LEFT_BOUND) / ACTIVE_WIDTH) * 100;
    const top = (marker.y / ACTIVE_HEIGHT) * 100;
    const options = marker.options.filter((option) => option.type !== 4);
    if (!options.length) return "";
    return `
      <div class="nr-poi-type-menu" style="left:${left.toFixed(4)}%;top:${top.toFixed(4)}%">
        <h3>${esc(t("poiTypeChoice"))}</h3>
        <div>
          ${options.map((option) => `
            <button type="button" data-nr-poi-id="${attr(marker.id)}" data-nr-poi-type="${attr(option.type)}" title="${attr(option.label)}">
              <img src="${ASSET_BASE}/icons/${attr(option.icon)}" alt="">
              <span>${esc(option.label)}</span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function candidateLandmarks(matches = getMatchingLayouts()) {
    if (!state.spawnPoint || state.exactLayout || matches.length <= 1) return [];
    const map = new Map();
    for (const layout of matches) {
      for (const poi of layout.filterLandmarks || []) {
        if (!FILTERABLE_CATEGORIES.has(poi.category)) continue;
        const type = typeCodeForPoi(poi);
        if (!isSelectableType(type)) continue;
        const signature = signatureForType(poi.id, type);
        const label = `${locationLabel(poi.location)} / ${typeLabel(type)}`;
        const current = map.get(signature) || {
          ...poi,
          signature,
          type,
          icon: iconForType(type, poi.icon),
          count: 0,
          label,
        };
        current.count += 1;
        map.set(signature, current);
      }
    }
    return [...map.values()]
      .sort((a, b) => b.count - a.count || typeRank(a.type) - typeRank(b.type) || a.label.localeCompare(b.label))
      .slice(0, 28);
  }

  function getMatchingLayouts() {
    if (!state.index) return [];
    const selected = [...state.selectedLandmarks].map(parseSignature).filter(Boolean);
    return state.index.layouts.filter((layout) => {
      if (state.nightlord && layout.nightlord !== state.nightlord) return false;
      if (state.shiftingEarth && layout.shiftingEarth !== state.shiftingEarth) return false;
      if (state.spawnPoint && layout.spawnPoint !== state.spawnPoint) return false;
      for (const filter of selected) {
        if (!layoutHasType(layout, filter.id, filter.type)) return false;
      }
      return true;
    });
  }

  function layoutHasType(layout, id, type) {
    return (layout.filterLandmarks || []).some((poi) => String(poi.id) === String(id) && typeCodeForPoi(poi) === Number(type));
  }

  function chooseFirstMatchingLayout() {
    const matches = getMatchingLayouts();
    if (!matches.length) return;
    if (!matches.some((layout) => layout.layoutNumber === state.layoutNumber)) {
      state.layoutNumber = matches[0].layoutNumber;
    }
  }

  function validSpawnLocations(matches) {
    return new Set(matches.map((layout) => layout.spawnPoint).filter(Boolean));
  }

  function toggleLandmark(signature) {
    if (!signature) return;
    if (state.selectedLandmarks.has(signature)) state.selectedLandmarks.delete(signature);
    else state.selectedLandmarks.add(signature);
    state.poiChoice = null;
  }

  function findLayout(layoutNumber) {
    return state.index.layouts.find((layout) => layout.layoutNumber === Number(layoutNumber));
  }

  function applyInitialState(initial) {
    const defaultCategories = state.index.categories
      .filter((category) => category.defaultVisible)
      .map((category) => category.id);
    const validCategories = new Set(state.index.categories.map((category) => category.id));
    state.language = initial.language === "en" ? "en" : "ja";
    state.categories = new Set(
      Array.isArray(initial.categories) && initial.categories.length
        ? initial.categories.filter((category) => validCategories.has(category))
        : defaultCategories
    );
    state.showLabels = initial.showLabels !== false;
    state.hideGuide = Boolean(initial.hideGuide);
    state.candidateOpen = initial.candidateOpen !== false;
    state.candidatePosition = normalizeCandidatePosition(initial.candidatePosition);
    state.selectedLandmarks = new Set(
      Array.isArray(initial.selectedLandmarks)
        ? initial.selectedLandmarks.filter((signature) => parseSignature(signature))
        : []
    );
    state.layoutNumber = Number(initial.layoutNumber) || 1;
    const layout = findLayout(state.layoutNumber) || state.index.layouts[0];
    state.layoutNumber = layout.layoutNumber;
    state.nightlord = hasOption(state.index.nightlords, initial.nightlord) ? initial.nightlord : "";
    state.shiftingEarth = hasOption(state.index.shiftingEarths, initial.shiftingEarth) ? initial.shiftingEarth : "";
    state.spawnPoint = hasOption(state.index.spawnPoints, initial.spawnPoint) ? initial.spawnPoint : "";
    state.exactLayout = Boolean(initial.exactLayout);
    chooseFirstMatchingLayout();
  }

  function readInitialState() {
    const query = new URLSearchParams(window.location.search);
    const hasQueryState = ["layout", "nightlord", "earth", "spawn", "labels", "cats", "lm", "lang", "exact"].some((key) => query.has(key));
    if (hasQueryState) {
      return {
        layoutNumber: Number(query.get("layout")),
        nightlord: query.get("nightlord") || "",
        shiftingEarth: query.get("earth") || "",
        spawnPoint: query.get("spawn") || "",
        showLabels: query.get("labels") !== "0",
        categories: splitList(query.get("cats")),
        selectedLandmarks: splitList(query.get("lm"), ";"),
        language: query.get("lang") || "ja",
        exactLayout: query.get("exact") === "1",
        hideGuide: localStorage.getItem(GUIDE_KEY) === "1",
      };
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        ...parsed,
        hideGuide: parsed.hideGuide || localStorage.getItem(GUIDE_KEY) === "1",
      };
    } catch {
      return { hideGuide: localStorage.getItem(GUIDE_KEY) === "1" };
    }
  }

  function persistState() {
    const payload = {
      layoutNumber: state.layoutNumber,
      nightlord: state.nightlord,
      shiftingEarth: state.shiftingEarth,
      spawnPoint: state.spawnPoint,
      exactLayout: state.exactLayout,
      showLabels: state.showLabels,
      categories: [...state.categories],
      selectedLandmarks: [...state.selectedLandmarks],
      language: state.language,
      hideGuide: state.hideGuide,
      candidateOpen: state.candidateOpen,
      candidatePosition: state.candidatePosition,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem(GUIDE_KEY, state.hideGuide ? "1" : "0");
    } catch {
      // Storage can be disabled.
    }

    const params = new URLSearchParams();
    params.set("layout", String(state.layoutNumber));
    if (state.nightlord) params.set("nightlord", state.nightlord);
    if (state.shiftingEarth) params.set("earth", state.shiftingEarth);
    if (state.spawnPoint) params.set("spawn", state.spawnPoint);
    if (state.selectedLandmarks.size) params.set("lm", [...state.selectedLandmarks].join(";"));
    if (state.exactLayout) params.set("exact", "1");
    params.set("labels", state.showLabels ? "1" : "0");
    params.set("cats", [...state.categories].join(","));
    params.set("lang", state.language);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }

  function updateCopy() {
    document.documentElement.lang = state.language === "ja" ? "ja" : "en";
    for (const node of app.querySelectorAll("[data-i18n]")) {
      const key = node.dataset.i18n;
      if (COPY[state.language][key]) node.textContent = COPY[state.language][key];
    }
    elements.candidatePanel.querySelector(".nr-candidate-header")?.setAttribute("title", t("candidateDragHint"));
    renderLanguageSwitch();
  }

  function renderLanguageSwitch() {
    for (const button of elements.languages.querySelectorAll("[data-nr-lang]")) {
      const active = button.dataset.nrLang === state.language || (state.language === "ja" && button.dataset.nrLang === "ja");
      button.classList.toggle("is-active", active);
    }
  }

  function togglePanel(name) {
    for (const panel of app.querySelectorAll("[data-nr-panel]")) {
      panel.hidden = panel.dataset.nrPanel === name ? !panel.hidden : true;
    }
  }

  function closePanels() {
    for (const panel of app.querySelectorAll("[data-nr-panel]")) panel.hidden = true;
  }

  function setStatus(text) {
    elements.status.textContent = text;
  }

  function statusText() {
    if (!state.pattern) return t("ready");
    return state.nightlord ? `${t("nightlordLabel")}：${nightlordLabel(state.pattern.nightlord)}` : t("unknownNightlord");
  }

  function formatLayoutOption(layout) {
    const special = layout.specialEvent ? ` / ${translateValue(layout.specialEvent)}` : "";
    return `${String(layout.layoutNumber).padStart(3, "0")} / ${layout.patternId} - ${nightlordLabel(layout.nightlord)} - ${mapLabel(layout.shiftingEarth)}${special}`;
  }

  function visiblePoiCount() {
    if (!state.pattern) return 0;
    return [...state.staticPois, ...state.pattern.dynamicPOIs].filter((poi) => state.categories.has(poi.category)).length;
  }

  function labelForPoi(poi) {
    if (poi.kind === "filter") {
      if (poi.selectedType) return typeLabel(poi.selectedType);
      if (poi.hasChurch) return typeLabel(4);
      return "POI";
    }
    if (poi.category === "spawn") return state.spawnPoint === poi.location ? t("selectedSpawn") : t("spawn");
    if (poi.category === "merchant") return typeLabel(14);
    if (poi.category === "night" && poi.night) return `${state.language === "ja" ? `第${poi.night}夜` : `Night ${poi.night}`} ${translateValue(String(poi.title || "").replace(/^Day [12]: /, ""))}`;
    return translateValue(poi.value) || translateValue(poi.title) || locationLabel(poi.location) || "POI";
  }

  function compactTitle(poi) {
    const main = labelForPoi(poi);
    const location = poi.location && locationLabel(poi.location) !== main ? ` - ${locationLabel(poi.location)}` : "";
    return `${main}${location}`;
  }

  function signatureForLandmark(poi) {
    return signatureForType(poi.id, typeCodeForPoi(poi));
  }

  function signatureForType(id, type) {
    return `${id}|${type}`;
  }

  function parseSignature(signature) {
    const [id, type] = String(signature || "").split("|");
    if (!id || !/^\d+$/.test(String(id)) || !/^\d+$/.test(String(type))) return null;
    return { id: String(id), type: Number(type) };
  }

  function labelForSignature(signature) {
    const parsed = parseSignature(signature);
    if (!parsed) return signature;
    for (const layout of state.index.layouts) {
      const poi = (layout.filterLandmarks || []).find((item) => String(item.id) === parsed.id && typeCodeForPoi(item) === parsed.type);
      if (poi) return `${locationLabel(poi.location)} / ${typeLabel(parsed.type)}`;
    }
    return typeLabel(parsed.type);
  }

  function typeCodeForPoi(poi) {
    if (poi.category === "evergaol") return 9;
    if (poi.category === "boss") return 10;
    if (poi.category === "night") return 13;
    if (poi.category === "merchant") return 14;
    if (poi.category === "event") return 15;
    return ICON_TYPE_CODES[poi.icon] || 15;
  }

  function isSelectableType(type) {
    return [1, 2, 3, 4, 7, 8, 9, 10, 11].includes(Number(type));
  }

  function typeLabel(type) {
    const def = TYPE_DEFINITIONS[type];
    if (!def) return "POI";
    return state.language === "ja" ? def.ja : def.en;
  }

  function typeRank(type) {
    return TYPE_DEFINITIONS[type]?.rank || 99;
  }

  function iconForType(type, fallback) {
    return TYPE_DEFINITIONS[type]?.icon || fallback || "Event.png";
  }

  function categoryRank(category) {
    return { major: 1, minor: 2, boss: 3, evergaol: 4 }[category] || 9;
  }

  function mapKeyForEarth(earth) {
    const found = state.index.layouts.find((layout) => layout.shiftingEarth === earth);
    return found?.mapLayout || "default";
  }

  function mapLabel(earth) {
    return MAP_LABELS[state.language]?.[earth] || earth;
  }

  function nightlordLabel(nightlord) {
    return NIGHTLORD_LABELS[state.language]?.[nightlord] || nightlord || t("anyNightlord");
  }

  function spawnLabel(spawn) {
    return SPAWN_LABELS[state.language]?.[spawn] || spawn;
  }

  function locationLabel(location) {
    return LOCATION_LABELS[state.language]?.[location] || spawnLabel(location) || location;
  }

  function translateValue(value) {
    if (!value) return "";
    const clean = cleanTitle(value);
    return VALUE_LABELS[state.language]?.[clean] || VALUE_LABELS[state.language]?.[value] || clean;
  }

  function categoryLabel(category) {
    return CATEGORY_LABELS[state.language]?.[category.id] || category.label;
  }

  function cleanTitle(value) {
    return String(value || "")
      .replace(/^Ruins - /, "")
      .replace(/^Camp - /, "")
      .replace(/^Fort - /, "")
      .replace(/^Great Church - /, "")
      .replace(/^Church - /, "")
      .replace(/^Township - /, "")
      .replace(/^Sorcerer's Rise - /, "")
      .replace(/^Difficult Sorcerer's Rise - /, "")
      .replace(/^Map Event - /, "");
  }

  function shortMapLabel(earth) {
    if (state.language !== "ja") return earth === "Default" ? "D" : earth.slice(0, 1);
    return { Default: "通", Mountaintop: "山", Crater: "穴", "Rotted Woods": "森", Noklateo: "都" }[earth] || earth.slice(0, 1);
  }

  function formatSelectedPoiCount(count) {
    if (count === 0) return t("selectedPoiZero");
    return t("selectedPoiCount").replace("{count}", String(count));
  }

  function formatPatternCount(count) {
    if (count === 1) return t("patternMatchOne");
    if (state.language === "ja" && count > 1 && count <= 3) {
      return t("patternMatchFew").replace("{count}", String(count));
    }
    return t("patternMatchCount").replace("{count}", String(count));
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${url}: ${response.status}`);
    return response.json();
  }

  function renderTiles(tileDirectory) {
    const parts = [];
    for (let displayRow = 0; displayRow < ROWS; displayRow += 1) {
      for (let displayCol = 0; displayCol < COLS; displayCol += 1) {
        const sourceRow = displayCol;
        const sourceCol = COLS - 1 - displayRow;
        const left = Math.floor((displayCol * MAP_SIZE) / COLS);
        const top = Math.floor((displayRow * MAP_SIZE) / ROWS);
        const right = Math.ceil(((displayCol + 1) * MAP_SIZE) / COLS);
        const bottom = Math.ceil(((displayRow + 1) * MAP_SIZE) / ROWS);
        const width = right - left + 1;
        const height = bottom - top + 1;
        parts.push(`<img class="nr-map-tile" src="${tileUrl(tileDirectory, sourceRow, sourceCol)}" alt="" draggable="false" decoding="async" style="--nr-tile-left:${left}px;--nr-tile-top:${top}px;--nr-tile-width:${width}px;--nr-tile-height:${height}px">`);
      }
    }
    elements.tiles.innerHTML = parts.join("");
  }

  function tileUrl(directory, row, col) {
    return `${ASSET_BASE}/maps/${directory}/MENU_MapTile_L0_${pad2(row)}_${pad2(col)}_webp.webp`;
  }

  function onWheel(event) {
    event.preventDefault();
    zoomAt(event.clientX, event.clientY, state.scale * (event.deltaY > 0 ? 0.88 : 1.14));
  }

  function onPointerDown(event) {
    if (event.target.closest(".nr-poi, .nr-poi-type-menu")) return;
    if (event.button !== undefined && event.button !== 0) return;
    elements.viewport.setPointerCapture(event.pointerId);
    elements.viewport.classList.add("is-dragging");
    state.pointers.set(event.pointerId, pointFromEvent(event));
    if (state.pointers.size === 2) startPinch();
    else state.drag = { pointerId: event.pointerId, last: pointFromEvent(event) };
  }

  function onPointerMove(event) {
    if (!state.pointers.has(event.pointerId)) return;
    event.preventDefault();
    state.pointers.set(event.pointerId, pointFromEvent(event));
    if (state.pointers.size >= 2) {
      handlePinch();
      return;
    }
    if (!state.drag || state.drag.pointerId !== event.pointerId) return;
    const point = pointFromEvent(event);
    state.x += point.x - state.drag.last.x;
    state.y += point.y - state.drag.last.y;
    state.drag.last = point;
    clampTransform();
    applyTransform();
  }

  function onPointerEnd(event) {
    if (state.pointers.has(event.pointerId)) state.pointers.delete(event.pointerId);
    try {
      elements.viewport.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer can already be released.
    }
    state.pinch = null;
    if (state.pointers.size === 1) {
      const [pointerId, point] = state.pointers.entries().next().value;
      state.drag = { pointerId, last: point };
    } else {
      state.drag = null;
      elements.viewport.classList.remove("is-dragging");
    }
  }

  function startPinch() {
    const points = [...state.pointers.values()];
    const center = midpoint(points[0], points[1]);
    const distance = pointerDistance(points[0], points[1]);
    const rect = elements.viewport.getBoundingClientRect();
    state.pinch = {
      distance,
      scale: state.scale,
      worldX: (center.x - rect.left - state.x) / state.scale,
      worldY: (center.y - rect.top - state.y) / state.scale,
    };
  }

  function handlePinch() {
    const points = [...state.pointers.values()];
    if (points.length < 2) return;
    if (!state.pinch) startPinch();
    const center = midpoint(points[0], points[1]);
    const distance = pointerDistance(points[0], points[1]);
    const rect = elements.viewport.getBoundingClientRect();
    const nextScale = clamp(state.pinch.scale * (distance / Math.max(1, state.pinch.distance)), MIN_SCALE, MAX_SCALE);
    state.scale = nextScale;
    state.x = center.x - rect.left - state.pinch.worldX * nextScale;
    state.y = center.y - rect.top - state.pinch.worldY * nextScale;
    clampTransform();
    applyTransform();
  }

  function zoomAtViewportCenter(nextScale) {
    const rect = elements.viewport.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, nextScale);
  }

  function zoomAt(clientX, clientY, nextScale) {
    const rect = elements.viewport.getBoundingClientRect();
    const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const worldX = (localX - state.x) / state.scale;
    const worldY = (localY - state.y) / state.scale;
    state.scale = scale;
    state.x = localX - worldX * scale;
    state.y = localY - worldY * scale;
    clampTransform();
    applyTransform();
  }

  function resetView() {
    const rect = elements.viewport.getBoundingClientRect();
    const fitScale = Math.min(rect.width / MAP_SIZE, rect.height / MAP_SIZE);
    const nextScale = isMobileViewport()
      ? clamp(Math.max(fitScale * 1.65, 0.58), MIN_SCALE, MAX_SCALE)
      : clamp(fitScale * 1.03, MIN_SCALE, MAX_SCALE);
    state.scale = nextScale;
    state.x = (rect.width - MAP_SIZE * nextScale) / 2;
    state.y = (rect.height - MAP_SIZE * nextScale) / 2;
    clampTransform();
    applyTransform();
  }

  function clampTransform() {
    const rect = elements.viewport.getBoundingClientRect();
    const worldWidth = MAP_SIZE * state.scale;
    const worldHeight = MAP_SIZE * state.scale;

    if (isMobileViewport()) {
      const paddingX = Math.max(140, rect.width * 0.42);
      const paddingY = Math.max(140, rect.height * 0.32);
      state.x = clamp(state.x, rect.width - worldWidth - paddingX, paddingX);
      state.y = clamp(state.y, rect.height - worldHeight - paddingY, paddingY);
      return;
    }

    const padding = 120;
    state.x = worldWidth <= rect.width ? (rect.width - worldWidth) / 2 : clamp(state.x, rect.width - worldWidth - padding, padding);
    state.y = worldHeight <= rect.height ? (rect.height - worldHeight) / 2 : clamp(state.y, rect.height - worldHeight - padding, padding);
  }

  function applyTransform() {
    elements.world.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})`;
  }

  async function copyCurrentLink() {
    persistState();
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = window.location.href;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setStatus(t("linkCopied"));
  }

  function zIndexForPoi(poi, index) {
    if (poi.category === "spawn" && state.spawnPoint === poi.location) return 92;
    if (poi.kind === "filter") return 80 + (index % 7);
    const base = { night: 72, spawn: 70, event: 66, merchant: 62, boss: 58, evergaol: 56, major: 50, minor: 46 }[poi.category] || 30;
    return base + (index % 7);
  }

  function pointFromEvent(event) {
    return { x: event.clientX, y: event.clientY };
  }

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function pointerDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function t(key) {
    return COPY[state.language]?.[key] || COPY.ja[key] || key;
  }

  function splitList(value, separator = ",") {
    return String(value || "").split(separator).map((item) => item.trim()).filter(Boolean);
  }

  function hasOption(options, value) {
    return Boolean(value && options.includes(value));
  }

  function isFiniteNumber(value) {
    return Number.isFinite(Number(value));
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function pad3(value) {
    return String(value).padStart(3, "0");
  }

  function debounce(callback, wait) {
    let timer = 0;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => callback(...args), wait);
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function esc(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function attr(value) {
    return esc(value).replace(/"/g, "&quot;");
  }
})();
