import React from "react";
import { PlacedDrone, DroneWave } from "../types/drone";
import {
  droneTypes,
  borders,
  directions,
  directionAngles,
  getClosestDirection,
  createWave,
} from "../constants/droneConstants";

import DronePlacementControl from "./DronePlacementControl";

export type { DroneWave };

export interface AttackSideProps {
  open: boolean;
  onClose: () => void;
  waves: DroneWave[];
  setWaves: React.Dispatch<React.SetStateAction<DroneWave[]>>;
  placedDrones: PlacedDrone[];

  onStartPlacement: (
    waveId: string | number,
    options: {
      mode: "single" | "batch";
      count: number;
    },
  ) => void;

  attackName: string;
  setAttackName: React.Dispatch<React.SetStateAction<string>>;
  attackDescription: string;
  setAttackDescription: React.Dispatch<React.SetStateAction<string>>;
  onSaveScenario?: () => void;
}

export const AttackSide: React.FC<AttackSideProps> = ({
  open,
  onClose,
  waves,
  setWaves,
  placedDrones,
  onStartPlacement,
  attackName,
  setAttackName,
  attackDescription,
  setAttackDescription,
  onSaveScenario,
}) => {
  if (!open) return null;

  const updateWave = (
    id: string | number,
    field: string,
    value: string | number | boolean,
  ) => {
    setWaves((prev) =>
      prev.map((wave) =>
        String(wave.id) === String(id)
          ? { ...wave, [field]: value }
          : wave,
      ),
    );
  };

  const addWave = () => {
    setWaves((prev) => {
      const numericIds = prev
        .map((wave) => Number(wave.id))
        .filter((id) => Number.isFinite(id));

      const nextId =
        numericIds.length === 0
          ? 1
          : Math.max(...numericIds) + 1;

      return [...prev, createWave(nextId)];
    });
  };

  const removeWave = (id: string | number) => {
    setWaves((prev) =>
      prev.length > 1
        ? prev.filter(
          (wave) => String(wave.id) !== String(id),
        )
        : prev,
    );
  };

  const toggleWave = (id: string | number) => {
    setWaves((prev) =>
      prev.map((wave) =>
        String(wave.id) === String(id)
          ? { ...wave, open: !wave.open }
          : wave,
      ),
    );
  };

  const handleCancel = () => {
    onClose();
  };

  const handleSave = () => {
    onSaveScenario?.();
    onClose();
  };

  /*
   * The application uses only two operational areas.
   *
   * We keep the underlying border values untouched where possible,
   * but normalize the displayed terminology.
   */
  const getBorderLabel = (value: string | undefined) => {
    if (!value) return "ללא גבול";

    const normalized = value.toLowerCase();

    if (
      normalized.includes("לבנון")
    ) {
      return "לבנון";
    }

    if (
      normalized.includes("עזה")
    ) {
      return "עזה";
    }

    return value;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(20, 29, 40, 0.24)",
          backdropFilter: "blur(2px)",
          zIndex: 1400,
        }}
      />

      {/* Modal */}
      <div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          top: 24,
          right: 24,
          bottom: 24,
          width: 460,
          maxWidth: "calc(100vw - 48px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "#f5f7fa",
          border: "1px solid #dce3eb",
          borderRadius: 16,
          boxShadow: "0 22px 60px rgba(17, 30, 45, 0.20)",
          fontFamily: "Inter, Arial, Helvetica, sans-serif",
          zIndex: 1500,
        }}
      >
        {/* HEADER */}
        <div
          style={{
            flexShrink: 0,
            padding: "19px 22px",
            background:
              "linear-gradient(135deg, #873535 0%, #a74444 100%)",
            color: "#fff",
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            style={{
              position: "absolute",
              left: 15,
              top: 15,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 20,
              fontWeight: 300,
            }}
          >
            ×
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 43,
                height: 43,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.13)",
              }}
            >
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="8"
                  y="9"
                  width="8"
                  height="5"
                  rx="1.5"
                  stroke="white"
                  strokeWidth="1.7"
                />
                <circle
                  cx="12"
                  cy="11.5"
                  r="1.2"
                  fill="white"
                />
                <path
                  d="M8 10.5H5.5C4.67 10.5 4 9.83 4 9V7"
                  stroke="white"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 10.5H18.5C19.33 10.5 20 9.83 20 9V7"
                  stroke="white"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2.8 6.2H6.8"
                  stroke="white"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
                <path
                  d="M3.8 4.8V7.6"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M17.2 6.2H21.2"
                  stroke="white"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
                <path
                  d="M20.2 4.8V7.6"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M9.5 14L7.5 17"
                  stroke="white"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path
                  d="M14.5 14L16.5 17"
                  stroke="white"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  letterSpacing: "-0.2px",
                }}
              >
                יצירת צד אדום
              </div>

              <div
                style={{
                  marginTop: 3,
                  fontSize: 11,
                  color: "#efd2d2",
                }}
              >
                יצירת תרחיש תקיפה
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 19px",
          }}
        >
          {/* Attack name */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              שם התקיפה
            </label>

            <input
              value={attackName}
              onChange={(e) =>
                setAttackName(e.target.value)
              }
              placeholder="הכנס שם תקיפה..."
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 21 }}>
            <label style={labelStyle}>
              הסבר התקיפה
            </label>

            <textarea
              value={attackDescription}
              onChange={(e) =>
                setAttackDescription(e.target.value)
              }
              placeholder="הכנס הסבר כללי על התרחיש..."
              style={textareaStyle}
            />

            {attackDescription.trim() && (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  minHeight: 30,
                  padding: "0 10px",
                  borderRadius: 7,
                  background: "#fff6f6",
                  border: "1px solid #efdada",
                  color: "#9b5555",
                  fontSize: 10.5,
                }}
              >
                <span>⚠</span>

                <span>
                  מממ... זה נשמע מסוכן מדי
                </span>
              </div>
            )}
          </div>

          {/* Waves header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div>
              <div
                style={{
                  color: "#17243a",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                גלי רחפנים
              </div>

              <div
                style={{
                  marginTop: 3,
                  color: "#7d8999",
                  fontSize: 11,
                }}
              >
                הגדרת גלי הסימולציה
              </div>
            </div>

            <div
              style={{
                minWidth: 28,
                height: 28,
                padding: "0 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 7,
                background: "#f8eaea",
                color: "#9e4141",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {waves.length}
            </div>
          </div>

          {/* Waves */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {waves.map((wave, index) => {
              const placedForWave =
                placedDrones.filter(
                  (d) =>
                    String(d.waveId) ===
                    String(wave.id),
                ).length;

              const requiredForWave =
                Math.max(
                  1,
                  Number(wave.quantity) || 1,
                );

              const remainingForWave = Math.max(
                0,
                requiredForWave -
                placedForWave,
              );

              const isComplete =
                placedForWave >=
                requiredForWave;

              const isOverAllocated =
                placedForWave >
                requiredForWave;

              return (
                <div
                  key={String(wave.id)}
                  style={{
                    position: "relative",
                    background: "#fff",
                    border: "1px solid #dce3ea",
                    borderRadius: 11,
                    overflow: "hidden",
                    boxShadow:
                      "0 3px 12px rgba(25, 45, 65, 0.045)",
                  }}
                >
                  {/* Red side accent */}
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background:
                        "linear-gradient(180deg,#9e3d3d,#c15b5b)",
                    }}
                  />

                  {/* Wave header */}
                  <button
                    type="button"
                    onClick={() =>
                      toggleWave(wave.id)
                    }
                    style={{
                      width: "100%",
                      minHeight: wave.open
                        ? 57
                        : 66,
                      padding:
                        "0 16px 0 13px",
                      display: "flex",
                      alignItems: "center",
                      border: "none",
                      background: "#fff",
                      cursor: "pointer",
                      textAlign: "right",
                      direction: "rtl",
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 7,
                        background: "#faeeee",
                        color: "#a13f3f",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {index + 1}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        marginRight: 10,
                      }}
                    >
                      <div
                        style={{
                          color: "#243249",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        גל רחפנים {index + 1}
                      </div>

                      {!wave.open && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            flexWrap: "wrap",
                            marginTop: 5,
                            color: "#687688",
                            fontSize: 10,
                            fontWeight: 500,
                            lineHeight: 1.35,
                          }}
                        >
                          <span
                            style={{
                              padding: "3px 6px",
                              borderRadius: 5,
                              background: "#f7f8fa",
                              border:
                                "1px solid #e8ebef",
                            }}
                          >
                            {getBorderLabel(
                              wave.border,
                            )}
                          </span>

                          <span
                            style={{
                              padding: "3px 6px",
                              borderRadius: 5,
                              background: isComplete
                                ? "#f0fdf4"
                                : "#fff5f5",
                              color: isComplete
                                ? "#16a34a"
                                : "#9e4141",
                              border: isComplete
                                ? "1px solid #bbf7d0"
                                : "1px solid #f0dede",
                              fontWeight: 700,
                            }}
                          >
                            {isComplete
                              ? `✓ הוצבו כל ${requiredForWave} הרחפנים`
                              : `הוצבו ${placedForWave}/${requiredForWave} · נותרו ${remainingForWave}`}
                          </span>

                          <span
                            style={{
                              padding: "3px 6px",
                              borderRadius: 5,
                              background: "#f7f8fa",
                              border:
                                "1px solid #e8ebef",
                            }}
                          >
                            {wave.droneType}
                          </span>
                        </div>
                      )}
                    </div>

                    {waves.length > 1 && (
                      <span
                        role="button"
                        title="מחק גל תקיפה"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeWave(wave.id);
                        }}
                        style={{
                          width: 24,
                          height: 24,
                          marginLeft: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 6,
                          background: "#fff1f2",
                          border:
                            "1px solid #fecdd3",
                          color: "#e11d48",
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        ✕
                      </span>
                    )}

                    <span
                      style={{
                        width: 25,
                        height: 25,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#8894a2",
                        fontSize: 16,
                        transform: wave.open
                          ? "rotate(0deg)"
                          : "rotate(180deg)",
                        transition:
                          "transform 160ms ease",
                      }}
                    >
                      ⌄
                    </span>
                  </button>

                  {/* Expanded content */}
                  {wave.open && (
                    <div
                      style={{
                        padding:
                          "0 16px 17px",
                        borderTop:
                          "1px solid #edf0f4",
                      }}
                    >
                      {/* Drone type */}
                      <div
                        style={{
                          paddingTop: 15,
                          marginBottom: 13,
                        }}
                      >
                        <label style={labelStyle}>
                          סוג רחפן
                        </label>

                        <select
                          value={wave.droneType}
                          onChange={(e) =>
                            updateWave(
                              wave.id,
                              "droneType",
                              e.target.value,
                            )
                          }
                          style={selectStyle}
                        >
                          {droneTypes.map(
                            (type) => (
                              <option
                                key={type}
                                value={type}
                              >
                                {type}
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      {/* Border + Quantity */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "1fr 1fr",
                          gap: 10,
                          marginBottom: 13,
                        }}
                      >
                        <div>
                          <label
                            style={labelStyle}
                          >
                            גבול
                          </label>

                          <select
                            value={
                              wave.border
                            }
                            onChange={(e) =>
                              updateWave(
                                wave.id,
                                "border",
                                e.target.value,
                              )
                            }
                            style={selectStyle}
                          >
                            {borders.map(
                              (border) => {
                                const displayLabel =
                                  getBorderLabel(
                                    border,
                                  );

                                return (
                                  <option
                                    key={border}
                                    value={
                                      border ===
                                        "בחר גבול..."
                                        ? ""
                                        : border
                                    }
                                  >
                                    {displayLabel}
                                  </option>
                                );
                              },
                            )}
                          </select>
                        </div>

                        <div>
                          <label
                            style={{
                              ...labelStyle,
                              color: "#29384e",
                              fontWeight: 700,
                            }}
                          >
                            כמות רחפנים
                          </label>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              position:
                                "relative",
                            }}
                          >
                            <button
                              type="button"
                              title="הפחת רחפן"
                              onClick={() =>
                                updateWave(
                                  wave.id,
                                  "quantity",
                                  Math.max(
                                    1,
                                    Number(
                                      wave.quantity ||
                                      1,
                                    ) - 1,
                                  ),
                                )
                              }
                              style={stepperButtonLeft}
                            >
                              −
                            </button>

                            <input
                              type="number"
                              min={1}
                              value={
                                wave.quantity
                              }
                              aria-label="כמות רחפנים"
                              onChange={(e) =>
                                updateWave(
                                  wave.id,
                                  "quantity",
                                  Math.max(
                                    1,
                                    Number(
                                      e.target
                                        .value,
                                    ) || 1,
                                  ),
                                )
                              }
                              style={{
                                ...inputStyle,
                                borderRadius: 0,
                                textAlign:
                                  "center",
                                paddingLeft: 42,
                                flex: 1,
                              }}
                            />

                            <span
                              style={{
                                position:
                                  "absolute",
                                left: 38,
                                top: 12,
                                color: "#a03f3f",
                                fontSize: 10,
                                fontWeight: 700,
                                pointerEvents:
                                  "none",
                              }}
                            >
                              יח'
                            </span>

                            <button
                              type="button"
                              title="הוסף רחפן"
                              onClick={() =>
                                updateWave(
                                  wave.id,
                                  "quantity",
                                  Number(
                                    wave.quantity ||
                                    1,
                                  ) + 1,
                                )
                              }
                              style={
                                stepperButtonRight
                              }
                            >
                              +
                            </button>
                          </div>

                          {isOverAllocated && (
                            <div
                              style={{
                                marginTop: 4,
                                color: "#dc2626",
                                fontSize: 10.5,
                                fontWeight: 600,
                              }}
                            >
                              ⚠️ הוצבו{" "}
                              {placedForWave}{" "}
                              רחפנים במפה
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Angle */}
                      <div
                        style={{
                          marginBottom: 13,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "space-between",
                            marginBottom: 7,
                          }}
                        >
                          <label
                            style={{
                              ...labelStyle,
                              marginBottom: 0,
                            }}
                          >
                            זווית כיוון
                          </label>

                          <div
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: 5,
                            }}
                          >
                            <button
                              type="button"
                              title="הפחת 5°"
                              onClick={() => {
                                const newAngle =
                                  (Number(
                                    wave.angle,
                                  ) -
                                    5 +
                                    360) %
                                  360;

                                updateWave(
                                  wave.id,
                                  "angle",
                                  newAngle,
                                );

                                updateWave(
                                  wave.id,
                                  "direction",
                                  getClosestDirection(
                                    newAngle,
                                  ),
                                );
                              }}
                              style={smallStepButton}
                            >
                              −
                            </button>

                            <div
                              style={{
                                position:
                                  "relative",
                                width: 62,
                              }}
                            >
                              <input
                                type="number"
                                min={0}
                                max={360}
                                value={
                                  wave.angle
                                }
                                onChange={(e) => {
                                  const val =
                                    Math.max(
                                      0,
                                      Math.min(
                                        360,
                                        Number(
                                          e.target
                                            .value,
                                        ) || 0,
                                      ),
                                    );

                                  updateWave(
                                    wave.id,
                                    "angle",
                                    val,
                                  );

                                  updateWave(
                                    wave.id,
                                    "direction",
                                    getClosestDirection(
                                      val,
                                    ),
                                  );
                                }}
                                style={{
                                  ...inputStyle,
                                  height: 26,
                                  padding:
                                    "0 18px 0 6px",
                                  textAlign:
                                    "center",
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  color: "#a03f3f",
                                }}
                              />

                              <span
                                style={{
                                  position:
                                    "absolute",
                                  left: 6,
                                  top: 4,
                                  fontSize: 11,
                                  color: "#a03f3f",
                                  fontWeight: 700,
                                  pointerEvents:
                                    "none",
                                }}
                              >
                                °
                              </span>
                            </div>

                            <button
                              type="button"
                              title="הוסף 5°"
                              onClick={() => {
                                const newAngle =
                                  (Number(
                                    wave.angle,
                                  ) + 5) %
                                  360;

                                updateWave(
                                  wave.id,
                                  "angle",
                                  newAngle,
                                );

                                updateWave(
                                  wave.id,
                                  "direction",
                                  getClosestDirection(
                                    newAngle,
                                  ),
                                );
                              }}
                              style={smallStepButton}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems:
                              "center",
                            gap: 9,
                            marginBottom: 8,
                          }}
                        >
                          <input
                            type="range"
                            min={0}
                            max={360}
                            step={5}
                            value={wave.angle}
                            onChange={(e) => {
                              const val =
                                Number(
                                  e.target.value,
                                );

                              updateWave(
                                wave.id,
                                "angle",
                                val,
                              );

                              updateWave(
                                wave.id,
                                "direction",
                                getClosestDirection(
                                  val,
                                ),
                              );
                            }}
                            style={{
                              flex: 1,
                              accentColor:
                                "#a34343",
                              cursor: "pointer",
                            }}
                          />

                          <div
                            title={`כיוון: ${wave.angle}° (${wave.direction})`}
                            style={{
                              width: 34,
                              height: 34,
                              flexShrink: 0,
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              borderRadius:
                                "50%",
                              border:
                                "1px solid #e2d2d2",
                              background:
                                "#fff7f7",
                              color: "#a34343",
                              fontSize: 15,
                              transform: `rotate(${wave.angle}deg)`,
                              transition:
                                "transform 120ms ease",
                            }}
                          >
                            ↑
                          </div>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "1fr 1fr 1fr 1fr",
                            gap: 5,
                          }}
                        >
                          {[
                            {
                              label:
                                "צפון 0°",
                              angle: 0,
                              dir: "צפון",
                            },
                            {
                              label:
                                "מזרח 90°",
                              angle: 90,
                              dir: "מזרח",
                            },
                            {
                              label:
                                "דרום 180°",
                              angle: 180,
                              dir: "דרום",
                            },
                            {
                              label:
                                "מערב 270°",
                              angle: 270,
                              dir: "מערב",
                            },
                          ].map((preset) => {
                            const isSelected =
                              Math.abs(
                                Number(
                                  wave.angle,
                                ) -
                                preset.angle,
                              ) < 5 ||
                              (preset.angle ===
                                0 &&
                                Number(
                                  wave.angle,
                                ) === 360);

                            return (
                              <button
                                key={
                                  preset.label
                                }
                                type="button"
                                onClick={() => {
                                  updateWave(
                                    wave.id,
                                    "angle",
                                    preset.angle,
                                  );

                                  updateWave(
                                    wave.id,
                                    "direction",
                                    preset.dir,
                                  );
                                }}
                                style={{
                                  padding:
                                    "4px 0",
                                  fontSize:
                                    10.5,
                                  fontWeight:
                                    isSelected
                                      ? 700
                                      : 500,
                                  borderRadius: 5,
                                  border:
                                    isSelected
                                      ? "1px solid #a34343"
                                      : "1px solid #e2e8f0",
                                  background:
                                    isSelected
                                      ? "#fff0f0"
                                      : "#ffffff",
                                  color:
                                    isSelected
                                      ? "#a34343"
                                      : "#64748b",
                                  cursor:
                                    "pointer",
                                }}
                              >
                                {
                                  preset.label
                                }
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Direction */}
                      <div
                        style={{
                          marginBottom: 13,
                        }}
                      >
                        <label
                          style={labelStyle}
                        >
                          כיוון
                        </label>

                        <select
                          value={
                            wave.direction
                          }
                          onChange={(e) => {
                            const dir =
                              e.target.value;

                            updateWave(
                              wave.id,
                              "direction",
                              dir,
                            );

                            if (
                              directionAngles[
                              dir
                              ] !== undefined
                            ) {
                              updateWave(
                                wave.id,
                                "angle",
                                directionAngles[
                                dir
                                ],
                              );
                            }
                          }}
                          style={selectStyle}
                        >
                          {directions.map(
                            (direction) => (
                              <option
                                key={direction}
                                value={
                                  direction
                                }
                              >
                                {direction}{" "}
                                {directionAngles[
                                  direction
                                ] !==
                                  undefined
                                  ? `(${directionAngles[direction]}°)`
                                  : ""}
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      {/* Altitude */}
                      <div
                        style={{
                          marginBottom: 13,
                        }}
                      >
                        <label
                          style={labelStyle}
                        >
                          גובה מעל פני שטח
                        </label>

                        <div
                          style={{
                            display: "flex",
                            alignItems:
                              "center",
                            position:
                              "relative",
                            marginBottom: 6,
                          }}
                        >
                          <button
                            type="button"
                            title="הפחת 25 מטר"
                            onClick={() =>
                              updateWave(
                                wave.id,
                                "altitude",
                                Math.max(
                                  0,
                                  Number(
                                    wave.altitude ||
                                    100,
                                  ) - 25,
                                ),
                              )
                            }
                            style={
                              stepperButtonLeft
                            }
                          >
                            −
                          </button>

                          <input
                            type="number"
                            min={0}
                            step={10}
                            value={
                              wave.altitude
                            }
                            onChange={(e) =>
                              updateWave(
                                wave.id,
                                "altitude",
                                Math.max(
                                  0,
                                  Number(
                                    e.target
                                      .value,
                                  ) || 0,
                                ),
                              )
                            }
                            placeholder="100"
                            style={{
                              ...inputStyle,
                              borderRadius: 0,
                              textAlign:
                                "center",
                              paddingLeft: 46,
                              flex: 1,
                            }}
                          />

                          <span
                            style={{
                              position:
                                "absolute",
                              left: 38,
                              top: 12,
                              color: "#8b96a3",
                              fontSize: 10,
                              fontWeight: 700,
                              pointerEvents:
                                "none",
                            }}
                          >
                            מטר
                          </span>

                          <button
                            type="button"
                            title="הוסף 25 מטר"
                            onClick={() =>
                              updateWave(
                                wave.id,
                                "altitude",
                                Number(
                                  wave.altitude ||
                                  100,
                                ) + 25,
                              )
                            }
                            style={
                              stepperButtonRight
                            }
                          >
                            +
                          </button>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "1fr 1fr 1fr 1fr",
                            gap: 5,
                          }}
                        >
                          {[50, 100, 200, 500].map(
                            (alt) => {
                              const isSelected =
                                Number(
                                  wave.altitude,
                                ) === alt;

                              return (
                                <button
                                  key={alt}
                                  type="button"
                                  onClick={() =>
                                    updateWave(
                                      wave.id,
                                      "altitude",
                                      alt,
                                    )
                                  }
                                  style={{
                                    padding:
                                      "3px 0",
                                    fontSize:
                                      10.5,
                                    fontWeight:
                                      isSelected
                                        ? 700
                                        : 500,
                                    borderRadius: 5,
                                    border:
                                      isSelected
                                        ? "1px solid #a34343"
                                        : "1px solid #e2e8f0",
                                    background:
                                      isSelected
                                        ? "#fff0f0"
                                        : "#ffffff",
                                    color:
                                      isSelected
                                        ? "#a34343"
                                        : "#64748b",
                                    cursor:
                                      "pointer",
                                  }}
                                >
                                  {alt} מ'
                                </button>
                              );
                            },
                          )}
                        </div>
                      </div>

                      {/* Placement */}
                      <DronePlacementControl
                        wave={wave}
                        requiredForWave={
                          requiredForWave
                        }
                        placedForWave={
                          placedForWave
                        }
                        remainingForWave={
                          remainingForWave
                        }
                        isComplete={
                          isComplete
                        }
                        labelStyle={
                          labelStyle
                        }
                        updateWave={
                          updateWave
                        }
                        onStartPlacement={(
                          waveId,
                          options,
                        ) =>
                          onStartPlacement(
                            waveId,
                            {
                              mode:
                                options.mode,
                              count:
                                options.mode ===
                                  "single"
                                  ? 1
                                  : requiredForWave,
                            },
                          )
                        }
                        onClose={onClose}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add wave */}
          <button
            type="button"
            onClick={addWave}
            style={{
              width: "100%",
              height: 44,
              marginTop: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              borderRadius: 9,
              border: "1px dashed #c58f8f",
              background: "#fffafa",
              color: "#a03e3e",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 400,
                lineHeight: 1,
              }}
            >
              +
            </span>

            הוסף גל רחפנים
          </button>
        </div>

        {/* FOOTER */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            gap: 9,
            padding: "14px 19px",
            background: "#fff",
            borderTop: "1px solid #e1e6ec",
          }}
        >
          <button
            type="button"
            onClick={handleCancel}
            style={{
              flex: 1,
              height: 42,
              borderRadius: 8,
              border: "1px solid #d6dde5",
              background: "#fff",
              color: "#596779",
              cursor: "pointer",
              fontSize: 13,
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
              height: 42,
              borderRadius: 8,
              border: "none",
              background:
                "linear-gradient(135deg,#963b3b,#b04a4a)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              boxShadow:
                "0 5px 12px rgba(150,59,59,.18)",
            }}
          >
            שמור תרחיש
          </button>
        </div>
      </div>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  color: "#334156",
  fontSize: 11.5,
  fontWeight: 600,
  textAlign: "right",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 39,
  boxSizing: "border-box",
  padding: "0 11px",
  border: "1px solid #d5dce5",
  borderRadius: 7,
  background: "#fff",
  color: "#253247",
  outline: "none",
  fontSize: 12.5,
  direction: "rtl",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  height: 78,
  padding: "10px 11px",
  resize: "vertical",
  fontFamily: "inherit",
  lineHeight: 1.5,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const stepperButtonLeft: React.CSSProperties = {
  width: 32,
  height: 39,
  border: "1px solid #d5dce5",
  borderLeft: "none",
  borderRadius: "0 7px 7px 0",
  background: "#f8fafc",
  color: "#475569",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  userSelect: "none",
};

const stepperButtonRight: React.CSSProperties = {
  width: 32,
  height: 39,
  border: "1px solid #d5dce5",
  borderRight: "none",
  borderRadius: "7px 0 0 7px",
  background: "#f8fafc",
  color: "#475569",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  userSelect: "none",
};

const smallStepButton: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 5,
  border: "1px solid #d5dce5",
  background: "#fff",
  color: "#475569",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export { DronePlacementControl };

export default AttackSide;