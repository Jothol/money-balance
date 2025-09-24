import type { Timestamp } from 'firebase/firestore'

export type InviteStatus = 'pending' | 'accepted' | 'canceled'

export type InviteDoc = {
  fromUid: string
  toUid?: string | null
  toEmail?: string | null
  toEmailLower?: string | null
  status: InviteStatus
  pairId?: string | null
  createdAt?: Timestamp | null
  respondedAt?: Timestamp | null
}
