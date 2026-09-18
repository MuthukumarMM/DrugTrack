import RoleLayout from './RoleLayout'
import { roleLinks } from '../constants/navigation'

export default function AdminLayout() {
  return <RoleLayout role="ADMIN" links={roleLinks.ADMIN} />
}
