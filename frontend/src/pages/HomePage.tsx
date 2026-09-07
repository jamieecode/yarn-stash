import { BookOpen, ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardQuery } from "../api/useDashboard";
import { StashDistribution } from "../components/dashboard/StashDistribution";
import { EmptyState } from "../components/ui/EmptyState";
import { WeightBadge } from "../components/ui/WeightBadge";
import { useAuth } from "../auth/AuthContext";
import type { DashboardSummary } from "../types/api";

// 홈 - 로그인 직후 첫 화면. "내 스태시가 지금 어떤 상태고, 뭘 바로 시작할 수 있는지"를 한 눈에 보여준다
export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useDashboardQuery();

  if (isLoading || !data) {
    return (
      <div>
        <Header nickname={user?.nickname ?? null} />
        <p className="p-6 text-center text-sm text-muted">불러오는 중...</p>
      </div>
    );
  }

  // 실을 한 개도 안 넣은 사람에게 0으로 채운 통계를 보여줘봐야 할 일만 안 보인다
  if (data.stash.yarnCount === 0) {
    return (
      <div>
        <Header nickname={user?.nickname ?? null} />
        <EmptyState
          message="갖고 있는 실을 등록하면 그 실로 뜰 수 있는 도안을 찾아드려요"
          action={
            <button
              onClick={() => navigate("/yarns/new")}
              className="cursor-pointer rounded-xl border-none bg-accent px-4 py-2.5 text-sm font-semibold text-white"
            >
              실 등록하기
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <Header nickname={user?.nickname ?? null} />

      <div className="flex flex-col gap-3 px-4 pt-3">
        <StashSummaryCard stash={data.stash} onOpen={() => navigate("/yarns")} />
        <ReadyToKnitCard readyToKnit={data.readyToKnit} onNavigate={navigate} />
        <StashDistribution rows={data.weightDistribution} />
        <ProjectStatusCard projects={data.projects} bookmarkCount={data.bookmarkCount} onNavigate={navigate} />
      </div>
    </div>
  );
}

function Header({ nickname }: { nickname: string | null }) {
  return (
    <div className="px-4 pt-4">
      <h1 className="text-lg font-bold text-text">{nickname ? `${nickname}님의 스태시` : "내 스태시"}</h1>
    </div>
  );
}

// 히어로 숫자는 "쓸 수 있는 양" - 총 보유량은 안 변하는 값이라 매일 볼 이유가 없지만,
// 가용량은 프로젝트를 시작하고 끝낼 때마다 움직이는 살아있는 숫자다
function StashSummaryCard({ stash, onOpen }: { stash: DashboardSummary["stash"]; onOpen: () => void }) {
  const committedShare = stash.totalM > 0 ? Math.round((stash.committedM / stash.totalM) * 100) : 0;

  return (
    <button onClick={onOpen} className="cursor-pointer rounded-2xl border border-border bg-card p-4 text-left">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted">지금 쓸 수 있는 실</span>
        <ChevronRight size={16} className="text-muted" />
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-text">{formatMeters(stash.availableM)}</span>
        <span className="text-sm text-muted">m</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
        <span>
          총 보유 <span className="font-semibold text-text">{formatMeters(stash.totalM)}m</span>
        </span>
        <span>
          실 <span className="font-semibold text-text">{stash.yarnCount}개</span> · {formatMeters(stash.skeinCount)}타래
        </span>
        {stash.committedM > 0 && (
          <span>
            프로젝트에 <span className="font-semibold text-text">{committedShare}%</span> 사용 중
          </span>
        )}
      </div>
    </button>
  );
}

function ReadyToKnitCard({
  readyToKnit,
  onNavigate,
}: {
  readyToKnit: DashboardSummary["readyToKnit"];
  onNavigate: (to: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5">
        <Sparkles size={15} className="text-accent" />
        <h2 className="text-sm font-semibold text-text">지금 바로 뜰 수 있는 도안</h2>
      </div>

      {readyToKnit.count === 0 ? (
        <p className="mt-2 text-xs text-muted">
          지금 가진 실만으로 넉넉하게 뜰 수 있는 도안이 아직 없어요. 도안을 더 등록해보세요
        </p>
      ) : (
        <>
          <p className="mt-1 text-[11px] text-muted">
            실 하나로 필요량이 채워지는 도안 <span className="font-semibold text-text">{readyToKnit.count}개</span>
          </p>
          <div className="mt-2.5 flex flex-col gap-1.5">
            {readyToKnit.samples.map((sample) => (
              <button
                key={sample.id}
                onClick={() => onNavigate(`/patterns/${sample.id}`)}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-card p-2 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sub-soft">
                  {sample.thumbnailUrl ? (
                    <img src={sample.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <BookOpen size={16} className="text-sub" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-text">{sample.name}</div>
                  <div className="truncate text-[11px] text-muted">
                    {sample.yarn.brand} {sample.yarn.lineName} · {formatMeters(sample.requiredMinM)}m 필요
                  </div>
                </div>
                {/* 배지를 세로로 쌓으면 오른쪽 폭을 뺏겨 실 이름이 잘린다 - 좁은 화면에선 굵기 하나만 남긴다 */}
                <div className="shrink-0">
                  <WeightBadge weight={sample.weightCategory} />
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ProjectStatusCard({
  projects,
  bookmarkCount,
  onNavigate,
}: {
  projects: DashboardSummary["projects"];
  bookmarkCount: number;
  onNavigate: (to: string) => void;
}) {
  const tiles = [
    { label: "진행중", value: projects.IN_PROGRESS, to: "/projects" },
    { label: "보류", value: projects.ON_HOLD, to: "/projects" },
    { label: "완료", value: projects.COMPLETED, to: "/projects" },
    { label: "찜한 도안", value: bookmarkCount, to: "/patterns" },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-text">프로젝트</h2>
      <div className="mt-2.5 grid grid-cols-4 gap-2">
        {tiles.map((tile) => (
          <button
            key={tile.label}
            onClick={() => onNavigate(tile.to)}
            className="cursor-pointer rounded-xl border border-border bg-bg py-2.5 text-center"
          >
            <div className="text-lg font-bold text-text">{tile.value}</div>
            <div className="mt-0.5 text-[10px] text-muted">{tile.label}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

// 만 단위가 넘어가면 자릿수만 길어지고 읽기 어려워져서 천 단위 구분자를 넣는다
function formatMeters(value: number) {
  return Math.round(value).toLocaleString("ko-KR");
}
