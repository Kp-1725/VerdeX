import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDeviceType } from "../hooks/useDeviceType";
import { fetchShelfProducts } from "../utils/api";
import { toFriendlyError } from "../utils/blockchain";

function navClass(isDesktop) {
  return ({ isActive }) =>
    `flex flex-col items-center justify-center rounded-2xl px-3 py-2 text-xs font-semibold transition ${
      isDesktop ? "flex-row gap-2 px-4 py-2 text-sm" : ""
    } ${isActive ? "bg-[#d6f2c9] text-[#1f5d2f]" : "text-[#4d6047]"}`;
}

function BottomNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDesktop } = useDeviceType();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shelfProducts, setShelfProducts] = useState([]);
  const [loadingShelf, setLoadingShelf] = useState(false);
  const [shelfError, setShelfError] = useState("");

  const wrapperClass = isDesktop
    ? "border-t border-[#dfe7c6] bg-[#f7fbe8] px-6 py-3"
    : "border-t border-[#dfe7c6] bg-[#f7fbe8] px-4 py-2";

  const listClass = isDesktop
    ? "flex items-center gap-3"
    : "grid grid-cols-3 gap-2";

  const iconClass = isDesktop ? "text-base" : "text-xl";

  function closeMenu() {
    setIsMenuOpen(false);
  }

  async function openMenu() {
    setIsMenuOpen(true);

    if (user?.role !== "Retailer") {
      return;
    }

    setLoadingShelf(true);
    setShelfError("");

    try {
      const response = await fetchShelfProducts();
      setShelfProducts(response?.products || []);
    } catch (error) {
      setShelfError(
        toFriendlyError(error, "Could not load shelf products right now."),
      );
    } finally {
      setLoadingShelf(false);
    }
  }

  function goTo(path) {
    closeMenu();
    navigate(path);
  }

  function onLogout() {
    closeMenu();
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
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
              <button
                type="button"
                onClick={() => {
                  if (isMenuOpen) {
                    closeMenu();
                    return;
                  }

                  openMenu();
                }}
                className={`flex h-full w-full flex-col items-center justify-center rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                  isDesktop ? "flex-row gap-2 px-4 py-2 text-sm" : ""
                } ${
                  isMenuOpen ? "bg-[#d6f2c9] text-[#1f5d2f]" : "text-[#4d6047]"
                }`}
                aria-expanded={isMenuOpen}
                aria-label="Open menu"
              >
                <span className={iconClass}>🧺</span>
                Menu
              </button>
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

      {isMenuOpen ? (
        <div
          className="fixed inset-0 z-[80] bg-black/25"
          onClick={closeMenu}
          role="presentation"
        >
          <div
            className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[760px] rounded-t-3xl border border-[#c8d8b2] bg-[#f8fced] p-4 shadow-[0_-10px_35px_rgba(53,76,47,0.2)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Quick menu"
          >
            <p className="mb-3 text-sm font-bold text-[#2f4a33]">Quick Menu</p>

            {user?.role === "Retailer" ? (
              <div className="mb-3 rounded-xl border border-[#d2e1bc] bg-[#f4fae8] p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-[#496346]">
                  Shelf Products
                </p>

                {loadingShelf ? (
                  <p className="mt-2 text-sm text-[#5c7457]">
                    Loading your shelf...
                  </p>
                ) : null}

                {!loadingShelf && shelfError ? (
                  <p className="mt-2 rounded-lg border border-[#efb6a8] bg-[#ffece6] px-2 py-2 text-xs font-semibold text-[#8d3a2c]">
                    {shelfError}
                  </p>
                ) : null}

                {!loadingShelf && !shelfError && shelfProducts.length === 0 ? (
                  <p className="mt-2 text-sm text-[#5c7457]">
                    No priced products on your shelf yet.
                  </p>
                ) : null}

                {!loadingShelf && !shelfError && shelfProducts.length > 0 ? (
                  <div className="mt-2 max-h-44 space-y-2 overflow-auto pr-1">
                    {shelfProducts.map((item) => (
                      <button
                        key={item.productId}
                        type="button"
                        onClick={() => goTo(`/product/${item.productId}`)}
                        className="w-full rounded-lg border border-[#cfe0b8] bg-white px-3 py-2 text-left"
                      >
                        <p className="text-sm font-bold text-[#2d4d33]">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#5d7459]">
                          ID: {item.productId} | Retail:{" "}
                          {item.pricingCurrency || "INR"}{" "}
                          {Number(item.retailPrice || 0).toFixed(2)}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => goTo("/update-status")}
                className="rounded-xl border border-[#cde0b6] bg-white px-3 py-3 text-sm font-bold text-[#2b5232]"
              >
                🔄 Update Status
              </button>
              <button
                type="button"
                onClick={() => goTo("/track")}
                className="rounded-xl border border-[#cde0b6] bg-white px-3 py-3 text-sm font-bold text-[#2b5232]"
              >
                🔍 Track Product
              </button>
              <button
                type="button"
                onClick={() => goTo("/metrics")}
                className="rounded-xl border border-[#cde0b6] bg-white px-3 py-3 text-sm font-bold text-[#2b5232]"
              >
                📊 Metrics
              </button>
              <button
                type="button"
                onClick={() => goTo("/home")}
                className="rounded-xl border border-[#cde0b6] bg-white px-3 py-3 text-sm font-bold text-[#2b5232]"
              >
                🏠 Home
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-xl border border-[#f0b5a6] bg-[#fff1ea] px-3 py-3 text-sm font-bold text-[#843f28]"
              >
                🚪 Logout
              </button>
            </div>

            <button
              type="button"
              onClick={closeMenu}
              className="mt-3 w-full rounded-xl bg-[#e9f4d8] px-4 py-2 text-sm font-bold text-[#2b5232]"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default BottomNav;
