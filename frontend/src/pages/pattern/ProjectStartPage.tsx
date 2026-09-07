import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopBar } from "../../components/layout/TopBar";
import { MatchTierChip } from "../../components/ui/MatchTierChip";
import { usePatternQuery, usePatternYarnMatchesQuery } from "../../api/usePatterns";
import { useStartOrResumeProjectMutation } from "../../api/useProjects";

// 화면설계서 6-2(프로젝트 시작)
export function ProjectStartPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: pattern } = usePatternQuery(id);
  const { data: matches } = usePatternYarnMatchesQuery(id);
  const [selectedYarnId, setSelectedYarnId] = useState<string | undefined>(undefined);
  const startProject = useStartOrResumeProjectMutation();

  if (!pattern) {
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title="프로젝트 시작" />
        <p className="p-6 text-center text-sm text-muted">불러오는 중...</p>
      </div>
    );
  }

  async function handleStart() {
    const project = await startProject.mutateAsync({ patternId: pattern!.id, yarnId: selectedYarnId });
    navigate(`/projects/${project.id}`, { replace: true });
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="프로젝트 시작" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-sm font-semibold text-text">{pattern.name}</div>
          <div className="mt-0.5 text-xs text-muted">
            {pattern.requiredMaxM && pattern.requiredMaxM > pattern.requiredMinM
              ? `${pattern.requiredMinM}~${pattern.requiredMaxM}m 필요`
              : `${pattern.requiredMinM}m 필요`}
          </div>
        </div>

        <h2 className="mb-2 mt-5 text-sm font-semibold text-text">실 선택</h2>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => setSelectedYarnId(undefined)}
            className={`cursor-pointer rounded-xl border p-3 text-left text-sm ${
              selectedYarnId === undefined ? "border-accent bg-accent-soft text-accent" : "border-border bg-card text-text"
            }`}
          >
            나중에 연결
          </button>
          {matches?.map((m) => (
            <button
              key={m.yarn.id}
              onClick={() => setSelectedYarnId(m.yarn.id)}
              className={`cursor-pointer rounded-xl border p-3 text-left ${
                selectedYarnId === m.yarn.id ? "border-accent bg-accent-soft" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text">
                  {m.yarn.brand} {m.yarn.lineName}
                </span>
                <MatchTierChip label={m.label} />
              </div>
              {/* 다른 프로젝트가 일부를 잡고 있으면 총 보유량이 아니라 "지금 쓸 수 있는 양"을 봐야 판단이 됨 */}
              <div className="mt-1 text-[11px] text-muted">
                쓸 수 있는 양 {Math.round(m.yarn.availableM)}m
                {m.yarn.committedM > 0 && ` (보유 ${Math.round(m.yarn.totalM)}m 중)`}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-bg p-4">
        <button
          onClick={handleStart}
          disabled={startProject.isPending}
          className="w-full cursor-pointer rounded-xl border-none bg-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {startProject.isPending ? "시작하는 중..." : "시작하기"}
        </button>
      </div>
    </div>
  );
}
