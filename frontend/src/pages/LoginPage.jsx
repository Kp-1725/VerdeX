import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MobileContainer from "../components/MobileContainer";
import LargeButton from "../components/LargeButton";
import MessageBar from "../components/MessageBar";
import { loginUser } from "../utils/api";
import { toFriendlyError } from "../utils/blockchain";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/LanguageContext";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { tr } = useLanguage();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(form);
      login({ token: data.token, user: data.user });
      setMessage(tr("Login successful ✅"));
      navigate("/home");
    } catch (err) {
      setError(toFriendlyError(err, tr("Could not login. Please try again.")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileContainer
      title="Welcome"
      subtitle="Login to add and update product journey"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#375138]">
            {tr("Phone or Email")}
          </label>
          <input
            value={form.identifier}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, identifier: e.target.value }))
            }
            autoComplete="username"
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-4 text-lg outline-none focus:border-[#2f7d35]"
            placeholder={tr("Enter phone or email")}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#375138]">
            {tr("Password")}
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
            autoComplete="current-password"
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-4 text-lg outline-none focus:border-[#2f7d35]"
            placeholder={tr("Enter password")}
            required
          />
        </div>

        <LargeButton
          text={loading ? tr("Please wait...") : tr("Login")}
          icon="🔐"
          type="submit"
          disabled={loading}
        />
      </form>

      <MessageBar message={message} type="success" />
      <MessageBar message={error} type="error" />

      <div className="space-y-2 text-sm text-[#48604a]">
        <p>
          {tr("New here?")}{" "}
          <Link className="font-bold text-[#1f5d2f]" to="/register">
            {tr("Register")}
          </Link>
        </p>
        <p>
          {tr("Consumer view:")}{" "}
          <Link className="font-bold text-[#1f5d2f]" to="/product/1">
            {tr("Open a product page")}
          </Link>
        </p>
      </div>
    </MobileContainer>
  );
}

export default LoginPage;
