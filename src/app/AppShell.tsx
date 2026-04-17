import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { requestJson } from "../lib/http";

export function AppShell() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const session = await requestJson<{ email: string | null }>("/api/session");
        if (!cancelled) {
          setEmail(session.email ?? "");
          setStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">Blog Admin</div>
        <nav className="app-nav">
          <NavLink to="/posts">文章</NavLink>
          <NavLink to="/posts/new">新建</NavLink>
        </nav>
        <div className="session-card">
          <span className="session-label">当前账号</span>
          <strong className="session-value">
            {status === "loading"
              ? "读取中..."
              : status === "error"
                ? "未获取到身份"
                : email || "未登录"}
          </strong>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
