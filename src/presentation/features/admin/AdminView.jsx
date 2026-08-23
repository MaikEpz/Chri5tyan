import { Suspense, useState } from "react";
import { lazyNamed } from "../../lazyNamed.js";
import { Tabs } from "../../components/layout/Tabs.jsx";
import { LoadingSkeletons } from "../../components/ui/LoadingSkeletons.jsx";

const AdminEquipmentView = lazyNamed(() => import("./AdminEquipmentView.jsx"), "AdminEquipmentView");
const AdminModerationView = lazyNamed(() => import("./AdminModerationView.jsx"), "AdminModerationView");
const AdminPortfolioView = lazyNamed(() => import("./AdminPortfolioView.jsx"), "AdminPortfolioView");
const AdminCastingCatalogsView = lazyNamed(() => import("./AdminCastingCatalogsView.jsx"), "AdminCastingCatalogsView");

const ADMIN_TABS = Object.freeze([
  ["casting", "Casting"],
  ["location", "Locaciones"],
  ["equipment", "Equipos"],
  ["portfolio", "Portafolio"],
  ["casting-catalogs", "Catálogos"],
]);

export function AdminView({ catalogService }) {
  const [section, setSection] = useState("casting");

  return (
    <div className="admin-workspace">
      <div className="admin-section-navigation">
        <Tabs
          label="Área administrativa"
          value={section}
          onChange={setSection}
          items={ADMIN_TABS}
        />
      </div>
      <Suspense fallback={<AdminSectionFallback />}>
        {(section === "casting" || section === "location") && (
          <AdminModerationView
            key={section}
            catalogService={catalogService}
            initialResource={section}
            hideResourceTabs
          />
        )}
        {section === "equipment" && (
          <AdminEquipmentView catalogService={catalogService} />
        )}
        {section === "portfolio" && (
          <AdminPortfolioView catalogService={catalogService} />
        )}
        {section === "casting-catalogs" && (
          <AdminCastingCatalogsView catalogService={catalogService} />
        )}
      </Suspense>
    </div>
  );
}

function AdminSectionFallback() {
  return (
    <div className="workspace-view">
      <LoadingSkeletons count={3} label="Cargando administración" variant="admin" />
    </div>
  );
}
