import "./DroneCard.css";

type DroneCardProps = {
  name: string;
  id: string;
  battery: number;
  accumulatedTime: string;
  recurringFault: string;
  previousFault: string;
  lastCheck: string;
  lastFix: string;
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
      {/* center */}
      <circle cx="50" cy="50" r="7" stroke="white" strokeWidth="4" />

      {/* upper left arm */}
      <path
        d="M46 46L28 28"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="23" cy="23" r="12" stroke="white" strokeWidth="4" />

      {/* upper right arm */}
      <path
        d="M54 46L72 28"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="77" cy="23" r="12" stroke="white" strokeWidth="4" />

      {/* bottom left arm */}
      <path
        d="M46 54L28 72"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="23" cy="77" r="12" stroke="white" strokeWidth="4" />

      {/* bottom right arm */}
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
  battery,
  accumulatedTime,
  recurringFault,
  previousFault,
  lastCheck,
  lastFix,
  status = "נשא",
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

    <div className="usage-row">

    <div className="battery">
        <span>סוללה:</span>
        <strong>{battery}%</strong>
      </div>

      <div className="accumulated-time">
        זמן שימוש מצטבר: {accumulatedTime}
      </div>

    </div>


    <div className="faults">

      {/* LEFT SIDE */}
      <div className="fault-block fault-left">
        <div className="fault-line">
          <span>תקלות קודמות:</span>
          <span>כנף</span>
        </div>

        <div className="fault-line">
          <span>שבור</span>
        </div>

        <div className="fault-date">
          תיקון אחרון: 6.2.23
        </div>
      </div>


      {/* RIGHT SIDE */}
      <div className="fault-block fault-right">
        <div className="fault-line">
          <span>תקלות חוזרות:</span>
          <span>חיישן</span>
        </div>

        <div className="fault-line">
          <span>כנף</span>
        </div>

        <div className="fault-date">
          בדיקה אחרונה: 6.2.23
        </div>
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