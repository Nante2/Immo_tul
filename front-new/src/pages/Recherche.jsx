import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyList from "@/components/PropertyList";
import { useSearchParams } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";

function Recherche() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  usePageTitle(search ? `Recherche : ${search}` : "Recherche");

  return (
    <>
      <Navbar />
      <PropertyList
        title={search ? `Résultats pour « ${search} »` : "Tous nos biens"}
        description="Voici les biens correspondants à votre recherche."
      />
      <Footer />
    </>
  );
}

export default Recherche;
