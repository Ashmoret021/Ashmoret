import React, { useState } from "react";

type DefenseDetails = {
  id: number;
  attackName: string;
  description: string;
  interceptors: string;
  border: string;
  interceptionType: string;
};

const borders = ["עזה", "לבנון"];

const interceptionTypes = [
  "יירוט אווירי",
  "יירוט בליסטי",
  "יירוט טילי שיוט",
  "יירוט רחפנים",
];

const createEmptyDefense = (): DefenseDetails => ({
  id: Date.now() + Math.random(),
  attackName: "",
  description: "",
  interceptors: "",
  border: "",
  interceptionType: "",
});

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "42px",
  padding: "0 13px",
  borderRadius: "8px",
  border: "1px solid #d5dce7",
  background: "#fff",
  color: "#172033",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  direction: "rtl",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  height: "86px",
  padding: "11px 13px",
  resize: "vertical",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "7px",
  color: "#263449",
  fontSize: "13px",
  fontWeight: 600,
  direction: "rtl",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

export interface DefenseSideProps {
  initialOpen?: boolean;
}

export const DefenseSide: React.FC<DefenseSideProps> = ({
  initialOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [defenseDetails, setDefenseDetails] = useState<DefenseDetails[]>([
    createEmptyDefense(),
  ]);

  const updateDefenseDetails = (
    id: number,
    field: keyof Omit<DefenseDetails, "id">,
    value: string
  ) => {
    setDefenseDetails((prev) =>
      prev.map((detail) =>
        detail.id === id
          ? {
            ...detail,
            [field]: value,
          }
          : detail
      )
    );
  };

  const handleAddDefenseDetails = () => {
    setDefenseDetails((prev) => [...prev, createEmptyDefense()]);
  };

  const removeDefenseDetails = (id: number) => {
    setDefenseDetails((prev) =>
      prev.length > 1
        ? prev.filter((detail) => detail.id !== id)
        : prev
    );
  };

  const handleSave = () => {
    console.log("Defense side:", {
      defenseDetails,
    });
  };

  const handleCancel = () => {
    setDefenseDetails([createEmptyDefense()]);
    setIsOpen(false);
  };

  return (
    <>
      <style>{`
        @keyframes defenseSideSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .defense-side-open-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(16, 42, 86, 0.35) !important;
        }
        .defense-side-open-btn:active {
          transform: translateY(0);
        }
        .defense-side-close-btn:hover {
          background: rgba(255, 255, 255, 0.22) !important;
        }
      `}</style>

      {/* Button to open DefenseSide */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="defense-side-open-btn"
          aria-label="פתח צד הגנה"
          title="פתח צד הגנה"
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 20px",
            background:
              "linear-gradient(135deg, #102a56 0%, #174b91 100%)",
            color: "#fff",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(16, 42, 86, 0.25)",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: 700,
            fontFamily: "Arial, Helvetica, sans-serif",
            direction: "rtl",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              background: "rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            🛡
          </div>
          <span>יצירת צד ההגנה</span>
        </button>
      )}

      {/* Defense Side Panel */}
      {isOpen && (
        <div
          dir="rtl"
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            bottom: "24px",
            width: "460px",
            maxWidth: "calc(100vw - 48px)",
            background: "#f5f7fa",
            borderRadius: "16px",
            boxShadow: "0 18px 50px rgba(15, 30, 55, 0.22)",
            border: "1px solid #dce2ea",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            fontFamily:
              "Arial, Helvetica, sans-serif",
            color: "#172033",
            zIndex: 1100,
            animation:
              "defenseSideSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background:
                "linear-gradient(135deg, #102a56 0%, #174b91 100%)",
              padding: "22px 24px",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "13px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "13px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "21px",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  🛡
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      letterSpacing: "-0.3px",
                    }}
                  >
                    יצירת צד ההגנה 
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "12px",
                      color: "#cbd9ed",
                    }}
                  >
                    הגדרת מערך ההגנה והיירוט
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="defense-side-close-btn"
                aria-label="סגור צד הגנה"
                title="סגור"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  background: "rgba(255, 255, 255, 0.12)",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  transition: "background 0.2s ease",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
            }}
          >
            {/* Section title */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "#16243a",
                  }}
                >
                  פרטי הגנה
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "12px",
                    color: "#748096",
                  }}
                >
                  הגדר את אמצעי ההגנה והיירוט
                </div>
              </div>

              <div
                style={{
                  minWidth: "30px",
                  height: "30px",
                  padding: "0 8px",
                  borderRadius: "7px",
                  background: "#e8f0fb",
                  color: "#17539b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {defenseDetails.length}
              </div>
            </div>

            {/* Defense cards */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {defenseDetails.map((detail, index) => (
                <div
                  key={detail.id}
                  style={{
                    position: "relative",
                    background: "#fff",
                    border: "1px solid #dce3ec",
                    borderRadius: "12px",
                    padding: "18px",
                    boxShadow: "0 4px 14px rgba(20, 40, 70, 0.06)",
                    overflow: "hidden",
                  }}
                >
                  {/* Blue accent */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: "4px",
                      background:
                        "linear-gradient(180deg, #1769c2, #1c8be0)",
                    }}
                  />

                  {/* Card header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "18px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "9px",
                      }}
                    >
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "7px",
                          background: "#edf4fc",
                          color: "#1762ad",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "13px",
                          fontWeight: 700,
                        }}
                      >
                        {index + 1}
                      </div>

                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#1b2a40",
                        }}
                      >
                        פרטי הגנה {index + 1}
                      </div>
                    </div>

                    {defenseDetails.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeDefenseDetails(detail.id)
                        }
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "7px",
                          border: "1px solid #e1e5eb",
                          background: "#fff",
                          color: "#8792a3",
                          cursor: "pointer",
                          fontSize: "18px",
                          lineHeight: 1,
                        }}
                        title="הסר פרטי הגנה"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Attack name */}
                  <div style={{ marginBottom: "15px" }}>
                    <label style={labelStyle}>
                      שם תקיפת יירוט
                    </label>

                    <input
                      type="text"
                      value={detail.attackName}
                      onChange={(e) =>
                        updateDefenseDetails(
                          detail.id,
                          "attackName",
                          e.target.value
                        )
                      }
                      placeholder="הכנס שם תקיפה..."
                      style={inputStyle}
                    />
                  </div>

                  {/* Interception type */}
                  <div style={{ marginBottom: "15px" }}>
                    <label style={labelStyle}>
                      סוג היירוט
                    </label>

                    <select
                      value={detail.interceptionType}
                      onChange={(e) =>
                        updateDefenseDetails(
                          detail.id,
                          "interceptionType",
                          e.target.value
                        )
                      }
                      style={selectStyle}
                    >
                      <option value="">
                        בחר סוג יירוט...
                      </option>

                      {interceptionTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: "15px" }}>
                    <label style={labelStyle}>
                      הסבר על ההגנה
                    </label>

                    <textarea
                      value={detail.description}
                      onChange={(e) =>
                        updateDefenseDetails(
                          detail.id,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="הכנס הסבר על ההגנה..."
                      style={textareaStyle}
                    />
                  </div>

                  {/* Interceptors */}
                  <div style={{ marginBottom: "15px" }}>
                    <label style={labelStyle}>
                      מיירטים
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={detail.interceptors}
                      onChange={(e) =>
                        updateDefenseDetails(
                          detail.id,
                          "interceptors",
                          e.target.value
                        )
                      }
                      placeholder="מספר מיירטים"
                      style={inputStyle}
                    />
                  </div>

                  {/* Border */}
                  <div>
                    <label style={labelStyle}>
                      מאיזה גבולות
                    </label>

                    <select
                      value={detail.border}
                      onChange={(e) =>
                        updateDefenseDetails(
                          detail.id,
                          "border",
                          e.target.value
                        )
                      }
                      style={selectStyle}
                    >
                      <option value="">
                        בחר גבול...
                      </option>

                      {borders.map((border) => (
                        <option key={border} value={border}>
                          {border}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Add button */}
            <button
              type="button"
              onClick={handleAddDefenseDetails}
              style={{
                width: "100%",
                height: "46px",
                marginTop: "16px",
                borderRadius: "9px",
                border: "1px dashed #8ca9c8",
                background: "#f8fbff",
                color: "#14599f",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  lineHeight: 1,
                  fontWeight: 400,
                }}
              >
                +
              </span>

              הוסף פרטי הגנה
            </button>
          </div>

          {/* Footer */}
          <div
            style={{
              flexShrink: 0,
              padding: "15px 20px",
              background: "#fff",
              borderTop: "1px solid #dfe4eb",
              display: "flex",
              gap: "10px",
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              style={{
                flex: 1,
                height: "44px",
                borderRadius: "8px",
                border: "1px solid #d6dce5",
                background: "#fff",
                color: "#4e5b6d",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              ביטול
            </button>

            <button
              type="button"
              onClick={handleSave}
              style={{
                flex: 1.5,
                height: "44px",
                borderRadius: "8px",
                border: "none",
                background:
                  "linear-gradient(135deg, #1765b5, #1d7ed0)",
                color: "#fff",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 700,
                boxShadow: "0 5px 12px rgba(23, 101, 181, 0.22)",
              }}
            >
              שמור צד הגנה
            </button>
          </div>
        </div>
      )}
    </>
  );
};