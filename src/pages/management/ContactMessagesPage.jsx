import { useEffect, useState } from 'react'
import { Mail, MessageSquare } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/feedback/EmptyState'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import { subscribeContactMessages } from '../../services/contactAdminService'

function formatDate(value) {
  if (!value) return 'Date unavailable'
  if (typeof value.toDate === 'function') return value.toDate().toLocaleString()
  return new Date(value).toLocaleString()
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState(null)
  useEffect(() => subscribeContactMessages(setMessages), [])

  if (!messages) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader title="Contact messages" description="Review messages submitted by customers, hospitals, pharmacies, and platform visitors." />
      {!messages.length ? (
        <EmptyState title="No contact messages yet" description="New messages will appear here as soon as someone contacts DrugTrack." />
      ) : (
        <div className="grid gap-4">
          {messages.map(message => (
            <article className="panel p-5" key={message.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 font-bold text-slate-950"><MessageSquare size={18} className="text-teal-600" />{message.subject || 'General enquiry'}</h2>
                  <p className="mt-1 text-sm text-slate-500">{message.name} | {message.email}{message.phone ? ` | ${message.phone}` : ''}</p>
                </div>
                <time className="text-xs text-slate-400">{formatDate(message.createdAt)}</time>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.message}</p>
              <a className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700" href={`mailto:${message.email}`}><Mail size={15} /> Reply by email</a>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
