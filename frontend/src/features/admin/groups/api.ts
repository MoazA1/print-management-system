import { adminGroups, getGroupById } from '@/mocks/admin-store'

export function listGroups() {
  return adminGroups
}

export function getGroupByIdOrUndefined(groupId?: string) {
  return getGroupById(groupId)
}
