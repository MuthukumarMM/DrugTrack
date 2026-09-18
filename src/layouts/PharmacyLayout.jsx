import RoleLayout from './RoleLayout'
import { roleLinks } from '../constants/navigation'

export default function PharmacyLayout() {
  return <RoleLayout role="PHARMACY" links={roleLinks.PHARMACY} />
}
