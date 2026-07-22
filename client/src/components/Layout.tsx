import { Heart, LogOut, Menu, Plus, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2 text-sm font-medium transition ${
    isActive ? "bg-sage-50 text-sage-700" : "text-ink-700 hover:bg-white/70 hover:text-ink-900"
  }`;

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    setOpen(false);
    navigate("/");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-cream-50/85 backdrop-blur-xl">
        <div className="page-shell flex min-h-16 items-center justify-between gap-4 py-2">
          <Link to="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
            <span className="grid size-10 place-items-center rounded-full bg-sage-600 text-white shadow-sm transition group-hover:rotate-6">
              <Heart size={18} fill="currentColor" />
            </span>
            <span>
              <span className="block font-display text-xl font-semibold leading-none text-ink-900">Excel & Min</span>
              <span className="mt-1 block text-[11px] tracking-[0.16em] text-ink-700">SECOND LIFE MARKET</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" className={navClass}>物品牆</NavLink>
            {user && <NavLink to="/me" className={navClass}>我的收藏</NavLink>}
            {user?.role === "admin" && <NavLink to="/admin" className={navClass}>管理後台</NavLink>}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <span className="px-2 text-sm text-ink-700">嗨，{user.nickname}</span>
                <Link to="/posts/new" className="btn-primary"><Plus size={17} />發布物品</Link>
                <button type="button" className="btn-secondary !px-3" onClick={handleLogout} aria-label="登出">
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">登入</Link>
                <Link to="/register" className="btn-primary">加入需求牆</Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="grid size-11 place-items-center rounded-full bg-white md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "關閉選單" : "開啟選單"}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {open && (
          <div className="page-shell pb-4 md:hidden">
            <nav className="card flex flex-col gap-1 p-3">
              <NavLink to="/" className={navClass} onClick={() => setOpen(false)}>物品牆</NavLink>
              {user && <NavLink to="/me" className={navClass} onClick={() => setOpen(false)}>我的收藏</NavLink>}
              {user?.role === "admin" && <NavLink to="/admin" className={navClass} onClick={() => setOpen(false)}>管理後台</NavLink>}
              <div className="my-2 h-px bg-cream-200" />
              {user ? (
                <>
                  <Link to="/posts/new" className="btn-primary" onClick={() => setOpen(false)}><Plus size={17} />發布物品</Link>
                  <button type="button" className="btn-secondary" onClick={handleLogout}><LogOut size={17} />登出</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary" onClick={() => setOpen(false)}><UserRound size={17} />登入</Link>
                  <Link to="/register" className="btn-primary" onClick={() => setOpen(false)}>加入需求牆</Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <main><Outlet /></main>

      <footer className="mt-20 border-t border-white/70 py-10">
        <div className="page-shell text-center text-sm text-ink-700">
          <p className="font-display text-2xl text-ink-900">Excel & Min</p>
          <p className="mt-2">讓好物在婚禮這天，遇見下一個喜歡它的人。</p>
          <p className="mt-4 text-xs">「我想要」是需求表達，不代表正式交易承諾。</p>
        </div>
      </footer>
    </div>
  );
}
