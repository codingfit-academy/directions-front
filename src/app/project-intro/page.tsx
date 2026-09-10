import {
  Activity,
  AlarmClock,
  Brain,
  Database,
  Footprints,
  GitBranch,
  Layers,
  LineChart,
  MapPin,
  Radar,
  ServerCog,
  ShieldAlert,
  Sparkles,
  TrafficCone,
  Users,
} from 'lucide-react';

export const metadata = {
  title: '지각방지 AI 내비 · 프로젝트 소개',
  description:
    'GPS 실측 기록을 학습해 개인화된 소요시간을 예측하고, 3단계 출발 알람으로 지각을 막는 서비스',
};

/* ─────────────────────────────────────────────────────────────
   AI 대회 출품용 소개 페이지.
   메인(`/`)에서 링크로 연결하지 않는 독립 페이지다 — 주소로만 접근한다.
   ───────────────────────────────────────────────────────────── */

const ALARMS = [
  {
    tone: 'emerald',
    quantile: 'p90 (비관적 추정)',
    title: '절대 안 늦어요',
    desc: '가장 오래 걸렸던 수준으로 잡아 가장 이르게 출발시키는 알람',
  },
  {
    tone: 'blue',
    quantile: 'p50 (예측 중앙값)',
    title: '이때까진 가야해요',
    desc: '평소 걸리는 시간에 딱 맞춰 출발시키는 알람',
  },
  {
    tone: 'rose',
    quantile: 'p10 (낙관적 추정)',
    title: '늦을 수도 있어요',
    desc: '가장 빨랐던 수준을 가정한 마지노선 — 지각 위험을 안고 출발',
  },
] as const;

const TONE: Record<string, { ring: string; text: string; chip: string; bar: string }> = {
  emerald: {
    ring: 'border-emerald-200 bg-emerald-50/60',
    text: 'text-emerald-700',
    chip: 'bg-emerald-100 text-emerald-800',
    bar: 'bg-emerald-500',
  },
  blue: {
    ring: 'border-blue-200 bg-blue-50/60',
    text: 'text-blue-700',
    chip: 'bg-blue-100 text-blue-800',
    bar: 'bg-blue-500',
  },
  rose: {
    ring: 'border-rose-200 bg-rose-50/60',
    text: 'text-rose-700',
    chip: 'bg-rose-100 text-rose-800',
    bar: 'bg-rose-500',
  },
};

function SectionTitle({
  icon: Icon,
  eyebrow,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-8">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold tracking-wide text-slate-600">
        <Icon className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      {desc && <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">{desc}</p>}
    </div>
  );
}

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-slate-200 py-2 last:border-0">
      <span className="shrink-0 text-sm text-slate-500">{k}</span>
      <span className="text-right font-mono text-sm font-medium text-slate-800">{v}</span>
    </div>
  );
}

export default function ProjectIntroPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* ── Hero ───────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_0%,white,transparent_35%)]" />
        <div className="relative mx-auto max-w-5xl px-6 py-20 sm:py-24">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/30 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            AI 공모전 출품작 · 프로젝트 소개
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            &ldquo;몇 시에 나가야 안 늦어요?&rdquo;
            <br />
            <span className="text-sky-100">에 답하는 AI 내비게이션</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-sky-50/90">
            지도 앱은 <b className="text-white">&ldquo;지금 출발하면 25분&rdquo;</b>이라고만 말합니다. 정작 필요한 건
            <b className="text-white"> &ldquo;9시까지 가려면 몇 시에 나가야 하는가&rdquo;</b>입니다. 이 서비스는 사용자가 실제로 걸어간
            GPS 기록을 모아 <b className="text-white">개인화된 소요시간 분포</b>를 학습하고, 그 분포를 그대로
            <b className="text-white"> 3단계 출발 알람</b>으로 바꿔줍니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Flutter 앱', 'FastAPI', 'PostGIS', 'ST-DBSCAN', 'XGBoost 분위수 회귀', 'LSTM 벤치마크'].map(
              (t) => (
                <span
                  key={t}
                  className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur"
                >
                  {t}
                </span>
              ),
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-20 px-6 py-16">
        {/* ── 문제 정의 ────────────────────────────────────── */}
        <section>
          <SectionTitle
            icon={ShieldAlert}
            eyebrow="PROBLEM"
            title="기존 ETA는 '평균 한 개'만 알려준다"
            desc="지각은 평균에서 나지 않고 꼬리(tail)에서 납니다. 같은 길도 신호를 몇 번 걸리느냐, 엘리베이터가 몇 층에 있느냐에 따라 매일 달라지는데, 기존 길찾기는 그 편차를 사용자에게 알려주지 않습니다."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                t: '평균만으론 부족',
                d: '평균 25분이어도 어떤 날은 34분이 걸립니다. 지각을 막으려면 "최악의 경우"를 알아야 합니다.',
              },
              {
                t: '나의 걸음이 아님',
                d: '지도 API의 보행 속도는 일반값입니다. 내 걸음, 내가 늘 걸리는 신호는 반영되지 않습니다.',
              },
              {
                t: '출발 시각을 안 알려줌',
                d: '소요시간을 알려줘도 역산은 사용자 몫입니다. 정작 필요한 건 알람이 울리는 것입니다.',
              },
            ].map((x) => (
              <Card key={x.t}>
                <h3 className="mb-2 font-bold text-slate-900">{x.t}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{x.d}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ── 서비스 개요 ──────────────────────────────────── */}
        <section>
          <SectionTitle
            icon={Footprints}
            eyebrow="SERVICE"
            title="같은 길을 3번 걸으면, AI가 내 출발 시각을 계산한다"
            desc="사용자는 평소 다니는 길(등교길, 퇴근길)을 이름 붙여 기록합니다. 기록이 쌓이면 서버가 그 사람의 실측 데이터로 소요시간 분포를 예측하고, 목표 도착 시각에서 역산해 알람 3개를 만들어 줍니다."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                icon: MapPin,
                t: '1. 기록하기',
                d: 'GPS를 5m 이동마다 수집하고, 멈춰 있을 때도 15초마다 강제로 한 점을 남깁니다. 30초마다 배치 업로드하며, 실패하면 버퍼로 되돌려 유실을 막습니다.',
              },
              {
                icon: TrafficCone,
                t: '2. 멈춘 지점 확인',
                d: '기록을 저장하면 서버가 찾아낸 "정지 구간"을 보여주고, 신호등인지 엘리베이터인지 기타인지 사용자가 알려줍니다. 지도의 빨간 점을 눌러 바로 표시할 수 있습니다.',
              },
              {
                icon: Brain,
                t: '3. AI 분석',
                d: '같은 이름으로 3회 이상 기록하면 분석이 열립니다. 평균·최소·최대 소요시간과, 그 값이 학습 모델에서 나온 것인지 규칙 기반 추정인지까지 함께 보여줍니다.',
              },
              {
                icon: AlarmClock,
                t: '4. 3단계 출발 알람',
                d: '목표 도착 시각을 정하면 예측 분포의 세 분위수를 각각 빼서 출발 시각 3개를 만듭니다. 이동 중에는 30초마다 정시 도착 확률을 다시 계산해 위험하면 진동으로 알립니다.',
              },
            ].map((x) => (
              <Card key={x.t}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <x.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-bold text-slate-900">{x.t}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{x.d}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ── 3단계 알람 ───────────────────────────────────── */}
        <section>
          <SectionTitle
            icon={AlarmClock}
            eyebrow="CORE IDEA"
            title="예측 '분포'를 그대로 알람 3개로 번역한다"
            desc="이 프로젝트의 핵심 아이디어입니다. 모델은 하나의 숫자가 아니라 세 개의 분위수를 출력하고, 그 세 값이 곧 사용자가 이해할 수 있는 세 개의 선택지가 됩니다."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {ALARMS.map((a) => {
              const tone = TONE[a.tone];
              return (
                <div key={a.title} className={`rounded-2xl border p-6 ${tone.ring}`}>
                  <div className={`mb-3 inline-block rounded-md px-2 py-1 font-mono text-xs font-semibold ${tone.chip}`}>
                    {a.quantile}
                  </div>
                  <h3 className={`text-lg font-bold ${tone.text}`}>{a.title}</h3>
                  <div className={`my-3 h-1 w-12 rounded-full ${tone.bar}`} />
                  <p className="text-sm leading-relaxed text-slate-600">{a.desc}</p>
                </div>
              );
            })}
          </div>
          <Card className="mt-4 bg-slate-900 text-slate-100">
            <p className="font-mono text-sm leading-relaxed">
              <span className="text-slate-400">출발 시각</span> = 목표 도착 시각 −{' '}
              <span className="text-emerald-400">p90</span> / <span className="text-blue-400">p50</span> /{' '}
              <span className="text-rose-400">p10</span>
            </p>
          </Card>
        </section>

        {/* ── AI 3종 ───────────────────────────────────────── */}
        <section>
          <SectionTitle
            icon={Brain}
            eyebrow="AI / ML"
            title="AI는 무엇을, 어떤 역할로 하는가"
            desc="세 가지 모델이 각각 다른 역할을 맡습니다. ①은 데이터를 만들고, ②는 예측을 하고, ③은 ②가 최선인지 검증합니다."
          />

          <div className="space-y-6">
            {/* ① ST-DBSCAN */}
            <Card>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                  <Radar className="h-5 w-5" />
                </span>
                <h3 className="text-xl font-bold text-slate-900">① ST-DBSCAN — 정지 구간 탐지</h3>
                <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                  직접 구현 (라이브러리 미사용)
                </span>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-slate-600">
                <b>역할: 원시 GPS를 의미 있는 사건으로 바꾼다.</b> 좌표 수천 개는 그 자체로 아무 정보도 아닙니다.
                시공간 클러스터링으로 &ldquo;여기서 47초 멈춰 있었다&rdquo;는 사건을 뽑아내야 비로소 신호 대기·엘리베이터
                같은 지연 요인을 다룰 수 있습니다. 일반 DBSCAN과 달리 <b>공간 거리와 시간 거리를 동시에</b> 만족해야
                이웃으로 인정하므로, 같은 장소를 왕복으로 두 번 지난 경우가 하나로 뭉치지 않습니다.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-800">파라미터</h4>
                  <Spec k="공간 반경 (eps_space)" v="15 m" />
                  <Spec k="시간 반경 (eps_time)" v="60 s" />
                  <Spec k="최소 이웃 (min_pts)" v="3" />
                  <Spec k="정지 인정 최소 체류" v="10 s" />
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-800">전처리 (노이즈 제거)</h4>
                  <Spec k="정확도 반경 초과 시 폐기" v="> 50 m" />
                  <Spec k="비현실적 순간속도 폐기" v="> 15 m/s" />
                  <Spec k="처리 시점" v="trip 종료 후 백그라운드" />
                  <Spec k="결과 저장" v="stop_clusters 테이블" />
                </div>
              </div>
            </Card>

            {/* ② XGBoost */}
            <Card>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <LineChart className="h-5 w-5" />
                </span>
                <h3 className="text-xl font-bold text-slate-900">② XGBoost 분위수 회귀 — ETA 예측</h3>
                <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                  서비스 예측 담당
                </span>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-slate-600">
                <b>역할: 소요시간을 &lsquo;하나의 값&rsquo;이 아니라 &lsquo;분포&rsquo;로 예측한다.</b> 일반 회귀(평균 예측)를 쓰면
                지각 방지에 필요한 &ldquo;최악의 경우&rdquo;를 알 수 없습니다. 그래서 목적함수를{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">reg:quantileerror</code>로 두고
                10%/50%/90% 세 분위수를 동시에 예측합니다. 이 세 값이 그대로 3단계 알람이 됩니다.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-800">학습 설정</h4>
                  <Spec k="objective" v="reg:quantileerror" />
                  <Spec k="quantile_alpha" v="[0.1, 0.5, 0.9]" />
                  <Spec k="max_depth / eta" v="4 / 0.1" />
                  <Spec k="num_boost_round" v="100" />
                  <Spec k="최소 학습 표본" v="20 trips" />
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-800">입력 피처 (6) / 라벨</h4>
                  <Spec k="distance_m" v="이동 거리" />
                  <Spec k="hour_of_day / day_of_week" v="출발 시각·요일 (KST)" />
                  <Spec k="historical_avg_speed_mps" v="이력 평균 속도" />
                  <Spec k="historical_source" v="0=기본 1=전체 2=개인" />
                  <Spec k="historical_avg_stop_count" v="평균 정지 횟수" />
                  <Spec k="→ 라벨" v="actual_duration_s" />
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm leading-relaxed text-amber-900">
                  <b>콜드 스타트 대응:</b> 표본이 20건 미만이면 학습을 거부하고 규칙 기반으로 폴백합니다 —{' '}
                  <span className="font-mono text-xs">거리 ÷ 속도 + 정지횟수 × 정지당 대기시간</span>. 기본 보행 속도는
                  1.2 m/s, 정지당 대기는 20초를 쓰되, <b>신호 주기를 아는 지점은 &ldquo;주기 ÷ 2&rdquo;</b>로 대체합니다
                  (임의 시점에 도착한다고 보면 기대 대기가 주기의 절반이므로).
                </p>
              </div>
            </Card>

            {/* ③ LSTM */}
            <Card>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
                  <Layers className="h-5 w-5" />
                </span>
                <h3 className="text-xl font-bold text-slate-900">③ LSTM — 시퀀스 모델 벤치마크</h3>
                <span className="rounded-md bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-800">
                  오프라인 검증용
                </span>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-slate-600">
                <b>역할: &ldquo;요약 피처로 충분한가&rdquo;를 검증한다.</b> ②는 궤적을 6개 숫자로 요약해 씁니다. 그렇다면 GPS
                시퀀스를 통째로 학습하면 더 정확할까? 이를 확인하려고 LSTM을 같은 홀드아웃에서 학습시켜 MAE를
                비교합니다. <b>다만 라이브 예측에는 쓰지 않습니다</b> — 출발 <i>전</i> 예측 시점에는 그 이동의 GPS 시퀀스가
                아직 존재하지 않기 때문입니다. 모델 선택의 근거를 데이터로 남기는 것이 이 모델의 목적입니다.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-800">구조</h4>
                  <Spec k="입력 (스텝당 3차원)" v="Δt, 이동거리, 정지여부" />
                  <Spec k="LSTM hidden" v="32" />
                  <Spec k="출력" v="3 분위수" />
                  <Spec k="손실" v="pinball loss" />
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-800">학습·평가</h4>
                  <Spec k="epochs / lr" v="200 / 0.05" />
                  <Spec k="최대 시퀀스 길이" v="300 step" />
                  <Spec k="홀드아웃" v="시간순 뒤쪽 20%" />
                  <Spec k="최소 표본" v="50 trips" />
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                * 랜덤 셔플이 아니라 <b>시간순</b>으로 나눕니다. 과거로 학습해 미래를 맞히는 실제 배포 상황과 같은 조건에서
                평가해야 의미가 있기 때문입니다. PyTorch는 선택 의존성이라 미설치 시 501을 반환합니다.
              </p>
            </Card>
          </div>
        </section>

        {/* ── Human in the loop ────────────────────────────── */}
        <section>
          <SectionTitle
            icon={Users}
            eyebrow="HUMAN-IN-THE-LOOP"
            title="사람이 라벨을 달면 모델이 실제로 좋아진다"
            desc="자동 탐지만으로는 '왜 멈췄는지'를 알 수 없습니다. 사용자의 한 번의 탭이 학습 피처와 대기시간 가정을 동시에 바꾸도록 파이프라인을 닫아 두었습니다."
          />
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { n: '1', t: '정지 구간 제시', d: 'ST-DBSCAN이 찾은 지점을 지도 위 빨간 점으로' },
              { n: '2', t: '사용자가 분류', d: '신호등 / 엘리베이터 / 기타(직접 입력)' },
              { n: '3', t: '신호등 데이터 연결', d: '그 좌표의 교차로를 요청 시점에 조회해 매칭' },
              { n: '4', t: '예측에 반영', d: 'signal_stop_count 피처 + 대기시간 = 주기 ÷ 2' },
            ].map((s) => (
              <Card key={s.n}>
                <div className="mb-2 grid h-7 w-7 place-items-center rounded-lg bg-slate-900 font-mono text-xs font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mb-1 text-sm font-bold text-slate-900">{s.t}</h3>
                <p className="text-xs leading-relaxed text-slate-600">{s.d}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ── 파이프라인 ───────────────────────────────────── */}
        <section>
          <SectionTitle
            icon={GitBranch}
            eyebrow="PIPELINE"
            title="AI를 어떻게 만들었는가 — 데이터부터 예측까지"
            desc="학습 데이터를 외부에서 가져온 것이 아니라, 앱이 스스로 만들어 쌓는 구조입니다. 사용자가 기록할수록 그 사용자에게 맞는 모델이 됩니다."
          />
          <div className="space-y-3">
            {[
              {
                t: '수집',
                d: 'Flutter 앱이 geolocator로 5m 이동마다 좌표를 받고, 정지 중에도 15초 하트비트로 점을 남긴다. 정지 시 점이 없으면 ST-DBSCAN의 min_pts(3)를 못 채워 신호 대기를 놓치기 때문이다.',
                tag: 'Flutter',
              },
              {
                t: '적재',
                d: '30초마다 배치 업로드 → gps_points 테이블에 PostGIS POINT(EPSG:4326)로 저장. 업로드 실패 시 버퍼에 되돌려 재시도한다.',
                tag: 'POST /gps/trips/{id}/points',
              },
              {
                t: '전처리',
                d: 'trip 종료 시 백그라운드 작업으로 정확도·속도 기반 노이즈 제거 → ST-DBSCAN 정지 구간 탐지 → 30m 내 신호등 매칭.',
                tag: 'BackgroundTasks',
              },
              {
                t: '피처화',
                d: '거리·실측 소요시간·이동/정지 시간·정지 횟수·신호 정지 수·평균 속도·시간대·요일을 계산해 trip_segment_features에 upsert. actual_duration_s가 학습 라벨이 된다.',
                tag: 'trip_segment_features',
              },
              {
                t: '학습',
                d: '누적된 완료 trip으로 XGBoost 분위수 회귀를 재학습하고 모델 파일로 저장. 표본이 모자라면 학습을 거부하고 그 사실을 응답에 담는다.',
                tag: 'POST /eta/train',
              },
              {
                t: '예측·추천',
                d: '요청 시 개인 이력 → 전체 이력 → 기본값 순으로 폴백하며 분위수 3점을 내고, 목표 도착 시각이 있으면 정시 도착 확률과 출발 상태 문구까지 계산한다.',
                tag: 'GET /eta/predict · departure-recommendation',
              },
            ].map((s, i) => (
              <div key={s.t} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600 font-mono text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  {i < 5 && <div className="my-1 w-px flex-1 bg-slate-200" />}
                </div>
                <Card className="mb-1 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900">{s.t}</h3>
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                      {s.tag}
                    </code>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">{s.d}</p>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* ── 분석 방법 ────────────────────────────────────── */}
        <section>
          <SectionTitle
            icon={Activity}
            eyebrow="ANALYSIS"
            title="분석은 어떻게 하는가"
            desc="예측값을 그대로 보여주지 않고, 사용자가 행동할 수 있는 형태(확률·문구·알람 시각)로 변환하는 단계입니다."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h3 className="mb-3 font-bold text-slate-900">정시 도착 확률 계산</h3>
              <p className="mb-3 text-sm leading-relaxed text-slate-600">
                예측된 세 분위수(p10, p50, p90)를 <b>경험적 CDF의 세 점</b>으로 보고 선형 보간합니다. 목표 시각까지
                남은 시간을 이 곡선에 넣으면 &ldquo;그 안에 도착할 확률&rdquo;이 나옵니다.
              </p>
              <div className="rounded-lg bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-100">
                P(도착 ≤ 남은시간) ≈ interp(remaining_s; p10→0.1, p50→0.5, p90→0.9)
              </div>
            </Card>
            <Card>
              <h3 className="mb-3 font-bold text-slate-900">확률 → 출발 상태 문구</h3>
              <p className="mb-3 text-sm leading-relaxed text-slate-600">
                확률을 임계값으로 나눠 사용자가 즉시 판단할 수 있는 네 상태로 매핑합니다.
              </p>
              <Spec k="P ≥ 0.9" v="여유 있는 출발" />
              <Spec k="0.9 > P ≥ 0.6" v="정시 출발" />
              <Spec k="0.6 > P ≥ 0.3" v="늦어도 지금은 출발" />
              <Spec k="P < 0.3" v="이미 늦음" />
            </Card>
            <Card>
              <h3 className="mb-3 font-bold text-slate-900">분위수 교차(quantile crossing) 보정</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                데이터가 적으면 p10 &gt; p50 같은 역전이 실제로 발생합니다. 개별 분위수의 미세한 정확도보다 순서
                보장이 사용자 경험에 더 중요하므로(&ldquo;최소&rdquo;가 &ldquo;평균&rdquo;보다 크면 신뢰를 잃음), 예측 직후 정렬로
                단조성을 강제합니다.
              </p>
            </Card>
            <Card>
              <h3 className="mb-3 font-bold text-slate-900">추정의 근거를 함께 노출</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                모든 예측 응답에 <code className="rounded bg-slate-100 px-1 font-mono text-xs">model_source</code>(학습
                모델인지 규칙 기반인지)와{' '}
                <code className="rounded bg-slate-100 px-1 font-mono text-xs">sample_count</code>(근거가 된 기록 수)를
                담고, 앱 화면에도 그대로 보여줍니다. 데이터가 적을 때 과신하지 않게 하는 것이 지각 방지 서비스의
                신뢰도에 직결되기 때문입니다.
              </p>
            </Card>
          </div>
        </section>

        {/* ── 아키텍처 ─────────────────────────────────────── */}
        <section>
          <SectionTitle icon={ServerCog} eyebrow="ARCHITECTURE" title="시스템 구성과 기술 스택" />
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <h3 className="mb-3 font-bold text-slate-900">앱 (Flutter)</h3>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li>Flutter 3.44 / Dart 3.12</li>
                <li>Riverpod (코드 생성) · Freezed</li>
                <li>go_router · Dio</li>
                <li>geolocator (백그라운드 GPS)</li>
                <li>feature-first 클린 아키텍처</li>
              </ul>
            </Card>
            <Card>
              <h3 className="mb-3 font-bold text-slate-900">서버 (FastAPI)</h3>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li>FastAPI · SQLAlchemy (async)</li>
                <li>PostgreSQL + PostGIS</li>
                <li>XGBoost · NumPy</li>
                <li>PyTorch (선택 의존성)</li>
                <li>Docker · GitHub Actions CD</li>
              </ul>
            </Card>
            <Card>
              <h3 className="mb-3 font-bold text-slate-900">웹 (Next.js)</h3>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li>Next.js 16 · React 19</li>
                <li>Tailwind CSS 4</li>
                <li>네이버 지도 JS SDK</li>
                <li>경로 탐색·신호등 시각화</li>
              </ul>
            </Card>
          </div>
          <Card className="mt-4 overflow-x-auto bg-slate-900">
            <pre className="font-mono text-xs leading-relaxed text-slate-100">{`[Flutter 앱]  GPS 수집 → 30초 배치 업로드
      │
      ▼
[FastAPI]  gps_points 적재 → (종료 시) 노이즈 제거 → ST-DBSCAN → 신호등 매칭
      │                                                  │
      │                                                  ▼
      │                                        stop_clusters (사용자 라벨)
      ▼
trip_segment_features ──→ XGBoost 분위수 회귀 학습 ──→ p10 / p50 / p90
      │                            │
      │                            └──→ (오프라인) LSTM 벤치마크로 비교 검증
      ▼
정시 도착 확률 → 출발 상태 문구 → 3단계 알람`}</pre>
          </Card>
        </section>

        {/* ── API ──────────────────────────────────────────── */}
        <section>
          <SectionTitle
            icon={Database}
            eyebrow="API"
            title="사용한 API"
            desc="자체 구축한 REST API와, 공공·상용 지도 API를 조합했습니다."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h3 className="mb-4 font-bold text-slate-900">자체 API (FastAPI)</h3>
              <div className="space-y-3 text-sm">
                {[
                  { g: '인증', l: ['POST /auth/register', 'POST /auth/login', 'GET /auth/me'] },
                  {
                    g: 'GPS 궤적',
                    l: [
                      'POST /gps/trips · GET /gps/trips',
                      'POST /gps/trips/{id}/points',
                      'POST /gps/trips/{id}/finish',
                      'GET /gps/trips/{id}/points · /stops · /features',
                      'PATCH /gps/stops/{id}/label',
                    ],
                  },
                  {
                    g: 'ETA',
                    l: [
                      'POST /eta/train',
                      'GET /eta/predict',
                      'GET /eta/departure-recommendation',
                      'POST /eta/train-lstm',
                    ],
                  },
                  {
                    g: '길찾기·신호등',
                    l: ['POST /directions/route', 'GET /directions/geocode/search', 'GET /signals/nearby'],
                  },
                ].map((x) => (
                  <div key={x.g}>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {x.g}
                    </div>
                    <ul className="space-y-1">
                      {x.l.map((e) => (
                        <li key={e} className="font-mono text-xs text-slate-700">
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="mb-4 font-bold text-slate-900">외부 API</h3>
              <div className="space-y-3">
                {[
                  { n: '네이버 클라우드 Maps', d: 'Geocoding · Directions 5(차량) · Web Dynamic Map' },
                  { n: 'T-map 보행자 경로', d: '보행 모드 경로 탐색 (실패 시 네이버로 폴백)' },
                  { n: 'VWorld / Kakao Local', d: '주소·장소 검색 지오코딩 폴백' },
                  {
                    n: '경찰청 교차로기반정보서비스',
                    d: '공공데이터포털 · 교차로(신호등) 위치 — 서울 388건',
                  },
                  {
                    n: '경찰청 교차로계획정보서비스',
                    d: '요일별·시간대별 신호 주기 — 서울 한정',
                  },
                  { n: '서울 열린데이터광장 TOPIS', d: '실시간 도로 소통 정보로 ETA 보정' },
                ].map((x) => (
                  <div key={x.n} className="border-b border-dashed border-slate-200 pb-3 last:border-0">
                    <div className="text-sm font-semibold text-slate-800">{x.n}</div>
                    <div className="text-xs leading-relaxed text-slate-500">{x.d}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* ── 한계 ─────────────────────────────────────────── */}
        <section>
          <SectionTitle
            icon={ShieldAlert}
            eyebrow="LIMITATIONS"
            title="현재 한계와 다음 단계"
            desc="심사에서 확인하실 수 있도록, 아직 해결되지 않은 부분을 그대로 적습니다."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                t: '신호등 데이터가 서울에만 있음',
                d: '경찰청 교차로 API는 388건 전부 서울이고 신호 주기 역시 서울 한정입니다. 서울 밖에서는 신호 보정 없이 기본 대기시간(20초)으로 폴백합니다.',
              },
              {
                t: '초기 사용자에겐 규칙 기반 추정',
                d: '학습에는 완료 trip 20건이 필요합니다. 그 전까지는 휴리스틱이며, 앱이 이 사실을 사용자에게 명시합니다.',
              },
              {
                t: 'LSTM은 아직 라이브 예측에 미투입',
                d: '출발 전에는 시퀀스가 없어 구조적으로 사용할 수 없습니다. 향후 "출발 직후 부분 시퀀스로 도착시각 재추정"에 활용할 여지가 있습니다.',
              },
              {
                t: 'OS 알림 스케줄러 연동 예정',
                d: '현재는 알람 시각 계산과 화면 표시까지 구현되어 있으며, 백그라운드 알림 등록이 다음 작업입니다.',
              },
            ].map((x) => (
              <Card key={x.t}>
                <h3 className="mb-2 font-bold text-slate-900">{x.t}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{x.d}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-5xl px-6 text-center text-sm text-slate-500">
          GPS 실측 기반 개인화 ETA · 3단계 지각 방지 알람 · AI 공모전 출품 프로젝트
        </div>
      </footer>
    </main>
  );
}
