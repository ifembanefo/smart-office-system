import { useState } from 'react'

interface Props {
  onConsent: () => void
}

export function ConsentModal({ onConsent }: Props) {
  const [checked, setChecked] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 flex flex-col gap-5">
        {/* Title */}
        <h2 className="text-xl font-bold text-gray-800 leading-snug">
          Participant Information &amp; Consent
        </h2>

        {/* Study description */}
        <p className="text-sm text-gray-700 leading-relaxed">
          This study aims to evaluate two different preference aggregation methods — <strong>Simple
          Averaging</strong> and <strong>Weighted Aggregation</strong> — implemented in a smart
          office prototype system. The primary objective is to assess which method is perceived as
          fairer, more usable, and more comfortable by users in a shared office context.
        </p>

        {/* Consent items */}
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">
            By participating in this study, you agree to the following:
          </p>
          <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside leading-relaxed">
            <li>
              Your environmental preferences (temperature, light intensity) will be collected for
              the purpose of testing the aggregation functionality.
            </li>
            <li>
              No personally identifiable information will be stored or linked to your responses.
            </li>
            <li>
              Your participation is voluntary and you may withdraw at any time without consequence.
            </li>
            <li>
              Data collected will be used exclusively for academic research purposes within this
              bachelor's thesis.
            </li>
          </ul>
        </div>

        {/* Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-blue-600 flex-shrink-0"
          />
          <span className="text-sm text-gray-700">
            I have read and understood the above information and I consent to participate in this
            study.
          </span>
        </label>

        {/* Button */}
        <button
          onClick={onConsent}
          disabled={!checked}
          className={`mt-1 w-full py-3 rounded-xl text-white font-semibold transition-colors ${
            checked
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Proceed to Evaluation
        </button>
      </div>
    </div>
  )
}
