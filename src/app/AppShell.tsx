import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { requestJson } from "../lib/http";

export function AppShell() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const session = await requestJson<{ authenticated: boolean }>("/api/session");
        if (!cancelled) setAuthenticated(session.authenticated);
      } catch {
        if (!cancelled) setAuthenticated(false);
      }
    }

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  async function onLogout() {
    try {
      await requestJson("/api/auth/logout", { method: "POST" });
    } finally {
      navigate("/login", { replace: true });
    }
  }

  if (authenticated === null) {
    return <div className="app-loading">读取中...</div>;
  }

  if (authenticated === false) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <NavigateReplace to={`/login?next=${next}`} />;
  }

  return (
    <div className="app-shell">
      <header className="mobile-topbar">
        <button
          type="button"
          className="menu-toggle"
          aria-label="打开菜单"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          ☰
        </button>
        <span className="brand">Blog Admin</span>
      </header>

      {menuOpen ? (
        <div
          className="sidebar-backdrop"
          role="presentation"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside className={menuOpen ? "app-sidebar open" : "app-sidebar"}>
        <div className="app-sidebar-header">
          <div className="app-brand">Blog Admin</div>
          <div className="app-brand-hint">编辑工作台</div>
        </div>
        <nav className="app-nav">
          <NavLink to="/posts">文章</NavLink>
          <NavLink to="/posts/new">新建</NavLink>
          <NavLink to="/media">图床</NavLink>
        </nav>
        <button type="button" className="app-logout" onClick={onLogout}>
          退出登录
        </button>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

function NavigateReplace({ to }: { to: string }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);
  return null;
}
