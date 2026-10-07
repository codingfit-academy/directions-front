import {
  AlertTriangle,
  Clock,
  Database,
  Mail,
  MapPin,
  Share2,
  ShieldCheck,
  Trash2,
  UserCog,
} from 'lucide-react';

export const metadata = {
  title: '지각그만 · 개인정보 처리방침',
  description: '지각그만(GPS 기반 출발 알람 서비스) 개인정보 처리방침',
};

/* ─────────────────────────────────────────────────────────────
   플레이스토어 콘솔 등록용 개인정보 처리방침. 메인(`/`)에서 링크로 연결하지
   않는 독립 페이지다 — 콘솔에 이 페이지의 URL만 등록해서 쓴다.
   ───────────────────────────────────────────────────────────── */

const EFFECTIVE_DATE = '2026-10-07';
const CONTACT_EMAIL = 'dogyum2026@gmail.com';

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-left text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-slate-100 last:border-0">
              <th className="w-36 shrink-0 bg-slate-50 px-3 py-2.5 align-top font-medium text-slate-700">
                {k}
              </th>
              <td className="px-3 py-2.5 text-slate-600">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold tracking-wide text-slate-600">
          <ShieldCheck className="h-3.5 w-3.5" />
          개인정보 처리방침
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          지각그만 개인정보 처리방침
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-500">
          시행일자: {EFFECTIVE_DATE}
        </p>

        <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          <p className="leading-relaxed">
            &ldquo;지각그만&rdquo;은 상용 서비스가 아니라 학생(이도겸)이 AI 경진대회 출품을 위해
            개발한 비상업적 개인 프로젝트입니다. 이 문서는 앱이 수집하는 정보와 처리 방식을
            이용자에게 투명하게 안내하기 위해 작성되었습니다.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <Section icon={Database} title="1. 수집하는 개인정보 항목">
            <p>회원가입 및 서비스 이용 과정에서 아래 정보를 수집합니다.</p>
            <Table
              rows={[
                ['회원가입 시', '이메일, 아이디(닉네임), 비밀번호(암호화 저장)'],
                ['선택 입력', '성별(선택 — 미입력 시에도 가입 가능)'],
                [
                  '서비스 이용 중',
                  'GPS 위치 정보(위도·경도, 이동 경로, 이동 속도), 기록 이름, 이동 시작·종료 시각',
                ],
                ['자동 수집', '기기의 접속 로그, 서비스 이용 기록'],
              ]}
            />
          </Section>

          <Section icon={MapPin} title="2. 위치정보의 수집·이용">
            <p>
              이 앱은 이용자가 직접 &ldquo;기록 시작&rdquo;을 눌러 걷거나 이동하는 동안에만(앱을
              사용 중일 때) GPS 위치 정보를 수집합니다. 백그라운드에서 상시로 위치를 수집하지
              않으며, 기록을 멈추면 위치 수집도 함께 종료됩니다.
            </p>
            <p>
              수집한 위치 기록은 이동 경로와 소요시간을 분석해 개인화된 소요시간을 예측하고,
              목표 도착 시각에 맞춘 출발 알람을 제공하는 목적으로만 이용됩니다. 정지 구간(신호
              대기 추정 등)을 분석하는 데도 쓰이며, 이 분석 결과는 신호등 데이터 보정 및 예측
              모델 개선에 활용됩니다.
            </p>
          </Section>

          <Section icon={Clock} title="3. 개인정보의 수집·이용 목적">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>아이디·이메일: 회원 식별, 로그인, 기록 식별</li>
              <li>GPS 이동 기록: 개인화된 소요시간 예측, 3단계 출발 알람 제공</li>
              <li>성별(선택): 걷는 속도 평균 비교(통계적 참고용)에만 사용</li>
              <li>기록 이름(예: &ldquo;집에서 학원 가는길&rdquo;): 같은 경로의 기록을 모아 평균/분석에 활용</li>
            </ul>
          </Section>

          <Section icon={Share2} title="4. 개인정보의 제3자 제공 및 외부 서비스 연동">
            <p>
              수집한 개인정보를 제3자에게 판매하거나 제공하지 않습니다. 다만 서비스 제공을 위해
              아래와 같이 좌표값·텍스트 등 일부 정보가 외부 API로 전달될 수 있습니다.
            </p>
            <Table
              rows={[
                ['네이버 클라우드 플랫폼', '지도 표시, 경로·좌표 변환(Geocode)을 위해 위치 좌표 전달'],
                ['공공데이터포털(경찰청)', '신호등·교차로 정보 조회를 위해 위치 좌표 전달'],
                [
                  'Google Gemini API',
                  '기록 이름(예: "집가는길") 텍스트를 분류·요약하는 데만 사용 — GPS 좌표는 전달하지 않음',
                ],
              ]}
            />
          </Section>

          <Section icon={UserCog} title="5. 개인정보의 보유 및 이용 기간">
            <p>
              회원 탈퇴 시 계정 및 연결된 이동 기록(GPS 포인트, 정지 구간, 분석 결과 포함)을
              지체 없이 삭제합니다. 본 프로젝트는 대회 출품을 목적으로 하므로, 대회 심사가
              종료된 이후에는 별도 고지 없이 전체 데이터가 파기될 수 있습니다.
            </p>
          </Section>

          <Section icon={Trash2} title="6. 이용자의 권리와 행사 방법">
            <p>이용자는 다음 권리를 앱 내에서 직접 행사할 수 있습니다.</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>개별 이동 기록 삭제: &ldquo;기록하기&rdquo; 또는 &ldquo;마이페이지&rdquo;에서 기록을 선택해 삭제</li>
              <li>로그아웃: 마이페이지에서 언제든 가능</li>
              <li>
                계정 전체 삭제(회원 탈퇴) 또는 그 외 문의는 아래 이메일로 요청하면 지체 없이
                처리합니다.
              </li>
            </ul>
          </Section>

          <Section icon={Mail} title="7. 문의처">
            <p>
              개인정보 처리방침 및 서비스 관련 문의는 아래 이메일로 연락해 주세요.
            </p>
            <p className="font-medium text-slate-800">
              개발자: 이도겸 ·{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-600 underline underline-offset-2">
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>
        </div>

        <p className="mt-10 text-center text-xs text-slate-400">
          본 방침은 사전 고지 없이 변경될 수 있으며, 변경 시 이 페이지를 통해 안내합니다.
        </p>
      </div>
    </main>
  );
}
