import { Route, Routes } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { PlainLayout } from "./components/layout/PlainLayout";
import { RequireSession } from "./auth/RequireSession";
import { IndexGate } from "./pages/IndexGate";
import { KakaoCallbackPage } from "./pages/auth/KakaoCallbackPage";
import { GoogleCallbackPage } from "./pages/auth/GoogleCallbackPage";
import { YarnListPage } from "./pages/yarn/YarnListPage";
import { YarnRegisterPage } from "./pages/yarn/YarnRegisterPage";
import { YarnDetailPage } from "./pages/yarn/YarnDetailPage";
import { YarnEditPage } from "./pages/yarn/YarnEditPage";
import { PatternListPage } from "./pages/pattern/PatternListPage";
import { PatternRegisterPage } from "./pages/pattern/PatternRegisterPage";
import { PatternDetailPage } from "./pages/pattern/PatternDetailPage";
import { PatternEditPage } from "./pages/pattern/PatternEditPage";
import { ProjectStartPage } from "./pages/pattern/ProjectStartPage";
import { ProjectListPage } from "./pages/project/ProjectListPage";
import { ProjectDetailPage } from "./pages/project/ProjectDetailPage";
import { MyPage } from "./pages/MyPage";

// 화면설계서 0-2 라우팅 구조 - 목록형 화면(MainLayout)은 하단 탭바 표시, 등록/상세/수정(PlainLayout)은 탭바 숨김
// RequireSession이 두 레이아웃 그룹을 감싸 세션 없이 딥링크로 들어오는 경우를 시작 화면으로 되돌림
function App() {
  return (
    <Routes>
      <Route path="/" element={<IndexGate />} />
      <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

      <Route element={<RequireSession />}>
        <Route element={<MainLayout />}>
          <Route path="/yarns" element={<YarnListPage />} />
          <Route path="/patterns" element={<PatternListPage />} />
          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="/my" element={<MyPage />} />
        </Route>

        <Route element={<PlainLayout />}>
          <Route path="/yarns/new" element={<YarnRegisterPage />} />
          <Route path="/yarns/:id" element={<YarnDetailPage />} />
          <Route path="/yarns/:id/edit" element={<YarnEditPage />} />
          <Route path="/patterns/new" element={<PatternRegisterPage />} />
          <Route path="/patterns/:id" element={<PatternDetailPage />} />
          <Route path="/patterns/:id/edit" element={<PatternEditPage />} />
          <Route path="/patterns/:id/start-project" element={<ProjectStartPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
