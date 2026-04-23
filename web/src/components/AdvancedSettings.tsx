import type { ChangeEvent } from 'react'
import { SETTINGS_DEFAULTS, useSettings } from '../store'
import './AdvancedSettings.css'

export function AdvancedSettings() {
  const {
    tunerGreenCents,
    tunerYellowCents,
    lessonCents,
    completedLevels,
    setTunerGreenCents,
    setTunerYellowCents,
    setLessonCents,
    resetLessonProgress,
    resetToDefaults,
  } = useSettings()

  // Keep yellow ≥ green: yellow is the outer zone. Clamp on input rather than validate,
  // so moving either slider always lands on a consistent state.
  function onGreen(e: ChangeEvent<HTMLInputElement>) {
    const next = Number(e.target.value)
    setTunerGreenCents(next)
    if (next > tunerYellowCents) setTunerYellowCents(next)
  }

  function onYellow(e: ChangeEvent<HTMLInputElement>) {
    const next = Number(e.target.value)
    setTunerYellowCents(next)
    if (next < tunerGreenCents) setTunerGreenCents(next)
  }

  function onLesson(e: ChangeEvent<HTMLInputElement>) {
    setLessonCents(Number(e.target.value))
  }

  const isDefault =
    tunerGreenCents === SETTINGS_DEFAULTS.tunerGreenCents &&
    tunerYellowCents === SETTINGS_DEFAULTS.tunerYellowCents &&
    lessonCents === SETTINGS_DEFAULTS.lessonCents

  return (
    <div className="advanced">
      <div className="advanced__group">
        <h4 className="advanced__group-title">Tuner tolerances</h4>
        <label className="advanced__row">
          <span className="advanced__label">Green zone (in tune)</span>
          <input
            type="range"
            min={1}
            max={50}
            step={1}
            value={tunerGreenCents}
            onChange={onGreen}
            className="calibrator__slider"
            aria-label="Tuner green-zone tolerance in cents"
          />
          <span className="advanced__value">±{tunerGreenCents} ¢</span>
        </label>
        <label className="advanced__row">
          <span className="advanced__label">Yellow zone (close)</span>
          <input
            type="range"
            min={1}
            max={99}
            step={1}
            value={tunerYellowCents}
            onChange={onYellow}
            className="calibrator__slider"
            aria-label="Tuner yellow-zone tolerance in cents"
          />
          <span className="advanced__value">±{tunerYellowCents} ¢</span>
        </label>
      </div>

      <div className="advanced__group">
        <h4 className="advanced__group-title">Lesson tolerance</h4>
        <label className="advanced__row">
          <span className="advanced__label">Pass / fail threshold</span>
          <input
            type="range"
            min={5}
            max={50}
            step={1}
            value={lessonCents}
            onChange={onLesson}
            className="calibrator__slider"
            aria-label="Lesson pass tolerance in cents"
          />
          <span className="advanced__value">±{lessonCents} ¢</span>
        </label>
      </div>

      <p className="note">
        Beyond the yellow zone is &ldquo;off&rdquo;. Defaults: ±10 green, ±25 yellow, ±15 lesson.
      </p>

      <div className="advanced__actions">
        <button
          type="button"
          className="pill pill--small"
          onClick={resetToDefaults}
          disabled={isDefault}
        >
          Reset tolerances
        </button>
        {completedLevels.length > 0 && (
          <button type="button" className="pill pill--small" onClick={resetLessonProgress}>
            Reset lessons ({completedLevels.length})
          </button>
        )}
      </div>
    </div>
  )
}
