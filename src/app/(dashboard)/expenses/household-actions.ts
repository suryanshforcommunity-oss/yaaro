'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/lib/notifications'

/* -------------------------------------------------------------------------- */
/*                                 INTERFACES                                 */
/* -------------------------------------------------------------------------- */

export type ExpenseCategory =
  | 'rent'
  | 'electricity'
  | 'water'
  | 'internet'
  | 'groceries'
  | 'maintenance'
  | 'cleaning'
  | 'custom'

export type SplitMethod =
  | 'equal'
  | 'custom_shares'
  | 'percentage'
  | 'individual_assigned'

export interface HouseholdMember {
  userId: string
  fullName: string
  avatarUrl: string | null
  city: string
  occupation: string
  role: 'curator' | 'member'
  joinedAt: string
}

export interface HouseholdInvitation {
  id: string
  householdId: string
  householdName: string
  householdCity: string
  invitedBy: {
    id: string
    fullName: string
    avatarUrl: string | null
  }
  inviteeUserId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
}

export interface HouseholdHistoryItem {
  id: string
  action: string
  by: string
  at: string
  details?: string
}

export interface HouseholdData {
  id: string
  name: string
  city: string
  address?: string
  monthlyRent: number
  rentDueDay: number
  curatorId: string
  createdAt: string
  members: HouseholdMember[]
  history: HouseholdHistoryItem[]
}

export interface ParticipantShareInput {
  userId: string
  amount: number
  percentage?: number
}

export interface AddHouseholdExpenseInput {
  householdId: string
  title: string
  category: ExpenseCategory
  amount: number
  splitMethod: SplitMethod
  participants: ParticipantShareInput[]
  assignedToUserId?: string
  receiptUrl?: string
  notes?: string
}

export interface SimplifiedDebt {
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  amount: number
}

export interface MemberFinancialSummary {
  userId: string
  fullName: string
  avatarUrl: string | null
  totalPaid: number
  totalShare: number
  netBalance: number // > 0: owed money, < 0: owes money
  status: 'owed' | 'owes' | 'settled'
}

export interface HouseholdExpenseView {
  id: string
  title: string
  category: ExpenseCategory
  categoryLabel: string
  amount: number
  splitMethod: SplitMethod
  paidByUserId: string
  paidByName: string
  isPaidByMe: boolean
  myShare: number
  createdAt: string
  dateDisplay: string
  status: 'settled' | 'pending' | 'partially_settled'
  receiptUrl?: string | null
  assignedToName?: string
  participants: Array<{
    userId: string
    fullName: string
    shareAmount: number
    isSettled: boolean
  }>
}

export interface SettlementRecord {
  id: string
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  amount: number
  method: 'UPI' | 'Cash' | 'Bank Transfer'
  reference: string
  settledAt: string
  notes?: string
}

export interface HouseholdDashboardData {
  hasHousehold: boolean
  household: HouseholdData | null
  currentUser: {
    id: string
    fullName: string
    avatarUrl: string | null
    role?: 'curator' | 'member'
  }
  pendingInvitationsReceived: HouseholdInvitation[]
  members: HouseholdMember[]
  financialSummary: {
    totalHouseholdExpenses: number
    myTotalPaid: number
    myTotalShare: number
    myNetBalance: number
    myNetStatus: 'you_are_owed' | 'you_owe' | 'all_settled'
    totalPaidExpenses: number
    totalPendingExpenses: number
  }
  memberBalances: MemberFinancialSummary[]
  simplifiedDebts: SimplifiedDebt[]
  recentExpenses: HouseholdExpenseView[]
  settlementHistory: SettlementRecord[]
  availableMonths: string[]
  currentMonth: string
}

/* -------------------------------------------------------------------------- */
/*                               HELPERS & DB                                 */
/* -------------------------------------------------------------------------- */

async function getDb(): Promise<{ db: any; user: any }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  try {
    const admin = createAdminClient()
    if (admin) return { db: admin as any, user }
  } catch {
    // fallback
  }
  return { db: supabase as any, user }
}

const CATEGORY_META: Record<ExpenseCategory, { label: string; dbCategory: string }> = {
  rent: { label: 'Monthly Rent', dbCategory: 'rent' },
  electricity: { label: 'Electricity Bill', dbCategory: 'electricity_bescom' },
  water: { label: 'Water & Purifier', dbCategory: 'water_purifier' },
  internet: { label: 'Internet / Wi-Fi', dbCategory: 'wifi_broadband' },
  groceries: { label: 'Groceries & Supplies', dbCategory: 'groceries_blinkit' },
  maintenance: { label: 'Society Maintenance', dbCategory: 'other' },
  cleaning: { label: 'Cleaning & Maid', dbCategory: 'maid_salary' },
  custom: { label: 'Custom Expense', dbCategory: 'other' },
}

/* -------------------------------------------------------------------------- */
/*                        PART A: HOUSEHOLD MANAGEMENT                         */
/* -------------------------------------------------------------------------- */

/**
 * Fetch the authenticated user's active household, members, and pending invitations
 */
export async function getHouseholdDashboardData(selectedMonth?: string): Promise<HouseholdDashboardData> {
  const { db, user } = await getDb()

  const emptyResult: HouseholdDashboardData = {
    hasHousehold: false,
    household: null,
    currentUser: {
      id: user?.id || '',
      fullName: 'YAARO Member',
      avatarUrl: null,
    },
    pendingInvitationsReceived: [],
    members: [],
    financialSummary: {
      totalHouseholdExpenses: 0,
      myTotalPaid: 0,
      myTotalShare: 0,
      myNetBalance: 0,
      myNetStatus: 'all_settled',
      totalPaidExpenses: 0,
      totalPendingExpenses: 0,
    },
    memberBalances: [],
    simplifiedDebts: [],
    recentExpenses: [],
    settlementHistory: [],
    availableMonths: [new Date().toISOString().slice(0, 7)],
    currentMonth: selectedMonth || new Date().toISOString().slice(0, 7),
  }

  if (!user) return emptyResult

  // 1. Fetch current profile
  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, avatar_url, city, preferred_location')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) {
    emptyResult.currentUser = {
      id: profile.id,
      fullName: profile.full_name || 'YAARO Member',
      avatarUrl: profile.avatar_url,
    }
  }

  // 2. Parse household from preferred_location
  let profileLoc: any = {}
  try {
    profileLoc = JSON.parse(profile?.preferred_location || '{}')
  } catch {}

  const householdData: HouseholdData | null = profileLoc.household_group || null
  const invitationsReceived: HouseholdInvitation[] = profileLoc.household_invitations_received || []

  emptyResult.pendingInvitationsReceived = invitationsReceived.filter((inv) => inv.status === 'pending')

  if (!householdData || !householdData.id) {
    return emptyResult
  }

  emptyResult.hasHousehold = true
  emptyResult.household = householdData
  emptyResult.members = householdData.members || []
  emptyResult.currentUser.role = householdData.curatorId === user.id ? 'curator' : 'member'

  // 3. Fetch expenses for this household
  const targetMonth = selectedMonth || new Date().toISOString().slice(0, 7) // 'YYYY-MM'
  const startDate = `${targetMonth}-01T00:00:00.000Z`
  const endDate = `${targetMonth}-31T23:59:59.999Z`

  const { data: expenses } = await db
    .from('shared_expenses')
    .select('*, participants:expense_participants(*, profile:profiles(id, full_name, avatar_url))')
    .eq('flat_group_id', householdData.id)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

  // 4. Calculate Financials
  let totalHouseholdSpent = 0
  let myTotalPaid = 0
  let myTotalShare = 0
  let totalPaidExpenses = 0
  let totalPendingExpenses = 0

  const memberTotals: Record<string, { totalPaid: number; totalShare: number }> = {}
  for (const m of householdData.members) {
    memberTotals[m.userId] = { totalPaid: 0, totalShare: 0 }
  }

  const expenseViews: HouseholdExpenseView[] = []
  const settlements: SettlementRecord[] = []

  if (expenses && expenses.length > 0) {
    for (const exp of expenses) {
      const amt = Number(exp.amount)
      totalHouseholdSpent += amt

      if (exp.paid_by_user_id === user.id) {
        myTotalPaid += amt
      }
      if (memberTotals[exp.paid_by_user_id]) {
        memberTotals[exp.paid_by_user_id].totalPaid += amt
      }

      // Read metadata from notes / upi ref
      let meta: any = {}
      try {
        const participantWithMeta = exp.participants?.find((p: any) => p.upi_transaction_ref && p.upi_transaction_ref.startsWith('{'))
        if (participantWithMeta) {
          meta = JSON.parse(participantWithMeta.upi_transaction_ref)
        }
      } catch {}

      // Calculate my share & participant shares
      let myShareAmt = 0
      let allSettled = true

      const parsedParticipants = (exp.participants || []).map((p: any) => {
        const pAmt = Number(p.share_amount)
        if (memberTotals[p.user_id]) {
          memberTotals[p.user_id].totalShare += pAmt
        }
        if (p.user_id === user.id) {
          myShareAmt = pAmt
        }
        if (!p.is_settled && p.user_id !== exp.paid_by_user_id) {
          allSettled = false
        }
        return {
          userId: p.user_id,
          fullName: p.profile?.full_name || 'Member',
          shareAmount: pAmt,
          isSettled: p.is_settled,
        }
      })

      if (allSettled) totalPaidExpenses += amt
      else totalPendingExpenses += amt

      // Reverse map category
      const catKey = (Object.keys(CATEGORY_META) as ExpenseCategory[]).find(
        (k) => CATEGORY_META[k].dbCategory === exp.category
      ) || (exp.category === 'rent' ? 'rent' : 'custom')

      const dateObj = new Date(exp.created_at)
      const dateDisplay = dateObj.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      })

      const paidMember = householdData.members.find((m) => m.userId === exp.paid_by_user_id)

      expenseViews.push({
        id: exp.id,
        title: exp.title,
        category: catKey,
        categoryLabel: CATEGORY_META[catKey]?.label || 'Expense',
        amount: amt,
        splitMethod: (meta.splitMethod || exp.split_method || 'equal') as SplitMethod,
        paidByUserId: exp.paid_by_user_id,
        paidByName: paidMember?.fullName || (exp.paid_by_user_id === user.id ? 'You' : 'Household Member'),
        isPaidByMe: exp.paid_by_user_id === user.id,
        myShare: myShareAmt,
        createdAt: exp.created_at,
        dateDisplay,
        status: allSettled ? 'settled' : 'pending',
        receiptUrl: meta.receiptUrl || null,
        assignedToName: meta.assignedToName,
        participants: parsedParticipants,
      })

      // Extract settlements if recorded
      if (meta.settlements && Array.isArray(meta.settlements)) {
        for (const s of meta.settlements) {
          settlements.push(s)
        }
      }
    }
  }

  // 5. Member Balances & Simplified Debts
  const memberBalances: MemberFinancialSummary[] = householdData.members.map((m) => {
    const paid = memberTotals[m.userId]?.totalPaid || 0
    const share = memberTotals[m.userId]?.totalShare || 0
    const net = paid - share
    return {
      userId: m.userId,
      fullName: m.fullName,
      avatarUrl: m.avatarUrl,
      totalPaid: paid,
      totalShare: share,
      netBalance: net,
      status: net > 0 ? 'owed' : net < 0 ? 'owes' : 'settled',
    }
  })

  // Calculate pairwise simplified debts
  const simplifiedDebts: SimplifiedDebt[] = []
  const debtors = memberBalances.filter((m) => m.netBalance < -1).map((m) => ({ ...m, owes: Math.abs(m.netBalance) }))
  const creditors = memberBalances.filter((m) => m.netBalance > 1).map((m) => ({ ...m, owed: m.netBalance }))

  let dIdx = 0
  let cIdx = 0
  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx]
    const creditor = creditors[cIdx]
    const settleAmt = Math.min(debtor.owes, creditor.owed)

    if (settleAmt > 0) {
      simplifiedDebts.push({
        fromUserId: debtor.userId,
        fromUserName: debtor.fullName,
        toUserId: creditor.userId,
        toUserName: creditor.fullName,
        amount: Math.round(settleAmt),
      })
    }

    debtor.owes -= settleAmt
    creditor.owed -= settleAmt

    if (debtor.owes < 1) dIdx++
    if (creditor.owed < 1) cIdx++
  }

  // Current user net
  const myNet = myTotalPaid - myTotalShare

  emptyResult.financialSummary = {
    totalHouseholdExpenses: totalHouseholdSpent,
    myTotalPaid,
    myTotalShare,
    myNetBalance: Math.abs(Math.round(myNet)),
    myNetStatus: myNet > 1 ? 'you_are_owed' : myNet < -1 ? 'you_owe' : 'all_settled',
    totalPaidExpenses,
    totalPendingExpenses,
  }
  emptyResult.memberBalances = memberBalances
  emptyResult.simplifiedDebts = simplifiedDebts
  emptyResult.recentExpenses = expenseViews
  emptyResult.settlementHistory = settlements.sort((a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime())

  // Generate available months (last 6 months)
  const availableMonths: string[] = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    availableMonths.push(d.toISOString().slice(0, 7))
  }
  emptyResult.availableMonths = availableMonths

  return emptyResult
}

/**
 * Create a new household group
 */
export async function createHouseholdAction(data: {
  name: string
  city: string
  address?: string
  monthlyRent?: number
  rentDueDay?: number
}): Promise<{ success: boolean; householdId?: string; error?: string }> {
  const { db, user } = await getDb()
  if (!user) return { success: false, error: 'Authentication required' }

  if (!data.name.trim()) return { success: false, error: 'Please enter a household name' }

  try {
    const { data: profile } = await db
      .from('profiles')
      .select('id, full_name, avatar_url, city, occupation, preferred_location')
      .eq('id', user.id)
      .maybeSingle()

    const householdId = `house-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const curatorMember: HouseholdMember = {
      userId: user.id,
      fullName: profile?.full_name || 'Curator',
      avatarUrl: profile?.avatar_url || null,
      city: data.city || profile?.city || 'Pune',
      occupation: profile?.occupation || 'Co-Liver',
      role: 'curator',
      joinedAt: new Date().toISOString(),
    }

    const newHousehold: HouseholdData = {
      id: householdId,
      name: data.name.trim(),
      city: data.city || profile?.city || 'Pune',
      address: data.address?.trim() || '',
      monthlyRent: Number(data.monthlyRent) || 0,
      rentDueDay: Number(data.rentDueDay) || 1,
      curatorId: user.id,
      createdAt: new Date().toISOString(),
      members: [curatorMember],
      history: [
        {
          id: `hist-${Date.now()}`,
          action: 'Household Created',
          by: curatorMember.fullName,
          at: new Date().toISOString(),
          details: `Formed household "${data.name.trim()}" in ${data.city || 'Pune'}.`,
        },
      ],
    }

    let profileLoc: any = {}
    try {
      profileLoc = JSON.parse(profile?.preferred_location || '{}')
    } catch {}

    profileLoc.household_group = newHousehold

    await db
      .from('profiles')
      .update({ preferred_location: JSON.stringify(profileLoc) })
      .eq('id', user.id)

    revalidatePath('/expenses')

    return { success: true, householdId }
  } catch (err: any) {
    console.error('Error creating household:', err)
    return { success: false, error: err.message || 'Failed to create household' }
  }
}

/**
 * Invite a roommate to the household
 */
export async function sendRoommateInvitationAction(data: {
  householdId: string
  identifier: string // email or user full name or user ID
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const { db, user } = await getDb()
  if (!user) return { success: false, error: 'Authentication required' }

  try {
    // 1. Fetch inviter profile
    const { data: inviterProfile } = await db
      .from('profiles')
      .select('id, full_name, avatar_url, preferred_location')
      .eq('id', user.id)
      .maybeSingle()

    let inviterLoc: any = {}
    try {
      inviterLoc = JSON.parse(inviterProfile?.preferred_location || '{}')
    } catch {}

    const household: HouseholdData = inviterLoc.household_group
    if (!household || household.id !== data.householdId) {
      return { success: false, error: 'Household not found or access unauthorized' }
    }

    // 2. Search for invitee in profiles
    const cleanId = data.identifier.trim()
    let inviteeUser: any = null

    // Search by exact ID
    const { data: byId } = await db.from('profiles').select('id, full_name, preferred_location').eq('id', cleanId).maybeSingle()
    if (byId) inviteeUser = byId

    // Search by full name ilike
    if (!inviteeUser) {
      const { data: byName } = await db.from('profiles').select('id, full_name, preferred_location').ilike('full_name', `%${cleanId}%`).maybeSingle()
      if (byName) inviteeUser = byName
    }

    if (!inviteeUser) {
      return {
        success: false,
        error: `Could not find a registered member matching "${cleanId}". Make sure they have completed YAARO onboarding.`,
      }
    }

    if (inviteeUser.id === user.id) {
      return { success: false, error: 'You are already the curator of this household.' }
    }

    // Check if already a member
    if (household.members.some((m) => m.userId === inviteeUser.id)) {
      return { success: false, error: `${inviteeUser.full_name} is already a member of this household.` }
    }

    // 3. Create invitation object
    const invitation: HouseholdInvitation = {
      id: `inv-${Date.now()}`,
      householdId: household.id,
      householdName: household.name,
      householdCity: household.city,
      invitedBy: {
        id: user.id,
        fullName: inviterProfile?.full_name || 'Household Curator',
        avatarUrl: inviterProfile?.avatar_url || null,
      },
      inviteeUserId: inviteeUser.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    // 4. Save to invitee profile
    let inviteeLoc: any = {}
    try {
      inviteeLoc = JSON.parse(inviteeUser.preferred_location || '{}')
    } catch {}

    const existingInvites: HouseholdInvitation[] = inviteeLoc.household_invitations_received || []
    inviteeLoc.household_invitations_received = [
      invitation,
      ...existingInvites.filter((i) => i.householdId !== household.id),
    ]

    await db
      .from('profiles')
      .update({ preferred_location: JSON.stringify(inviteeLoc) })
      .eq('id', inviteeUser.id)

    // 5. Record in household history
    household.history.push({
      id: `hist-${Date.now()}`,
      action: 'Invitation Dispatched',
      by: inviterProfile?.full_name || 'Curator',
      at: new Date().toISOString(),
      details: `Invited ${inviteeUser.full_name} to join household.`,
    })

    inviterLoc.household_group = household
    await db
      .from('profiles')
      .update({ preferred_location: JSON.stringify(inviterLoc) })
      .eq('id', user.id)

    // 6. Notify invitee
    await createNotification({
      userId: inviteeUser.id,
      type: 'household_invitation',
      title: 'Household Invitation! 🏡',
      body: `${inviterProfile?.full_name || 'A flatmate'} invited you to join "${household.name}" (${household.city}) on YAARO.`,
      actionUrl: '/expenses',
    })

    revalidatePath('/expenses')
    return { success: true, message: `Invitation sent to ${inviteeUser.full_name}!` }
  } catch (err: any) {
    console.error('Failed to send invitation:', err)
    return { success: false, error: err.message || 'Failed to send invitation' }
  }
}

/**
 * Respond to an invitation (accept or decline)
 */
export async function respondToHouseholdInvitationAction(data: {
  invitationId: string
  action: 'accept' | 'decline'
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const { db, user } = await getDb()
  if (!user) return { success: false, error: 'Authentication required' }

  try {
    // 1. Fetch current profile
    const { data: myProfile } = await db
      .from('profiles')
      .select('id, full_name, avatar_url, city, occupation, preferred_location')
      .eq('id', user.id)
      .maybeSingle()

    let myLoc: any = {}
    try {
      myLoc = JSON.parse(myProfile?.preferred_location || '{}')
    } catch {}

    const invites: HouseholdInvitation[] = myLoc.household_invitations_received || []
    const invitation = invites.find((i) => i.id === data.invitationId)

    if (!invitation) {
      return { success: false, error: 'Invitation not found or expired' }
    }

    invitation.status = data.action === 'accept' ? 'accepted' : 'declined'

    // Update invitee profile
    myLoc.household_invitations_received = invites.filter((i) => i.id !== data.invitationId)

    if (data.action === 'accept') {
      // Fetch curator profile to get current household data
      const { data: curatorProfile } = await db
        .from('profiles')
        .select('id, full_name, preferred_location')
        .eq('id', invitation.invitedBy.id)
        .maybeSingle()

      let curatorLoc: any = {}
      try {
        curatorLoc = JSON.parse(curatorProfile?.preferred_location || '{}')
      } catch {}

      const household: HouseholdData = curatorLoc.household_group
      if (household && household.id === invitation.householdId) {
        const newMember: HouseholdMember = {
          userId: user.id,
          fullName: myProfile?.full_name || 'Roommate',
          avatarUrl: myProfile?.avatar_url || null,
          city: household.city,
          occupation: myProfile?.occupation || 'Co-Liver',
          role: 'member',
          joinedAt: new Date().toISOString(),
        }

        // Add to household
        if (!household.members.some((m) => m.userId === user.id)) {
          household.members.push(newMember)
        }

        household.history.push({
          id: `hist-${Date.now()}`,
          action: 'Member Joined',
          by: newMember.fullName,
          at: new Date().toISOString(),
          details: `${newMember.fullName} accepted invitation and joined the household.`,
        })

        // Save updated household on curator and my profile
        curatorLoc.household_group = household
        await db.from('profiles').update({ preferred_location: JSON.stringify(curatorLoc) }).eq('id', curatorProfile.id)

        // Save on my profile
        myLoc.household_group = household

        // Propagate updated members to all existing members
        for (const m of household.members) {
          if (m.userId !== user.id && m.userId !== curatorProfile.id) {
            const { data: memberProf } = await db.from('profiles').select('preferred_location').eq('id', m.userId).maybeSingle()
            if (memberProf) {
              let mLoc: any = {}
              try { mLoc = JSON.parse(memberProf.preferred_location || '{}') } catch {}
              mLoc.household_group = household
              await db.from('profiles').update({ preferred_location: JSON.stringify(mLoc) }).eq('id', m.userId)
            }
          }
        }

        // Notify curator
        await createNotification({
          userId: curatorProfile.id,
          type: 'member_joined_household',
          title: 'New Roommate Joined! 🤝',
          body: `${newMember.fullName} accepted your invitation to join "${household.name}".`,
          actionUrl: '/expenses',
        })
      }
    }

    await db.from('profiles').update({ preferred_location: JSON.stringify(myLoc) }).eq('id', user.id)

    revalidatePath('/expenses')
    return {
      success: true,
      message: data.action === 'accept' ? 'Welcome to the household!' : 'Invitation declined.',
    }
  } catch (err: any) {
    console.error('Error responding to invitation:', err)
    return { success: false, error: err.message || 'Failed to update invitation' }
  }
}

/**
 * Leave a household group
 */
export async function leaveHouseholdAction(householdId: string): Promise<{ success: boolean; error?: string }> {
  const { db, user } = await getDb()
  if (!user) return { success: false, error: 'Authentication required' }

  try {
    const { data: myProfile } = await db
      .from('profiles')
      .select('id, full_name, preferred_location')
      .eq('id', user.id)
      .maybeSingle()

    let myLoc: any = {}
    try { myLoc = JSON.parse(myProfile?.preferred_location || '{}') } catch {}

    const household: HouseholdData = myLoc.household_group
    if (!household || household.id !== householdId) {
      return { success: false, error: 'Household not found' }
    }

    // Remove user from members
    const updatedMembers = household.members.filter((m) => m.userId !== user.id)
    const wasCurator = household.curatorId === user.id

    // Transfer curator role if curator left and members remain
    if (wasCurator && updatedMembers.length > 0) {
      updatedMembers[0].role = 'curator'
      household.curatorId = updatedMembers[0].userId
    }

    household.members = updatedMembers
    household.history.push({
      id: `hist-${Date.now()}`,
      action: 'Member Left',
      by: myProfile?.full_name || 'Member',
      at: new Date().toISOString(),
      details: `${myProfile?.full_name || 'Member'} left the household.`,
    })

    // Remove household from my profile
    delete myLoc.household_group
    await db.from('profiles').update({ preferred_location: JSON.stringify(myLoc) }).eq('id', user.id)

    // Sync updated household across remaining members
    for (const m of updatedMembers) {
      const { data: memberProf } = await db.from('profiles').select('preferred_location').eq('id', m.userId).maybeSingle()
      if (memberProf) {
        let mLoc: any = {}
        try { mLoc = JSON.parse(memberProf.preferred_location || '{}') } catch {}
        mLoc.household_group = household
        await db.from('profiles').update({ preferred_location: JSON.stringify(mLoc) }).eq('id', m.userId)
      }
    }

    revalidatePath('/expenses')
    return { success: true }
  } catch (err: any) {
    console.error('Error leaving household:', err)
    return { success: false, error: err.message || 'Failed to leave household' }
  }
}

/* -------------------------------------------------------------------------- */
/*                        PART B & C: EXPENSES & SPLITTING                     */
/* -------------------------------------------------------------------------- */

/**
 * Add a new shared household expense supporting all 8 categories and 4 split methods
 */
export async function addHouseholdExpenseAction(input: AddHouseholdExpenseInput): Promise<{
  success: boolean
  expenseId?: string
  error?: string
}> {
  const { db, user } = await getDb()
  if (!user) return { success: false, error: 'Authentication required' }

  if (!input.title.trim()) return { success: false, error: 'Please enter an expense title' }
  const totalAmt = Number(input.amount)
  if (isNaN(totalAmt) || totalAmt <= 0) return { success: false, error: 'Please enter a valid amount' }

  try {
    // 1. Fetch current profile & household
    const { data: myProfile } = await db
      .from('profiles')
      .select('id, full_name, preferred_location')
      .eq('id', user.id)
      .maybeSingle()

    let myLoc: any = {}
    try { myLoc = JSON.parse(myProfile?.preferred_location || '{}') } catch {}

    const household: HouseholdData = myLoc.household_group
    if (!household || household.id !== input.householdId) {
      return { success: false, error: 'Household not authorized' }
    }

    // 2. Validate participants and split logic
    let resolvedParticipants: ParticipantShareInput[] = []

    if (input.splitMethod === 'equal') {
      const activeMembers = household.members
      const sharePerPerson = Math.round((totalAmt / activeMembers.length) * 100) / 100
      let runningSum = 0

      resolvedParticipants = activeMembers.map((m, idx) => {
        let share = sharePerPerson
        if (idx === activeMembers.length - 1) {
          share = Math.round((totalAmt - runningSum) * 100) / 100 // adjust rounding
        }
        runningSum += share
        return { userId: m.userId, amount: share }
      })
    } else if (input.splitMethod === 'custom_shares') {
      const sum = input.participants.reduce((acc, p) => acc + Number(p.amount || 0), 0)
      if (Math.abs(sum - totalAmt) > 1) {
        return { success: false, error: `Sum of custom shares (₹${sum}) must equal total amount (₹${totalAmt})` }
      }
      resolvedParticipants = input.participants.map((p) => ({ userId: p.userId, amount: Number(p.amount) }))
    } else if (input.splitMethod === 'percentage') {
      const sumPct = input.participants.reduce((acc, p) => acc + Number(p.percentage || 0), 0)
      if (Math.abs(sumPct - 100) > 1) {
        return { success: false, error: `Sum of percentages (${sumPct}%) must equal 100%` }
      }
      resolvedParticipants = input.participants.map((p) => {
        const amt = Math.round((totalAmt * (Number(p.percentage) / 100)) * 100) / 100
        return { userId: p.userId, amount: amt, percentage: Number(p.percentage) }
      })
    } else if (input.splitMethod === 'individual_assigned') {
      if (!input.assignedToUserId) {
        return { success: false, error: 'Please choose which roommate this expense is assigned to' }
      }
      resolvedParticipants = [
        { userId: input.assignedToUserId, amount: totalAmt },
      ]
    }

    // 3. Insert into shared_expenses
    const catMeta = CATEGORY_META[input.category] || CATEGORY_META.custom
    const assignedMember = input.assignedToUserId
      ? household.members.find((m) => m.userId === input.assignedToUserId)
      : undefined

    const { data: newExp, error: expError } = await db
      .from('shared_expenses')
      .insert({
        paid_by_user_id: user.id,
        flat_group_id: household.id,
        title: input.title.trim(),
        category: catMeta.dbCategory,
        amount: totalAmt,
        split_method: input.splitMethod === 'equal' ? 'equal' : input.splitMethod === 'percentage' ? 'percentage' : 'custom_shares',
        status: 'pending',
      })
      .select('id')
      .single()

    if (expError || !newExp) {
      console.error('Failed to create shared expense:', expError)
      return { success: false, error: expError?.message || 'Database error creating expense' }
    }

    // 4. Insert participants
    const metaPayload = JSON.stringify({
      splitMethod: input.splitMethod,
      category: input.category,
      receiptUrl: input.receiptUrl || null,
      notes: input.notes || null,
      assignedToName: assignedMember?.fullName,
      createdBy: myProfile?.full_name || 'Member',
    })

    const participantRows = resolvedParticipants.map((p) => ({
      expense_id: newExp.id,
      user_id: p.userId,
      share_amount: p.amount,
      is_settled: p.userId === user.id, // the payer's own share is already settled
      settled_at: p.userId === user.id ? new Date().toISOString() : null,
      upi_transaction_ref: metaPayload,
    }))

    const { error: partError } = await db.from('expense_participants').insert(participantRows)
    if (partError) {
      console.error('Failed to insert participants:', partError)
    }

    // 5. Notify all other household members
    const notifyPromises = household.members
      .filter((m) => m.userId !== user.id)
      .map((m) =>
        createNotification({
          userId: m.userId,
          type: 'new_household_expense',
          title: `New Expense: ₹${totalAmt.toLocaleString('en-IN')}`,
          body: `${myProfile?.full_name || 'A flatmate'} added "${input.title}" (${catMeta.label}) to the household ledger.`,
          actionUrl: '/expenses',
        })
      )

    await Promise.allSettled(notifyPromises)

    revalidatePath('/expenses')
    return { success: true, expenseId: newExp.id }
  } catch (err: any) {
    console.error('Failed to add household expense:', err)
    return { success: false, error: err.message || 'Failed to add expense' }
  }
}

/* -------------------------------------------------------------------------- */
/*                         PART D & E: SETTLEMENT ENGINE                      */
/* -------------------------------------------------------------------------- */

/**
 * Record a settlement between two household members (without claiming false automated banking)
 */
export async function recordHouseholdSettlementAction(data: {
  householdId: string
  toUserId: string
  amount: number
  method: 'UPI' | 'Cash' | 'Bank Transfer'
  reference?: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  const { db, user } = await getDb()
  if (!user) return { success: false, error: 'Authentication required' }

  const settleAmt = Number(data.amount)
  if (isNaN(settleAmt) || settleAmt <= 0) return { success: false, error: 'Invalid settlement amount' }

  try {
    const { data: myProfile } = await db
      .from('profiles')
      .select('id, full_name, preferred_location')
      .eq('id', user.id)
      .maybeSingle()

    const { data: recipientProfile } = await db
      .from('profiles')
      .select('id, full_name')
      .eq('id', data.toUserId)
      .maybeSingle()

    let myLoc: any = {}
    try { myLoc = JSON.parse(myProfile?.preferred_location || '{}') } catch {}

    const household: HouseholdData = myLoc.household_group
    if (!household || household.id !== data.householdId) {
      return { success: false, error: 'Household not authorized' }
    }

    // 1. Mark pending participant shares between these two users as settled
    const { data: pendingExpenses } = await db
      .from('shared_expenses')
      .select('id, paid_by_user_id, participants:expense_participants(*)')
      .eq('flat_group_id', household.id)
      .eq('paid_by_user_id', data.toUserId)

    if (pendingExpenses && pendingExpenses.length > 0) {
      for (const exp of pendingExpenses) {
        const myParticipant = (exp.participants || []).find((p: any) => p.user_id === user.id && !p.is_settled)
        if (myParticipant) {
          await db
            .from('expense_participants')
            .update({
              is_settled: true,
              settled_at: new Date().toISOString(),
              upi_transaction_ref: JSON.stringify({
                settledVia: data.method,
                ref: data.reference || `SETTLE-${Date.now().toString().slice(-6)}`,
                notes: data.notes || 'Recorded settlement',
              }),
            })
            .eq('id', myParticipant.id)
        }
      }
    }

    // 2. Record settlement in household history
    const record: SettlementRecord = {
      id: `settle-${Date.now()}`,
      fromUserId: user.id,
      fromUserName: myProfile?.full_name || 'Member',
      toUserId: data.toUserId,
      toUserName: recipientProfile?.full_name || 'Member',
      amount: settleAmt,
      method: data.method,
      reference: data.reference || `REF-${Date.now().toString().slice(-6)}`,
      settledAt: new Date().toISOString(),
      notes: data.notes,
    }

    household.history.push({
      id: `hist-${Date.now()}`,
      action: 'Settlement Recorded',
      by: myProfile?.full_name || 'Member',
      at: new Date().toISOString(),
      details: `${myProfile?.full_name || 'Member'} settled ₹${settleAmt.toLocaleString('en-IN')} with ${recipientProfile?.full_name || 'Member'} via ${data.method}.`,
    })

    // Sync updated history
    myLoc.household_group = household
    await db.from('profiles').update({ preferred_location: JSON.stringify(myLoc) }).eq('id', user.id)

    // Notify recipient
    await createNotification({
      userId: data.toUserId,
      type: 'household_settlement',
      title: `Settlement Recorded: ₹${settleAmt.toLocaleString('en-IN')} 💳`,
      body: `${myProfile?.full_name || 'A flatmate'} recorded a settlement of ₹${settleAmt.toLocaleString('en-IN')} via ${data.method}. Ref: ${record.reference}`,
      actionUrl: '/expenses',
    })

    revalidatePath('/expenses')
    return { success: true }
  } catch (err: any) {
    console.error('Error recording settlement:', err)
    return { success: false, error: err.message || 'Failed to record settlement' }
  }
}
