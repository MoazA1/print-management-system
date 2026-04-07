import { adminUsers, getUserById } from '@/mocks/admin-store'

export function listUsers() {
  return adminUsers
}

export function getUserByIdOrUndefined(userId?: string) {
  return getUserById(userId)
}
