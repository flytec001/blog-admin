import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { requestJson } from "../../lib/http";
import { ApiError } from "../../lib/types";

export function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestJson("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const next = params.get("next") || "/";
      navigate(next, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("密码错误");
      } else {
        setError("登录失败，请稍后重试");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-heading">
          <h1 className="login-title">Blog Admin</h1>
          <p className="login-subtitle">输入管理密码继续</p>
        </div>
        <label className="login-field">
          <span>管理密码</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            required
          />
        </label>
        {error ? <p className="login-error">{error}</p> : null}
        <button type="submit" className="login-submit" disabled={submitting}>
          {submitting ? "登录中..." : "登录"}
        </button>
      </form>
    </div>
  );
}
