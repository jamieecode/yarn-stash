import React, { useState } from "react";
import { Plus, ChevronLeft, Search, ExternalLink, Trash2, Heart, Package, BookOpen, Pencil, Check, X, Image as ImageIcon, User, ListChecks, Minus } from "lucide-react";

const C = {
  bg: "#FAF6EE",
  card: "#FFFFFF",
  border: "#E5DFD1",
  accent: "#C9663C",
  accentSoft: "#F3E1D5",
  sub: "#7C8B6F",
  subSoft: "#E7EDE1",
  warn: "#B8792F",
  warnSoft: "#F5E7CE",
  danger: "#A8443A",
  dangerSoft: "#F2DAD3",
  text: "#3D3830",
  muted: "#8A8272",
};
const FONT = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";

const OZ_TO_G = 28.35;
const YD_TO_M = 0.9144;

const WEIGHT_LABEL = {
  LACE: "레이스",
  FINGERING: "피어링",
  SPORT: "스포츠",
  DK: "DK",
  WORSTED: "워스티드",
  ARAN: "아란",
  BULKY: "벌키",
  SUPER_BULKY: "슈퍼벌키",
};
const WEIGHT_ORDER = ["LACE", "FINGERING", "SPORT", "DK", "WORSTED", "ARAN", "BULKY", "SUPER_BULKY"];

const CRAFT_LABEL = { KNITTING: "대바늘", CROCHET: "코바늘", BOTH: "대바늘+코바늘" };
const CRAFT_ORDER = ["KNITTING", "CROCHET", "BOTH"];

const initialYarns = [
  {
    id: "y1",
    brand: "드롭스",
    lineName: "Nepal",
    colorName: "그레이 멜란지",
    fiber: "울65% 알파카35%",
    weightCategory: "WORSTED",
    needleSize: "4.5mm",
    gaugeStitches: 18,
    color: "#B9B0A0",
    photos: [{ color: "#B9B0A0" }, { color: "#C9B79C" }],
    memo: "겨울 스웨터용으로 사둔 것",
    batches: [
      { id: "b1", dyeLot: "6281", skeinCount: 5, weightPerSkeinG: 50, lengthPerSkeinM: 75, purchasedAt: "2026-03-02" },
      { id: "b2", dyeLot: "6299", skeinCount: 2, weightPerSkeinG: 50, lengthPerSkeinM: 75, purchasedAt: "2026-06-10" },
    ],
  },
  {
    id: "y2",
    brand: "말라브리고",
    lineName: "Rios",
    colorName: "나뚜랄",
    fiber: "울100%",
    weightCategory: "DK",
    needleSize: "4mm",
    color: "#E9E2D3",
    photos: [{ color: "#E9E2D3" }],
    memo: "",
    batches: [{ id: "b3", dyeLot: null, skeinCount: 3, weightPerSkeinG: 100, lengthPerSkeinM: 192, purchasedAt: "2026-01-15" }],
  },
  {
    id: "y3",
    brand: "산네비니",
    lineName: "코튼사",
    colorName: "아이보리",
    fiber: "면100%",
    weightCategory: "SPORT",
    needleSize: "3mm",
    color: "#F2EEE0",
    photos: [{ color: "#F2EEE0" }],
    memo: "",
    consumed: true,
    batches: [{ id: "b4", dyeLot: null, skeinCount: 4, weightPerSkeinG: 40, lengthPerSkeinM: 110, purchasedAt: "2026-05-20" }],
  },
  {
    id: "y4",
    brand: "핸드스펀",
    lineName: "",
    colorName: "내추럴 그레이",
    fiber: "울100% (직접 방적)",
    weightCategory: null,
    needleSize: "",
    color: "#DCD3BE",
    photos: [{ color: "#DCD3BE" }],
    memo: "친구가 물레로 자아준 실, 굵기가 일정하지 않음",
    batches: [{ id: "b5", dyeLot: null, skeinCount: 1, weightPerSkeinG: 120, lengthPerSkeinM: 200, purchasedAt: null }],
  },
];

const mockYarnCatalog = [
  { brand: "드롭스", lineName: "Nepal", fiber: "울65% 알파카35%", weightCategory: "WORSTED", needleSize: "4.5mm", gaugeStitches: 18, source: "내 DB" },
  { brand: "드롭스", lineName: "Big Merino", fiber: "울100%", weightCategory: "BULKY", needleSize: "6mm", gaugeStitches: 10, source: "내 DB" },
  { brand: "말라브리고", lineName: "Rios", fiber: "울100%", weightCategory: "DK", needleSize: "4mm", gaugeStitches: 22, source: "내 DB" },
  { brand: "말라브리고", lineName: "Worsted", fiber: "울100%", weightCategory: "WORSTED", needleSize: "5mm", gaugeStitches: 17, source: "Ravelry" },
  { brand: "산네비니", lineName: "코튼사", fiber: "면100%", weightCategory: "SPORT", needleSize: "3mm", gaugeStitches: 20, source: "내 DB" },
];

const initialPatterns = [
  { id: "pt1", name: "라글란 스웨터", designer: "김뜨개", craftType: "KNITTING", weightCategory: "WORSTED", requiredMinM: 850, requiredMaxM: 1200, gaugeStitches: 20, source: "내 DB", otherBookmarkCount: 3 },
  { id: "pt2", name: "심플 숄더백", designer: "울공방", craftType: "CROCHET", weightCategory: "WORSTED", requiredMinM: 320, gaugeStitches: 18, source: "내 DB", otherBookmarkCount: 0 },
  { id: "pt7", name: "장갑 세트", designer: "손끝공방", craftType: "KNITTING", weightCategory: "WORSTED", requiredMinM: 450, gaugeStitches: 18, source: "내 DB", otherBookmarkCount: 0 },
  { id: "pt3", name: "Sockhead 모자", designer: "Kelly McClure", craftType: "KNITTING", weightCategory: "WORSTED", requiredMinM: 370, source: "Ravelry", otherBookmarkCount: 0 },
  { id: "pt4", name: "베이직 가디건", designer: "Purl Soho", craftType: "KNITTING", weightCategory: "DK", requiredMinM: 520, requiredMaxM: 780, source: "Ravelry", otherBookmarkCount: 1 },
  { id: "pt5", name: "여름 탑", designer: "실타래", craftType: "CROCHET", weightCategory: "SPORT", requiredMinM: 380, source: "내 DB", otherBookmarkCount: 0 },
  { id: "pt6", name: "여름 원피스", designer: "코튼공방", craftType: "BOTH", weightCategory: "SPORT", requiredMinM: 600, source: "내 DB", otherBookmarkCount: 0 },
];

// 아직 우리 DB에는 없고 Ravelry에서만 검색되는 목업 풀 (검색 시 폴백으로 노출)
const mockRavelryPool = [
  { name: "Antler Cardigan", designer: "Andrea Mowry", craftType: "KNITTING", weightCategory: "WORSTED", requiredMinM: 1400, requiredMaxM: 1900, gaugeStitches: 15, ravelryId: 88231 },
  { name: "Weekender Sweater", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "DK", requiredMinM: 950, requiredMaxM: 1300, gaugeStitches: 22, ravelryId: 77120 },
  { name: "Comfy Cardigan", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "WORSTED", requiredMinM: 1100, gaugeStitches: 17, ravelryId: 77121 },
  { name: "Log Cabin Blanket", designer: "Isabell Kraemer", craftType: "CROCHET", weightCategory: "BULKY", requiredMinM: 2200, ravelryId: 65422 },
  { name: "Simple Lines Beanie", designer: "Nimble Needles", craftType: "KNITTING", weightCategory: "WORSTED", requiredMinM: 180, gaugeStitches: 18, ravelryId: 90103 },
];

const PROJECT_STATUS_LABEL = { IN_PROGRESS: "진행중", COMPLETED: "완료", ON_HOLD: "보류" };
const PROJECT_STATUS_ORDER = ["IN_PROGRESS", "COMPLETED", "ON_HOLD"];

const initialProjects = [
  {
    id: "proj1",
    patternId: "pt2",
    yarnId: "y1",
    status: "IN_PROGRESS",
    currentRow: 42,
    memo: "겨드랑이 밑 늘림코 구간, 도안 12페이지 참고",
    photos: [{ color: "#C9B79C" }],
    updatedAt: "2026-07-20",
  },
];

function totalMeters(yarn) {
  return yarn.batches.reduce((s, b) => s + b.skeinCount * b.lengthPerSkeinM, 0);
}
function totalGrams(yarn) {
  return yarn.batches.reduce((s, b) => s + b.skeinCount * b.weightPerSkeinG, 0);
}
function totalSkeins(yarn) {
  return yarn.batches.reduce((s, b) => s + b.skeinCount, 0);
}

function matchTier(ratio) {
  if (ratio < 100) return { label: "부족함", bg: C.dangerSoft, fg: C.danger };
  if (ratio < 110) return { label: "타이트함", bg: C.warnSoft, fg: C.warn };
  if (ratio < 130) return { label: "충분함", bg: C.subSoft, fg: C.sub };
  return { label: "여유 있음", bg: C.accentSoft, fg: C.accent };
}

function formatRequired(p) {
  if (p.requiredMaxM && p.requiredMaxM > p.requiredMinM) return `${p.requiredMinM}~${p.requiredMaxM}m`;
  return `${p.requiredMinM}m`;
}

function gaugeStatus(yarnGauge, patternGauge) {
  if (!yarnGauge || !patternGauge) return null;
  const diff = Math.abs(yarnGauge - patternGauge);
  return diff <= 1 ? { label: "게이지 일치", match: true } : { label: "게이지 차이 있음", match: false };
}

function largestLotMeters(yarn) {
  const groups = {};
  yarn.batches.forEach((b) => {
    const key = b.dyeLot || "__none__";
    groups[key] = (groups[key] || 0) + b.skeinCount * b.lengthPerSkeinM;
  });
  return Math.max(0, ...Object.values(groups));
}

function TopBar({ title, onBack, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px", borderBottom: `1px solid ${C.border}`, background: C.bg }}>
      <div style={{ width: 40 }}>
        {onBack && (
          <button onClick={onBack} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex" }}>
            <ChevronLeft size={22} color={C.text} />
          </button>
        )}
      </div>
      <div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{title}</div>
      <div style={{ width: 40, display: "flex", justifyContent: "flex-end" }}>{right}</div>
    </div>
  );
}

function BottomTabBar({ tab, setTab }) {
  const tabs = [
    { key: "yarn", label: "실", icon: Package },
    { key: "pattern", label: "도안", icon: BookOpen },
    { key: "project", label: "프로젝트", icon: ListChecks },
    { key: "my", label: "마이", icon: User },
  ];
  return (
    <div style={{ display: "flex", borderTop: `1px solid ${C.border}`, background: C.card }}>
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = tab === t.key;
        return (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{ flex: 1, border: "none", background: "transparent", padding: "10px 0 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", color: active ? C.accent : C.muted }}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
            <span style={{ fontSize: 11, fontWeight: active ? 600 : 400 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function WeightBadge({ w }) {
  if (!w) {
    return (
      <span style={{ background: C.border, color: C.muted, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>
        무게 미지정
      </span>
    );
  }
  return (
    <span style={{ background: C.subSoft, color: C.sub, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>
      {WEIGHT_LABEL[w] || w}
    </span>
  );
}

function CraftBadge({ c }) {
  return (
    <span style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>
      {CRAFT_LABEL[c] || c}
    </span>
  );
}

function YarnCard({ yarn, onOpen }) {
  const m = totalMeters(yarn);
  const skeins = totalSkeins(yarn);
  const lotCount = new Set(yarn.batches.map((b) => b.dyeLot || "none")).size;
  const photoCount = yarn.photos?.length || 0;
  const cover = yarn.photos?.[0]?.color || yarn.color;
  return (
    <div onClick={() => onOpen(yarn.id)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", cursor: "pointer", opacity: yarn.consumed ? 0.55 : 1 }}>
      <div style={{ height: 90, background: cover, position: "relative" }}>
        {yarn.consumed && (
          <span style={{ position: "absolute", top: 6, left: 6, background: "rgba(61,56,48,0.75)", color: "#fff", fontSize: 10, padding: "2px 7px", borderRadius: 10 }}>
            소진됨
          </span>
        )}
        {lotCount > 1 && (
          <span style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(61,56,48,0.75)", color: "#fff", fontSize: 10, padding: "2px 7px", borderRadius: 10 }}>
            로트 {lotCount}개
          </span>
        )}
        {photoCount > 1 && (
          <span style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(61,56,48,0.75)", color: "#fff", fontSize: 10, padding: "2px 7px", borderRadius: 10, display: "flex", alignItems: "center", gap: 3 }}>
            <ImageIcon size={10} /> {photoCount}
          </span>
        )}
      </div>
      <div style={{ padding: 10 }}>
        <div style={{ fontSize: 12, color: C.muted }}>{yarn.brand}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: "2px 0 6px" }}>{yarn.lineName} · {yarn.colorName}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <WeightBadge w={yarn.weightCategory} />
          <span style={{ fontSize: 11, color: C.muted }}>{m}m · {skeins}타래</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- 실 탭 ---------- */

function YarnListScreen({ yarns, onOpen, onAdd }) {
  const [filter, setFilter] = useState("ALL");
  const [sort, setSort] = useState("RECENT");
  const [query, setQuery] = useState("");
  const [showConsumed, setShowConsumed] = useState(false);
  const filtered = (filter === "ALL" ? yarns : yarns.filter((y) => y.weightCategory === filter))
    .filter((y) => showConsumed || !y.consumed)
    .filter((y) => {
      if (query.length === 0) return true;
      const q = query.toLowerCase();
      return y.brand.toLowerCase().includes(q) || (y.lineName || "").toLowerCase().includes(q) || (y.colorName || "").toLowerCase().includes(q);
    });
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "NAME") return `${a.brand}${a.lineName}`.localeCompare(`${b.brand}${b.lineName}`, "ko");
    return 0; // RECENT: 등록순(배열 원래 순서) 유지
  });
  return (
    <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
      <div style={{ padding: "14px 14px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>내 실 스태시</div>
        <button onClick={onAdd} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex" }}>
          <Plus size={22} color={C.accent} />
        </button>
      </div>
      <div style={{ padding: "8px 14px 0" }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: 12, color: C.muted }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="브랜드, 라인명, 색상으로 검색"
            style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px 10px 32px", fontSize: 13, boxSizing: "border-box" }}
          />
        </div>
      </div>
      <div style={{ padding: "8px 14px 0", display: "flex", gap: 6, overflowX: "auto" }}>
        {["ALL", ...WEIGHT_ORDER].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ flexShrink: 0, border: filter === f ? "none" : `1px solid ${C.border}`, borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", background: filter === f ? C.text : C.card, color: filter === f ? "#fff" : C.muted }}
          >
            {f === "ALL" ? "전체" : WEIGHT_LABEL[f]}
          </button>
        ))}
      </div>
      <div style={{ padding: "8px 14px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ k: "RECENT", label: "최근 등록순" }, { k: "NAME", label: "이름순" }].map((s) => (
            <button
              key={s.k}
              onClick={() => setSort(s.k)}
              style={{ border: "none", background: "transparent", color: sort === s.k ? C.accent : C.muted, fontSize: 12, fontWeight: sort === s.k ? 600 : 400, cursor: "pointer", padding: "4px 6px" }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowConsumed(!showConsumed)}
          style={{ border: "none", background: "transparent", color: showConsumed ? C.accent : C.muted, fontSize: 11, fontWeight: showConsumed ? 600 : 400, cursor: "pointer", padding: "4px 6px" }}
        >
          소진됨 보기 {showConsumed ? "✓" : ""}
        </button>
      </div>
      {sorted.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: C.muted, fontSize: 13 }}>
          {query.length > 0 ? "일치하는 실이 없어요" : "해당 굵기의 실이 없어요"}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "10px 14px 20px" }}>
          {sorted.map((y) => (
            <YarnCard key={y.id} yarn={y} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

function YarnRegisterScreen({ onCancel, onCreate }) {
  const inputStyle = { width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, background: C.card, color: C.text, boxSizing: "border-box" };
  const labelStyle = { fontSize: 12, color: C.muted, marginBottom: 5, display: "block" };

  const [brand, setBrand] = useState("");
  const [lineName, setLineName] = useState("");
  const [query, setQuery] = useState("");
  const [showList, setShowList] = useState(false);
  const [catalogSource, setCatalogSource] = useState(null);
  const [colorName, setColorName] = useState("");
  const [fiber, setFiber] = useState("");
  const [weightCategory, setWeightCategory] = useState("");
  const [needleSize, setNeedleSize] = useState("");
  const [gaugeStitches, setGaugeStitches] = useState("");
  const [unit, setUnit] = useState("METRIC");
  const [batches, setBatches] = useState([{ dyeLot: "", skeinCount: "", weightPerSkein: "", lengthPerSkein: "" }]);
  const [photos, setPhotos] = useState([]);
  const [memo, setMemo] = useState("");
  const swatchColors = ["#EADFCB", "#D9C9A8", "#C9B79C", "#B9B0A0", "#E9E2D3"];

  const updateBatch = (i, patch) => {
    const next = [...batches];
    next[i] = { ...next[i], ...patch };
    setBatches(next);
  };

  const canSubmit = brand.trim() && batches.every((b) => b.skeinCount && b.weightPerSkein && b.lengthPerSkein);

  const submit = () => {
    const normBatches = batches.map((b, i) => {
      const w = Number(b.weightPerSkein);
      const l = Number(b.lengthPerSkein);
      return {
        id: "b" + Date.now() + i,
        dyeLot: b.dyeLot || null,
        skeinCount: Number(b.skeinCount),
        weightPerSkeinG: unit === "IMPERIAL" ? +(w * OZ_TO_G).toFixed(1) : w,
        lengthPerSkeinM: unit === "IMPERIAL" ? +(l * YD_TO_M).toFixed(1) : l,
        purchasedAt: null,
      };
    });
    onCreate({ brand, lineName, colorName, fiber, weightCategory: weightCategory || null, needleSize, gaugeStitches: gaugeStitches ? Number(gaugeStitches) : null, color: photos[0]?.color || "#DCD3BE", photos, memo, batches: normBatches });
  };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar title="실 등록" onBack={onCancel} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ position: "relative" }}>
          <span style={labelStyle}>브랜드 또는 라인명 검색</span>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: 12, color: C.muted }} />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setCatalogSource(null); setShowList(true); }}
              onBlur={() => setTimeout(() => setShowList(false), 120)}
              placeholder="예: 드롭스 Nepal"
              style={{ ...inputStyle, paddingLeft: 32 }}
            />
          </div>
          {showList && query.length > 0 && (() => {
            const matches = mockYarnCatalog.filter((c) => c.brand.includes(query) || c.lineName.includes(query));
            return matches.length > 0 ? (
              <div style={{ position: "absolute", top: 62, left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, zIndex: 10, overflow: "hidden" }}>
                {matches.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setBrand(c.brand); setLineName(c.lineName); setFiber(c.fiber);
                      setWeightCategory(c.weightCategory); setNeedleSize(c.needleSize);
                      setGaugeStitches(c.gaugeStitches ? String(c.gaugeStitches) : "");
                      setCatalogSource(c.source); setQuery(`${c.brand} ${c.lineName}`); setShowList(false);
                    }}
                    style={{ padding: "9px 12px", borderBottom: i < matches.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{c.brand} {c.lineName}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{c.fiber} · {c.source}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>일치하는 실이 없어요, 아래에 직접 입력해주세요</div>
            );
          })()}
          {catalogSource && <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>{catalogSource}에서 자동 입력됨</div>}
        </div>
        <div>
          <span style={labelStyle}>브랜드</span>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="예: 드롭스" style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>실 이름 / 라인</span>
          <input value={lineName} onChange={(e) => setLineName(e.target.value)} placeholder="예: Nepal" style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>색상명</span>
          <input value={colorName} onChange={(e) => setColorName(e.target.value)} placeholder="예: 그레이 멜란지" style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>소재</span>
          <input value={fiber} onChange={(e) => setFiber(e.target.value)} placeholder="예: 울65% 알파카35%" style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>무게 카테고리 (선택)</span>
          <select value={weightCategory} onChange={(e) => setWeightCategory(e.target.value)} style={inputStyle}>
            <option value="">선택 안 함 (모름)</option>
            {WEIGHT_ORDER.map((w) => (<option key={w} value={w}>{WEIGHT_LABEL[w]}</option>))}
          </select>
          {!weightCategory && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>비워두면 도안 추천 기능에서만 제외돼요</div>}
        </div>
        <div>
          <span style={labelStyle}>추천 바늘 사이즈</span>
          <input value={needleSize} onChange={(e) => setNeedleSize(e.target.value)} placeholder="예: 4.5mm" style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>게이지 (선택, 콧수/10cm)</span>
          <input value={gaugeStitches} onChange={(e) => setGaugeStitches(e.target.value)} placeholder="예: 18" style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>사진 (여러 장 가능)</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: "relative" }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, background: p.color }} />
                <button
                  onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                  style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", border: "none", background: C.text, color: "#fff", fontSize: 10, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => setPhotos([...photos, { color: swatchColors[photos.length % swatchColors.length] }])}
              style={{ width: 56, height: 56, borderRadius: 10, border: `1px dashed ${C.border}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, cursor: "pointer" }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div>
          <span style={labelStyle}>메모 (선택)</span>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: 선물로 받음, 세일 때 구매" rows={2} style={{ ...inputStyle, resize: "none", fontFamily: FONT }} />
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>보유 기록</span>
            <div style={{ display: "flex", gap: 4 }}>
              {["METRIC", "IMPERIAL"].map((u) => (
                <button key={u} onClick={() => setUnit(u)} style={{ border: unit === u ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`, background: unit === u ? C.accentSoft : C.card, color: unit === u ? C.accent : C.muted, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {u === "METRIC" ? "g · m" : "oz · yd"}
                </button>
              ))}
            </div>
          </div>
          {batches.map((b, i) => (
            <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, marginBottom: 10, position: "relative" }}>
              {batches.length > 1 && (
                <button onClick={() => setBatches(batches.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: 6, right: 6, border: "none", background: "transparent", color: C.muted, cursor: "pointer" }}>
                  <Trash2 size={13} />
                </button>
              )}
              <input value={b.dyeLot} onChange={(e) => updateBatch(i, { dyeLot: e.target.value })} placeholder="염색로트 (선택, 비워두면 로트 구분 없음)" style={{ ...inputStyle, marginBottom: 6 }} />
              <div style={{ display: "flex", gap: 6 }}>
                <input value={b.skeinCount} onChange={(e) => updateBatch(i, { skeinCount: e.target.value })} placeholder="타래 수" style={{ ...inputStyle, flex: 1 }} />
                <input value={b.weightPerSkein} onChange={(e) => updateBatch(i, { weightPerSkein: e.target.value })} placeholder={unit === "METRIC" ? "타래당 g" : "타래당 oz"} style={{ ...inputStyle, flex: 1 }} />
                <input value={b.lengthPerSkein} onChange={(e) => updateBatch(i, { lengthPerSkein: e.target.value })} placeholder={unit === "METRIC" ? "타래당 m" : "타래당 yd"} style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>
          ))}
          <button onClick={() => setBatches([...batches, { dyeLot: "", skeinCount: "", weightPerSkein: "", lengthPerSkein: "" }])} style={{ border: `1px dashed ${C.border}`, background: "transparent", borderRadius: 8, padding: "8px 0", width: "100%", fontSize: 12, color: C.muted, cursor: "pointer" }}>
            + 다른 로트 추가
          </button>
        </div>

        <button disabled={!canSubmit} onClick={submit} style={{ marginTop: 4, padding: "13px 0", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 600, cursor: canSubmit ? "pointer" : "not-allowed", background: canSubmit ? C.accent : C.border, color: canSubmit ? "#fff" : C.muted }}>
          등록하기
        </button>
      </div>
    </div>
  );
}

function YarnEditScreen({ yarn, onCancel, onSave }) {
  const inputStyle = { width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, background: C.card, color: C.text, boxSizing: "border-box" };
  const labelStyle = { fontSize: 12, color: C.muted, marginBottom: 5, display: "block" };

  const [brand, setBrand] = useState(yarn.brand);
  const [lineName, setLineName] = useState(yarn.lineName || "");
  const [colorName, setColorName] = useState(yarn.colorName || "");
  const [fiber, setFiber] = useState(yarn.fiber || "");
  const [weightCategory, setWeightCategory] = useState(yarn.weightCategory || "");
  const [needleSize, setNeedleSize] = useState(yarn.needleSize || "");
  const [gaugeStitches, setGaugeStitches] = useState(yarn.gaugeStitches ? String(yarn.gaugeStitches) : "");
  const [memo, setMemo] = useState(yarn.memo || "");
  const [photos, setPhotos] = useState(yarn.photos || []);

  const canSubmit = brand.trim();
  const swatchColors = ["#EADFCB", "#D9C9A8", "#C9B79C", "#B9B0A0", "#E9E2D3"];

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar title="실 정보 수정" onBack={onCancel} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <span style={labelStyle}>사진</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: "relative" }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, background: p.color }} />
                <button
                  onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                  style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", border: "none", background: C.text, color: "#fff", fontSize: 10, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => setPhotos([...photos, { color: swatchColors[photos.length % swatchColors.length] }])}
              style={{ width: 56, height: 56, borderRadius: 10, border: `1px dashed ${C.border}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, cursor: "pointer" }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div>
          <span style={labelStyle}>브랜드</span>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>실 이름 / 라인</span>
          <input value={lineName} onChange={(e) => setLineName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>색상명</span>
          <input value={colorName} onChange={(e) => setColorName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>소재</span>
          <input value={fiber} onChange={(e) => setFiber(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>무게 카테고리 (선택)</span>
          <select value={weightCategory || ""} onChange={(e) => setWeightCategory(e.target.value)} style={inputStyle}>
            <option value="">선택 안 함 (모름)</option>
            {WEIGHT_ORDER.map((w) => (<option key={w} value={w}>{WEIGHT_LABEL[w]}</option>))}
          </select>
          {!weightCategory && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>비워두면 도안 추천 기능에서만 제외돼요</div>}
        </div>
        <div>
          <span style={labelStyle}>추천 바늘 사이즈</span>
          <input value={needleSize} onChange={(e) => setNeedleSize(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>게이지 (선택, 콧수/10cm)</span>
          <input value={gaugeStitches} onChange={(e) => setGaugeStitches(e.target.value)} placeholder="예: 18" style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>메모</span>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: 선물로 받음, 세일 때 구매" rows={2} style={{ ...inputStyle, resize: "none", fontFamily: FONT }} />
        </div>
        <button
          disabled={!canSubmit}
          onClick={() => onSave({ brand, lineName, colorName, fiber, weightCategory: weightCategory || null, needleSize, gaugeStitches: gaugeStitches ? Number(gaugeStitches) : null, memo, photos })}
          style={{ marginTop: 4, padding: "13px 0", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 600, cursor: canSubmit ? "pointer" : "not-allowed", background: canSubmit ? C.accent : C.border, color: canSubmit ? "#fff" : C.muted }}
        >
          저장하기
        </button>
      </div>
    </div>
  );
}

function BatchRow({ yarn, batch, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [dyeLot, setDyeLot] = useState(batch.dyeLot || "");
  const [skeinCount, setSkeinCount] = useState(String(batch.skeinCount));
  const [weightPerSkeinG, setWeightPerSkeinG] = useState(String(batch.weightPerSkeinG));
  const [lengthPerSkeinM, setLengthPerSkeinM] = useState(String(batch.lengthPerSkeinM));
  const smallInput = { border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px", fontSize: 12, width: "100%", boxSizing: "border-box" };

  if (!editing) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
        <div onClick={() => setEditing(true)} style={{ cursor: "pointer", flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{batch.dyeLot ? `로트 ${batch.dyeLot}` : "로트 구분 없음"}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{batch.skeinCount}타래 · 타래당 {batch.weightPerSkeinG}g/{batch.lengthPerSkeinM}m</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setEditing(true)} style={{ border: "none", background: "transparent", color: C.muted, cursor: "pointer" }}><Pencil size={13} /></button>
          <button onClick={() => onDelete(yarn.id, batch.id)} style={{ border: "none", background: "transparent", color: C.muted, cursor: "pointer" }}><Trash2 size={14} /></button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.card, border: `1.5px solid ${C.accent}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
      <input value={dyeLot} onChange={(e) => setDyeLot(e.target.value)} placeholder="염색로트 (선택)" style={{ ...smallInput, marginBottom: 6 }} />
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <input value={skeinCount} onChange={(e) => setSkeinCount(e.target.value)} placeholder="타래 수" style={smallInput} />
        <input value={weightPerSkeinG} onChange={(e) => setWeightPerSkeinG(e.target.value)} placeholder="타래당 g" style={smallInput} />
        <input value={lengthPerSkeinM} onChange={(e) => setLengthPerSkeinM(e.target.value)} placeholder="타래당 m" style={smallInput} />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => {
            onUpdate(yarn.id, batch.id, { dyeLot: dyeLot || null, skeinCount: Number(skeinCount), weightPerSkeinG: Number(weightPerSkeinG), lengthPerSkeinM: Number(lengthPerSkeinM) });
            setEditing(false);
          }}
          style={{ flex: 1, border: "none", background: C.accent, color: "#fff", borderRadius: 8, padding: "7px 0", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
        >
          <Check size={13} /> 저장
        </button>
        <button
          onClick={() => setEditing(false)}
          style={{ flex: 1, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, borderRadius: 8, padding: "7px 0", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
        >
          <X size={13} /> 취소
        </button>
      </div>
    </div>
  );
}

function YarnDetailScreen({ yarn, patterns, onBack, onOpenPattern, onDeleteBatch, onUpdateBatch, onEditYarn, onDeleteYarn, onToggleConsumed, bookmarks, onToggleBookmark }) {
  const [tab, setTab] = useState("stash");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const m = totalMeters(yarn);
  const g = totalGrams(yarn);
  const skeins = totalSkeins(yarn);
  const lgLotM = largestLotMeters(yarn);

  const matches = patterns
    .filter((p) => p.weightCategory === yarn.weightCategory)
    .map((p) => ({ ...p, ratio: Math.round((m / p.requiredMinM) * 100) }))
    .sort((a, b) => b.ratio - a.ratio);

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar
        title={`${yarn.brand} ${yarn.lineName}`}
        onBack={onBack}
        right={
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={onEditYarn} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex" }}>
              <Pencil size={18} color={C.text} />
            </button>
            <button onClick={() => setConfirmingDelete(true)} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex" }}>
              <Trash2 size={18} color={C.danger} />
            </button>
          </div>
        }
      />
      {confirmingDelete && (
        <div style={{ margin: "12px 16px 0", background: C.dangerSoft, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 12, color: C.text, marginBottom: 10 }}>삭제하면 되돌릴 수 없어요. 정말 삭제할까요?</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onDeleteYarn} style={{ flex: 1, border: "none", background: C.danger, color: "#fff", borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>삭제</button>
            <button onClick={() => setConfirmingDelete(false)} style={{ flex: 1, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, borderRadius: 8, padding: "8px 0", fontSize: 12, cursor: "pointer" }}>취소</button>
          </div>
        </div>
      )}
      {yarn.photos && yarn.photos.length > 0 ? (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "0 0 0 0" }}>
          {yarn.photos.map((p, i) => (
            <div key={i} style={{ flex: yarn.photos.length === 1 ? "1 0 100%" : "0 0 auto", width: yarn.photos.length === 1 ? "100%" : 110, height: 110, background: p.color }} />
          ))}
        </div>
      ) : (
        <div style={{ height: 110, background: yarn.color }} />
      )}
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 13, color: C.muted }}>{yarn.colorName} · {yarn.fiber}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <WeightBadge w={yarn.weightCategory} />
          {yarn.needleSize && <span style={{ fontSize: 11, background: C.card, border: `1px solid ${C.border}`, padding: "3px 9px", borderRadius: 20, color: C.text }}>{yarn.needleSize}</span>}
        </div>
        {yarn.memo && (
          <div style={{ fontSize: 12, color: C.muted, marginTop: 8, background: C.subSoft, borderRadius: 8, padding: "8px 10px" }}>{yarn.memo}</div>
        )}
        <button
          onClick={onToggleConsumed}
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
            border: `1px solid ${yarn.consumed ? C.accent : C.border}`,
            background: yarn.consumed ? C.accentSoft : "transparent",
            color: yarn.consumed ? C.accent : C.muted,
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Check size={13} /> {yarn.consumed ? "다 썼어요 (취소하려면 탭)" : "다 썼어요"}
        </button>

        <div style={{ display: "flex", gap: 6, margin: "16px 0 14px" }}>
          {[{ k: "stash", label: "보유 현황" }, { k: "match", label: "이 실로 뜰 수 있는 도안" }].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", border: tab === t.k ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`, background: tab === t.k ? C.accentSoft : C.card, color: tab === t.k ? C.accent : C.muted }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "stash" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-around", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{skeins}</div><div style={{ fontSize: 11, color: C.muted }}>타래</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{g}g</div><div style={{ fontSize: 11, color: C.muted }}>총 무게</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{m}m</div><div style={{ fontSize: 11, color: C.muted }}>총 길이</div></div>
            </div>
            {yarn.batches.map((b) => (
              <BatchRow key={b.id} yarn={yarn} batch={b} onDelete={onDeleteBatch} onUpdate={onUpdateBatch} />
            ))}
          </>
        )}

        {tab === "match" && (
          <>
            {yarn.consumed ? (
              <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: 24 }}>소진 처리된 실이라 도안 추천을 보여주지 않아요</div>
            ) : !yarn.weightCategory ? (
              <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: 24 }}>무게 카테고리를 입력하면 추천받을 수 있어요</div>
            ) : matches.length === 0 ? (
              <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: 24, lineHeight: 1.6 }}>
                같은 굵기의 도안을 찾지 못했어요.<br />로컬 DB에 등록된 도안이 아직 적어서일 수 있어요.
              </div>
            ) : (
              matches.map((p) => {
                const tier = matchTier(p.ratio);
                const isBookmarked = bookmarks.includes(p.id);
                const gauge = gaugeStatus(yarn.gaugeStitches, p.gaugeStitches);
                const needsLotMix = m >= p.requiredMinM && lgLotM < p.requiredMinM;
                return (
                  <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div onClick={() => onOpenPattern(p)} style={{ cursor: "pointer", flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{p.designer} · {p.source}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {tier && <span style={{ fontSize: 10, fontWeight: 600, background: tier.bg, color: tier.fg, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{tier.label}</span>}
                        <button onClick={() => onToggleBookmark(p.id)} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex" }}>
                          <Heart size={16} color={C.accent} fill={isBookmarked ? C.accent : "none"} />
                        </button>
                      </div>
                    </div>
                    <div onClick={() => onOpenPattern(p)} style={{ fontSize: 11, color: C.muted, marginTop: 6, cursor: "pointer" }}>
                      필요 {formatRequired(p)} · 요구량 대비 {p.ratio}% 보유
                    </div>
                    {(gauge || needsLotMix) && (
                      <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                        {gauge && (
                          <span style={{ fontSize: 10, fontWeight: 600, background: gauge.match ? C.subSoft : C.warnSoft, color: gauge.match ? C.sub : C.warn, padding: "2px 7px", borderRadius: 20 }}>
                            {gauge.label}
                          </span>
                        )}
                        {needsLotMix && (
                          <span style={{ fontSize: 10, fontWeight: 600, background: C.warnSoft, color: C.warn, padding: "2px 7px", borderRadius: 20 }}>
                            로트를 섞어야 해요
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- 도안 탭 ---------- */

function PatternListScreen({ patterns, bookmarks, onToggleBookmark, onOpen, onAdd }) {
  const [filter, setFilter] = useState("ALL");
  const [craftFilter, setCraftFilter] = useState("ALL");
  const [query, setQuery] = useState("");

  const base = (filter === "ALL" ? patterns : patterns.filter((p) => bookmarks.includes(p.id)))
    .filter((p) => craftFilter === "ALL" || p.craftType === craftFilter);
  const filtered = query.length > 0 ? base.filter((p) => p.name.includes(query) || (p.designer || "").includes(query)) : base;

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: "14px 14px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>도안</div>
        <button onClick={onAdd} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex" }}>
          <Plus size={22} color={C.accent} />
        </button>
      </div>
      <div style={{ padding: "8px 14px 0" }}>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: 12, color: C.muted }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="도안명 또는 작가로 검색" style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px 10px 32px", fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {[{ k: "ALL", label: "전체" }, { k: "BOOKMARKED", label: "찜함" }].map((f) => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{ border: filter === f.k ? "none" : `1px solid ${C.border}`, borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", background: filter === f.k ? C.text : C.card, color: filter === f.k ? "#fff" : C.muted }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          {["ALL", ...CRAFT_ORDER].map((c) => (
            <button
              key={c}
              onClick={() => setCraftFilter(c)}
              style={{ flexShrink: 0, border: craftFilter === c ? "none" : `1px solid ${C.border}`, borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", background: craftFilter === c ? C.text : C.card, color: craftFilter === c ? "#fff" : C.muted }}
            >
              {c === "ALL" ? "전체" : CRAFT_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 14px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
              {filter === "BOOKMARKED" ? "아직 찜한 도안이 없어요" : craftFilter !== "ALL" ? "해당하는 도안이 없어요" : "찾는 도안이 없나요?"}
            </div>
            {filter === "ALL" && craftFilter === "ALL" && (
              <button onClick={onAdd} style={{ border: `1px dashed ${C.border}`, background: "transparent", borderRadius: 8, padding: "8px 16px", fontSize: 12, color: C.accent, cursor: "pointer" }}>
                등록하기
              </button>
            )}
          </div>
        ) : (
          filtered.map((p) => {
            const isBookmarked = bookmarks.includes(p.id);
            return (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
                <div onClick={() => onOpen(p)} style={{ cursor: "pointer", flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{p.designer || "작가 미상"} · {p.source}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    <CraftBadge c={p.craftType} />
                    <WeightBadge w={p.weightCategory} />
                    <span style={{ fontSize: 11, color: C.muted, alignSelf: "center" }}>필요 {formatRequired(p)}</span>
                  </div>
                </div>
                <button onClick={() => onToggleBookmark(p.id)} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex" }}>
                  <Heart size={16} color={C.accent} fill={isBookmarked ? C.accent : "none"} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function PatternRegisterScreen({ onCancel, onCreate, existingPatterns, onOpenExisting }) {
  const inputStyle = { width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, background: C.card, color: C.text, boxSizing: "border-box" };
  const labelStyle = { fontSize: 12, color: C.muted, marginBottom: 5, display: "block" };

  const [query, setQuery] = useState("");
  const [showList, setShowList] = useState(false);
  const [pickedSource, setPickedSource] = useState(null); // "내 DB" | "Ravelry" | null(직접 입력)
  const [ravelryId, setRavelryId] = useState(null);

  const [name, setName] = useState("");
  const [designer, setDesigner] = useState("");
  const [craftType, setCraftType] = useState("");
  const [weightCategory, setWeightCategory] = useState("");
  const [requiredUnit, setRequiredUnit] = useState("METRIC");
  const [requiredAmount, setRequiredAmount] = useState("");
  const [requiredMaxAmount, setRequiredMaxAmount] = useState("");
  const [gaugeStitches, setGaugeStitches] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  const [yarnQuery, setYarnQuery] = useState("");
  const [showYarnList, setShowYarnList] = useState(false);
  const [originalYarnSource, setOriginalYarnSource] = useState(null);
  const [originalYarnBrand, setOriginalYarnBrand] = useState("");
  const [originalYarnLine, setOriginalYarnLine] = useState("");

  const matches = (() => {
    if (query.length === 0) return [];
    const local = existingPatterns
      .filter((p) => p.name.includes(query) || (p.designer || "").includes(query))
      .map((p) => ({ ...p, _existing: true, _source: "내 DB" }));
    const ravelry = mockRavelryPool
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.designer.toLowerCase().includes(query.toLowerCase()))
      .filter((p) => !local.some((l) => l.name === p.name))
      .map((p) => ({ ...p, _existing: false, _source: "Ravelry" }));
    return [...local, ...ravelry];
  })();

  const pick = (p) => {
    if (p._existing) {
      onOpenExisting(p);
      return;
    }
    setName(p.name);
    setDesigner(p.designer);
    setCraftType(p.craftType || "");
    setWeightCategory(p.weightCategory);
    setRequiredUnit("METRIC");
    setRequiredAmount(String(p.requiredMinM));
    setRequiredMaxAmount(p.requiredMaxM ? String(p.requiredMaxM) : "");
    setGaugeStitches(p.gaugeStitches ? String(p.gaugeStitches) : "");
    setRavelryId(p.ravelryId);
    setPickedSource("Ravelry");
    setQuery(p.name);
    setShowList(false);
  };

  const canSubmit = name.trim() && requiredAmount && craftType && weightCategory;

  const submit = () => {
    const amount = Number(requiredAmount);
    const maxAmount = requiredMaxAmount ? Number(requiredMaxAmount) : null;
    const requiredMinM = requiredUnit === "IMPERIAL" ? +(amount * YD_TO_M).toFixed(1) : amount;
    const requiredMaxM = maxAmount != null ? (requiredUnit === "IMPERIAL" ? +(maxAmount * YD_TO_M).toFixed(1) : maxAmount) : null;
    onCreate({
      name, designer, craftType, weightCategory, requiredMinM, requiredMaxM, requiredUnit,
      gaugeStitches: gaugeStitches ? Number(gaugeStitches) : null,
      sourceUrl,
      source: pickedSource === "Ravelry" ? "Ravelry" : "내 DB",
      ravelryId: ravelryId || null,
      originalYarnBrand: originalYarnBrand || null,
      originalYarnLine: originalYarnLine || null,
    });
  };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar title="도안 등록" onBack={onCancel} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ position: "relative" }}>
          <span style={labelStyle}>도안명 또는 작가 검색</span>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: 12, color: C.muted }} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setName(e.target.value);
                setPickedSource(null);
                setRavelryId(null);
                setShowList(true);
              }}
              onBlur={() => setTimeout(() => setShowList(false), 120)}
              placeholder="예: Antler, PetiteKnit"
              style={{ ...inputStyle, paddingLeft: 32 }}
            />
          </div>
          {showList && matches.length > 0 && (
            <div style={{ position: "absolute", top: 62, left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, zIndex: 10, overflow: "hidden", maxHeight: 240, overflowY: "auto" }}>
              {matches.map((p, i) => (
                <div key={i} onClick={() => pick(p)} style={{ padding: "9px 12px", borderBottom: i < matches.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {p.designer} · {p._source} {p._existing && "· 이미 등록됨, 탭하면 상세로 이동"}
                  </div>
                </div>
              ))}
            </div>
          )}
          {showList && query.length > 0 && matches.length === 0 && (
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>일치하는 도안이 없어요, 아래 정보를 직접 입력해서 등록해주세요</div>
          )}
          {pickedSource && <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>{pickedSource}에서 자동 입력됨 — 확인 후 등록하면 내 DB에도 저장돼요</div>}
        </div>

        <div>
          <span style={labelStyle}>도안명 *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 세로 케이블 목도리" style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>작가 (선택)</span>
          <input value={designer} onChange={(e) => setDesigner(e.target.value)} placeholder="예: @knit_someone" style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>도구 종류 *</span>
          <select value={craftType} onChange={(e) => setCraftType(e.target.value)} style={{ ...inputStyle, color: craftType ? C.text : C.muted }}>
            <option value="" disabled>선택해주세요</option>
            {CRAFT_ORDER.map((c) => (<option key={c} value={c}>{CRAFT_LABEL[c]}</option>))}
          </select>
        </div>
        <div>
          <span style={labelStyle}>무게 카테고리 *</span>
          <select value={weightCategory} onChange={(e) => setWeightCategory(e.target.value)} style={{ ...inputStyle, color: weightCategory ? C.text : C.muted }}>
            <option value="" disabled>선택해주세요</option>
            {WEIGHT_ORDER.map((w) => (<option key={w} value={w}>{WEIGHT_LABEL[w]}</option>))}
          </select>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <span style={labelStyle}>필요량 *</span>
            <div style={{ display: "flex", gap: 4 }}>
              {["METRIC", "IMPERIAL"].map((u) => (
                <button key={u} onClick={() => setRequiredUnit(u)} style={{ border: requiredUnit === u ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`, background: requiredUnit === u ? C.accentSoft : C.card, color: requiredUnit === u ? C.accent : C.muted, borderRadius: 8, padding: "3px 9px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {u === "METRIC" ? "m" : "yd"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input value={requiredAmount} onChange={(e) => setRequiredAmount(e.target.value)} placeholder={requiredUnit === "METRIC" ? "최소 (예: 400)" : "최소 (예: 440)"} style={{ ...inputStyle, flex: 1 }} />
            <span style={{ color: C.muted, fontSize: 12 }}>~</span>
            <input value={requiredMaxAmount} onChange={(e) => setRequiredMaxAmount(e.target.value)} placeholder="최대 (선택)" style={{ ...inputStyle, flex: 1 }} />
          </div>
        </div>

        <div>
          <span style={labelStyle}>게이지 (선택, 콧수/10cm)</span>
          <input value={gaugeStitches} onChange={(e) => setGaugeStitches(e.target.value)} placeholder="예: 18" style={inputStyle} />
        </div>

        <div style={{ position: "relative" }}>
          <span style={labelStyle}>원본 실 (선택)</span>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: 12, color: C.muted }} />
            <input
              value={yarnQuery}
              onChange={(e) => { setYarnQuery(e.target.value); setOriginalYarnSource(null); setShowYarnList(true); setOriginalYarnBrand(e.target.value); setOriginalYarnLine(""); }}
              onBlur={() => setTimeout(() => setShowYarnList(false), 120)}
              placeholder="예: 말라브리고 Rios"
              style={{ ...inputStyle, paddingLeft: 32 }}
            />
          </div>
          {showYarnList && yarnQuery.length > 0 && (() => {
            const ymatches = mockYarnCatalog.filter((c) => c.brand.includes(yarnQuery) || c.lineName.includes(yarnQuery));
            return ymatches.length > 0 ? (
              <div style={{ position: "absolute", top: 62, left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, zIndex: 10, overflow: "hidden" }}>
                {ymatches.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setOriginalYarnBrand(c.brand); setOriginalYarnLine(c.lineName);
                      setOriginalYarnSource(c.source); setYarnQuery(`${c.brand} ${c.lineName}`); setShowYarnList(false);
                    }}
                    style={{ padding: "9px 12px", borderBottom: i < ymatches.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{c.brand} {c.lineName}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{c.fiber} · {c.source}</div>
                  </div>
                ))}
              </div>
            ) : null;
          })()}
          {originalYarnSource && <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>{originalYarnSource}에서 자동 입력됨</div>}
        </div>

        <div>
          <span style={labelStyle}>참고 링크 (선택)</span>
          <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="블로그, 인스타 등 원본 링크" style={inputStyle} />
        </div>
        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
          도안의 뜨기 방법이나 차트 이미지는 저작권 문제로 등록할 수 없어요. 도안명, 작가, 필요량 같은 사실 정보만 기록돼요.
        </div>
        <button
          disabled={!canSubmit}
          onClick={submit}
          style={{ marginTop: 4, padding: "13px 0", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 600, cursor: canSubmit ? "pointer" : "not-allowed", background: canSubmit ? C.accent : C.border, color: canSubmit ? "#fff" : C.muted }}
        >
          등록하기
        </button>
      </div>
    </div>
  );
}
function PatternDetailScreen({ pattern, yarns, projects, onBack, bookmarks, onToggleBookmark, bookmarkMemos, onUpdateBookmarkMemo, onOpenYarn, onEditPattern, onDeletePattern, onStartProject }) {
  const isBookmarked = bookmarks.includes(pattern.id);
  const [memo, setMemo] = useState(bookmarkMemos[pattern.id] || "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const linkedProjectCount = projects.filter((p) => p.patternId === pattern.id).length;
  const canDelete = (pattern.otherBookmarkCount || 0) === 0 && linkedProjectCount === 0;
  const deleteBlockReason = (pattern.otherBookmarkCount || 0) > 0
    ? `다른 분 ${pattern.otherBookmarkCount}명이 찜한 도안이라 삭제할 수 없어요`
    : linkedProjectCount > 0
    ? "이 도안으로 진행 중인 프로젝트가 있어 삭제할 수 없어요"
    : "";
  const yarnMatches = yarns
    .filter((y) => !y.consumed && y.weightCategory === pattern.weightCategory)
    .map((y) => ({ ...y, ratio: Math.round((totalMeters(y) / pattern.requiredMinM) * 100) }))
    .sort((a, b) => b.ratio - a.ratio);

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar
        title="도안 정보"
        onBack={onBack}
        right={
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={onEditPattern} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex" }}>
              <Pencil size={17} color={C.text} />
            </button>
            <button
              onClick={() => canDelete && setConfirmingDelete(true)}
              style={{ border: "none", background: "transparent", cursor: canDelete ? "pointer" : "not-allowed", display: "flex" }}
              title={canDelete ? "" : deleteBlockReason}
            >
              <Trash2 size={17} color={canDelete ? C.danger : C.border} />
            </button>
            <button onClick={() => onToggleBookmark(pattern.id)} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex" }}>
              <Heart size={20} color={C.accent} fill={isBookmarked ? C.accent : "none"} />
            </button>
          </div>
        }
      />
      {confirmingDelete && (
        <div style={{ margin: "12px 16px 0", background: C.dangerSoft, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 12, color: C.text, marginBottom: 10 }}>삭제하면 되돌릴 수 없어요. 정말 삭제할까요?</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onDeletePattern} style={{ flex: 1, border: "none", background: C.danger, color: "#fff", borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>삭제</button>
            <button onClick={() => setConfirmingDelete(false)} style={{ flex: 1, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, borderRadius: 8, padding: "8px 0", fontSize: 12, cursor: "pointer" }}>취소</button>
          </div>
        </div>
      )}
      {!canDelete && (
        <div style={{ margin: "10px 16px 0", fontSize: 11, color: C.muted, textAlign: "center" }}>
          {deleteBlockReason}
        </div>
      )}
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{pattern.name}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{pattern.designer || "작가 미상"}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          <CraftBadge c={pattern.craftType} />
          <WeightBadge w={pattern.weightCategory} />
          <span style={{ fontSize: 11, background: C.card, border: `1px solid ${C.border}`, padding: "3px 9px", borderRadius: 20, color: C.text }}>필요 {formatRequired(pattern)}</span>
        </div>
        {(pattern.originalYarnBrand || pattern.originalYarnLine) && (
          <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>
            원본 실: <span style={{ color: C.text, fontWeight: 500 }}>{pattern.originalYarnBrand} {pattern.originalYarnLine}</span>
          </div>
        )}
        {pattern.source === "Ravelry" && (
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 6, color: C.accent, fontSize: 12, cursor: "pointer" }}>
            <ExternalLink size={13} /> Ravelry에서 원본 보기
          </div>
        )}
        {pattern.sourceUrl && (
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 6, color: C.accent, fontSize: 12, cursor: "pointer" }}>
            <ExternalLink size={13} /> 참고 링크 보기
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>내가 가진 실 중 맞는 것</div>
          {yarnMatches.length === 0 ? (
            <div style={{ fontSize: 12, color: C.muted, padding: "12px 0" }}>같은 굵기의 실이 없어요</div>
          ) : (
            yarnMatches.map((y) => {
              const tier = matchTier(y.ratio);
              const gauge = gaugeStatus(y.gaugeStitches, pattern.gaugeStitches);
              const needsLotMix = totalMeters(y) >= pattern.requiredMinM && largestLotMeters(y) < pattern.requiredMinM;
              return (
                <div key={y.id} onClick={() => onOpenYarn(y.id)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 8, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: y.color }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{y.brand} {y.lineName}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{totalMeters(y)}m 보유 · 요구량 대비 {y.ratio}%</div>
                      </div>
                    </div>
                    {tier && <span style={{ fontSize: 10, fontWeight: 600, background: tier.bg, color: tier.fg, padding: "3px 8px", borderRadius: 20 }}>{tier.label}</span>}
                  </div>
                  {(gauge || needsLotMix) && (
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      {gauge && (
                        <span style={{ fontSize: 10, fontWeight: 600, background: gauge.match ? C.subSoft : C.warnSoft, color: gauge.match ? C.sub : C.warn, padding: "2px 7px", borderRadius: 20 }}>
                          {gauge.label}
                        </span>
                      )}
                      {needsLotMix && (
                        <span style={{ fontSize: 10, fontWeight: 600, background: C.warnSoft, color: C.warn, padding: "2px 7px", borderRadius: 20 }}>
                          로트를 섞어야 해요
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {isBookmarked && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>내 메모</div>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              onBlur={() => onUpdateBookmarkMemo(pattern.id, memo)}
              placeholder="예: 5.5mm로 바꿔서 뜰 것"
              rows={2}
              style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, fontSize: 13, resize: "none", boxSizing: "border-box", fontFamily: FONT }}
            />
          </div>
        )}

        <button
          onClick={onStartProject}
          style={{ marginTop: 20, width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: C.accent, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          이 도안으로 시작하기
        </button>
      </div>
    </div>
  );
}

function PatternEditScreen({ pattern, onCancel, onSave }) {
  const inputStyle = { width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, background: C.card, color: C.text, boxSizing: "border-box" };
  const labelStyle = { fontSize: 12, color: C.muted, marginBottom: 5, display: "block" };

  const [name, setName] = useState(pattern.name);
  const [designer, setDesigner] = useState(pattern.designer || "");
  const [craftType, setCraftType] = useState(pattern.craftType || "KNITTING");
  const [weightCategory, setWeightCategory] = useState(pattern.weightCategory);
  const [requiredUnit, setRequiredUnit] = useState(pattern.requiredUnit || "METRIC");
  const toDisplay = (m) => (pattern.requiredUnit === "IMPERIAL" ? String(+(m / YD_TO_M).toFixed(1)) : String(m));
  const [requiredAmount, setRequiredAmount] = useState(toDisplay(pattern.requiredMinM));
  const [requiredMaxAmount, setRequiredMaxAmount] = useState(pattern.requiredMaxM ? toDisplay(pattern.requiredMaxM) : "");
  const [gaugeStitches, setGaugeStitches] = useState(pattern.gaugeStitches ? String(pattern.gaugeStitches) : "");
  const [sourceUrl, setSourceUrl] = useState(pattern.sourceUrl || "");
  const [originalYarnBrand, setOriginalYarnBrand] = useState(pattern.originalYarnBrand || "");
  const [originalYarnLine, setOriginalYarnLine] = useState(pattern.originalYarnLine || "");

  const canSubmit = name.trim() && requiredAmount;

  const submit = () => {
    const amount = Number(requiredAmount);
    const maxAmount = requiredMaxAmount ? Number(requiredMaxAmount) : null;
    const requiredMinM = requiredUnit === "IMPERIAL" ? +(amount * YD_TO_M).toFixed(1) : amount;
    const requiredMaxM = maxAmount != null ? (requiredUnit === "IMPERIAL" ? +(maxAmount * YD_TO_M).toFixed(1) : maxAmount) : null;
    onSave({
      name, designer, craftType, weightCategory, requiredMinM, requiredMaxM, requiredUnit,
      gaugeStitches: gaugeStitches ? Number(gaugeStitches) : null,
      sourceUrl,
      originalYarnBrand: originalYarnBrand || null,
      originalYarnLine: originalYarnLine || null,
      source: "내 DB", // 출처와 무관하게 수정하면 내 기록으로 전환, ravelryId는 유지
    });
  };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar title="도안 정보 수정" onBack={onCancel} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {pattern.source === "Ravelry" && (
          <div style={{ fontSize: 11, color: C.muted, background: C.subSoft, borderRadius: 8, padding: 10, lineHeight: 1.5 }}>
            Ravelry에서 가져온 정보예요. 수정하면 내 기록으로 저장되고, Ravelry 링크는 유지돼요.
          </div>
        )}
        <div>
          <span style={labelStyle}>도안명 *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>작가 (선택)</span>
          <input value={designer} onChange={(e) => setDesigner(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>도구 종류 *</span>
          <select value={craftType} onChange={(e) => setCraftType(e.target.value)} style={inputStyle}>
            {CRAFT_ORDER.map((c) => (<option key={c} value={c}>{CRAFT_LABEL[c]}</option>))}
          </select>
        </div>
        <div>
          <span style={labelStyle}>무게 카테고리 *</span>
          <select value={weightCategory} onChange={(e) => setWeightCategory(e.target.value)} style={inputStyle}>
            {WEIGHT_ORDER.map((w) => (<option key={w} value={w}>{WEIGHT_LABEL[w]}</option>))}
          </select>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <span style={labelStyle}>필요량 *</span>
            <div style={{ display: "flex", gap: 4 }}>
              {["METRIC", "IMPERIAL"].map((u) => (
                <button key={u} onClick={() => setRequiredUnit(u)} style={{ border: requiredUnit === u ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`, background: requiredUnit === u ? C.accentSoft : C.card, color: requiredUnit === u ? C.accent : C.muted, borderRadius: 8, padding: "3px 9px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {u === "METRIC" ? "m" : "yd"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input value={requiredAmount} onChange={(e) => setRequiredAmount(e.target.value)} placeholder="최소" style={{ ...inputStyle, flex: 1 }} />
            <span style={{ color: C.muted, fontSize: 12 }}>~</span>
            <input value={requiredMaxAmount} onChange={(e) => setRequiredMaxAmount(e.target.value)} placeholder="최대 (선택)" style={{ ...inputStyle, flex: 1 }} />
          </div>
        </div>
        <div>
          <span style={labelStyle}>게이지 (선택, 콧수/10cm)</span>
          <input value={gaugeStitches} onChange={(e) => setGaugeStitches(e.target.value)} placeholder="예: 18" style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>원본 실 — 브랜드 (선택)</span>
          <input value={originalYarnBrand} onChange={(e) => setOriginalYarnBrand(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>원본 실 — 라인명 (선택)</span>
          <input value={originalYarnLine} onChange={(e) => setOriginalYarnLine(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <span style={labelStyle}>참고 링크 (선택)</span>
          <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} style={inputStyle} />
        </div>
        <button
          disabled={!canSubmit}
          onClick={submit}
          style={{ marginTop: 4, padding: "13px 0", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 600, cursor: canSubmit ? "pointer" : "not-allowed", background: canSubmit ? C.accent : C.border, color: canSubmit ? "#fff" : C.muted }}
        >
          저장하기
        </button>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, onGuest }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 28, background: `linear-gradient(180deg, ${C.bg}, #F3ECDD)` }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: C.accent, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🧶</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>실 스태시</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>가진 실로 뭘 뜰 수 있는지 알려드릴게요</div>
      </div>
      <div style={{ width: "100%", maxWidth: 280, display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={() => onLogin("KAKAO")} style={{ background: "#FEE500", color: "#3D3830", border: "none", borderRadius: 12, padding: "13px 0", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          카카오로 로그인
        </button>
        <button onClick={() => onLogin("GOOGLE")} style={{ background: "#fff", color: C.text, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 0", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          구글로 로그인
        </button>
        <button onClick={onGuest} style={{ background: "transparent", color: C.muted, border: "none", borderRadius: 12, padding: "10px 0", fontWeight: 500, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
          게스트로 시작하기
        </button>
        <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 4 }}>
          게스트로 시작해도 나중에 마이 탭에서 언제든 로그인할 수 있어요
        </div>
      </div>
    </div>
  );
}

function MyScreen({ session, onLogin, onLogout }) {
  const providerLabel = { KAKAO: "카카오", GOOGLE: "구글" };
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: "14px 14px 4px" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>마이</div>
      </div>
      <div style={{ padding: 20, display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.border}`, marginTop: 10 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.subSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User size={22} color={C.sub} />
        </div>
        <div>
          {session.provider === "GUEST" ? (
            <>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>게스트로 이용 중</div>
              <div style={{ fontSize: 12, color: C.muted }}>로그인하면 다른 기기에서도 볼 수 있어요</div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>실 스태시 사용자</div>
              <div style={{ fontSize: 12, color: C.muted }}>{providerLabel[session.provider]} 계정으로 로그인됨</div>
            </>
          )}
        </div>
      </div>

      {session.provider === "GUEST" ? (
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
            로그인하면 지금까지 등록한 실·찜 데이터가 그대로 계정으로 이관돼요
          </div>
          <button onClick={() => onLogin("KAKAO")} style={{ background: "#FEE500", color: "#3D3830", border: "none", borderRadius: 10, padding: "12px 0", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            카카오로 로그인
          </button>
          <button onClick={() => onLogin("GOOGLE")} style={{ background: "#fff", color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 0", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            구글로 로그인
          </button>
        </div>
      ) : (
        <div style={{ padding: "6px 0" }}>
          <div onClick={onLogout} style={{ padding: "14px 20px", fontSize: 13, color: C.danger, cursor: "pointer" }}>
            로그아웃
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 프로젝트 탭 ---------- */

function ProjectStartScreen({ pattern, matchedYarns, onCancel, onCreate }) {
  const [selectedYarnId, setSelectedYarnId] = useState(null);

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar title="프로젝트 시작" onBack={onCancel} />
      <div style={{ padding: 16 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{pattern.name}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <CraftBadge c={pattern.craftType} />
            <span style={{ fontSize: 11, color: C.muted, alignSelf: "center" }}>필요 {formatRequired(pattern)}</span>
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>실 선택 (선택 사항)</div>
        <div
          onClick={() => setSelectedYarnId(null)}
          style={{ border: selectedYarnId === null ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`, background: selectedYarnId === null ? C.accentSoft : C.card, borderRadius: 10, padding: 12, marginBottom: 8, cursor: "pointer" }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: selectedYarnId === null ? C.accent : C.text }}>나중에 연결</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>실을 아직 안 정했거나 나중에 골라도 돼요</div>
        </div>
        {matchedYarns.length === 0 ? (
          <div style={{ fontSize: 12, color: C.muted, padding: "8px 2px" }}>같은 굵기의 실이 없어요 (나중에 연결할 수 있어요)</div>
        ) : (
          matchedYarns.map((y) => (
            <div
              key={y.id}
              onClick={() => setSelectedYarnId(y.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, border: selectedYarnId === y.id ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`, background: selectedYarnId === y.id ? C.accentSoft : C.card, borderRadius: 10, padding: 12, marginBottom: 8, cursor: "pointer" }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 6, background: y.color }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{y.brand} {y.lineName}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{totalMeters(y)}m 보유 · 요구량 대비 {y.ratio}%</div>
              </div>
            </div>
          ))
        )}

        <button
          onClick={() => onCreate(selectedYarnId)}
          style={{ marginTop: 16, width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: C.accent, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          시작하기
        </button>
      </div>
    </div>
  );
}

function ProjectListScreen({ projects, patterns, yarns, onOpen }) {
  const [filter, setFilter] = useState("ALL");
  const filtered = filter === "ALL" ? projects : projects.filter((p) => p.status === filter);

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: "14px 14px 4px" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>프로젝트</div>
      </div>
      <div style={{ padding: "8px 14px 0", display: "flex", gap: 6 }}>
        {["ALL", ...PROJECT_STATUS_ORDER].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{ border: filter === s ? "none" : `1px solid ${C.border}`, borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", background: filter === s ? C.text : C.card, color: filter === s ? "#fff" : C.muted }}
          >
            {s === "ALL" ? "전체" : PROJECT_STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      <div style={{ padding: 16 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
            {filter === "ALL" || filter === "IN_PROGRESS" ? <>아직 시작한 프로젝트가 없어요.<br />도안 탭에서 마음에 드는 도안을 찾아 시작해보세요.</> : "해당하는 프로젝트가 없어요"}
          </div>
        ) : (
          filtered.map((proj) => {
            const pattern = patterns.find((p) => p.id === proj.patternId);
            const yarn = yarns.find((y) => y.id === proj.yarnId);
            if (!pattern) return null;
            return (
              <div key={proj.id} onClick={() => onOpen(proj.id)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 8, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{pattern.name}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{yarn ? `${yarn.brand} ${yarn.lineName}` : "실 미연결"}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, background: C.subSoft, color: C.sub, padding: "3px 8px", borderRadius: 20 }}>{PROJECT_STATUS_LABEL[proj.status]}</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>현재 {proj.currentRow}단 · {proj.updatedAt} 업데이트</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ProjectDetailScreen({ project, pattern, yarn, allYarns, onBack, onUpdate, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [showYarnPicker, setShowYarnPicker] = useState(false);
  const [memo, setMemo] = useState(project.memo || "");
  const [photos, setPhotos] = useState(project.photos || []);
  const swatchColors = ["#EADFCB", "#D9C9A8", "#C9B79C", "#B9B0A0", "#E9E2D3"];
  const linkableYarns = allYarns.filter((y) => !y.consumed && y.weightCategory === pattern?.weightCategory);

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar
        title={pattern?.name || "프로젝트"}
        onBack={onBack}
        right={
          <button onClick={() => setConfirmingDelete(true)} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex" }}>
            <Trash2 size={18} color={C.danger} />
          </button>
        }
      />
      {confirmingDelete && (
        <div style={{ margin: "12px 16px 0", background: C.dangerSoft, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 12, color: C.text, marginBottom: 10 }}>삭제하면 되돌릴 수 없어요. 정말 삭제할까요?</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onDelete} style={{ flex: 1, border: "none", background: C.danger, color: "#fff", borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>삭제</button>
            <button onClick={() => setConfirmingDelete(false)} style={{ flex: 1, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, borderRadius: 8, padding: "8px 0", fontSize: 12, cursor: "pointer" }}>취소</button>
          </div>
        </div>
      )}
      <div style={{ padding: 16 }}>
        <div onClick={() => setShowYarnPicker(!showYarnPicker)} style={{ fontSize: 12, color: C.muted, marginBottom: 8, cursor: "pointer" }}>
          {yarn ? <>실: <span style={{ color: C.text, fontWeight: 500 }}>{yarn.brand} {yarn.lineName}</span></> : <span style={{ color: C.accent, textDecoration: "underline" }}>실 연결하기</span>}
        </div>
        {showYarnPicker && (
          <div style={{ marginBottom: 16 }}>
            {linkableYarns.length === 0 ? (
              <div style={{ fontSize: 11, color: C.muted, padding: "6px 2px" }}>같은 굵기의 실이 없어요</div>
            ) : (
              linkableYarns.map((y) => (
                <div
                  key={y.id}
                  onClick={() => { onUpdate({ yarnId: y.id }); setShowYarnPicker(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, marginBottom: 6, cursor: "pointer" }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: y.color }} />
                  <div style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{y.brand} {y.lineName}</div>
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {PROJECT_STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => onUpdate({ status: s })}
              style={{ flex: 1, padding: "9px 0", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", border: project.status === s ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`, background: project.status === s ? C.accentSoft : C.card, color: project.status === s ? C.accent : C.muted }}
            >
              {PROJECT_STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {project.status === "COMPLETED" && (
          <div style={{ background: C.subSoft, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: C.sub, textAlign: "center" }}>
            🎉 완성했어요! 실이 다 쓰였다면 실 상세에서 직접 소진 처리할 수 있어요.
          </div>
        )}

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>현재 단수</div>
          <div style={{ fontSize: 40, fontWeight: 700, color: C.text, marginBottom: 12 }}>{project.currentRow}</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={() => onUpdate({ currentRow: Math.max(0, project.currentRow - 1) })}
              style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.card, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Minus size={18} color={C.text} />
            </button>
            <button
              onClick={() => onUpdate({ currentRow: project.currentRow + 1 })}
              style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: C.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Plus size={18} color="#fff" />
            </button>
          </div>
          {!confirmingReset ? (
            <button onClick={() => setConfirmingReset(true)} style={{ marginTop: 12, border: "none", background: "transparent", color: C.muted, fontSize: 11, cursor: "pointer", textDecoration: "underline" }}>
              리셋
            </button>
          ) : (
            <div style={{ marginTop: 12, display: "flex", gap: 6, justifyContent: "center" }}>
              <button onClick={() => { onUpdate({ currentRow: 0 }); setConfirmingReset(false); }} style={{ border: "none", background: C.danger, color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>0으로 리셋</button>
              <button onClick={() => setConfirmingReset(false)} style={{ border: `1px solid ${C.border}`, background: "transparent", color: C.muted, borderRadius: 8, padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>취소</button>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>진행 사진</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: "relative" }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, background: p.color }} />
                <button
                  onClick={() => { const next = photos.filter((_, idx) => idx !== i); setPhotos(next); onUpdate({ photos: next }); }}
                  style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", border: "none", background: C.text, color: "#fff", fontSize: 10, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => { const next = [...photos, { color: swatchColors[photos.length % swatchColors.length] }]; setPhotos(next); onUpdate({ photos: next }); }}
              style={{ width: 56, height: 56, borderRadius: 10, border: `1px dashed ${C.border}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, cursor: "pointer" }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>메모</div>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={() => onUpdate({ memo })}
            placeholder="예: 겨드랑이 밑 늘림코 구간, 12페이지 참고"
            rows={3}
            style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, fontSize: 13, resize: "none", boxSizing: "border-box", fontFamily: FONT }}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- 루트 ---------- */

export default function App() {
  const [session, setSession] = useState(null); // null = 시작화면 노출, {provider} = 로그인/게스트 상태
  const [yarns, setYarns] = useState(initialYarns);
  const [patterns, setPatterns] = useState(initialPatterns);
  const [bookmarks, setBookmarks] = useState(["pt3"]);
  const [bookmarkMemos, setBookmarkMemos] = useState({});
  const [projects, setProjects] = useState(initialProjects);

  const [tab, setTab] = useState("yarn");
  const [screen, setScreen] = useState("main");
  const [activeYarnId, setActiveYarnId] = useState(null);
  const [activePatternId, setActivePatternId] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [cameFrom, setCameFrom] = useState({ tab: "yarn", screen: "main" });

  const activeYarn = yarns.find((y) => y.id === activeYarnId);
  const activePattern = patterns.find((p) => p.id === activePatternId);
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const toggleBookmark = (patternId) => {
    setBookmarks((prev) => (prev.includes(patternId) ? prev.filter((id) => id !== patternId) : [...prev, patternId]));
    setBookmarkMemos((prev) => {
      if (!prev[patternId]) return prev;
      const next = { ...prev };
      delete next[patternId];
      return next;
    });
  };
  const updateBookmarkMemo = (patternId, memo) => {
    setBookmarkMemos((prev) => ({ ...prev, [patternId]: memo }));
  };
  const deleteYarn = (yarnId) => {
    setYarns((prev) => prev.filter((y) => y.id !== yarnId));
    setScreen("main");
    setTab("yarn");
  };
  const deletePattern = (patternId) => {
    setPatterns((prev) => prev.filter((p) => p.id !== patternId));
    setBookmarks((prev) => prev.filter((id) => id !== patternId));
    setScreen("main");
    setTab("pattern");
  };
  const createYarn = (draft) => {
    setYarns((prev) => [{ id: "y" + Date.now(), ...draft }, ...prev]);
    setScreen("main");
  };
  const deleteBatch = (yarnId, batchId) => {
    setYarns((prev) => prev.map((y) => (y.id === yarnId ? { ...y, batches: y.batches.filter((b) => b.id !== batchId) } : y)));
  };
  const updateBatch = (yarnId, batchId, patch) => {
    setYarns((prev) => prev.map((y) => (y.id === yarnId ? { ...y, batches: y.batches.map((b) => (b.id === batchId ? { ...b, ...patch } : b)) } : y)));
  };
  const updateYarn = (yarnId, patch) => {
    setYarns((prev) => prev.map((y) => (y.id === yarnId ? { ...y, ...patch } : y)));
    setScreen("yarnDetail");
  };
  const toggleConsumed = (yarnId) => {
    setYarns((prev) => prev.map((y) => (y.id === yarnId ? { ...y, consumed: !y.consumed } : y)));
  };
  const updatePattern = (patternId, patch) => {
    setPatterns((prev) => prev.map((p) => (p.id === patternId ? { ...p, ...patch } : p)));
    setScreen("patternDetail");
  };
  const createPattern = (draft) => {
    setPatterns((prev) => [{ id: "pt" + Date.now(), ...draft }, ...prev]);
    setTab("pattern");
    setScreen("main");
  };
  const openPatternFrom = (p, fromTab, fromScreen) => {
    setCameFrom({ tab: fromTab, screen: fromScreen });
    setActivePatternId(p.id);
    setScreen("patternDetail");
  };
  const backFromPatternDetail = () => {
    setTab(cameFrom.tab);
    setScreen(cameFrom.screen);
  };
  const login = (provider) => setSession({ provider });
  const startGuest = () => setSession({ provider: "GUEST" });
  const logout = () => {
    setSession(null);
    setTab("yarn");
    setScreen("main");
  };

  const startProjectFor = (patternId) => {
    const existing = projects.find((p) => p.patternId === patternId && p.status === "IN_PROGRESS");
    if (existing) {
      setActiveProjectId(existing.id);
      setTab("project");
      setScreen("projectDetail");
      return;
    }
    setActivePatternId(patternId);
    setScreen("projectStart");
  };
  const createProject = (patternId, yarnId) => {
    const id = "proj" + Date.now();
    const today = new Date().toISOString().slice(0, 10);
    setProjects((prev) => [{ id, patternId, yarnId, status: "IN_PROGRESS", currentRow: 0, memo: "", photos: [], updatedAt: today }, ...prev]);
    setActiveProjectId(id);
    setTab("project");
    setScreen("projectDetail");
  };
  const updateProject = (projectId, patch) => {
    const today = new Date().toISOString().slice(0, 10);
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, ...patch, updatedAt: today } : p)));
  };
  const deleteProject = (projectId) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setTab("project");
    setScreen("main");
  };

  return (
    <div style={{ fontFamily: FONT, maxWidth: 380, height: 700, margin: "0 auto", background: C.bg, color: C.text, borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column", border: `1px solid ${C.border}`, boxShadow: "0 8px 30px rgba(61,56,48,0.12)" }}>
      {!session ? (
        <LoginScreen onLogin={login} onGuest={startGuest} />
      ) : (
        <>
          {screen === "main" && tab === "yarn" && (
            <>
              <YarnListScreen yarns={yarns} onOpen={(id) => { setActiveYarnId(id); setScreen("yarnDetail"); }} onAdd={() => setScreen("yarnRegister")} />
              <BottomTabBar tab={tab} setTab={setTab} />
            </>
          )}
          {screen === "main" && tab === "pattern" && (
            <>
              <PatternListScreen patterns={patterns} bookmarks={bookmarks} onToggleBookmark={toggleBookmark} onOpen={(p) => openPatternFrom(p, "pattern", "main")} onAdd={() => setScreen("patternRegister")} />
              <BottomTabBar tab={tab} setTab={setTab} />
            </>
          )}
          {screen === "main" && tab === "my" && (
            <>
              <MyScreen session={session} onLogin={login} onLogout={logout} />
              <BottomTabBar tab={tab} setTab={setTab} />
            </>
          )}
          {screen === "main" && tab === "project" && (
            <>
              <ProjectListScreen
                projects={projects}
                patterns={patterns}
                yarns={yarns}
                onOpen={(id) => { setActiveProjectId(id); setScreen("projectDetail"); }}
              />
              <BottomTabBar tab={tab} setTab={setTab} />
            </>
          )}
          {screen === "yarnRegister" && <YarnRegisterScreen onCancel={() => setScreen("main")} onCreate={createYarn} />}
          {screen === "yarnDetail" && activeYarn && (
            <YarnDetailScreen
              yarn={activeYarn}
              patterns={patterns}
              onBack={() => setScreen("main")}
              onDeleteBatch={deleteBatch}
              onUpdateBatch={updateBatch}
              onEditYarn={() => setScreen("yarnEdit")}
              onDeleteYarn={() => deleteYarn(activeYarn.id)}
              onToggleConsumed={() => toggleConsumed(activeYarn.id)}
              bookmarks={bookmarks}
              onToggleBookmark={toggleBookmark}
              onOpenPattern={(p) => openPatternFrom(p, "yarn", "yarnDetail")}
            />
          )}
          {screen === "yarnEdit" && activeYarn && (
            <YarnEditScreen yarn={activeYarn} onCancel={() => setScreen("yarnDetail")} onSave={(patch) => updateYarn(activeYarn.id, patch)} />
          )}
          {screen === "patternRegister" && (
            <PatternRegisterScreen
              onCancel={() => setScreen("main")}
              onCreate={createPattern}
              existingPatterns={patterns}
              onOpenExisting={(p) => openPatternFrom(p, "pattern", "main")}
            />
          )}
          {screen === "patternDetail" && activePattern && (
            <PatternDetailScreen
              pattern={activePattern}
              yarns={yarns}
              projects={projects}
              onBack={backFromPatternDetail}
              bookmarks={bookmarks}
              onToggleBookmark={toggleBookmark}
              bookmarkMemos={bookmarkMemos}
              onUpdateBookmarkMemo={updateBookmarkMemo}
              onOpenYarn={(id) => { setActiveYarnId(id); setTab("yarn"); setScreen("yarnDetail"); }}
              onEditPattern={() => setScreen("patternEdit")}
              onDeletePattern={() => deletePattern(activePattern.id)}
              onStartProject={() => startProjectFor(activePattern.id)}
            />
          )}
          {screen === "patternEdit" && activePattern && (
            <PatternEditScreen pattern={activePattern} onCancel={() => setScreen("patternDetail")} onSave={(patch) => updatePattern(activePattern.id, patch)} />
          )}
          {screen === "projectStart" && activePattern && (
            <ProjectStartScreen
              pattern={activePattern}
              matchedYarns={yarns
                .filter((y) => !y.consumed && y.weightCategory === activePattern.weightCategory)
                .map((y) => ({ ...y, ratio: Math.round((totalMeters(y) / activePattern.requiredMinM) * 100) }))
                .sort((a, b) => b.ratio - a.ratio)}
              onCancel={() => setScreen("patternDetail")}
              onCreate={(yarnId) => createProject(activePattern.id, yarnId)}
            />
          )}
          {screen === "projectDetail" && activeProject && (
            <ProjectDetailScreen
              project={activeProject}
              pattern={patterns.find((p) => p.id === activeProject.patternId)}
              yarn={yarns.find((y) => y.id === activeProject.yarnId)}
              allYarns={yarns}
              onBack={() => { setTab("project"); setScreen("main"); }}
              onUpdate={(patch) => updateProject(activeProject.id, patch)}
              onDelete={() => deleteProject(activeProject.id)}
            />
          )}
        </>
      )}
    </div>
  );
}
