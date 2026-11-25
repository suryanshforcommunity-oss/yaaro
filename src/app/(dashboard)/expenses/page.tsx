'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  Receipt,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  DollarSign,
  Coffee,
  Sparkles,
  Upload,
  Calendar,
  Users,
  Home,
  ShieldCheck,
  Eye,
  AlertTriangle,
  ChevronDown,
  Check,
  X,
  CreditCard,
  History,
  QrCode,
  Tag,
  Clock,
} from 'lucide-react'
import EditorialNavigation from '@/components/EditorialNavigation'
import {
  getSplitLedgerState,
  confirmFlatmateConnectionAction,
  saveFlatSetupAction,
  getMonthlyLedger,
  addSharedExpenseAction,
  confirmExpenseAction,
  disputeExpenseAction,
  recordSettlementAction,
  uploadBillAttachmentAction,
  SplitLedgerState,
  MonthlyLedgerSummary,
  ExpenseItemView,
} from './actions'

export default function ExpensesPage() {
  const [loading, setLoading] = useState(true)
  const [ledgerState, setLedgerState] = useState<SplitLedgerState | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyLedgerSummary | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7))
  const [isPending, startTransition] = useTransition()

  // Modals state
  const [showFlatSetupModal, setShowFlatSetupModal] = useState(false)
  const [showUploadBillModal, setShowUploadBillModal] = useState(false)
  const [showManualExpenseModal, setShowManualExpenseModal] = useState(false)
  const [showSettleModal, setShowSettleModal] = useState(false)
  const [viewingAttachmentUrl, setViewingAttachmentUrl] = useState<string | null>(null)
  const [disputeModalExpense, setDisputeModalExpense] = useState<ExpenseItemView | null>(null)
  const [disputeReason, setDisputeReason] = useState('')

  // Flat Setup Form State
  const [flatName, setFlatName] = useState('')
  const [flatCity, setFlatCity] = useState('Pune')
  const [flatLocality, setFlatLocality] = useState('Hinjewadi')
  const [monthlyRentInput, setMonthlyRentInput] = useState('24000')
  const [rentSplitType, setRentSplitType] = useState<'equal' | 'percentage' | 'custom'>('equal')
  const [myRentShareInput, setMyRentShareInput] = useState('12000')
  const [flatmateRentShareInput, setFlatmateRentShareInput] = useState('12000')
  const [rentDueDay, setRentDueDay] = useState('5')
  const [securityDepositInput, setSecurityDepositInput] = useState('48000')
  const [agreementStartDate, setAgreementStartDate] = useState('2026-11-01')
  const [agreementEndDate, setAgreementEndDate] = useState('2027-10-31')
  const [agreementFileUrl, setAgreementFileUrl] = useState<string | null>(null)

  // Upload Bill Form State
  const [billCategory, setBillCategory] = useState('electricity')
  const [billFile, setBillFile] = useState<File | null>(null)
  const [isOcrProcessing, setIsOcrProcessing] = useState(false)
  const [ocrResult, setOcrResult] = useState<any>(null)
  const [billTitle, setBillTitle] = useState('')
  const [billTotalAmount, setBillTotalAmount] = useState('')
  const [billSplitMethod, setBillSplitMethod] = useState<'equal' | 'percentage' | 'custom'>('equal')
  const [groceryItems, setGroceryItems] = useState<Array<{ name: string; price: number; isShared: boolean }>>([])

  // Manual Expense Form State
  const [manualTitle, setManualTitle] = useState('')
  const [manualCategory, setManualCategory] = useState('wifi_broadband')
  const [manualAmount, setManualAmount] = useState('')
  const [manualSplitMethod, setManualSplitMethod] = useState<'equal' | 'percentage' | 'custom'>('equal')
  const [manualNotes, setManualNotes] = useState('')

  // Settle Up Form State
  const [settleAmount, setSettleAmount] = useState('')
  const [settleMethod, setSettleMethod] = useState<'upi' | 'bank_transfer' | 'cash'>('upi')
  const [settleUpiRef, setSettleUpiRef] = useState('')
  const [settleSuccessMsg, setSettleSuccessMsg] = useState<string | null>(null)

  // Load Initial State
  const loadStateAndData = async (month?: string) => {
    try {
      const state = await getSplitLedgerState()
      setLedgerState(state)

      if (state.state === 5) {
        const mData = await getMonthlyLedger(month || selectedMonth)
        setMonthlyData(mData)
        if (state.flatDetails) {
          setFlatName(state.flatDetails.flatName)
          setFlatCity(state.flatDetails.city)
          setFlatLocality(state.flatDetails.locality)
          setMonthlyRentInput(state.flatDetails.monthlyRent.toString())
          setMyRentShareInput(state.flatDetails.myShare.toString())
          setFlatmateRentShareInput(state.flatDetails.flatmateShare.toString())
        }
      }
    } catch (err) {
      console.error('Error loading ledger:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStateAndData()
  }, [])

  // Month Switcher Handler
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth)
    startTransition(async () => {
      const mData = await getMonthlyLedger(newMonth)
      setMonthlyData(mData)
    })
  }

  // Confirm Flatmate Connection (State 3 -> State 4)
  const handleConfirmFlatmate = async (partnerId: string) => {
    startTransition(async () => {
      const res = await confirmFlatmateConnectionAction(partnerId)
      if (res.success) {
        await loadStateAndData()
        setShowFlatSetupModal(true)
      }
    })
  }

  // Save Flat Setup (State 4 -> State 5)
  const handleSaveFlatSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    const rent = parseFloat(monthlyRentInput) || 24000
    const myShare = parseFloat(myRentShareInput) || Math.round(rent / 2)
    const partnerShare = parseFloat(flatmateRentShareInput) || (rent - myShare)
    const deposit = parseFloat(securityDepositInput) || rent * 2
    const due = parseInt(rentDueDay, 10) || 5

    startTransition(async () => {
      const res = await saveFlatSetupAction({
        flatName: flatName.trim() || `${flatLocality} Co-Living Suite`,
        city: flatCity,
        locality: flatLocality,
        monthlyRent: rent,
        myShare,
        flatmateShare: partnerShare,
        rentSplitType,
        dueDay: due,
        securityDeposit: deposit,
        agreementStartDate,
        agreementEndDate,
        agreementUrl: agreementFileUrl,
      })
      if (res.success) {
        setShowFlatSetupModal(false)
        await loadStateAndData()
      }
    })
  }

  // Handle Agreement File Upload in Setup Modal
  const handleAgreementUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('billCategory', 'rent_agreement')

    setIsOcrProcessing(true)
    const res = await uploadBillAttachmentAction(formData)
    setIsOcrProcessing(false)

    if (res.success && res.extractedData) {
      setAgreementFileUrl(res.fileUrl || null)
      if (res.extractedData.totalAmount) {
        setMonthlyRentInput(res.extractedData.totalAmount.toString())
        setMyRentShareInput(Math.round(res.extractedData.totalAmount / 2).toString())
        setFlatmateRentShareInput(Math.round(res.extractedData.totalAmount / 2).toString())
      }
      if (res.extractedData.securityDeposit) {
        setSecurityDepositInput(res.extractedData.securityDeposit.toString())
      }
    }
  }

  // Handle Bill Upload & OCR Extraction
  const handleBillFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBillFile(file)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('billCategory', billCategory)

    setIsOcrProcessing(true)
    const res = await uploadBillAttachmentAction(formData)
    setIsOcrProcessing(false)

    if (res.success && res.extractedData) {
      setOcrResult(res)
      setBillTotalAmount(res.extractedData.totalAmount.toString())
      setBillTitle(
        billCategory === 'electricity'
          ? `${res.extractedData.provider || 'Electricity'} Bill (${new Date().toLocaleDateString('en-US', { month: 'short' })})`
          : billCategory === 'groceries'
          ? `${res.extractedData.provider || 'Grocery'} Essentials`
          : `${file.name.split('.')[0]}`
      )
      if (res.extractedData.items) {
        setGroceryItems(res.extractedData.items)
      }
    }
  }

  // Toggle grocery item shared vs personal
  const handleToggleGroceryItem = (idx: number) => {
    const updated = [...groceryItems]
    updated[idx].isShared = !updated[idx].isShared
    setGroceryItems(updated)

    // Recalculate shared total
    const sharedSum = updated.filter((i) => i.isShared).reduce((a, b) => a + b.price, 0)
    setBillTotalAmount(sharedSum.toString())
  }

  // Submit Uploaded Bill Expense
  const handleSubmitBillExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(billTotalAmount)
    if (!billTitle.trim() || isNaN(amt) || amt <= 0) return

    startTransition(async () => {
      const res = await addSharedExpenseAction({
        title: billTitle.trim(),
        category: billCategory === 'electricity' ? 'electricity_bescom' : billCategory === 'groceries' ? 'groceries_blinkit' : 'other',
        amount: amt,
        splitMethod: billSplitMethod,
        billUrl: ocrResult?.fileUrl || null,
        ocrData: ocrResult?.extractedData || null,
        notes: groceryItems.length > 0 ? `Shared grocery items from ${ocrResult?.extractedData?.provider || 'receipt'}` : '',
      })
      if (res.success) {
        setShowUploadBillModal(false)
        setBillFile(null)
        setOcrResult(null)
        await loadStateAndData()
      }
    })
  }

  // Submit Manual Expense
  const handleSubmitManualExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(manualAmount)
    if (!manualTitle.trim() || isNaN(amt) || amt <= 0) return

    startTransition(async () => {
      const res = await addSharedExpenseAction({
        title: manualTitle.trim(),
        category: manualCategory,
        amount: amt,
        splitMethod: manualSplitMethod,
        notes: manualNotes.trim(),
      })
      if (res.success) {
        setShowManualExpenseModal(false)
        setManualTitle('')
        setManualAmount('')
        setManualNotes('')
        await loadStateAndData()
      }
    })
  }

  // Confirm Expense
  const handleConfirmExpense = async (expenseId: string) => {
    startTransition(async () => {
      await confirmExpenseAction(expenseId)
      await loadStateAndData()
    })
  }

  // Submit Dispute
  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disputeModalExpense || !disputeReason.trim()) return

    startTransition(async () => {
      await disputeExpenseAction(disputeModalExpense.id, disputeReason.trim())
      setDisputeModalExpense(null)
      setDisputeReason('')
      await loadStateAndData()
    })
  }

  // Record Settlement
  const handleRecordSettlement = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(settleAmount)
    if (isNaN(amt) || amt <= 0) return

    startTransition(async () => {
      const res = await recordSettlementAction({
        amount: amt,
        settlementMethod: settleMethod,
        upiTransactionRef: settleUpiRef.trim() || undefined,
      })
      if (res.success) {
        setSettleSuccessMsg(`Settlement of ₹${amt.toLocaleString()} recorded successfully!`)
        setTimeout(() => {
          setSettleSuccessMsg(null)
          setShowSettleModal(false)
        }, 1500)
        await loadStateAndData()
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white pb-24 lg:pb-12">
        <EditorialNavigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
          <h2 className="text-3xl font-black uppercase text-deepgreen font-serif">
            Loading Split Ledger...
          </h2>
          <p className="font-serif italic text-sm text-deepgreen/70">
            Checking authentic flatmate relationships and shared domestic accounts.
          </p>
        </main>
      </div>
    )
  }

  const state = ledgerState?.state || 1

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white pb-24 lg:pb-12">
      <EditorialNavigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* =========================================================================
            STATE 1: NEW USER — NO FLAT AND NO CONFIRMED FLATMATE
           ========================================================================= */}
        {state === 1 && (
          <div className="border-2 border-deepgreen bg-cream-light p-8 sm:p-14 shadow-[8px_8px_0px_#263F32] text-center space-y-6 max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-full border-2 border-deepgreen bg-butter mx-auto flex items-center justify-center text-2xl shadow-[2px_2px_0px_#263F32]">
              🤝
            </div>
            <div className="space-y-2">
              <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-tomato px-2.5 py-1 bg-tomato/10 border border-tomato inline-block">
                DOMESTIC LEDGER INACTIVE
              </span>
              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-deepgreen font-serif">
                Your ledger starts with your flatmate.
              </h1>
              <p className="font-serif italic text-base text-deepgreen/80 max-w-lg mx-auto">
                Find your flatmate or join a flat to start tracking shared expenses, rent, and settlements.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/discover"
                className="w-full sm:w-auto px-8 py-3.5 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs border border-deepgreen shadow-[3px_3px_0px_#263F32] transition-colors"
              >
                Find a Flatmate ↗
              </Link>
              <Link
                href="/rooms"
                className="w-full sm:w-auto px-8 py-3.5 bg-cream hover:bg-butter text-deepgreen font-serif font-bold uppercase tracking-wider text-xs border-2 border-deepgreen shadow-[3px_3px_0px_#263F32] transition-colors"
              >
                Explore Flats ↗
              </Link>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 2: USER OWNS OR HAS FOUND A FLAT BUT HASN'T FOUND A FLATMATE
           ========================================================================= */}
        {state === 2 && (
          <div className="border-2 border-deepgreen bg-cream-light p-8 sm:p-14 shadow-[8px_8px_0px_#263F32] text-center space-y-6 max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-full border-2 border-deepgreen bg-butter mx-auto flex items-center justify-center text-2xl shadow-[2px_2px_0px_#263F32]">
              🏠
            </div>
            <div className="space-y-2">
              <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-tomato px-2.5 py-1 bg-tomato/10 border border-tomato inline-block">
                FLAT VERIFIED • FLATMATE VACANT
              </span>
              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-deepgreen font-serif">
                Your flat is ready. Your flatmate isn't!
              </h1>
              <p className="font-serif italic text-base text-deepgreen/80 max-w-lg mx-auto">
                Find someone compatible to share your flat and start managing expenses together.
              </p>
            </div>

            <div className="pt-4">
              <Link
                href="/discover"
                className="inline-block px-8 py-3.5 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs border border-deepgreen shadow-[3px_3px_0px_#263F32] transition-colors"
              >
                Find a Flatmate ↗
              </Link>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 3: POTENTIAL FLATMATE FOUND, BUT CONNECTION IS NOT CONFIRMED
           ========================================================================= */}
        {state === 3 && (
          <div className="border-2 border-deepgreen bg-cream-light p-6 sm:p-10 shadow-[8px_8px_0px_#263F32] space-y-6 max-w-4xl mx-auto">
            <div className="text-center space-y-2 border-b-2 border-deepgreen pb-6">
              <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-tomato px-2.5 py-1 bg-butter border border-deepgreen inline-block">
                CONNECTION PENDING
              </span>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-deepgreen font-serif">
                Almost there!
              </h1>
              <p className="font-serif italic text-sm text-deepgreen/80 max-w-xl mx-auto">
                Confirm your flatmate connection and complete your flat setup to activate your shared ledger.
              </p>
            </div>

            {/* List of prospective matched flatmates */}
            <div className="space-y-4">
              <h3 className="font-sans text-xs uppercase font-bold text-deepgreen tracking-wider">
                PROSPECTIVE FLATMATE CONNECTIONS ({ledgerState?.potentialMatches.length || 0})
              </h3>

              {ledgerState?.potentialMatches.map((cand) => (
                <div
                  key={cand.id}
                  className="border-2 border-deepgreen bg-cream p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[2px_2px_0px_#263F32]"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={cand.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'}
                      alt={cand.fullName}
                      className="w-14 h-14 rounded-full border-2 border-deepgreen object-cover shrink-0 shadow-[2px_2px_0px_#263F32]"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-[9px] uppercase px-1.5 py-0.5 bg-butter text-deepgreen font-bold border border-deepgreen">
                          {cand.harmonyScore}% Harmony
                        </span>
                        <span className="font-sans text-xs text-deepgreen/60">
                          📍 {cand.locality}, {cand.city}
                        </span>
                      </div>
                      <h4 className="text-xl font-black uppercase text-deepgreen">{cand.fullName}</h4>
                      <p className="font-serif italic text-xs text-deepgreen/70">
                        {cand.occupation} {cand.companyOrCollege ? `@ ${cand.companyOrCollege}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/chat?user=${cand.id}`}
                      className="px-4 py-2.5 border-2 border-deepgreen bg-cream hover:bg-butter font-serif font-bold uppercase text-xs transition-colors shadow-[2px_2px_0px_#263F32]"
                    >
                      Chat
                    </Link>
                    <button
                      onClick={() => handleConfirmFlatmate(cand.id)}
                      disabled={isPending}
                      className="px-6 py-2.5 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase text-xs tracking-wider transition-colors border border-deepgreen shadow-[2px_2px_0px_#263F32]"
                    >
                      Confirm as Flatmate 🤝
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 4: FLATMATE CONFIRMED, BUT FLAT SETUP IS INCOMPLETE
           ========================================================================= */}
        {state === 4 && (
          <div className="border-2 border-deepgreen bg-cream-light p-8 sm:p-12 shadow-[8px_8px_0px_#263F32] space-y-6 max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full border-2 border-deepgreen bg-butter mx-auto flex items-center justify-center text-2xl shadow-[2px_2px_0px_#263F32]">
              📝
            </div>
            <div className="space-y-2">
              <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-emerald-800 px-2.5 py-1 bg-emerald-100 border border-emerald-400 inline-block">
                FLATMATE CONFIRMED: {ledgerState?.flatmate?.fullName}
              </span>
              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-deepgreen font-serif">
                Complete your flat setup.
              </h1>
              <p className="font-serif italic text-base text-deepgreen/80 max-w-lg mx-auto">
                Add your rent details and flat information to start managing shared expenses.
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setShowFlatSetupModal(true)}
                className="px-8 py-3.5 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs border border-deepgreen shadow-[3px_3px_0px_#263F32] transition-colors"
              >
                Complete Flat Setup ↗
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 5: CONFIRMED FLATMATE + ESTABLISHED FLAT (FULL ACTIVE DASHBOARD)
           ========================================================================= */}
        {state === 5 && (
          <div className="space-y-8">
            {/* Top Bar with Badge, Hub Locality, and Month Selector */}
            <div className="border-b-2 border-deepgreen pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="stamp-badge font-sans text-[10px] font-bold px-2 py-0.5 bg-butter text-deepgreen">
                    ACTIVE SHARED LEDGER
                  </span>
                  <span className="font-sans text-[10px] uppercase tracking-wider text-deepgreen/70">
                    {ledgerState?.flatDetails?.flatName || 'Verified Living Hub'}
                  </span>
                  <span className="text-deepgreen/40">•</span>
                  <span className="font-sans text-[10px] uppercase font-bold text-tomato">
                    Co-Living with {ledgerState?.flatmate?.fullName}
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-deepgreen font-serif">
                  SPLIT LEDGER
                </h1>
                <p className="font-serif italic text-sm text-deepgreen/80">
                  Real-time domestic accounting, OCR bill splitting, and certified HRA rent settlements.
                </p>
              </div>

              {/* Month Selector Tabs */}
              <div className="flex items-center gap-2">
                <span className="font-sans text-xs uppercase font-bold text-deepgreen/70">PERIOD:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="border-2 border-deepgreen bg-cream px-3 py-1.5 font-sans font-bold text-xs uppercase text-deepgreen focus:outline-none shadow-[2px_2px_0px_#263F32]"
                >
                  {monthlyData?.availableMonths.map((ym) => {
                    const [y, m] = ym.split('-')
                    const label = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })
                    return (
                      <option key={ym} value={ym}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            {/* PART 9 - SECTION A: MONTHLY OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Total Monthly Expenses */}
              <div className="p-5 border-2 border-deepgreen bg-cream-light shadow-[4px_4px_0px_#263F32]">
                <span className="font-sans text-[10px] uppercase tracking-wider text-deepgreen/60 font-bold block mb-1">
                  TOTAL SPENT ({monthlyData?.monthLabel.split(' ')[0].toUpperCase()})
                </span>
                <div className="text-3xl font-black text-deepgreen font-serif">
                  ₹{monthlyData?.totalMonthlyExpenses.toLocaleString() || '0'}
                </div>
                <p className="font-serif italic text-xs text-deepgreen/70 mt-1">
                  Shared domestic expenses across flatmates.
                </p>
              </div>

              {/* Your Share */}
              <div className="p-5 border-2 border-deepgreen bg-cream-light shadow-[4px_4px_0px_#263F32]">
                <span className="font-sans text-[10px] uppercase tracking-wider text-deepgreen/60 font-bold block mb-1">
                  YOUR TOTAL SHARE
                </span>
                <div className="text-3xl font-black text-tomato font-serif">
                  ₹{monthlyData?.myShareTotal.toLocaleString() || '0'}
                </div>
                <p className="font-serif italic text-xs text-deepgreen/70 mt-1">
                  Amount allocated to you based on agreed splits.
                </p>
              </div>

              {/* Flatmate's Share */}
              <div className="p-5 border-2 border-deepgreen bg-cream-light shadow-[4px_4px_0px_#263F32]">
                <span className="font-sans text-[10px] uppercase tracking-wider text-deepgreen/60 font-bold block mb-1">
                  {ledgerState?.flatmate?.fullName.split(' ')[0].toUpperCase()}'S SHARE
                </span>
                <div className="text-3xl font-black text-deepgreen font-serif">
                  ₹{monthlyData?.flatmateShareTotal.toLocaleString() || '0'}
                </div>
                <p className="font-serif italic text-xs text-deepgreen/70 mt-1">
                  Amount allocated to your flatmate.
                </p>
              </div>

              {/* Net Settlement Balance */}
              <div className="p-5 border-2 border-deepgreen bg-cream-light shadow-[4px_4px_0px_#263F32] flex flex-col justify-between">
                <div>
                  <span className="font-sans text-[10px] uppercase tracking-wider font-bold block mb-1 text-tomato">
                    NET SETTLEMENT
                  </span>
                  <div className="text-3xl font-black font-serif">
                    {monthlyData?.netStatus === 'you_are_owed' ? (
                      <span className="text-emerald-800">+₹{monthlyData.netBalance.toLocaleString()}</span>
                    ) : monthlyData?.netStatus === 'you_owe' ? (
                      <span className="text-tomato">-₹{Math.abs(monthlyData.netBalance).toLocaleString()}</span>
                    ) : (
                      <span className="text-deepgreen">₹0</span>
                    )}
                  </div>
                  <p className="font-serif italic text-xs text-deepgreen/80 mt-1">
                    {monthlyData?.netStatus === 'you_are_owed'
                      ? `${ledgerState?.flatmate?.fullName} owes you ₹${monthlyData.netBalance.toLocaleString()}`
                      : monthlyData?.netStatus === 'you_owe'
                      ? `You owe ${ledgerState?.flatmate?.fullName} ₹${Math.abs(monthlyData?.netBalance || 0).toLocaleString()}`
                      : 'All domestic expenses fully settled.'}
                  </p>
                </div>

                {monthlyData && monthlyData.netBalance !== 0 && (
                  <button
                    onClick={() => {
                      setSettleAmount(Math.abs(monthlyData.netBalance).toString())
                      setShowSettleModal(true)
                    }}
                    className="mt-3 w-full py-2 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase text-[11px] tracking-wider transition-colors shadow-[2px_2px_0px_#263F32]"
                  >
                    Settle Up via UPI ↗
                  </button>
                )}
              </div>
            </div>

            {/* PART 9 - SECTION D: QUICK ACTIONS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => {
                  setBillCategory('electricity')
                  setOcrResult(null)
                  setBillFile(null)
                  setShowUploadBillModal(true)
                }}
                className="p-4 border-2 border-deepgreen bg-cream hover:bg-butter transition-colors text-left shadow-[3px_3px_0px_#263F32] group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Upload className="h-5 w-5 text-tomato group-hover:scale-110 transition-transform" />
                  <span className="font-sans text-[9px] font-bold uppercase px-1.5 py-0.5 bg-deepgreen text-cream">AI OCR</span>
                </div>
                <div className="font-bold text-sm uppercase text-deepgreen font-serif">Upload Bill</div>
                <div className="font-sans text-[11px] text-deepgreen/70">Electricity, Groceries, WiFi</div>
              </button>

              <button
                onClick={() => setShowManualExpenseModal(true)}
                className="p-4 border-2 border-deepgreen bg-cream hover:bg-butter transition-colors text-left shadow-[3px_3px_0px_#263F32] group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Plus className="h-5 w-5 text-tomato group-hover:scale-110 transition-transform" />
                  <span className="font-sans text-[9px] font-bold uppercase px-1.5 py-0.5 bg-cream-light border border-deepgreen text-deepgreen">Manual</span>
                </div>
                <div className="font-bold text-sm uppercase text-deepgreen font-serif">Add Expense</div>
                <div className="font-sans text-[11px] text-deepgreen/70">Custom amount &amp; category</div>
              </button>

              <button
                onClick={() => {
                  setSettleAmount(Math.abs(monthlyData?.netBalance || 0).toString())
                  setShowSettleModal(true)
                }}
                className="p-4 border-2 border-deepgreen bg-cream hover:bg-butter transition-colors text-left shadow-[3px_3px_0px_#263F32] group"
              >
                <div className="flex items-center justify-between mb-2">
                  <QrCode className="h-5 w-5 text-tomato group-hover:scale-110 transition-transform" />
                  <span className="font-sans text-[9px] font-bold uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-800">Instant</span>
                </div>
                <div className="font-bold text-sm uppercase text-deepgreen font-serif">Settle Up</div>
                <div className="font-sans text-[11px] text-deepgreen/70">1-tap UPI settlement</div>
              </button>

              <button
                onClick={() => setShowFlatSetupModal(true)}
                className="p-4 border-2 border-deepgreen bg-cream hover:bg-butter transition-colors text-left shadow-[3px_3px_0px_#263F32] group"
              >
                <div className="flex items-center justify-between mb-2">
                  <FileText className="h-5 w-5 text-tomato group-hover:scale-110 transition-transform" />
                  <span className="font-sans text-[9px] font-bold uppercase px-1.5 py-0.5 bg-butter text-deepgreen">Terms</span>
                </div>
                <div className="font-bold text-sm uppercase text-deepgreen font-serif">Rent Agreement</div>
                <div className="font-sans text-[11px] text-deepgreen/70">View &amp; update lease</div>
              </button>
            </div>

            {/* PART 9 - SECTION B: RENT OVERVIEW */}
            <div className="border-2 border-deepgreen bg-cream-light p-6 shadow-[6px_6px_0px_#263F32] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-deepgreen pb-3 gap-2">
                <div>
                  <span className="font-sans text-[10px] uppercase font-bold text-tomato tracking-widest">
                    MONTHLY LEASE SPECIFICATION
                  </span>
                  <h3 className="text-2xl font-black uppercase text-deepgreen font-serif">
                    Rent Overview ({monthlyData?.monthLabel})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-sans text-xs font-bold uppercase px-2.5 py-1 border border-deepgreen ${
                      monthlyData?.rentOverview.paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    Status: {monthlyData?.rentOverview.paymentStatus === 'paid' ? 'Paid & Settled' : 'Due on 5th'}
                  </span>
                  {monthlyData?.rentOverview.agreementUrl && (
                    <button
                      onClick={() => setViewingAttachmentUrl(monthlyData.rentOverview.agreementUrl || null)}
                      className="px-3 py-1 bg-cream hover:bg-butter border border-deepgreen text-deepgreen font-sans text-xs font-bold uppercase shadow-[1px_1px_0px_#263F32]"
                    >
                      View Agreement 📄
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-sans text-xs">
                <div className="p-3 bg-cream border border-deepgreen">
                  <span className="text-[10px] text-deepgreen/60 uppercase block">TOTAL MONTHLY RENT</span>
                  <span className="text-lg font-bold text-deepgreen font-serif">
                    ₹{monthlyData?.rentOverview.monthlyRent.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-cream border border-deepgreen">
                  <span className="text-[10px] text-deepgreen/60 uppercase block">YOUR CONTRIBUTION</span>
                  <span className="text-lg font-bold text-tomato font-serif">
                    ₹{monthlyData?.rentOverview.myRentShare.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-cream border border-deepgreen">
                  <span className="text-[10px] text-deepgreen/60 uppercase block">FLATMATE CONTRIBUTION</span>
                  <span className="text-lg font-bold text-deepgreen font-serif">
                    ₹{monthlyData?.rentOverview.flatmateRentShare.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-cream border border-deepgreen">
                  <span className="text-[10px] text-deepgreen/60 uppercase block">SECURITY DEPOSIT</span>
                  <span className="text-lg font-bold text-deepgreen font-serif">
                    ₹{monthlyData?.rentOverview.securityDeposit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* PART 9 - SECTION C: SHARED EXPENSES BY CATEGORY */}
            <div className="border-2 border-deepgreen bg-cream-light p-6 shadow-[6px_6px_0px_#263F32] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-deepgreen pb-3">
                <h3 className="text-xl font-black uppercase text-deepgreen font-serif">
                  Shared Expenses by Category
                </h3>
                <span className="font-sans text-xs text-deepgreen/60">
                  {monthlyData?.monthLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(monthlyData?.categoryBreakdown || {}).map(([key, cat]) => (
                  <div key={key} className="p-3 border border-deepgreen bg-cream space-y-1">
                    <div className="flex items-center justify-between text-base">
                      <span>{cat.icon}</span>
                      <span className="font-sans text-xs font-bold text-tomato font-serif">
                        ₹{cat.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="font-serif font-bold text-xs uppercase text-deepgreen truncate">
                      {cat.label}
                    </div>
                    <div className="font-sans text-[10px] text-deepgreen/60">
                      Your share: ₹{cat.myShare.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PART 9 - SECTION E: RECENT TRANSACTIONS */}
            <div className="border-2 border-deepgreen bg-cream-light p-6 sm:p-8 shadow-[8px_8px_0px_#263F32] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-deepgreen pb-4 gap-2">
                <div>
                  <h3 className="text-2xl font-black uppercase text-deepgreen font-serif">
                    Transactions Log ({monthlyData?.transactions.length || 0})
                  </h3>
                  <p className="font-serif italic text-xs text-deepgreen/70">
                    Audit trail with bill attachments, OCR verification, and confirmation status.
                  </p>
                </div>
                <span className="font-sans text-xs font-bold text-deepgreen/60 uppercase">
                  {monthlyData?.monthLabel}
                </span>
              </div>

              {monthlyData?.transactions.length === 0 ? (
                <div className="p-8 text-center text-sm font-serif italic text-deepgreen/60 border-2 border-dashed border-deepgreen/30 bg-cream">
                  No expenses recorded for this month yet. Use "Upload Bill" or "Add Expense" to start logging!
                </div>
              ) : (
                <div className="divide-y border border-deepgreen bg-cream">
                  {monthlyData?.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-butter/10 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-sans text-[10px] uppercase font-bold px-2 py-0.5 bg-deepgreen text-cream">
                            {tx.categoryDisplay}
                          </span>
                          <span className="font-sans text-xs text-deepgreen/60">{tx.date}</span>
                          {tx.isDisputed && (
                            <span className="font-sans text-[10px] font-bold uppercase px-2 py-0.5 bg-red-100 text-red-800 border border-red-300">
                              ⚠️ Disputed: {tx.disputeReason}
                            </span>
                          )}
                          {tx.isSettled ? (
                            <span className="font-sans text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800">
                              ✓ Settled
                            </span>
                          ) : (
                            <span className="font-sans text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-100 text-amber-900">
                              Pending Settlement
                            </span>
                          )}
                        </div>

                        <h4 className="font-serif font-bold text-base text-deepgreen">{tx.title}</h4>
                        <div className="font-sans text-xs text-deepgreen/70 flex flex-wrap items-center gap-3">
                          <span>
                            Paid by <strong className="text-deepgreen">{tx.paidByName}</strong> (Total ₹{tx.amount.toLocaleString()})
                          </span>
                          <span>•</span>
                          <span>
                            Your share: <strong className="text-tomato font-serif">₹{tx.myShare.toLocaleString()}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-auto">
                        {tx.billUrl && (
                          <button
                            onClick={() => setViewingAttachmentUrl(tx.billUrl || null)}
                            className="px-2.5 py-1.5 border border-deepgreen bg-cream hover:bg-butter font-sans text-xs font-bold flex items-center gap-1 shadow-[1px_1px_0px_#263F32]"
                            title="View original uploaded bill"
                          >
                            <Eye className="h-3.5 w-3.5 text-tomato" />
                            <span>Bill Attachment</span>
                          </button>
                        )}

                        {!tx.isPaidByMe && !tx.isSettled && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleConfirmExpense(tx.id)}
                              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-cream font-sans text-xs font-bold uppercase"
                              title="Confirm this expense"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => {
                                setDisputeModalExpense(tx)
                                setDisputeReason('')
                              }}
                              className="px-2.5 py-1.5 border border-red-400 bg-red-50 text-red-700 hover:bg-red-100 font-sans text-xs font-bold uppercase"
                              title="Dispute this amount"
                            >
                              Dispute
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL 1: FLAT SETUP & RENT AGREEMENT
         ========================================================================= */}
      {showFlatSetupModal && (
        <div className="fixed inset-0 bg-deepgreen/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-cream border-2 border-deepgreen max-w-xl w-full p-6 sm:p-8 shadow-[8px_8px_0px_#263F32] space-y-4 my-8">
            <div className="flex items-center justify-between border-b-2 border-deepgreen pb-3">
              <div>
                <span className="font-sans text-[10px] uppercase font-bold text-tomato tracking-widest">
                  ESTABLISH SHARED LIVING SPACE
                </span>
                <h3 className="text-2xl font-black uppercase text-deepgreen font-serif">
                  Flat Setup &amp; Rent Terms
                </h3>
              </div>
              <button
                onClick={() => setShowFlatSetupModal(false)}
                className="p-1 border border-deepgreen hover:bg-red-50"
              >
                <X className="h-5 w-5 text-deepgreen" />
              </button>
            </div>

            <form onSubmit={handleSaveFlatSetup} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">
                  Flat / Society Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Skyline Residency Flat 402"
                  value={flatName}
                  onChange={(e) => setFlatName(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream-light p-2 font-serif text-sm text-deepgreen focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={flatCity}
                    onChange={(e) => setFlatCity(e.target.value)}
                    className="w-full border-2 border-deepgreen bg-cream-light p-2 font-serif text-sm text-deepgreen focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">Locality</label>
                  <input
                    type="text"
                    required
                    value={flatLocality}
                    onChange={(e) => setFlatLocality(e.target.value)}
                    className="w-full border-2 border-deepgreen bg-cream-light p-2 font-serif text-sm text-deepgreen focus:outline-none"
                  />
                </div>
              </div>

              {/* Upload Rent Agreement with OCR */}
              <div className="p-4 bg-butter/30 border-2 border-dashed border-deepgreen space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs uppercase font-bold text-deepgreen">
                    Upload Rent Agreement (PDF / Photo)
                  </span>
                  <span className="font-sans text-[9px] uppercase font-bold px-2 py-0.5 bg-deepgreen text-cream">
                    Auto OCR Extract
                  </span>
                </div>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleAgreementUpload}
                  className="w-full text-xs font-sans file:mr-3 file:py-1.5 file:px-3 file:border-2 file:border-deepgreen file:bg-cream file:text-xs file:font-bold file:uppercase hover:file:bg-butter"
                />
                {isOcrProcessing && (
                  <div className="font-sans text-xs text-tomato font-bold animate-pulse">
                    Analyzing rent agreement with AI OCR...
                  </div>
                )}
                {agreementFileUrl && (
                  <div className="font-sans text-[11px] text-emerald-800 font-bold">
                    ✓ Agreement uploaded &amp; verified. Terms extracted below.
                  </div>
                )}
              </div>

              {/* Rent Financials */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">Total Rent (₹)</label>
                  <input
                    type="number"
                    required
                    value={monthlyRentInput}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0
                      setMonthlyRentInput(e.target.value)
                      if (rentSplitType === 'equal') {
                        setMyRentShareInput(Math.round(val / 2).toString())
                        setFlatmateRentShareInput((val - Math.round(val / 2)).toString())
                      }
                    }}
                    className="w-full border-2 border-deepgreen bg-cream-light p-2 font-serif text-sm text-deepgreen focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">Your Share (₹)</label>
                  <input
                    type="number"
                    required
                    value={myRentShareInput}
                    onChange={(e) => setMyRentShareInput(e.target.value)}
                    className="w-full border-2 border-deepgreen bg-cream-light p-2 font-serif text-sm text-deepgreen focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">Flatmate Share (₹)</label>
                  <input
                    type="number"
                    required
                    value={flatmateRentShareInput}
                    onChange={(e) => setFlatmateRentShareInput(e.target.value)}
                    className="w-full border-2 border-deepgreen bg-cream-light p-2 font-serif text-sm text-deepgreen focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">Rent Due Date</label>
                  <select
                    value={rentDueDay}
                    onChange={(e) => setRentDueDay(e.target.value)}
                    className="w-full border-2 border-deepgreen bg-cream-light p-2 font-serif text-sm text-deepgreen focus:outline-none"
                  >
                    <option value="1">1st of the month</option>
                    <option value="5">5th of the month</option>
                    <option value="7">7th of the month</option>
                    <option value="10">10th of the month</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">Security Deposit (₹)</label>
                  <input
                    type="number"
                    required
                    value={securityDepositInput}
                    onChange={(e) => setSecurityDepositInput(e.target.value)}
                    className="w-full border-2 border-deepgreen bg-cream-light p-2 font-serif text-sm text-deepgreen focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t-2 border-deepgreen">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase text-xs tracking-wider transition-colors shadow-[2px_2px_0px_#263F32]"
                >
                  Confirm &amp; Activate Split Ledger 🚀
                </button>
                <button
                  type="button"
                  onClick={() => setShowFlatSetupModal(false)}
                  className="px-4 py-3 border-2 border-deepgreen bg-cream hover:bg-butter font-serif font-bold uppercase text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: UPLOAD BILL & AUTOMATIC OCR SPLITTING (Parts 3, 4, 8)
         ========================================================================= */}
      {showUploadBillModal && (
        <div className="fixed inset-0 bg-deepgreen/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-cream border-2 border-deepgreen max-w-xl w-full p-6 sm:p-8 shadow-[8px_8px_0px_#263F32] space-y-4 my-8">
            <div className="flex items-center justify-between border-b-2 border-deepgreen pb-3">
              <div>
                <span className="font-sans text-[10px] uppercase font-bold text-tomato tracking-widest">
                  AUTOMATIC BILL OCR &amp; SPLITTING
                </span>
                <h3 className="text-2xl font-black uppercase text-deepgreen font-serif">
                  Upload Domestic Bill
                </h3>
              </div>
              <button
                onClick={() => setShowUploadBillModal(false)}
                className="p-1 border border-deepgreen hover:bg-red-50"
              >
                <X className="h-5 w-5 text-deepgreen" />
              </button>
            </div>

            <form onSubmit={handleSubmitBillExpense} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">Bill Category</label>
                <select
                  value={billCategory}
                  onChange={(e) => {
                    setBillCategory(e.target.value)
                    setOcrResult(null)
                    setGroceryItems([])
                  }}
                  className="w-full border-2 border-deepgreen bg-cream-light p-2 font-serif text-sm text-deepgreen focus:outline-none"
                >
                  <option value="electricity">⚡ Electricity Bill (BESCOM / MSEDCL / Tata)</option>
                  <option value="groceries">🛒 Grocery Receipt (Blinkit / Zepto / Instamart)</option>
                  <option value="wifi">📶 Wi-Fi / Broadband Bill</option>
                  <option value="other">📦 Other Shared Bill</option>
                </select>
              </div>

              {/* File Upload Box */}
              <div className="border-2 border-dashed border-deepgreen p-5 bg-cream text-center space-y-2">
                <Upload className="h-8 w-8 text-tomato mx-auto" />
                <div className="font-serif font-bold text-sm uppercase text-deepgreen">
                  Upload Bill Photograph or PDF
                </div>
                <input
                  type="file"
                  required
                  accept="image/*,application/pdf"
                  onChange={handleBillFileUpload}
                  className="w-full text-xs font-sans file:mr-3 file:py-1.5 file:px-3 file:border-2 file:border-deepgreen file:bg-cream-light file:text-xs file:font-bold file:uppercase hover:file:bg-butter"
                />
                {isOcrProcessing && (
                  <div className="font-sans text-xs text-tomato font-bold animate-pulse pt-2">
                    Running OCR extraction engine on invoice...
                  </div>
                )}
              </div>

              {/* Extracted Details for User Verification */}
              {ocrResult && (
                <div className="p-4 bg-butter/30 border-2 border-deepgreen space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[10px] uppercase font-bold text-deepgreen">
                      AI EXTRACTED VALUES (CONFIDENCE: {ocrResult.extractedData?.confidenceScore}%)
                    </span>
                    <span className="font-sans text-[9px] uppercase font-bold px-1.5 py-0.5 bg-emerald-700 text-cream">
                      Verified
                    </span>
                  </div>

                  {/* Grocery Itemized Selection (Part 4) */}
                  {groceryItems.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-deepgreen/20">
                      <span className="font-sans text-[11px] uppercase font-bold text-deepgreen block">
                        Toggle Shared vs Personal Items:
                      </span>
                      <div className="max-h-40 overflow-y-auto divide-y border border-deepgreen bg-cream font-sans text-xs">
                        {groceryItems.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleToggleGroceryItem(idx)}
                            className="p-2 flex items-center justify-between cursor-pointer hover:bg-butter/20"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={item.isShared}
                                onChange={() => {}}
                                className="accent-deepgreen"
                              />
                              <span className={item.isShared ? 'font-bold text-deepgreen' : 'text-deepgreen/60 line-through'}>
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-serif font-bold">₹{item.price}</span>
                              <span
                                className={`text-[9px] uppercase font-bold px-1 py-0.2 border ${
                                  item.isShared ? 'bg-butter text-deepgreen border-deepgreen' : 'bg-sand text-deepgreen/70 border-deepgreen/40'
                                }`}
                              >
                                {item.isShared ? 'Shared' : 'Personal'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-sans font-bold text-deepgreen/70 mb-0.5">
                        Expense Title
                      </label>
                      <input
                        type="text"
                        required
                        value={billTitle}
                        onChange={(e) => setBillTitle(e.target.value)}
                        className="w-full border border-deepgreen bg-cream-light p-1.5 font-serif text-xs text-deepgreen focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-sans font-bold text-deepgreen/70 mb-0.5">
                        Total Amount (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={billTotalAmount}
                        onChange={(e) => setBillTotalAmount(e.target.value)}
                        className="w-full border border-deepgreen bg-cream-light p-1.5 font-serif text-xs text-deepgreen focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-sans font-bold text-deepgreen/70 mb-0.5">
                      Splitting Method
                    </label>
                    <select
                      value={billSplitMethod}
                      onChange={(e) => setBillSplitMethod(e.target.value as any)}
                      className="w-full border border-deepgreen bg-cream-light p-1.5 font-serif text-xs text-deepgreen focus:outline-none"
                    >
                      <option value="equal">50-50 Equal Split</option>
                      <option value="percentage">Percentage Split</option>
                      <option value="custom">Custom Amount</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t-2 border-deepgreen">
                <button
                  type="submit"
                  disabled={isPending || !ocrResult}
                  className="flex-1 py-3 bg-tomato hover:bg-tomato-dark disabled:opacity-50 text-cream font-serif font-bold uppercase text-xs tracking-wider transition-colors shadow-[2px_2px_0px_#263F32]"
                >
                  Confirm &amp; Add to Shared Ledger 🧾
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadBillModal(false)}
                  className="px-4 py-3 border-2 border-deepgreen bg-cream hover:bg-butter font-serif font-bold uppercase text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: MANUAL EXPENSE ENTRY (Part 5)
         ========================================================================= */}
      {showManualExpenseModal && (
        <div className="fixed inset-0 bg-deepgreen/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-cream border-2 border-deepgreen max-w-md w-full p-6 shadow-[8px_8px_0px_#263F32] space-y-4 my-8">
            <div className="flex items-center justify-between border-b-2 border-deepgreen pb-3">
              <h3 className="text-xl font-black uppercase text-deepgreen font-serif">
                Add Expense Manually
              </h3>
              <button
                onClick={() => setShowManualExpenseModal(false)}
                className="p-1 border border-deepgreen hover:bg-red-50"
              >
                <X className="h-5 w-5 text-deepgreen" />
              </button>
            </div>

            <form onSubmit={handleSubmitManualExpense} className="space-y-3 font-serif">
              <div>
                <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Society Maintenance, Water Tanker, Filter Coffee"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream-light p-2 text-sm text-deepgreen focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">Category</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream-light p-2 text-sm text-deepgreen focus:outline-none"
                >
                  <option value="electricity_bescom">Electricity</option>
                  <option value="water_purifier">Water / Tanker</option>
                  <option value="wifi_broadband">Internet / Wi-Fi</option>
                  <option value="groceries_blinkit">Groceries</option>
                  <option value="cook_salary">Cook / Domestic Help</option>
                  <option value="maid_salary">Maid / Cleaning</option>
                  <option value="household_cleaning">Household Supplies</option>
                  <option value="maintenance">Society Maintenance</option>
                  <option value="repairs">Repairs &amp; Hardware</option>
                  <option value="other">Other Shared Outlay</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">Total Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1800"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream-light p-2 text-sm text-deepgreen focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">Split Method</label>
                <select
                  value={manualSplitMethod}
                  onChange={(e) => setManualSplitMethod(e.target.value as any)}
                  className="w-full border-2 border-deepgreen bg-cream-light p-2 text-sm text-deepgreen focus:outline-none"
                >
                  <option value="equal">Equal (50 / 50)</option>
                  <option value="percentage">Percentage (60 / 40)</option>
                  <option value="custom">Custom Amounts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Paid via GPay at counter"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream-light p-2 text-sm text-deepgreen focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t-2 border-deepgreen">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-tomato text-cream font-serif font-bold uppercase text-xs tracking-wider hover:bg-tomato-dark transition-colors shadow-[2px_2px_0px_#263F32]"
                >
                  Add to Ledger
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualExpenseModal(false)}
                  className="px-4 py-2.5 border-2 border-deepgreen bg-cream hover:bg-butter font-serif font-bold uppercase text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: SETTLE UP (Part 6)
         ========================================================================= */}
      {showSettleModal && (
        <div className="fixed inset-0 bg-deepgreen/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-cream border-2 border-deepgreen max-w-md w-full p-6 shadow-[8px_8px_0px_#263F32] space-y-4 my-8">
            <div className="flex items-center justify-between border-b-2 border-deepgreen pb-3">
              <div>
                <span className="font-sans text-[10px] uppercase font-bold text-tomato tracking-widest">
                  DOMESTIC SETTLEMENT
                </span>
                <h3 className="text-xl font-black uppercase text-deepgreen font-serif">
                  Settle Up with {ledgerState?.flatmate?.fullName.split(' ')[0]}
                </h3>
              </div>
              <button
                onClick={() => setShowSettleModal(false)}
                className="p-1 border border-deepgreen hover:bg-red-50"
              >
                <X className="h-5 w-5 text-deepgreen" />
              </button>
            </div>

            {settleSuccessMsg ? (
              <div className="p-4 bg-emerald-100 border border-emerald-400 text-emerald-800 font-sans text-xs font-bold text-center">
                ✓ {settleSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleRecordSettlement} className="space-y-3 font-serif">
                <div>
                  <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">
                    Settlement Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    className="w-full border-2 border-deepgreen bg-cream-light p-2 text-sm text-deepgreen font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">
                    Payment Method
                  </label>
                  <select
                    value={settleMethod}
                    onChange={(e) => setSettleMethod(e.target.value as any)}
                    className="w-full border-2 border-deepgreen bg-cream-light p-2 text-sm text-deepgreen focus:outline-none"
                  >
                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="bank_transfer">Net Banking / IMPS</option>
                    <option value="cash">Cash In Hand</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">
                    UPI Reference / Txn ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 432588190241"
                    value={settleUpiRef}
                    onChange={(e) => setSettleUpiRef(e.target.value)}
                    className="w-full border-2 border-deepgreen bg-cream-light p-2 text-sm text-deepgreen focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-butter/30 border border-deepgreen font-sans text-xs text-deepgreen/80">
                  Recording this settlement will automatically update outstanding balances for both flatmates without double-counting.
                </div>

                <div className="flex gap-2 pt-2 border-t-2 border-deepgreen">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-3 bg-tomato text-cream font-serif font-bold uppercase text-xs tracking-wider hover:bg-tomato-dark transition-colors shadow-[2px_2px_0px_#263F32]"
                  >
                    Record Payment &amp; Settle Balance
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettleModal(false)}
                    className="px-4 py-3 border-2 border-deepgreen bg-cream hover:bg-butter font-serif font-bold uppercase text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: DISPUTE EXPENSE (Part 8)
         ========================================================================= */}
      {disputeModalExpense && (
        <div className="fixed inset-0 bg-deepgreen/80 z-50 flex items-center justify-center p-4">
          <div className="bg-cream border-2 border-deepgreen max-w-md w-full p-6 shadow-[8px_8px_0px_#263F32] space-y-4">
            <h3 className="text-xl font-black uppercase text-deepgreen font-serif">
              Dispute Shared Expense
            </h3>
            <p className="font-serif italic text-xs text-deepgreen/80">
              Disputing "{disputeModalExpense.title}" (₹{disputeModalExpense.amount.toLocaleString()}) will notify your flatmate and pause settlement for this item.
            </p>

            <form onSubmit={handleSubmitDispute} className="space-y-3">
              <div>
                <label className="block text-xs uppercase font-sans font-bold text-deepgreen mb-1">
                  Reason for Dispute
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. I did not consume the grocery items, or bill amount was typed incorrectly."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream-light p-2 font-serif text-sm text-deepgreen focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t-2 border-deepgreen">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-red-700 text-cream font-serif font-bold uppercase text-xs tracking-wider hover:bg-red-800 transition-colors shadow-[2px_2px_0px_#263F32]"
                >
                  Submit Dispute
                </button>
                <button
                  type="button"
                  onClick={() => setDisputeModalExpense(null)}
                  className="px-4 py-2.5 border-2 border-deepgreen bg-cream hover:bg-butter font-serif font-bold uppercase text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: VIEW ATTACHMENT / ORIGINAL BILL (Part 8)
         ========================================================================= */}
      {viewingAttachmentUrl && (
        <div className="fixed inset-0 bg-deepgreen/90 z-50 flex items-center justify-center p-4">
          <div className="bg-cream border-2 border-deepgreen max-w-2xl w-full p-4 sm:p-6 shadow-[8px_8px_0px_#263F32] space-y-3">
            <div className="flex items-center justify-between border-b-2 border-deepgreen pb-2">
              <span className="font-sans text-xs uppercase font-bold text-deepgreen">
                Verified Document Attachment
              </span>
              <button
                onClick={() => setViewingAttachmentUrl(null)}
                className="p-1 border border-deepgreen hover:bg-red-50"
              >
                <X className="h-5 w-5 text-deepgreen" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto border border-deepgreen bg-black flex items-center justify-center p-2">
              {viewingAttachmentUrl.endsWith('.pdf') ? (
                <iframe src={viewingAttachmentUrl} className="w-full h-96" />
              ) : (
                <img
                  src={viewingAttachmentUrl}
                  alt="Bill or Agreement Attachment"
                  className="max-h-[65vh] object-contain"
                />
              )}
            </div>

            <div className="flex justify-end pt-2">
              <a
                href={viewingAttachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-deepgreen text-cream font-serif font-bold uppercase text-xs tracking-wider hover:bg-tomato transition-colors shadow-[2px_2px_0px_#E95D43]"
              >
                Open in Full Window ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}