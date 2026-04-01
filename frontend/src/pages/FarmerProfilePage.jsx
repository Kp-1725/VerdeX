import { useEffect, useMemo, useState } from "react";
import MobileContainer from "../components/MobileContainer";
import LargeButton from "../components/LargeButton";
import MessageBar from "../components/MessageBar";
import { updateMyFarmerProfile } from "../utils/api";
import { toFriendlyError } from "../utils/blockchain";
import { useAuth } from "../hooks/useAuth";

const FIELD_LIMITS = {
  farmName: 80,
  location: 120,
  acreage: 8,
  preferredContact: 40,
  primaryCrops: 180,
  farmingMethod: 80,
  certifications: 180,
  phone: 20,
  bio: 600,
};

function FarmerProfilePage() {
  const { user } = useAuth();

  const initialProfile = useMemo(
    () => ({
      farmName: user?.farmerProfile?.farmName || "",
      location: user?.farmerProfile?.location || "",
      acreage:
        user?.farmerProfile?.acreage === null ||
        user?.farmerProfile?.acreage === undefined
          ? ""
          : String(user.farmerProfile.acreage),
      primaryCrops: (user?.farmerProfile?.primaryCrops || []).join(", "),
      farmingMethod: user?.farmerProfile?.farmingMethod || "",
      certifications: (user?.farmerProfile?.certifications || []).join(", "),
      phone: user?.farmerProfile?.phone || "",
      preferredContact: user?.farmerProfile?.preferredContact || "",
      bio: user?.farmerProfile?.bio || "",
    }),
    [user?.farmerProfile],
  );

  const [form, setForm] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(initialProfile);
  }, [initialProfile]);

  function limit(field, value) {
    const max = FIELD_LIMITS[field];
    if (!max || typeof value !== "string") {
      return value;
    }

    return value.slice(0, max);
  }

  function onChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: limit(field, value) }));
  }

  async function onSave() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await updateMyFarmerProfile({
        profile: {
          farmName: form.farmName,
          location: form.location,
          acreage: form.acreage === "" ? null : Number(form.acreage),
          primaryCrops: form.primaryCrops,
          farmingMethod: form.farmingMethod,
          certifications: form.certifications,
          phone: form.phone,
          preferredContact: form.preferredContact,
          bio: form.bio,
        },
      });

      setMessage("Farmer profile saved ✅");
    } catch (err) {
      setError(toFriendlyError(err, "Could not save profile."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileContainer
      title="My Farm Profile"
      subtitle="Show farm details to retailers"
      showNav
      showBack
      backTo="/home"
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#375138]">
            Farm Name
          </label>
          <input
            value={form.farmName}
            onChange={(e) => onChange("farmName", e.target.value)}
            maxLength={FIELD_LIMITS.farmName}
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-3 text-base outline-none focus:border-[#2f7d35]"
            placeholder="Green Valley Farm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#375138]">
            Location
          </label>
          <input
            value={form.location}
            onChange={(e) => onChange("location", e.target.value)}
            maxLength={FIELD_LIMITS.location}
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-3 text-base outline-none focus:border-[#2f7d35]"
            placeholder="Village, District"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#375138]">
              Acres
            </label>
            <input
              value={form.acreage}
              onChange={(e) => {
                const sanitized = e.target.value
                  .replace(/[^0-9.]/g, "")
                  .replace(/(\..*)\./g, "$1");
                onChange("acreage", sanitized);
              }}
              inputMode="decimal"
              maxLength={FIELD_LIMITS.acreage}
              className="w-full rounded-2xl border border-[#cddab5] px-4 py-3 text-base outline-none focus:border-[#2f7d35]"
              placeholder="12"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#375138]">
              Preferred Contact
            </label>
            <input
              value={form.preferredContact}
              onChange={(e) => onChange("preferredContact", e.target.value)}
              maxLength={FIELD_LIMITS.preferredContact}
              className="w-full rounded-2xl border border-[#cddab5] px-4 py-3 text-base outline-none focus:border-[#2f7d35]"
              placeholder="Phone / Chat"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#375138]">
            Primary Crops
          </label>
          <input
            value={form.primaryCrops}
            onChange={(e) => onChange("primaryCrops", e.target.value)}
            maxLength={FIELD_LIMITS.primaryCrops}
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-3 text-base outline-none focus:border-[#2f7d35]"
            placeholder="Rice, Wheat, Tomato"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#375138]">
            Farming Method
          </label>
          <input
            value={form.farmingMethod}
            onChange={(e) => onChange("farmingMethod", e.target.value)}
            maxLength={FIELD_LIMITS.farmingMethod}
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-3 text-base outline-none focus:border-[#2f7d35]"
            placeholder="Organic / Natural / Conventional"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#375138]">
            Certifications
          </label>
          <input
            value={form.certifications}
            onChange={(e) => onChange("certifications", e.target.value)}
            maxLength={FIELD_LIMITS.certifications}
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-3 text-base outline-none focus:border-[#2f7d35]"
            placeholder="Organic India, FSSAI"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#375138]">
            Phone
          </label>
          <input
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            maxLength={FIELD_LIMITS.phone}
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-3 text-base outline-none focus:border-[#2f7d35]"
            placeholder="Contact number"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#375138]">
            About Farm
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => onChange("bio", e.target.value)}
            maxLength={FIELD_LIMITS.bio}
            rows={4}
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-3 text-base outline-none focus:border-[#2f7d35]"
            placeholder="Tell retailers about your farm quality and strengths"
          />
        </div>

        <LargeButton
          icon="💾"
          text={loading ? "Saving..." : "Save Profile"}
          onClick={onSave}
          disabled={loading}
        />

        <MessageBar message={message} type="success" />
        <MessageBar message={error} type="error" />
      </div>
    </MobileContainer>
  );
}

export default FarmerProfilePage;
