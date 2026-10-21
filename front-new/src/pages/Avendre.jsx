import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyList from "@/components/PropertyList";
import { usePageTitle } from "@/hooks/usePageTitle";

function Avendre() {
  usePageTitle("Biens à vendre");
  return (
    <>
      <Navbar />
      <PropertyList
        actionType="sale"
        title="Biens à vendre"
        description="Découvrez notre sélection de maisons, villas et terrains à vendre à Toliara et ses environs"
      />
      <Footer />
    </>
  );
}

export default Avendre;
