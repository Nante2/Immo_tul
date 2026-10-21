import { useEffect } from "react";

const SITE_NAME = "ImmoTuléar";

// Met à jour le titre de l'onglet ; sans argument, garde le titre par défaut du site
export const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Agence immobilière à Toliara`;
  }, [title]);
};
