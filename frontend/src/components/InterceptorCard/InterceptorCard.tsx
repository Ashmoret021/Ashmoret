import "./InterceptorCard.css";
import { GiMissileLauncher } from "react-icons/gi";

type InterceptorCardProps = {
  id: string;

  simulatedSystemName: string;
  systemQuantity: number | string;
  simulatedInterceptorName: string;
  interceptorsPerSystem: number | string;
  totalInterceptors: number | string;
  interceptorCost: number | string;
  estimatedInterceptionSuccessRate: number | string;
  operationalRange: number | string;

  status?: string;
};

function InterceptorIcon() {
  return <GiMissileLauncher className="interceptor-svg" />;
}

export default function InterceptorCard({
  id,
  simulatedSystemName,
  systemQuantity,
  simulatedInterceptorName,
  interceptorsPerSystem,
  totalInterceptors,
  interceptorCost,
  estimatedInterceptionSuccessRate,
  operationalRange,
  status = "מיירט",
}: InterceptorCardProps) {
  return (
    <div className="interceptor-card" dir="rtl">

      {/* BLUE RIBBON */}
      <div className="status-ribbon">
        <span>{status}</span>
      </div>

      {/* HEADER */}
      <div className="interceptor-header">
        <div className="interceptor-main-info">
          <InterceptorIcon />

          <div className="interceptor-name-wrapper">
            <div className="interceptor-name">
              {simulatedSystemName}
            </div>

            <div className="interceptor-id">
              {id}
            </div>
          </div>
        </div>
      </div>

      {/* INTERCEPTOR INFORMATION */}
      <div className="interceptor-info">

        {/* <div className="info-item">
          <span>שם מערכת מסחרי מדומה:</span>
          <strong>{simulatedSystemName}</strong>
        </div> */}

        <div className="info-item">
          <span>כמות מערכות:</span>
          <strong>{systemQuantity}</strong>
        </div>

        <div className="info-item stacked">
          <span>שם מיירט מסחרי מדומה:</span>
          <strong>{simulatedInterceptorName}</strong>
        </div>

        <div className="info-item">
          <span>מיירטים לכל מערכת:</span>
          <strong>{interceptorsPerSystem}</strong>
        </div>

        <div className="info-item">
          <span>סה״כ מיירטים:</span>
          <strong>{totalInterceptors}</strong>
        </div>

        <div className="info-item">
          <span>עלות מיירט:</span>
          <strong>{interceptorCost + "₪"}</strong>
        </div>

        <div className="info-item stacked">
          <span>אחוז הצלחת יירוט משוער:</span>
          <strong>{estimatedInterceptionSuccessRate}</strong>
        </div>

        <div className="info-item">
          <span>טווח פעילות:</span>
          <strong>{operationalRange}</strong>
        </div>

      </div>

    </div>
  );
}
