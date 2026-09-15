'use client';

import { useCallback, useEffect, useState } from 'react';
import { ImagePlus, LogOut, RefreshCw, Trash2, Upload } from 'lucide-react';

const API_BASE_URL = 'https://directions-api.codingfit.kr';
const TOKEN_STORAGE_KEY = 'admin_token';

type Category = {
  id: number;
  name: string;
  created_at: string;
};

// 배포 도메인 앞단(Cloudflare 등 edge)이 OPTIONS 프리플라이트를 자체적으로 가로채
// 응답하는데, 그 응답의 Access-Control-Allow-Headers가 `Content-Type,Authorization`
// 으로 고정돼 있다. 커스텀 헤더(X-Admin-Token)는 이 목록에 없어서 브라우저가
// 프리플라이트 단계에서 요청 자체를 막아버린다 — 그래서 이미 허용된 Authorization
// 헤더에 토큰을 실어 보낸다(서버 app/auth.py의 require_admin이 Authorization: Bearer
// 형태도 받아준다).
function adminHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [checking, setChecking] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');

  const [newName, setNewName] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(TOKEN_STORAGE_KEY);
      if (saved) setToken(saved);
    } catch {
      // localStorage 접근 불가(프라이빗 모드 등) — 매번 다시 입력하게 둔다.
    }
  }, []);

  const loadCategories = useCallback(async (activeToken: string) => {
    setLoading(true);
    setListError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories`, {
        headers: adminHeaders(activeToken),
      });
      if (res.status === 403 || res.status === 503) {
        throw new Error('관리자 토큰이 올바르지 않습니다.');
      }
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data: Category[] = await res.json();
      setCategories(data);

      const entries = await Promise.all(
        data.map(async (c) => {
          try {
            const imgRes = await fetch(`${API_BASE_URL}/admin/categories/${c.id}/image`, {
              headers: adminHeaders(activeToken),
            });
            if (!imgRes.ok) return [c.id, ''] as const;
            const blob = await imgRes.blob();
            return [c.id, URL.createObjectURL(blob)] as const;
          } catch {
            return [c.id, ''] as const;
          }
        }),
      );
      setImages(Object.fromEntries(entries));
    } catch (err) {
      setListError(err instanceof Error ? err.message : '분류를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) loadCategories(token);
  }, [token, loadCategories]);

  const submitToken = async () => {
    const value = tokenInput.trim();
    if (!value) {
      setTokenError('토큰을 입력하세요.');
      return;
    }
    setChecking(true);
    setTokenError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories`, {
        headers: adminHeaders(value),
      });
      if (!res.ok) throw new Error('토큰이 올바르지 않습니다.');
      window.localStorage.setItem(TOKEN_STORAGE_KEY, value);
      setToken(value);
    } catch (err) {
      setTokenError(err instanceof Error ? err.message : '확인 실패');
    } finally {
      setChecking(false);
    }
  };

  const logout = () => {
    try {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
    setToken(null);
    setCategories([]);
    setImages({});
  };

  const createCategory = async () => {
    if (!token) return;
    const name = newName.trim();
    if (!name) {
      setCreateError('분류 이름을 입력하세요.');
      return;
    }
    if (!newFile) {
      setCreateError('대표 이미지를 선택하세요.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('image', newFile);
      const res = await fetch(`${API_BASE_URL}/admin/categories`, {
        method: 'POST',
        headers: adminHeaders(token),
        body: form,
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.detail || `status ${res.status}`);
      }
      setNewName('');
      setNewFile(null);
      await loadCategories(token);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : '분류 추가에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!token) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: 'DELETE',
        headers: adminHeaders(token),
      });
      if (!res.ok && res.status !== 404) throw new Error(`status ${res.status}`);
      await loadCategories(token);
    } catch (err) {
      setListError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <Card className="w-full max-w-sm">
          <h1 className="mb-1 text-lg font-bold text-slate-900">관리자 로그인</h1>
          <p className="mb-4 text-sm text-slate-500">
            여정 이름 분류(썸네일) 관리 페이지입니다. 서버의 ADMIN_API_TOKEN을 입력하세요.
          </p>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitToken()}
            placeholder="관리자 토큰"
            className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
          {tokenError && <p className="mb-2 text-xs text-rose-600">{tokenError}</p>}
          <button
            onClick={submitToken}
            disabled={checking}
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {checking ? '확인 중…' : '입장하기'}
          </button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">여정 분류 관리</h1>
            <p className="mt-1 text-sm text-slate-500">
              &ldquo;기록하기&rdquo;로 새 이름이 들어오면, Gemini가 여기 등록된 분류 중 가장 비슷한 것으로
              자동 분류하고 그 대표 이미지를 썸네일로 씁니다.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => loadCategories(token)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> 새로고침
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="h-3.5 w-3.5" /> 나가기
            </button>
          </div>
        </div>

        <Card className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
            <ImagePlus className="h-4 w-4" /> 새 분류 추가
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="분류 이름 (예: 등교길, 출근길, 산책)"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100">
              <Upload className="h-4 w-4" />
              {newFile ? newFile.name : '이미지 선택'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <button
              onClick={createCategory}
              disabled={creating}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {creating ? '추가 중…' : '추가'}
            </button>
          </div>
          {createError && <p className="mt-2 text-xs text-rose-600">{createError}</p>}
        </Card>

        {listError && (
          <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{listError}</p>
        )}

        {loading ? (
          <p className="text-sm text-slate-400">불러오는 중…</p>
        ) : categories.length === 0 ? (
          <Card className="text-center text-sm text-slate-400">아직 등록된 분류가 없습니다.</Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {categories.map((c) => (
              <Card key={c.id} className="flex flex-col">
                <div className="mb-3 aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
                  {images[c.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={images[c.id]} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      이미지 없음
                    </div>
                  )}
                </div>
                <div className="mb-3 flex-1">
                  <h3 className="font-bold text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-400">
                    {new Date(c.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <button
                  onClick={() => deleteCategory(c.id)}
                  disabled={deletingId === c.id}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" /> 삭제
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
