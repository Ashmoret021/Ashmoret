import DroneCard from "./DroneCard/DroneCard";
import InterceptorCard from "./InterceptorCard/InterceptorCard";

export default function Cards() {
  return (
    <div
      style={{
        width: "700px",
        height: "300px",
        padding: 40,
        background: "#ffffff",
      }}
    >
      <DroneCard 
        name="SkyMite-C7"
        id="5555555"
        droneType="רחפן מסחרי קל"
        estimatedAttackQuantity={1200}
        unitCost={2500}
        totalCost={3000000}
        simulatedThreatNature="הצפה כמותית, חתימה נמוכה, מתאים לשחיקת קשב וגלאים."
        flightDistance={15}
        flightSpeed={60}
        estimatedDamage="350000"
        intelligenceAssessmentLebanon="800"
        intelligenceAssessmentGaza="400"/>
      <InterceptorCard
      id="222222"
      simulatedSystemName="ShieldNest-Lite"
      systemQuantity={8}
      simulatedInterceptorName="BuzzStop-15"
      interceptorsPerSystem={24}
      totalInterceptors={192}
      interceptorCost={15000}
      estimatedInterceptionSuccessRate="72% מול SkyMite-C7; 38% מול NanoSwarm-Q9"
      operationalRange={10}
      />
    </div>
  );
}

