import "./DroneCard.css";

type DroneCardProps = {
  name: string;
  id: string;

  droneType: string;
  estimatedAttackQuantity: number | string;
  unitCost: number | string;
  totalCost: number | string;
  simulatedThreatNature: string;
  flightDistance: number | string;
  flightSpeed: number | string;
  estimatedDamage: string;
  intelligenceAssessmentLebanon: string;
  intelligenceAssessmentGaza: string;

  status?: string;
};

function DroneIcon() {
  return (
    <svg
      className="drone-svg"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="7" stroke="white" strokeWidth="4" />

      <path
        d="M46 46L28 28"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="23" cy="23" r="12" stroke="white" strokeWidth="4" />

      <path
        d="M54 46L72 28"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="77" cy="23" r="12" stroke="white" strokeWidth="4" />

      <path
        d="M46 54L28 72"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="23" cy="77" r="12" stroke="white" strokeWidth="4" />

      <path
        d="M54 54L72 72"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="77" cy="77" r="12" stroke="white" strokeWidth="4" />
    </svg>
  );
}


function LocationIcon() {
  return (
    <svg
      className="location-svg"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M32 58C32 58 49 42 49 24C49 14.6 41.4 7 32 7C22.6 7 15 14.6 15 24C15 42 32 58 32 58Z"
        stroke="white"
        strokeWidth="4"
      />

      <circle
        cx="32"
        cy="24"
        r="6"
        stroke="white"
        strokeWidth="4"
      />
    </svg>
  );
}

export default function DroneCard({
  name,
  id,
  droneType,
  estimatedAttackQuantity,
  unitCost,
  totalCost,
  simulatedThreatNature,
  flightDistance,
  flightSpeed,
  estimatedDamage,
  intelligenceAssessmentLebanon,
  intelligenceAssessmentGaza,
  status = "רחפן",
}: DroneCardProps) {
  return (
    <div className="drone-card" dir="rtl">

      {/* BLUE RIBBON */}
      <div className="status-ribbon">
        <span>{status}</span>
      </div>

      {/* HEADER */}
      <div className="drone-header">
        <div className="drone-main-info">
          <DroneIcon />

          <div className="drone-name-wrapper">
            <div className="drone-name">
              {name}
            </div>

            <div className="drone-id">
              {id}
            </div>
          </div>
        </div>
      </div>

      {/* DRONE INFORMATION */}
      <div className="drone-info">

        <div className="info-item">
          <span>סוג רחפן:</span>
          <strong>{droneType}</strong>
        </div>

        <div className="info-item">
          <span>כמות משוערת תקיפה:</span>
          <strong>{estimatedAttackQuantity}</strong>
        </div>

        <div className="info-item">
          <span>עלות יחידה:</span>
          <strong>{unitCost + "₪"}</strong>
        </div>

        <div className="info-item">
          <span>עלות כוללת:</span>
          <strong>{totalCost + "₪"}</strong>
        </div>

        <div className="info-item stacked">
          <span>אופי איום מדומה:</span>
          <strong>{simulatedThreatNature}</strong>
        </div>

        <div className="info-item">
          <span>מרחק טיסה:</span>
          <strong>{flightDistance + "km"}</strong>
        </div>

        <div className="info-item">
          <span>מהירות טיסה:</span>
          <strong>{flightSpeed + "km/h"}</strong>
        </div>

        <div className="info-item">
          <span>נזק משוער:</span>
          <strong>{estimatedDamage + "₪"}</strong>
        </div>

        <div className="info-item intelligence">
          <span>הערכה מודיעינית מלבנון:</span>
          <strong>{intelligenceAssessmentLebanon}</strong>
        </div>

        <div className="info-item intelligence">
          <span>הערכה מודיעינית מעזה:</span>
          <strong>{intelligenceAssessmentGaza}</strong>
        </div>

      </div>

      {/* BOTTOM PATH */}
      <div className="drone-path">

        <div className="path-start" />

        <div className="path-line" />

        <div className="path-drone">
          <DroneIcon />
        </div>

        <div className="path-line" />

        <div className="path-location">
          <LocationIcon />
        </div>

      </div>

    </div>
  );
}
