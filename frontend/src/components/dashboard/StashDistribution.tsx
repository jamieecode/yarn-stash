import { WEIGHT_CATEGORY_LABEL, type DashboardSummary } from "../../types/api";

type Row = DashboardSummary["weightDistribution"][number];

// 무게 카테고리별 보유 분포. 두 세그먼트는 같은 색상(accent)의 명도 2단계다 - 서로 다른 항목이 아니라
// "총량 중 얼마가 아직 자유로운가"라는 부분-전체 관계라서, 범주형 2색으로 칠하면 관계가 오히려 흐려진다.
// (앱 토큰의 accent+sub 조합은 색각 검증에서도 정상 시야 ΔE 14.4로 떨어져 범주형으로 쓸 수 없었음)
export function StashDistribution({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return null;

  // 막대 길이는 카테고리 간 비교가 목적이므로 가장 큰 카테고리를 100%로 잡는다
  const maxTotal = Math.max(...rows.map((r) => r.totalM));
  const hasCommitted = rows.some((r) => r.totalM > r.availableM);

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-text">굵기별 보유량</h2>
        <span className="text-[11px] text-muted">{rows.length}종</span>
      </div>

      {/* 세그먼트가 둘일 때만 범례를 단다 - 하나뿐이면 막대 옆 숫자가 곧 설명이라 범례가 잉여 */}
      {hasCommitted && (
        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <i className="h-2 w-2 rounded-full border border-accent bg-accent" aria-hidden /> 쓸 수 있음
          </span>
          {/* 연한 쪽은 흰 배경에서 거의 안 보여서 테두리로 형태를 잡아준다 */}
          <span className="flex items-center gap-1">
            <i className="h-2 w-2 rounded-full border border-border bg-accent-soft" aria-hidden /> 프로젝트 사용 중
          </span>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2.5">
        {rows.map((row) => (
          <DistributionRow key={row.weightCategory ?? "__none__"} row={row} maxTotal={maxTotal} />
        ))}
      </div>
    </section>
  );
}

function DistributionRow({ row, maxTotal }: { row: Row; maxTotal: number }) {
  const label = row.weightCategory ? WEIGHT_CATEGORY_LABEL[row.weightCategory] : "굵기 미입력";
  const barWidth = maxTotal > 0 ? (row.totalM / maxTotal) * 100 : 0;
  const availableShare = row.totalM > 0 ? (row.availableM / row.totalM) * 100 : 0;
  const committedM = Math.round(row.totalM - row.availableM);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-text">
          {label}
          <span className="ml-1 text-[11px] text-muted">{row.yarnCount}개</span>
        </span>
        {/* 모든 행에 값을 직접 붙인다 - 터치 화면이라 툴팁 뒤에 숫자를 숨기면 읽을 방법이 없음 */}
        <span className="shrink-0 text-[11px] text-muted">
          {committedM > 0 ? (
            <>
              <span className="font-semibold text-text">{Math.round(row.availableM)}m</span> / {Math.round(row.totalM)}m
            </>
          ) : (
            <span className="font-semibold text-text">{Math.round(row.totalM)}m</span>
          )}
        </span>
      </div>

      <div className="mt-1 h-2 w-full rounded-full bg-bg">
        {/* 바깥 막대 = 이 카테고리의 총 보유량, 안쪽 진한 부분 = 아직 쓸 수 있는 양 */}
        <div className="h-full rounded-full bg-accent-soft" style={{ width: `${barWidth}%` }}>
          <div className="h-full rounded-full bg-accent" style={{ width: `${availableShare}%` }} />
        </div>
      </div>
    </div>
  );
}
