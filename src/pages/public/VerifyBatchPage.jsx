import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShieldCheck, ShieldX } from 'lucide-react'
import { verifyBatch } from '../../services/functionsService'
import { PublicLayout } from './PublicPages'

export default function VerifyBatchPage() {
  const { token: routeToken } = useParams()
  const [token, setToken] = useState(routeToken || '')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  const runVerify = async value => {
    setBusy(true)
    try {
      setResult(await verifyBatch(value.trim()))
    } catch {
      setResult({ valid: false, status: 'UNAVAILABLE' })
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!routeToken) return
    let isMounted = true
    setBusy(true)
    verifyBatch(routeToken.trim())
      .then(res => {
        if (isMounted) setResult(res)
      })
      .catch(() => {
        if (isMounted) setResult({ valid: false, status: 'UNAVAILABLE' })
      })
      .finally(() => {
        if (isMounted) setBusy(false)
      })
    return () => {
      isMounted = false
    }
  }, [routeToken])

  const verify = event => {
    event.preventDefault()
    runVerify(token)
  }

  return (
    <PublicLayout>
      <main className="mx-auto max-w-2xl px-5 py-16">
        <p className="font-semibold text-brand-600">BATCH VERIFICATION</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-950">Verify a medicine batch</h1>
        <p className="mt-3 text-slate-600">
          Enter the DrugTrack verification token from a batch QR code. This service exposes safe authenticity information only.
        </p>
        <form onSubmit={verify} className="mt-7 flex flex-col gap-3 sm:flex-row">
          <input className="field" required value={token} placeholder="Verification token" onChange={event => setToken(event.target.value)} />
          <button disabled={busy} className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white disabled:opacity-50">
            {busy ? 'Checking...' : 'Verify'}
          </button>
        </form>
        {result && (
          <section className={`panel mt-6 p-6 ${result.valid ? 'border-teal-200' : 'border-red-200'}`}>
            {result.valid ? <ShieldCheck className="text-teal-600" /> : <ShieldX className="text-red-600" />}
            <h2 className="mt-3 text-xl font-bold text-slate-950">{result.valid ? 'Verified batch' : 'Unable to verify batch'}</h2>
            <p className="mt-2 text-sm text-slate-600">Status: {result.status}</p>
            {result.drugName && (
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Medicine</dt>
                  <dd className="font-semibold">{result.drugName}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Batch</dt>
                  <dd className="font-semibold">{result.batchNumber}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Manufacturer</dt>
                  <dd>{result.manufacturerName || 'Verified source'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Manufactured</dt>
                  <dd>{result.manufacturingDate}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Expires</dt>
                  <dd>{result.expiryDate}</dd>
                </div>
              </dl>
            )}
          </section>
        )}
      </main>
    </PublicLayout>
  )
}
