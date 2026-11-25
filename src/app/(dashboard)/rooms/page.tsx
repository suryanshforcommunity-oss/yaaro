'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Coffee,
  MapPin,
  Flame,
  Plus,
  Home,
  Check,
  Bookmark,
  SlidersHorizontal,
  X,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Edit3,
  ShieldAlert,
  Wifi,
  Wind,
  Bath,
  Tv,
  Car,
  Dumbbell,
  RefreshCw,
} from 'lucide-react'
import EditorialNavigation from '@/components/EditorialNavigation'
import {
  getRoomListings,
  createRoomListing,
  getUserMyListings,
  updateRoomListing,
  deleteRoomListing,
  toggleRoomAvailability,
  toggleSaveRoomListing,
  sendRoomEnquiryAction,
  reportSuspiciousListingAction,
  type RoomListingItem,
  type RoomFilters,
  type CreateRoomListingInput,
} from './actions'

const AVAILABLE_AMENITIES = [
  'Attached Bath',
  'Private Balcony',
  'High Speed WiFi',
  'Air Conditioning',
  '100% DG Power Backup',
  'Daily Housekeeping',
  'Modular Kitchen',
  'Covered Parking',
  'Gym & Swimming Pool',
  'Washing Machine',
  'RO Water Filter',
  'Pet Friendly',
]

export default function RoomsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'my_listings' | 'saved'>('all')
  const [listings, setListings] = useState<RoomListingItem[]>([])
  const [myListings, setMyListings] = useState<RoomListingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<RoomListingItem | null>(null)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  // Enquiry state
  const [enquiryRoom, setEnquiryRoom] = useState<RoomListingItem | null>(null)
  const [enquiryMessage, setEnquiryMessage] = useState('')
  const [isSendingEnquiry, setIsSendingEnquiry] = useState(false)
  const [enquirySuccess, setEnquirySuccess] = useState(false)

  // Publish / Edit modal state
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [editingListingId, setEditingListingId] = useState<string | null>(null)
  const [isSubmittingListing, setIsSubmittingListing] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Report modal state
  const [reportTargetRoom, setReportTargetRoom] = useState<RoomListingItem | null>(null)
  const [reportReason, setReportReason] = useState('Brokerage solicitation')
  const [reportDetails, setReportDetails] = useState('')
  const [reportStatus, setReportStatus] = useState<string | null>(null)

  // Filters state
  const [cityFilter, setCityFilter] = useState('ALL')
  const [localityFilter, setLocalityFilter] = useState('')
  const [budgetMaxFilter, setBudgetMaxFilter] = useState<string>('any')
  const [furnishingFilter, setFurnishingFilter] = useState('all')
  const [roomTypeFilter, setRoomTypeFilter] = useState('all')
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])

  // Publish form state
  const [title, setTitle] = useState('')
  const [city, setCity] = useState('Pune')
  const [locality, setLocality] = useState('')
  const [neighborhoodVibe, setNeighborhoodVibe] = useState('')
  const [rentMonthly, setRentMonthly] = useState<number>(14000)
  const [securityDeposit, setSecurityDeposit] = useState<number>(28000)
  const [maintenanceMonthly, setMaintenanceMonthly] = useState<number>(1000)
  const [roomType, setRoomType] = useState<'private' | 'shared'>('private')
  const [furnishedType, setFurnishedType] = useState<'unfurnished' | 'semi_furnished' | 'fully_furnished'>('fully_furnished')
  const [attachedBathroom, setAttachedBathroom] = useState(true)
  const [balconyAvailable, setBalconyAvailable] = useState(true)
  const [formAmenities, setFormAmenities] = useState<string[]>([
    'Attached Bath',
    'High Speed WiFi',
    'Daily Housekeeping',
  ])
  const [description, setDescription] = useState('')
  const [photoUrlInput, setPhotoUrlInput] = useState('')
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80',
  ])

  // Load rooms
  const loadRooms = async () => {
    setIsLoading(true)
    try {
      const filters: RoomFilters = {
        city: cityFilter === 'ALL' ? undefined : cityFilter,
        locality: localityFilter.trim() || undefined,
        budgetMax: budgetMaxFilter === 'any' ? undefined : parseInt(budgetMaxFilter, 10),
        furnishing: furnishingFilter,
        roomType: roomTypeFilter,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      }
      const data = await getRoomListings(filters)
      setListings(data)

      if (activeTab === 'my_listings') {
        const myData = await getUserMyListings()
        setMyListings(myData)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRooms()
  }, [cityFilter, localityFilter, budgetMaxFilter, furnishingFilter, roomTypeFilter, selectedAmenities, activeTab])

  // Toggle saved listing
  const handleToggleSave = async (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation()
    const { isSaved } = await toggleSaveRoomListing(listingId)
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, isSaved } : l))
    )
  }

  // Handle Enquiry Submit
  const handleSendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enquiryRoom) return
    setIsSendingEnquiry(true)
    const res = await sendRoomEnquiryAction(enquiryRoom.id, enquiryRoom.host.id, enquiryMessage)
    setIsSendingEnquiry(false)
    if (res.success) {
      setEnquirySuccess(true)
      setTimeout(() => {
        setEnquirySuccess(false)
        setEnquiryRoom(null)
        setEnquiryMessage('')
      }, 2000)
    }
  }

  // Handle Publish / Edit Form Submit
  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!title.trim() || !locality.trim()) {
      setFormError('Please enter listing title and approximate locality.')
      return
    }

    setIsSubmittingListing(true)

    const payload: CreateRoomListingInput = {
      title,
      description,
      city,
      locality,
      neighborhoodVibe,
      rentMonthly,
      securityDeposit,
      maintenanceMonthly,
      roomType,
      furnishedType,
      attachedBathroom,
      balconyAvailable,
      amenities: formAmenities,
      houseRules: ['Quiet Hours 11 PM - 7 AM', 'Clean common kitchen area', 'Mutual domestic respect'],
      preferredGender: 'any',
      images: uploadedPhotos,
    }

    try {
      if (editingListingId) {
        const res = await updateRoomListing(editingListingId, payload)
        if (!res.success) setFormError(res.error || 'Failed to update listing.')
        else {
          setIsPublishModalOpen(false)
          setEditingListingId(null)
          loadRooms()
        }
      } else {
        const res = await createRoomListing(payload)
        if (!res.success) setFormError(res.error || 'Failed to create listing.')
        else {
          setIsPublishModalOpen(false)
          loadRooms()
        }
      }
    } finally {
      setIsSubmittingListing(false)
    }
  }

  // Open Edit Modal
  const openEditModal = (room: RoomListingItem) => {
    setEditingListingId(room.id)
    setTitle(room.title)
    setCity(room.city)
    setLocality(room.locality)
    setNeighborhoodVibe(room.neighborhoodVibe)
    setRentMonthly(room.rentMonthly)
    setSecurityDeposit(room.securityDeposit)
    setMaintenanceMonthly(room.maintenanceMonthly)
    setRoomType(room.roomType)
    setFurnishedType(room.furnishedType)
    setAttachedBathroom(room.attachedBathroom)
    setBalconyAvailable(room.balconyAvailable)
    setFormAmenities(room.amenities)
    setDescription(room.description)
    setUploadedPhotos(room.images)
    setIsPublishModalOpen(true)
  }

  // Delete Listing
  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to permanently delete this listing?')) return
    await deleteRoomListing(listingId)
    loadRooms()
  }

  // Toggle Availability
  const handleToggleStatus = async (room: RoomListingItem) => {
    await toggleRoomAvailability(room.id, room.status)
    loadRooms()
  }

  // Submit Report
  const handleReportSubmit = async () => {
    if (!reportTargetRoom) return
    const res = await reportSuspiciousListingAction(reportTargetRoom.id, reportReason, reportDetails)
    setReportStatus(res.message)
    setTimeout(() => {
      setReportStatus(null)
      setReportTargetRoom(null)
      setReportDetails('')
    }, 2500)
  }

  const displayedListings =
    activeTab === 'saved'
      ? listings.filter((l) => l.isSaved)
      : activeTab === 'my_listings'
      ? myListings
      : listings

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white pb-24 lg:pb-12">
      <EditorialNavigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Header */}
        <div className="border-b-2 border-deepgreen pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
              <span>VOL. 02 // ZERO-BROKERAGE ROOM MARKETPLACE</span>
              <span>•</span>
              <span className="text-deepgreen/70">
                {cityFilter === 'ALL' ? 'Pan-India Hub' : `${cityFilter} Hub`} • {displayedListings.length > 0 ? `${displayedListings.length} Verified Rooms` : 'Direct Community Listings'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-deepgreen mt-0.5">
              VERIFIED ROOMS &amp; FLATS
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingListingId(null)
                setTitle('')
                setLocality('')
                setDescription('')
                setIsPublishModalOpen(true)
              }}
              className="px-4 py-2 border-2 border-deepgreen bg-tomato text-cream hover:bg-deepgreen font-mono text-xs font-bold uppercase transition-colors shadow-[2px_2px_0px_#263F32] flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Publish Room Listing +</span>
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3.5 py-2 border-2 border-deepgreen bg-cream hover:bg-butter font-mono text-xs font-bold uppercase transition-colors flex items-center gap-1.5 shadow-[2px_2px_0px_#263F32]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-tomato" />
              <span>{showFilters ? 'Hide Filters' : 'Filter Rooms'}</span>
            </button>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-2 border-b border-deepgreen/20 pb-2 font-mono text-xs font-bold uppercase">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 border-2 transition-all ${
              activeTab === 'all'
                ? 'border-deepgreen bg-deepgreen text-cream shadow-[2px_2px_0px_#E95D43]'
                : 'border-transparent text-deepgreen/70 hover:text-deepgreen'
            }`}
          >
            All Verified Rooms ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('my_listings')}
            className={`px-4 py-1.5 border-2 transition-all ${
              activeTab === 'my_listings'
                ? 'border-deepgreen bg-deepgreen text-cream shadow-[2px_2px_0px_#E95D43]'
                : 'border-transparent text-deepgreen/70 hover:text-deepgreen'
            }`}
          >
            My Published Listings ({myListings.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-1.5 border-2 transition-all ${
              activeTab === 'saved'
                ? 'border-deepgreen bg-deepgreen text-cream shadow-[2px_2px_0px_#E95D43]'
                : 'border-transparent text-deepgreen/70 hover:text-deepgreen'
            }`}
          >
            Saved Bookmarks ({listings.filter((l) => l.isSaved).length})
          </button>
        </div>

        {/* Filter Drawer */}
        {showFilters && (
          <div className="p-6 border-2 border-deepgreen bg-cream-light shadow-[6px_6px_0px_#263F32] space-y-4 animate-fade-in font-mono text-xs">
            <div className="flex justify-between items-center border-b border-deepgreen/20 pb-2">
              <h4 className="font-serif font-black uppercase text-sm text-deepgreen">
                CALIBRATE ROOM MARKETPLACE
              </h4>
              <button
                onClick={() => {
                  setCityFilter('ALL')
                  setLocalityFilter('')
                  setBudgetMaxFilter('any')
                  setFurnishingFilter('all')
                  setRoomTypeFilter('all')
                  setSelectedAmenities([])
                }}
                className="text-tomato hover:underline font-bold"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">CITY HUB</label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream p-1.5 font-serif text-xs text-deepgreen focus:outline-none"
                >
                  <option value="ALL">All Cities</option>
                  <option value="Pune">Pune</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Nagpur">Nagpur</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">LOCALITY SEARCH</label>
                <input
                  type="text"
                  placeholder="e.g. Hinjewadi, Indiranagar..."
                  value={localityFilter}
                  onChange={(e) => setLocalityFilter(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream p-1.5 font-serif text-xs text-deepgreen placeholder:text-deepgreen/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">MAX MONTHLY RENT</label>
                <select
                  value={budgetMaxFilter}
                  onChange={(e) => setBudgetMaxFilter(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream p-1.5 font-serif text-xs text-deepgreen focus:outline-none"
                >
                  <option value="any">Any Budget</option>
                  <option value="15000">Up to ₹15,000</option>
                  <option value="20000">Up to ₹20,000</option>
                  <option value="25000">Up to ₹25,000</option>
                  <option value="35000">Up to ₹35,000</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">FURNISHING STATUS</label>
                <select
                  value={furnishingFilter}
                  onChange={(e) => setFurnishingFilter(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream p-1.5 font-serif text-xs text-deepgreen focus:outline-none"
                >
                  <option value="all">All Furnishings</option>
                  <option value="fully_furnished">Fully Furnished</option>
                  <option value="semi_furnished">Semi-Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </select>
              </div>
            </div>

            {/* Amenities Multi-Select Tags */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-2">
                FILTER BY MUST-HAVE AMENITIES:
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_AMENITIES.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity)
                  return (
                    <button
                      key={amenity}
                      onClick={() => {
                        setSelectedAmenities((prev) =>
                          isSelected ? prev.filter((a) => a !== amenity) : [...prev, amenity]
                        )
                      }}
                      className={`px-2.5 py-1 border text-xs transition-colors ${
                        isSelected
                          ? 'border-deepgreen bg-tomato text-cream font-bold shadow-[1px_1px_0px_#263F32]'
                          : 'border-deepgreen/40 bg-cream text-deepgreen hover:border-deepgreen'
                      }`}
                    >
                      {amenity}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-24 text-center font-mono text-xs text-deepgreen/60 flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-tomato" />
            <span>Loading verified room listings...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && displayedListings.length === 0 && (
          <div className="p-8 sm:p-14 border-2 border-deepgreen bg-cream-light text-center space-y-6 shadow-[6px_6px_0px_#263F32] max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-butter/50 border-2 border-deepgreen mx-auto flex items-center justify-center text-tomato shadow-[3px_3px_0px_#263F32]">
              <Home className="h-8 w-8 text-tomato" />
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-tomato font-bold bg-tomato/10 px-2.5 py-0.5 border border-tomato/30">
                {activeTab === 'my_listings'
                  ? 'Your Publishing Studio'
                  : activeTab === 'saved'
                  ? 'Personal Bookmarks'
                  : 'Zero-Brokerage Community Network'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black uppercase text-deepgreen font-serif">
                {activeTab === 'my_listings'
                  ? 'You Haven’t Published Any Rooms Yet'
                  : activeTab === 'saved'
                  ? 'No Saved Bookmarks'
                  : cityFilter !== 'ALL'
                  ? `No Rooms Published in ${cityFilter} Yet`
                  : 'No Shared Rooms or Flats Published Yet'}
              </h3>
              <p className="font-serif italic text-sm text-deepgreen/80 max-w-lg mx-auto leading-relaxed">
                {activeTab === 'my_listings'
                  ? 'Own a flat or have an unoccupied room to share? Publish your listing to connect directly with compatible, verified flatmates — 100% direct with 0% brokerage.'
                  : activeTab === 'saved'
                  ? 'Bookmark room listings to review and compare them with prospective flatmates.'
                  : 'YAARO is a member-powered shared living collective. We do not display artificial properties or fake broker listings. Listings appear here organically as real registered members publish their available rooms and flats.'}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  setEditingListingId(null)
                  setTitle('')
                  setLocality('')
                  setDescription('')
                  setIsPublishModalOpen(true)
                }}
                className="px-6 py-3 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs border-2 border-deepgreen shadow-[3px_3px_0px_#263F32] flex items-center gap-2 transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                <Plus className="h-4 w-4" />
                <span>Publish a Room Listing +</span>
              </button>

              <Link
                href="/discover"
                className="px-5 py-3 border-2 border-deepgreen bg-cream hover:bg-butter text-deepgreen font-mono text-xs font-bold uppercase transition-colors shadow-[2px_2px_0px_#263F32] flex items-center gap-1.5"
              >
                <span>Find Flatmates First</span>
                <span className="text-tomato font-bold">↗</span>
              </Link>
            </div>

            {(cityFilter !== 'ALL' || localityFilter || budgetMaxFilter !== 'any' || furnishingFilter !== 'all' || selectedAmenities.length > 0) && (
              <div className="pt-3 border-t border-deepgreen/20">
                <button
                  onClick={() => {
                    setCityFilter('ALL')
                    setLocalityFilter('')
                    setBudgetMaxFilter('any')
                    setFurnishingFilter('all')
                    setRoomTypeFilter('all')
                    setSelectedAmenities([])
                  }}
                  className="text-xs font-mono text-deepgreen/70 hover:text-tomato underline"
                >
                  Clear Active Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Room Listings Stream (Editorial 35mm Format) */}
        {!isLoading && displayedListings.length > 0 && (
          <div className="space-y-8">
            {displayedListings.map((room) => {
              const mainPhoto = room.images[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af'
              return (
                <article
                  key={room.id}
                  className="border-2 border-deepgreen bg-cream-light shadow-[8px_8px_0px_#263F32] overflow-hidden"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* Left 35mm Property Photography (7 Cols) */}
                    <div className="lg:col-span-7 relative border-b-2 lg:border-b-0 lg:border-r-2 border-deepgreen bg-sand/30 overflow-hidden">
                      <div className="relative group cursor-pointer" onClick={() => setSelectedRoom(room)}>
                        <img
                          src={mainPhoto}
                          alt={room.title}
                          className="w-full h-80 sm:h-96 lg:h-[430px] object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Verified Zero-Brokerage Stamp */}
                        <div className="absolute top-3 left-3 bg-deepgreen text-cream px-3 py-1 font-mono text-xs font-bold uppercase border border-deepgreen shadow-[2px_2px_0px_#E95D43]">
                          ✓ VERIFIED ZERO-BROKERAGE
                        </div>

                        {/* Photo Count */}
                        <div className="absolute bottom-3 left-3 bg-cream/95 text-deepgreen px-2.5 py-1 font-mono text-[11px] font-bold border border-deepgreen shadow-[1px_1px_0px_#263F32]">
                          📷 {room.images.length} Photos
                        </div>

                        {/* Bookmark Button */}
                        <button
                          onClick={(e) => handleToggleSave(e, room.id)}
                          className={`absolute top-3 right-3 p-2.5 border border-deepgreen transition-colors ${
                            room.isSaved ? 'bg-tomato text-cream' : 'bg-cream text-deepgreen hover:bg-butter'
                          }`}
                          title={room.isSaved ? 'Saved in bookmarks' : 'Save room'}
                        >
                          <Bookmark className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Locality Privacy Area Bar */}
                      <div className="p-3 bg-deepgreen text-cream flex items-center justify-between font-mono text-xs border-t-2 border-deepgreen">
                        <span className="truncate">📍 {room.locality}, {room.city}</span>
                        <span className="text-butter font-bold shrink-0 ml-2">Approximate Area</span>
                      </div>
                    </div>

                    {/* Right Editorial Dossier Details (5 Cols) */}
                    <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-4">
                      <div>
                        {/* Title & Plate Tag */}
                        <div className="border-b border-deepgreen/20 pb-3 mb-3">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-tomato font-bold block mb-1">
                            {room.neighborhoodVibe}
                          </span>
                          <h2
                            onClick={() => setSelectedRoom(room)}
                            className="text-2xl font-black uppercase text-deepgreen font-serif leading-tight cursor-pointer hover:text-tomato transition-colors"
                          >
                            {room.title}
                          </h2>
                          <p className="font-mono text-xs text-deepgreen/70 mt-1">
                            Hosted by {room.host.fullName} • {room.host.occupation}
                          </p>
                        </div>

                        {/* Price & Deposit */}
                        <div className="flex items-baseline justify-between bg-cream p-3 border border-deepgreen mb-3">
                          <div>
                            <span className="text-[10px] uppercase font-mono text-deepgreen/60 block">RENT</span>
                            <span className="font-serif font-black text-2xl text-deepgreen">
                              ₹{room.rentMonthly.toLocaleString()}
                              <span className="text-xs font-mono font-normal text-deepgreen/70"> / mo</span>
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-mono text-deepgreen/60 block">REFUNDABLE DEPOSIT</span>
                            <span className="font-mono font-bold text-xs text-deepgreen">
                              ₹{room.securityDeposit.toLocaleString()} (2 Mo Cap)
                            </span>
                          </div>
                        </div>

                        {/* Specs Pill Row */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className="px-2 py-0.5 border border-deepgreen bg-cream text-deepgreen font-mono text-[11px] font-bold">
                            {room.roomType === 'private' ? 'Private Master Bed' : 'Shared Bed'}
                          </span>
                          <span className="px-2 py-0.5 border border-deepgreen bg-cream text-deepgreen font-mono text-[11px] font-bold">
                            {room.furnishedType.replace('_', ' ')}
                          </span>
                          {room.attachedBathroom && (
                            <span className="px-2 py-0.5 border border-deepgreen bg-butter text-deepgreen font-mono text-[11px] font-bold">
                              Attached Bath
                            </span>
                          )}
                          {room.balconyAvailable && (
                            <span className="px-2 py-0.5 border border-deepgreen bg-butter text-deepgreen font-mono text-[11px] font-bold">
                              Balcony
                            </span>
                          )}
                        </div>

                        {/* Description Preview */}
                        <p className="font-serif italic text-xs text-deepgreen/80 line-clamp-3 leading-relaxed mb-3">
                          “{room.description}”
                        </p>

                        {/* Top Amenities */}
                        <div className="flex flex-wrap gap-1 text-[10px] font-mono text-deepgreen/70">
                          {room.amenities.slice(0, 4).map((a, idx) => (
                            <span key={idx} className="bg-sand/40 px-1.5 py-0.5 border border-deepgreen/30">
                              ✓ {a}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t-2 border-deepgreen space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedRoom(room)
                              setActivePhotoIndex(0)
                            }}
                            className="flex-1 py-3 bg-cream hover:bg-butter border-2 border-deepgreen text-deepgreen font-mono text-xs font-bold uppercase transition-colors shadow-[2px_2px_0px_#263F32]"
                          >
                            Inspect Dossier →
                          </button>

                          <button
                            onClick={() => {
                              setEnquiryRoom(room)
                              setEnquiryMessage(
                                `Hi ${room.host.fullName}! I saw "${room.title}" on YAARO and would love to schedule a chai walkthrough.`
                              )
                            }}
                            className="flex-1 py-3 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors border-2 border-deepgreen shadow-[3px_3px_0px_#263F32] flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Send Enquiry ↗</span>
                          </button>
                        </div>

                        {/* My Listings Controls */}
                        {activeTab === 'my_listings' && (
                          <div className="flex items-center justify-between pt-2 border-t border-deepgreen/20 font-mono text-xs">
                            <button
                              onClick={() => handleToggleStatus(room)}
                              className={`px-2.5 py-1 border border-deepgreen font-bold uppercase ${
                                room.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-sand text-deepgreen'
                              }`}
                            >
                              Status: {room.status === 'active' ? 'Active' : 'Rented Out'}
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(room)}
                                className="p-1 border border-deepgreen bg-cream hover:bg-butter"
                                title="Edit Listing"
                              >
                                <Edit3 className="h-3.5 w-3.5 text-deepgreen" />
                              </button>
                              <button
                                onClick={() => handleDeleteListing(room.id)}
                                className="p-1 border border-deepgreen bg-cream hover:bg-red-50 text-red-600"
                                title="Delete Listing"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* DETAILED ROOM DOSSIER MODAL */}
        {selectedRoom && (
          <div className="fixed inset-0 z-50 bg-deepgreen/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-3xl w-full bg-cream-light border-2 border-deepgreen p-6 sm:p-8 shadow-[10px_10px_0px_#263F32] space-y-6 my-8 animate-scale-up">
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b-2 border-deepgreen pb-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
                    VERIFIED FLAT DOSSIER // {selectedRoom.neighborhoodVibe}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase text-deepgreen font-serif mt-0.5">
                    {selectedRoom.title}
                  </h3>
                  <p className="font-mono text-xs text-deepgreen/70">
                    📍 {selectedRoom.locality}, {selectedRoom.city} • Hosted by {selectedRoom.host.fullName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="p-1.5 border border-deepgreen bg-cream hover:bg-red-50 text-deepgreen"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Photo Gallery with Slider */}
              <div className="space-y-2">
                <div className="relative h-72 sm:h-96 border-2 border-deepgreen overflow-hidden bg-sand">
                  <img
                    src={selectedRoom.images[activePhotoIndex] || selectedRoom.images[0]}
                    alt={selectedRoom.title}
                    className="w-full h-full object-cover"
                  />
                  {selectedRoom.images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setActivePhotoIndex((prev) =>
                            prev === 0 ? selectedRoom.images.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-cream/90 border border-deepgreen shadow-[2px_2px_0px_#263F32]"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          setActivePhotoIndex((prev) =>
                            prev === selectedRoom.images.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-cream/90 border border-deepgreen shadow-[2px_2px_0px_#263F32]"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {selectedRoom.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selectedRoom.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhotoIndex(i)}
                        className={`w-16 h-12 border-2 shrink-0 overflow-hidden ${
                          activePhotoIndex === i ? 'border-tomato shadow-[2px_2px_0px_#263F32]' : 'border-deepgreen/40 opacity-70'
                        }`}
                      >
                        <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Financial Specifications Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 border border-deepgreen bg-cream">
                  <span className="text-[10px] text-deepgreen/60 uppercase block">MONTHLY RENT</span>
                  <span className="font-serif font-black text-lg text-deepgreen">
                    ₹{selectedRoom.rentMonthly.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 border border-deepgreen bg-cream">
                  <span className="text-[10px] text-deepgreen/60 uppercase block">SECURITY DEPOSIT</span>
                  <span className="font-bold text-deepgreen">
                    ₹{selectedRoom.securityDeposit.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 border border-deepgreen bg-cream">
                  <span className="text-[10px] text-deepgreen/60 uppercase block">ROOM TYPE</span>
                  <span className="font-bold text-deepgreen capitalize">{selectedRoom.roomType}</span>
                </div>
                <div className="p-3 border border-deepgreen bg-cream">
                  <span className="text-[10px] text-deepgreen/60 uppercase block">FURNISHING</span>
                  <span className="font-bold text-deepgreen capitalize">
                    {selectedRoom.furnishedType.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 bg-cream border border-deepgreen space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-tomato block">
                  PROPERTY OVERVIEW &amp; LIVING ARRANGEMENT
                </span>
                <p className="font-serif text-sm text-deepgreen leading-relaxed whitespace-pre-line">
                  {selectedRoom.description}
                </p>
              </div>

              {/* Amenities Grid */}
              <div>
                <h5 className="font-mono text-xs font-bold uppercase text-deepgreen mb-2">
                  VERIFIED AMENITIES &amp; INCLUSIONS
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedRoom.amenities.map((a, i) => (
                    <div
                      key={i}
                      className="p-2 border border-deepgreen bg-cream text-xs font-mono text-deepgreen flex items-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5 text-tomato shrink-0" />
                      <span className="truncate">{a}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Privacy Radar */}
              <div className="p-4 bg-butter/30 border-2 border-deepgreen flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] uppercase font-bold text-deepgreen/70 block">
                    LOCATION PRIVACY RADAR (RESIDENT PROTECTION)
                  </span>
                  <p className="font-serif text-xs text-deepgreen">
                    Approximate Area: <span className="font-bold">{selectedRoom.locality}, {selectedRoom.city}</span>
                  </p>
                  <p className="text-[11px] text-deepgreen/70">
                    Exact flat numbers and residential addresses are never displayed publicly. They are unlocked after in-app host walkthrough confirmation.
                  </p>
                </div>
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-deepgreen bg-cream flex flex-col items-center justify-center shrink-0 text-center text-[9px] font-bold">
                  <span>~500m</span>
                  <span className="text-tomato">Area Radius</span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 border-t-2 border-deepgreen flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setReportTargetRoom(selectedRoom)
                    setSelectedRoom(null)
                  }}
                  className="font-mono text-xs text-deepgreen/60 hover:text-red-600 underline flex items-center gap-1"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Report Suspicious Listing</span>
                </button>

                <button
                  onClick={() => {
                    const r = selectedRoom
                    setSelectedRoom(null)
                    setEnquiryRoom(r)
                    setEnquiryMessage(
                      `Hi ${r.host.fullName}! I saw "${r.title}" on YAARO and would love to schedule a chai walkthrough.`
                    )
                  }}
                  className="px-6 py-3 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase text-xs border border-deepgreen shadow-[3px_3px_0px_#263F32] flex items-center gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Send Enquiry to Host ↗</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SEND ENQUIRY MODAL */}
        {enquiryRoom && (
          <div className="fixed inset-0 z-50 bg-deepgreen/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-cream border-4 border-deepgreen p-6 sm:p-8 shadow-[10px_10px_0px_#263F32] space-y-4 animate-scale-up">
              <div className="flex justify-between items-start border-b-2 border-deepgreen pb-3">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
                    DIRECT IN-APP ENQUIRY
                  </span>
                  <h4 className="text-xl font-black uppercase text-deepgreen font-serif mt-0.5">
                    Contact {enquiryRoom.host.fullName}
                  </h4>
                </div>
                <button onClick={() => setEnquiryRoom(null)} className="p-1 text-deepgreen">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {enquirySuccess ? (
                <div className="p-6 bg-butter border-2 border-deepgreen text-center space-y-2 animate-fade-in font-mono text-xs">
                  <CheckCircle2 className="h-8 w-8 text-emerald-800 mx-auto" />
                  <p className="font-bold text-deepgreen">Enquiry Sent to Host!</p>
                  <p className="text-deepgreen/80">
                    A conversation thread has been opened in your Chat with the room card attached.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendEnquiry} className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">
                      MESSAGE TO HOST
                    </label>
                    <textarea
                      rows={4}
                      value={enquiryMessage}
                      onChange={(e) => setEnquiryMessage(e.target.value)}
                      className="w-full border-2 border-deepgreen bg-cream p-2.5 font-serif text-sm text-deepgreen focus:outline-none focus:border-tomato"
                      placeholder="Introduce yourself and ask about move-in timelines or walkthroughs..."
                      required
                    />
                  </div>

                  <div className="p-3 bg-sand/30 border border-deepgreen text-[11px] text-deepgreen/70">
                    ✓ Interactive room card will be automatically attached in chat.
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSendingEnquiry}
                      className="flex-1 py-3 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase text-xs border border-deepgreen shadow-[2px_2px_0px_#263F32]"
                    >
                      {isSendingEnquiry ? 'Sending...' : 'Send Enquiry via Chat ↗'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnquiryRoom(null)}
                      className="flex-1 py-3 border-2 border-deepgreen bg-cream hover:bg-butter font-mono text-xs font-bold uppercase"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* PUBLISH / EDIT ROOM LISTING MODAL */}
        {isPublishModalOpen && (
          <div className="fixed inset-0 z-50 bg-deepgreen/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-2xl w-full bg-cream-light border-4 border-deepgreen p-6 sm:p-8 shadow-[10px_10px_0px_#263F32] space-y-5 my-8 animate-scale-up">
              <div className="flex justify-between items-start border-b-2 border-deepgreen pb-3">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
                    ZERO-BROKERAGE LISTING DISPATCH
                  </span>
                  <h3 className="text-2xl font-black uppercase text-deepgreen font-serif mt-0.5">
                    {editingListingId ? 'Edit Room Listing' : 'Publish Verified Room Listing'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsPublishModalOpen(false)}
                  className="p-1 border border-deepgreen bg-cream hover:bg-red-50 text-deepgreen"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-100 border-2 border-red-500 text-red-800 font-mono text-xs font-bold">
                  {formError}
                </div>
              )}

              <form onSubmit={handlePublishSubmit} className="space-y-4 font-mono text-xs">
                {/* Title */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">
                    LISTING TITLE *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Sunlit Master Bed in Hinjewadi Phase 1 Gated Society"
                    className="w-full border-2 border-deepgreen bg-cream p-2 font-serif text-sm text-deepgreen focus:outline-none focus:border-tomato"
                    required
                  />
                </div>

                {/* City & Locality */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">CITY *</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full border-2 border-deepgreen bg-cream p-2 font-serif text-xs text-deepgreen focus:outline-none"
                    >
                      <option value="Pune">Pune</option>
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Delhi">Delhi NCR</option>
                      <option value="Hyderabad">Hyderabad</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">
                      LOCALITY (APPROXIMATE) *
                    </label>
                    <input
                      type="text"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="e.g. Hinjewadi Phase 1, Indiranagar..."
                      className="w-full border-2 border-deepgreen bg-cream p-2 font-serif text-xs text-deepgreen focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Rent & Deposit */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">
                      MONTHLY RENT (₹) *
                    </label>
                    <input
                      type="number"
                      value={rentMonthly}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0
                        setRentMonthly(val)
                        setSecurityDeposit(val * 2)
                      }}
                      className="w-full border-2 border-deepgreen bg-cream p-2 font-serif text-sm text-deepgreen focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">
                      SECURITY DEPOSIT (₹, CAPPED 2 MO)
                    </label>
                    <input
                      type="number"
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(parseInt(e.target.value, 10) || 0)}
                      className="w-full border-2 border-deepgreen bg-cream p-2 font-serif text-sm text-deepgreen focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">
                      MAINTENANCE (₹/MO)
                    </label>
                    <input
                      type="number"
                      value={maintenanceMonthly}
                      onChange={(e) => setMaintenanceMonthly(parseInt(e.target.value, 10) || 0)}
                      className="w-full border-2 border-deepgreen bg-cream p-2 font-serif text-sm text-deepgreen focus:outline-none"
                    />
                  </div>
                </div>

                {/* Room Type & Furnishing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">ROOM TYPE</label>
                    <select
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value as any)}
                      className="w-full border-2 border-deepgreen bg-cream p-2 font-serif text-xs text-deepgreen focus:outline-none"
                    >
                      <option value="private">Private Bedroom</option>
                      <option value="shared">Shared Bed in Double Occupancy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">FURNISHING</label>
                    <select
                      value={furnishedType}
                      onChange={(e) => setFurnishedType(e.target.value as any)}
                      className="w-full border-2 border-deepgreen bg-cream p-2 font-serif text-xs text-deepgreen focus:outline-none"
                    >
                      <option value="fully_furnished">Fully Furnished</option>
                      <option value="semi_furnished">Semi-Furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                    </select>
                  </div>
                </div>

                {/* Attached Bath & Balcony Toggles */}
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-mono text-xs">
                    <input
                      type="checkbox"
                      checked={attachedBathroom}
                      onChange={(e) => setAttachedBathroom(e.target.checked)}
                      className="accent-tomato h-4 w-4"
                    />
                    <span>Attached Washroom</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-mono text-xs">
                    <input
                      type="checkbox"
                      checked={balconyAvailable}
                      onChange={(e) => setBalconyAvailable(e.target.checked)}
                      className="accent-tomato h-4 w-4"
                    />
                    <span>Private Balcony</span>
                  </label>
                </div>

                {/* Amenities Multi-Select */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1.5">
                    SELECT AMENITIES:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {AVAILABLE_AMENITIES.map((a) => {
                      const isChecked = formAmenities.includes(a)
                      return (
                        <label key={a} className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setFormAmenities((prev) =>
                                isChecked ? prev.filter((item) => item !== a) : [...prev, a]
                              )
                            }}
                            className="accent-tomato h-3.5 w-3.5"
                          />
                          <span className="truncate">{a}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Photos */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">
                    ROOM PHOTOGRAPHS (IMAGE URLS)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={photoUrlInput}
                      onChange={(e) => setPhotoUrlInput(e.target.value)}
                      placeholder="Paste Unsplash / Storage image URL..."
                      className="flex-1 border-2 border-deepgreen bg-cream p-1.5 font-serif text-xs text-deepgreen focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (photoUrlInput.trim()) {
                          setUploadedPhotos((prev) => [...prev, photoUrlInput.trim()])
                          setPhotoUrlInput('')
                        }
                      }}
                      className="px-3 py-1 bg-deepgreen text-cream font-mono text-xs uppercase"
                    >
                      Add Photo
                    </button>
                  </div>

                  {uploadedPhotos.length > 0 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                      {uploadedPhotos.map((img, i) => (
                        <div key={i} className="relative w-16 h-12 border border-deepgreen shrink-0">
                          <img src={img} alt="preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setUploadedPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                            className="absolute -top-1 -right-1 bg-tomato text-cream rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">
                    DESCRIPTION &amp; FLAT VIBE
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the flat, current flatmates, quiet hours, and what makes living here great..."
                    className="w-full border-2 border-deepgreen bg-cream p-2 font-serif text-xs text-deepgreen focus:outline-none"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="pt-2 flex items-center gap-3 border-t-2 border-deepgreen">
                  <button
                    type="submit"
                    disabled={isSubmittingListing}
                    className="flex-1 py-3 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase text-xs border border-deepgreen shadow-[2px_2px_0px_#263F32]"
                  >
                    {isSubmittingListing
                      ? 'Publishing...'
                      : editingListingId
                      ? 'Save Changes'
                      : 'Publish Room Listing ↗'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublishModalOpen(false)}
                    className="flex-1 py-3 border-2 border-deepgreen bg-cream hover:bg-butter font-mono text-xs font-bold uppercase"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* REPORT SUSPICIOUS LISTING MODAL */}
        {reportTargetRoom && (
          <div className="fixed inset-0 z-50 bg-deepgreen/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-cream border-4 border-deepgreen p-6 sm:p-8 shadow-[10px_10px_0px_#263F32] space-y-4 animate-scale-up font-mono text-xs">
              <div className="flex items-center gap-2 border-b-2 border-deepgreen pb-3">
                <ShieldAlert className="h-6 w-6 text-tomato shrink-0" />
                <h4 className="font-serif font-black uppercase text-lg text-deepgreen">
                  Report Suspicious Listing
                </h4>
              </div>

              {reportStatus ? (
                <div className="p-4 bg-butter border border-deepgreen text-center font-bold text-deepgreen">
                  {reportStatus}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-serif text-xs text-deepgreen">
                    Reporting: <span className="font-bold">{reportTargetRoom.title}</span>
                  </p>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">REASON</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full border-2 border-deepgreen bg-cream p-2 font-serif text-xs text-deepgreen focus:outline-none"
                    >
                      <option value="Brokerage solicitation">Hidden brokerage solicitation</option>
                      <option value="Misleading photographs">Misleading or stolen photographs</option>
                      <option value="Incorrect rent / deposit">Price mismatch from agreed listing</option>
                      <option value="Harassment or fraud">Suspected fraudulent landlord / fraud</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">
                      DETAILS (OPTIONAL)
                    </label>
                    <textarea
                      rows={3}
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Provide context..."
                      className="w-full border-2 border-deepgreen bg-cream p-2 font-serif text-xs text-deepgreen focus:outline-none"
                    />
                  </div>
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={handleReportSubmit}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-serif font-bold uppercase text-xs border border-deepgreen shadow-[2px_2px_0px_#263F32]"
                    >
                      Submit Report
                    </button>
                    <button
                      onClick={() => setReportTargetRoom(null)}
                      className="flex-1 py-3 border-2 border-deepgreen bg-cream hover:bg-butter font-mono text-xs font-bold uppercase"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
