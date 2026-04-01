import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MobileContainer from "../components/MobileContainer";
import LargeButton from "../components/LargeButton";
import MessageBar from "../components/MessageBar";
import { registerUser } from "../utils/api";
import { toFriendlyError } from "../utils/blockchain";
import { useAuth } from "../hooks/useAuth";
import { ROLES } from "../utils/constants";
import { useLanguage } from "../hooks/LanguageContext";

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { tr } = useLanguage();

  const [form, setForm] = useState({
    name: "",
    role: ROLES.FARMER,
    identifier: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const data = await registerUser(form);
      login({ token: data.token, user: data.user });
      setMessage(tr("Registration successful ✅"));
      navigate("/home");
    } catch (err) {
      setError(
        toFriendlyError(err, tr("Could not register. Please try again.")),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileContainer
      title="Create Account"
      subtitle="Quick setup for farmer or retailer"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#375138]">
            {tr("Name")}
          </label>
          <input
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            autoComplete="name"
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-4 text-lg outline-none focus:border-[#2f7d35]"
            placeholder={tr("Enter name")}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#375138]">
            {tr("Role")}
          </label>
          <select
            value={form.role}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, role: e.target.value }))
            }
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-4 text-lg outline-none focus:border-[#2f7d35]"
          >
            <option value={ROLES.FARMER}>{tr("Farmer")}</option>
            <option value={ROLES.RETAILER}>{tr("Retailer")}</option>
          </select>
        </div>

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
            autoComplete="new-password"
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-4 text-lg outline-none focus:border-[#2f7d35]"
            placeholder={tr("Create password")}
            required
          />
        </div>

        <LargeButton
          text={loading ? tr("Please wait...") : tr("Register")}
          icon="📝"
          type="submit"
          disabled={loading}
        />
      </form>

      <MessageBar message={message} type="success" />
      <MessageBar message={error} type="error" />

      <p className="text-sm text-[#48604a]">
        {tr("Already have an account?")}{" "}
        <Link className="font-bold text-[#1f5d2f]" to="/login">
          {tr("Login")}
        </Link>
      </p>
    </MobileContainer>
  );
}

export default RegisterPage;
