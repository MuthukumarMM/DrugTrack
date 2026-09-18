import { Link, useNavigate } from 'react-router-dom'
import { Clock3, FileWarning, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { signOutUser } from '../../services/authService'

export default function AccountStatusPage() {
  const { currentUser, profile, profileError } = useAuth()
  const navigate = useNavigate()
  const blocked = profile?.status === 'SUSPENDED' || profile?.status === 'REJECTED'
  const missingProfile = currentUser && !profile

  const signOut = async () => {
    await signOutUser()
    navigate('/login', { replace: true })
  }

  let icon = <Clock3 className="mx-auto text-brand-600" size={38} />
  let title = 'Organization verification pending'
  let message =
    'Your Firebase registration is complete. An administrator must approve your organization before operational tools become available.'

  if (!currentUser) {
    icon = <ShieldAlert className="mx-auto text-amber-600" size={38} />
    title = 'Sign in required'
    message = 'Sign in to view the current status of your DrugTrack account.'
  } else if (missingProfile) {
    icon = <FileWarning className="mx-auto text-amber-600" size={38} />
    title = 'Profile setup is incomplete'
    message = profileError || 'Your authentication account exists, but the users profile document could not be loaded.'
  } else if (blocked) {
    icon = <ShieldAlert className="mx-auto text-red-600" size={38} />
    title = 'Account access is unavailable'
    message = 'This account is rejected or suspended. Contact the administrator if you believe this is incorrect.'
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-5">
      <section className="panel w-full max-w-lg p-8 text-center">
        {icon}
        <p className="mt-5 text-sm font-semibold tracking-wide text-brand-600">DRUGTRACK ACCOUNT STATUS</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        {profile && (
          <dl className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-4 text-left text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Role</dt>
              <dd className="font-semibold">{profile.role?.replaceAll('_', ' ')}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Status</dt>
              <dd className="font-semibold">{profile.status?.replaceAll('_', ' ')}</dd>
            </div>
          </dl>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold" to="/">
            Public site
          </Link>
          {!currentUser ? (
            <Link className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white" to="/login">
              Sign in
            </Link>
          ) : (
            <button onClick={signOut} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              Sign out
            </button>
          )}
        </div>
      </section>
    </main>
  )
}
