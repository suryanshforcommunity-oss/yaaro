'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Zap,
  ArrowRight,
  Flame,
  Award,
  Lock,
  RefreshCw,
  HelpCircle,
  X,
} from 'lucide-react'
import EditorialNavigation from '@/components/EditorialNavigation'
import {
  getSubscriptionOverviewAction,
  createSubscriptionOrderAction,
  confirmSubscriptionPaymentAction,
  cancelSubscriptionAction,
} from './actions'
import { YAARO_PLANS, type PlanTier, type BillingCycle, type UserSubscriptionDetails } from '@/lib/subscription'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual')
  const [currentSub, setCurrentSub] = useState<UserSubscriptionDetails | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [processingPlan, setProcessingPlan] = useState<PlanTier | null>(null)
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Checkout modal
  const [checkoutModal, setCheckoutModal] = useState<{
    plan: PlanTier
    billingCycle: BillingCycle
    orderId: string
    amount: number
  } | null>(null)
  const [paymentRefInput, setPaymentRefInput] = useState<string>('')
  const [isConfirming, setIsConfirming] = useState<boolean>(false)

  useEffect(() => {
    async function loadSub() {
      setLoading(true)
      const res = await getSubscriptionOverviewAction()
      if (res.success && res.subscription) {
        setCurrentSub(res.subscription)
      }
      setLoading(false)
    }
    loadSub()
  }, [])

  const handleSelectPlan = async (planTier: PlanTier) => {
    if (planTier === 'free') return
    if (currentSub?.planTier === planTier && currentSub.isActive) {
      setStatusMsg({ text: `You are already subscribed to ${YAARO_PLANS[planTier].name}.`, type: 'success' })
      return
    }

    setProcessingPlan(planTier)
    const res = await createSubscriptionOrderAction(planTier, billingCycle)
    setProcessingPlan(null)

    if (res.success && res.order) {
      setCheckoutModal({
        plan: planTier,
        billingCycle,
        orderId: res.order.orderId,
        amount: res.order.amount,
      })
      setPaymentRefInput(`pay_${Math.random().toString(36).substring(2, 9)}`)
    } else {
      setStatusMsg({ text: res.message || 'Failed to initiate order.', type: 'error' })
    }
  }

  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkoutModal) return

    setIsConfirming(true)
    const res = await confirmSubscriptionPaymentAction(
      checkoutModal.orderId,
      paymentRefInput,
      'mock_signature_valid',
      checkoutModal.plan,
      checkoutModal.billingCycle
    )
    setIsConfirming(false)

    if (res.success) {
      setStatusMsg({ text: res.message, type: 'success' })
      setCheckoutModal(null)
      const fresh = await getSubscriptionOverviewAction()
      if (fresh.subscription) setCurrentSub(fresh.subscription)
    } else {
      setStatusMsg({ text: res.message, type: 'error' })
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel automatic subscription renewal?')) return

    setLoading(true)
    const res = await cancelSubscriptionAction()
    setLoading(false)

    if (res.success) {
      setStatusMsg({ text: res.message, type: 'success' })
      const fresh = await getSubscriptionOverviewAction()
      if (fresh.subscription) setCurrentSub(fresh.subscription)
    } else {
      setStatusMsg({ text: res.message, type: 'error' })
    }
  }

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white pb-24 lg:pb-16">
      <EditorialNavigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Editorial Top Masthead */}
        <div className="border-b-2 border-deepgreen pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
                <span>VOL. 08 // THE YAARO CLUB COLLECTIVE</span>
                <span>•</span>
                <span className="text-deepgreen/70">Zero Brokerage &amp; Curated Living Standard</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-deepgreen mt-0.5">
                MEMBERSHIP &amp; PRIVILEGES
              </h1>
              <p className="font-serif italic text-sm text-deepgreen/80 mt-1 max-w-2xl">
                Free forever for basic compatibility matching. Join YAARO Club Pro for deep psychological insights,
                unlimited discovery swipes, incognito browsing, and priority collective visibility.
              </p>
            </div>

            {/* Active Subscription Badge */}
            {currentSub && currentSub.planTier !== 'free' && (
              <div className="p-3 bg-butter border-2 border-deepgreen shadow-[3px_3px_0px_#263F32] space-y-1">
                <div className="font-mono text-[10px] uppercase font-bold text-tomato flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ACTIVE COLLECTIVE TIER</span>
                </div>
                <div className="font-serif font-black text-sm text-deepgreen">
                  {currentSub.config.name} ({currentSub.billingCycle})
                </div>
                <div className="font-mono text-[10px] text-deepgreen/70">
                  {currentSub.daysRemaining} days remaining in current period
                </div>
                <button
                  onClick={handleCancelSubscription}
                  className="font-mono text-[10px] text-tomato underline font-bold uppercase block pt-1"
                >
                  Cancel Renewal
                </button>
              </div>
            )}
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center pt-6">
            <div className="p-1 bg-cream-light border-2 border-deepgreen inline-flex items-center gap-1 shadow-[3px_3px_0px_#263F32]">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 font-mono text-xs font-bold uppercase transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-deepgreen text-cream shadow-[1px_1px_0px_#263F32]'
                    : 'text-deepgreen/70 hover:text-deepgreen'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-1.5 font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 ${
                  billingCycle === 'annual'
                    ? 'bg-tomato text-cream shadow-[1px_1px_0px_#263F32]'
                    : 'text-deepgreen/70 hover:text-deepgreen'
                }`}
              >
                <span>Annual Billing</span>
                <span className="bg-butter text-deepgreen text-[9px] px-1.5 py-0.2 font-black border border-deepgreen">
                  SAVE 33%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Notification Toast */}
        {statusMsg && (
          <div
            className={`p-4 border-2 font-mono text-xs font-bold flex items-center justify-between shadow-[3px_3px_0px_#263F32] ${
              statusMsg.type === 'success'
                ? 'bg-emerald-100 border-emerald-700 text-emerald-900'
                : 'bg-tomato/10 border-tomato text-tomato'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="underline">Dismiss</button>
          </div>
        )}

        {/* 3-Column Editorial Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Tier 1: Free Standard Dossier */}
          <div className="border-2 border-deepgreen bg-cream-light p-6 sm:p-8 space-y-6 shadow-[5px_5px_0px_#263F32] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-deepgreen/20 pb-3">
                <span className="font-mono text-[10px] font-bold text-deepgreen/60 uppercase tracking-widest block">
                  ENTRY TIER
                </span>
                <h3 className="font-serif font-black uppercase text-2xl text-deepgreen mt-1">
                  {YAARO_PLANS.free.name}
                </h3>
                <p className="font-serif italic text-xs text-deepgreen/70 mt-1">
                  {YAARO_PLANS.free.tagline}
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black font-serif text-deepgreen">₹0</span>
                <span className="font-mono text-xs text-deepgreen/60">/ forever</span>
              </div>

              {/* Feature Checklist */}
              <ul className="space-y-2.5 font-serif text-xs text-deepgreen/90 pt-2 border-t border-deepgreen/20">
                {YAARO_PLANS.free.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 leading-snug">
                    <span className="text-emerald-700 font-bold shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-deepgreen/20">
              <button
                disabled={true}
                className="w-full py-2.5 border-2 border-deepgreen bg-cream text-deepgreen/70 font-mono text-xs font-bold uppercase cursor-default"
              >
                {currentSub?.planTier === 'free' ? 'Current Active Tier' : 'Default Base Access'}
              </button>
            </div>
          </div>

          {/* Tier 2: YAARO Club Pro (Featured / Most Popular) */}
          <div className="border-2 border-deepgreen bg-butter/30 p-6 sm:p-8 space-y-6 shadow-[8px_8px_0px_#E95D43] relative flex flex-col justify-between border-t-8 border-t-tomato">
            <div className="absolute -top-4 right-4 bg-tomato text-cream font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1 border border-deepgreen shadow-[2px_2px_0px_#263F32]">
              ★ MOST COVETED
            </div>

            <div className="space-y-4">
              <div className="border-b border-deepgreen/20 pb-3">
                <span className="font-mono text-[10px] font-bold text-tomato uppercase tracking-widest block">
                  PRO COLLECTIVE
                </span>
                <h3 className="font-serif font-black uppercase text-2xl text-deepgreen mt-1">
                  {YAARO_PLANS.yaaro_pro.name}
                </h3>
                <p className="font-serif italic text-xs text-deepgreen/80 mt-1">
                  {YAARO_PLANS.yaaro_pro.tagline}
                </p>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black font-serif text-deepgreen">
                  ₹{billingCycle === 'annual' ? '333' : '499'}
                </span>
                <span className="font-mono text-xs text-deepgreen/70">
                  {billingCycle === 'annual' ? '/ month (billed ₹3,999/yr)' : '/ month'}
                </span>
              </div>

              {/* Feature Checklist */}
              <ul className="space-y-2.5 font-serif text-xs text-deepgreen pt-2 border-t border-deepgreen/20">
                {YAARO_PLANS.yaaro_pro.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 leading-snug font-medium">
                    <span className="text-tomato font-bold shrink-0">★</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-deepgreen/20">
              <button
                onClick={() => handleSelectPlan('yaaro_pro')}
                disabled={processingPlan === 'yaaro_pro' || (currentSub?.planTier === 'yaaro_pro' && currentSub.isActive)}
                className="w-full py-3 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors shadow-[3px_3px_0px_#263F32] disabled:opacity-50"
              >
                {currentSub?.planTier === 'yaaro_pro' && currentSub.isActive
                  ? 'Current Plan Active'
                  : processingPlan === 'yaaro_pro'
                  ? 'Initiating Order...'
                  : 'Upgrade to YAARO Club Pro ↗'}
              </button>
            </div>
          </div>

          {/* Tier 3: Landlord & Owner Collective */}
          <div className="border-2 border-deepgreen bg-cream-light p-6 sm:p-8 space-y-6 shadow-[5px_5px_0px_#263F32] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-deepgreen/20 pb-3">
                <span className="font-mono text-[10px] font-bold text-deepgreen/60 uppercase tracking-widest block">
                  ACCOMMODATION HOST
                </span>
                <h3 className="font-serif font-black uppercase text-2xl text-deepgreen mt-1">
                  {YAARO_PLANS.landlord_verified.name}
                </h3>
                <p className="font-serif italic text-xs text-deepgreen/70 mt-1">
                  {YAARO_PLANS.landlord_verified.tagline}
                </p>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black font-serif text-deepgreen">
                  ₹{billingCycle === 'annual' ? '666' : '999'}
                </span>
                <span className="font-mono text-xs text-deepgreen/70">
                  {billingCycle === 'annual' ? '/ month (billed ₹7,999/yr)' : '/ month'}
                </span>
              </div>

              {/* Feature Checklist */}
              <ul className="space-y-2.5 font-serif text-xs text-deepgreen/90 pt-2 border-t border-deepgreen/20">
                {YAARO_PLANS.landlord_verified.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 leading-snug">
                    <span className="text-deepgreen font-bold shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-deepgreen/20">
              <button
                onClick={() => handleSelectPlan('landlord_verified')}
                disabled={processingPlan === 'landlord_verified' || (currentSub?.planTier === 'landlord_verified' && currentSub.isActive)}
                className="w-full py-3 bg-deepgreen hover:bg-tomato text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors shadow-[3px_3px_0px_#E95D43] disabled:opacity-50"
              >
                {currentSub?.planTier === 'landlord_verified' && currentSub.isActive
                  ? 'Current Plan Active'
                  : processingPlan === 'landlord_verified'
                  ? 'Initiating Order...'
                  : 'Join Owner Collective ↗'}
              </button>
            </div>
          </div>
        </div>

        {/* Payment Checkout Modal (Razorpay-ready Sandbox) */}
        {checkoutModal && (
          <div className="fixed inset-0 z-50 bg-deepgreen/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-cream border-2 border-deepgreen max-w-md w-full p-6 sm:p-8 shadow-[8px_8px_0px_#263F32] space-y-6">
              <div className="flex items-center justify-between border-b border-deepgreen/20 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-tomato" />
                  <h3 className="font-serif font-black uppercase text-xl text-deepgreen">
                    Secure Subscription Order
                  </h3>
                </div>
                <button
                  onClick={() => setCheckoutModal(null)}
                  className="p-1 border border-deepgreen bg-cream hover:bg-tomato hover:text-cream text-deepgreen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-butter/40 border border-deepgreen space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-deepgreen/70">Selected Plan:</span>
                  <span className="font-bold text-deepgreen">{YAARO_PLANS[checkoutModal.plan].name}</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-deepgreen/70">Billing Period:</span>
                  <span className="font-bold text-deepgreen capitalize">{checkoutModal.billingCycle}</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-deepgreen/70">Order Token:</span>
                  <span className="font-bold text-deepgreen truncate max-w-[200px]">{checkoutModal.orderId}</span>
                </div>
                <div className="flex justify-between font-serif text-lg font-black border-t border-deepgreen/20 pt-2 text-deepgreen">
                  <span>Total Payable:</span>
                  <span className="text-tomato">₹{checkoutModal.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <form onSubmit={handleConfirmCheckout} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-xs uppercase font-bold text-deepgreen block">
                    Payment Gateway Reference (UPI / Card / NetBanking)
                  </label>
                  <input
                    type="text"
                    value={paymentRefInput}
                    onChange={(e) => setPaymentRefInput(e.target.value)}
                    placeholder="e.g. pay_29aBc1092 or UPI Ref"
                    className="w-full px-3 py-2 border-2 border-deepgreen bg-cream-light font-mono text-xs text-deepgreen focus:outline-none"
                    required
                  />
                  <span className="font-mono text-[10px] text-deepgreen/60 block">
                    Razorpay abstraction active. Automatically authenticates transaction and updates database entitlements.
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutModal(null)}
                    className="flex-1 py-2.5 border-2 border-deepgreen bg-cream text-deepgreen font-mono text-xs font-bold uppercase hover:bg-cream-light"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isConfirming}
                    className="flex-1 py-2.5 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors shadow-[2px_2px_0px_#263F32] disabled:opacity-50"
                  >
                    {isConfirming ? 'Confirming...' : 'Authorize Payment ↗'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Trust & Guarantee Statement */}
        <div className="border-2 border-deepgreen bg-cream p-6 shadow-[4px_4px_0px_#263F32] space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs uppercase font-bold text-deepgreen">
            <ShieldCheck className="w-4 h-4 text-tomato" />
            <span>THE YAARO FREEMIUM COMMITMENT</span>
          </div>
          <p className="font-serif text-xs text-deepgreen/80 leading-relaxed">
            Finding compatible roommates and verified homes will always remain accessible on YAARO without mandatory fees.
            Paid memberships fund our dedicated human compliance desk, legal agreement drafting, and background screening
            tools. You can cancel your subscription renewal at any moment directly from this dashboard.
          </p>
        </div>
      </main>
    </div>
  )
}
