import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDeviceType } from "../hooks/useDeviceType";

function navClass(isDesktop) {
  return ({ isActive }) =>
    `flex flex-col items-center justify-center rounded-2xl px-3 py-2 text-xs font-semibold transition ${
      isDesktop ? "flex-row gap-2 px-4 py-2 text-sm" : ""
    } ${isActive ? "bg-[#d6f2c9] text-[#1f5d2f]" : "text-[#4d6047]"}`;
}

function BottomNav() {
  const { user } = useAuth();
  const { isDesktop } = useDeviceType();

  const wrapperClass = isDesktop
    ? "border-t border-[#dfe7c6] bg-[#f7fbe8] px-6 py-3"
    : "border-t border-[#dfe7c6] bg-[#f7fbe8] px-4 py-2";

  const listClass = isDesktop
    ? "flex items-center gap-3"
    : "grid grid-cols-3 gap-2";

  const iconClass = isDesktop ? "text-base" : "text-xl";

  return (
    <nav className={wrapperClass}>
      <ul className={listClass}>
        <li>
          <NavLink to="/home" className={navClass(isDesktop)}>
            <span className={iconClass}>🏠</span>
            Home
          </NavLink>
        </li>

        <li>
          {user?.role === "Farmer" ? (
            <NavLink to="/add-product" className={navClass(isDesktop)}>
              <span className={iconClass}>➕</span>
              Add
            </NavLink>
          ) : (
            <div
              className={`flex h-full flex-col items-center justify-center rounded-2xl px-3 py-2 text-xs text-[#9bad90] ${
                isDesktop ? "flex-row gap-2 px-4 text-sm" : ""
              }`}
            >
              <span className={iconClass}>🧺</span>
              Menu
            </div>
          )}
        </li>

        <li>
          <NavLink to="/track" className={navClass(isDesktop)}>
            <span className={iconClass}>🔍</span>
            Track
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default BottomNav;
