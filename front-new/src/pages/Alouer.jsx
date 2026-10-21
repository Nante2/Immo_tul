import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyList from "@/components/PropertyList";
import { usePageTitle } from "@/hooks/usePageTitle";

function Alouer() {
  usePageTitle("Biens à louer");
  return (
    <>
      <Navbar />
      <PropertyList
        actionType="rent"
        title="Biens à louer"
        description="Trouvez votre location idéale parmi nos appartements, maisons et villas à Toliara"
      />
      <Footer />
    </>
  );
}

export default Alouer;
