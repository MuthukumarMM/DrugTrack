import RoleLayout from './RoleLayout'
import { roleLinks } from '../constants/navigation'

export default function HospitalLayout() {
  return <RoleLayout role="HOSPITAL" links={roleLinks.HOSPITAL} />
}
