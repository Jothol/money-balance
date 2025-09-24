import { addDoc, collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '@/firebase/firebase'
import { InviteDoc } from '@/types/Invite'
import { canonicalPairId } from '@/lib/pairs'

const invitesCol = () => collection(db, 'invites')

export async function sendInviteByEmail(fromUid: string, toEmail: string) {
  const email = toEmail.trim()
  const emailLower = email.toLowerCase()
  const uq = query(collection(db, 'users'), where('emailLower', '==', emailLower))
  const ur = await getDocs(uq)
  const toUid = ur.empty ? null : ur.docs[0].id
  const ref = await addDoc(invitesCol(), {
    fromUid,
    toUid,
    toEmail: email,
    toEmailLower: emailLower,
    status: 'pending',
    pairId: null,
    createdAt: serverTimestamp(),
    respondedAt: null
  } as InviteDoc)
  return ref.id
}

export async function sendInviteToUid(fromUid: string, toUid: string) {
  const ref = await addDoc(invitesCol(), {
    fromUid,
    toUid,
    toEmail: null,
    toEmailLower: null,
    status: 'pending',
    pairId: null,
    createdAt: serverTimestamp(),
    respondedAt: null
  } as InviteDoc)
  return ref.id
}

export async function listIncomingInvites(selfUid: string, selfEmailLower: string) {
  const q1 = query(invitesCol(), where('toUid', '==', selfUid))
  const q2 = selfEmailLower ? query(invitesCol(), where('toEmailLower', '==', selfEmailLower)) : null
  const [r1, r2] = await Promise.all([getDocs(q1), q2 ? getDocs(q2) : Promise.resolve({ docs: [] } as unknown as ReturnType<typeof getDocs>)])
  const merge = new Map<string, InviteDoc & { id: string }>()
  r1.docs.forEach(d => merge.set(d.id, { id: d.id, ...(d.data() as InviteDoc) }))
  ;(r2 as unknown as { docs: typeof r1.docs }).docs.forEach(d => merge.set(d.id, { id: d.id, ...(d.data() as InviteDoc) }))
  return Array.from(merge.values()).filter(x => x.status === 'pending')
}

export async function listOutgoingInvites(selfUid: string) {
  const r = await getDocs(query(invitesCol(), where('fromUid', '==', selfUid)))
  return r.docs.map(d => ({ id: d.id, ...(d.data() as InviteDoc) })).filter(x => x.status === 'pending')
}

export async function acceptInvite(inviteId: string, selfUid: string, selfEmailLower?: string) {
  const inviteRef = doc(db, 'invites', inviteId)
  let createdPairId: string | null = null
  await runTransaction(db, async tx => {
    const snap = await tx.get(inviteRef)
    if (!snap.exists()) return
    const inv = snap.data() as InviteDoc
    if (inv.status !== 'pending') return
    if (inv.toUid && inv.toUid !== selfUid) return
    if (!inv.toUid && inv.toEmailLower && selfEmailLower && inv.toEmailLower !== selfEmailLower) return
    const other = inv.fromUid
    const pairId = canonicalPairId(selfUid, other)
    const pairRef = doc(db, 'pairs', pairId)
    const now = serverTimestamp()
    tx.set(pairRef, { members: [selfUid, other].sort(), createdAt: now }, { merge: true })
    tx.update(inviteRef, { status: 'accepted', pairId, respondedAt: now, toUid: inv.toUid ?? selfUid })
    createdPairId = pairId
  })
  return createdPairId
}

export async function cancelInvite(inviteId: string) {
  await updateDoc(doc(db, 'invites', inviteId), { status: 'canceled', respondedAt: serverTimestamp() })
}

export async function resolveUserLabel(uid: string) {
  const s = await getDoc(doc(db, 'users', uid))
  if (!s.exists()) return { name: uid.slice(0, 6), email: '' }
  const u = s.data() as { firstName?: string; lastName?: string; email?: string }
  const name = [u.firstName ?? '', u.lastName ?? ''].filter(Boolean).join(' ').trim() || (u.email ? String(u.email).split('@')[0] : uid.slice(0, 6))
  return { name, email: u.email ?? '' }
}
