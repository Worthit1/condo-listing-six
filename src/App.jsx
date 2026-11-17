import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Building2,
  Lock,
  DollarSign,
  Car,
  Phone,
  Mail,
  FileCheck,
  AlertCircle,
  Plus,
  X,
  MapPin,
  ShieldCheck,
  Clock,
  Database,
  Loader2,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

const INITIAL_BUILDINGS = [
  {
    name: 'Ice Condominiums (York Centre)',
    address: '12 & 14 York St',
    neighborhood: 'South Core / Waterfront',
    corpNumber: 'TSCC 2510',
    lockboxPolicy: 'Off-site only — No lockboxes permitted on site or bike racks',
    lockboxAllowed: false,
    feeAmount: '$75.00',
    feeMethod: 'Bank Draft or Certified Cheque payable to TSCC 2510',
    authorizationRequired: 'Signed Owner Authorization Form + MLS Listing Agreement + Agent Business Card',
    visitorParking: 'Paid underground visitor parking via P1 (Enter off York St); register plate at concierge',
    managementCompany: 'Del Property Management',
    managementPhone: '(416) 555-0192',
    managementEmail: 'mgmt@icecondos-toronto.ca',
    conciergePhone: '(416) 555-0199',
    notes: 'Security strictly cuts unauthorized lockboxes on surrounding street furniture. Key release requires 24h advance management registration.',
  },
  {
    name: 'Charlie Condos',
    address: '8 Charlotte St',
    neighborhood: 'King West',
    corpNumber: 'TSCC 2274',
    lockboxPolicy: 'Concierge Key Safe / Dedicated Lockbox Room in P1',
    lockboxAllowed: true,
    feeAmount: '$50.00',
    feeMethod: 'E-Transfer or Cheque payable to TSCC 2274',
    authorizationRequired: 'Listing Agreement Schedule + Property Management Key Release Form',
    visitorParking: '14 visitor spots on P1 (Max 4 hours; register with concierge immediately)',
    managementCompany: 'Crossbridge Condominium Services',
    managementPhone: '(416) 555-0144',
    managementEmail: 'charlie.mgmt@crossbridge.ca',
    conciergePhone: '(416) 555-0148',
    notes: 'Lockboxes must be clearly tagged with Unit # and Brokerage name. Untagged boxes are removed monthly.',
  },
  {
    name: 'One Bloor East',
    address: '1 Bloor St E',
    neighborhood: 'Yorkville / Bloor-Yonge',
    corpNumber: 'TSCC 2631',
    lockboxPolicy: 'Concierge Key Custody Only (No physical Realtor lockboxes)',
    lockboxAllowed: false,
    feeAmount: '$100.00',
    feeMethod: 'Certified Cheque or Money Order payable to TSCC 2631',
    authorizationRequired: 'Notarized/Signed Owner Consent + Brokerage Letter + RECO License Copy',
    visitorParking: 'Commercial paid garage entrance off Hayden St (No free Realtor visitor parking)',
    managementCompany: 'FirstService Residential',
    managementPhone: '(416) 555-0177',
    managementEmail: 'onebloor.admin@fsresidential.com',
    conciergePhone: '(416) 555-0180',
    notes: 'Showing agents must leave physical photo ID with concierge while holding keys.',
  },
  {
    name: 'The Merchandise Lofts',
    address: '155 Dalhousie St',
    neighborhood: 'Garden District / Church-Yonge',
    corpNumber: 'MTCC 1368',
    lockboxPolicy: 'Designated Exterior Rail at Rear Laneway Entrance',
    lockboxAllowed: true,
    feeAmount: '$0.00 (Free)',
    feeMethod: 'No fee — Registration form required',
    authorizationRequired: 'Email copy of Listing Agreement to Management Office prior to install',
    visitorParking: 'Limited surface visitor spots off Dalhousie; Green P across the street',
    managementCompany: 'Brookfield Condominium Services',
    managementPhone: '(416) 555-0123',
    managementEmail: 'merchandise@brookfieldcondos.ca',
    conciergePhone: '(416) 555-0125',
    notes: 'Fob programming for showings requires 48 hours notice through management office.',
  },
];

export default function App() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lockboxFilter, setLockboxFilter] = useState('all');
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newBuilding, setNewBuilding] = useState({
    name: '',
    address: '',
    neighborhood: '',
    corpNumber: '',
    lockboxPolicy: '',
    lockboxAllowed: true,
    feeAmount: '',
    feeMethod: '',
    authorizationRequired: '',
    visitorParking: '',
    managementCompany: '',
    managementPhone: '',
    managementEmail: '',
    conciergePhone: '',
    notes: '',
  });

  // Real-time listener connected to Firestore "buildings" collection
  useEffect(() => {
    let seeded = false;
    const buildingsRef = collection(db, 'buildings');
    const q = query(buildingsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty && !seeded) {
          seeded = true;
          for (const b of [...INITIAL_BUILDINGS].reverse()) {
            await addDoc(buildingsRef, {
              ...b,
              createdAt: serverTimestamp(),
            });
          }
          return;
        }

        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setBuildings(list);
        setLoading(false);
        setSelectedBuildingId((prevId) => {
          if (prevId && list.some((item) => item.id === prevId)) return prevId;
          return list[0]?.id || null;
        });
      },
      (error) => {
        console.error('Firestore sync error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const selectedBuilding = useMemo(() => {
    return buildings.find((b) => b.id === selectedBuildingId) || buildings[0] || null;
  }, [buildings, selectedBuildingId]);

  const filteredBuildings = useMemo(() => {
    return buildings.filter((b) => {
      const matchesSearch =
        (b.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.neighborhood || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.corpNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        lockboxFilter === 'all' ||
        (lockboxFilter === 'allowed' && b.lockboxAllowed) ||
        (lockboxFilter === 'restricted' && !b.lockboxAllowed);

      return matchesSearch && matchesFilter;
    });
  }, [buildings, searchQuery, lockboxFilter]);

  const handleAddBuilding = async (e) => {
    e.preventDefault();
    if (!newBuilding.name || !newBuilding.address || saving) return;

    try {
      setSaving(true);
      const docRef = await addDoc(collection(db, 'buildings'), {
        ...newBuilding,
        createdAt: serverTimestamp(),
      });
      setSelectedBuildingId(docRef.id);
      setShowAddModal(false);
      setNewBuilding({
        name: '',
        address: '',
        neighborhood: '',
        corpNumber: '',
        lockboxPolicy: '',
        lockboxAllowed: true,
        feeAmount: '',
        feeMethod: '',
        authorizationRequired: '',
        visitorParking: '',
        managementCompany: '',
        managementPhone: '',
        managementEmail: '',
        conciergePhone: '',
        notes: '',
      });
    } catch (err) {
      alert('Could not save building. Check your Firebase Firestore rules.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  CondoListingInTheSix<span className="text-amber-400">.com</span>
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/30">
                  <Database className="h-3 w-3" />
                  Live Cloud Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Building-by-building listing protocols, lockbox rules &amp; management contacts
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Building Protocol
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Search & Filter Bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by street address, building name, neighborhood, or TSCC/MTCC #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All Buildings' },
              { id: 'allowed', label: 'Lockbox Allowed' },
              { id: 'restricted', label: 'No Lockbox / Concierge' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setLockboxFilter(tab.id)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                  lockboxFilter === tab.id
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            <p className="mt-3 text-sm">Connecting to Toronto Condo Database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Building List */}
            <div className="space-y-3 lg:col-span-5">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>{filteredBuildings.length} buildings found</span>
                <span>Click a building for full protocol</span>
              </div>

              {filteredBuildings.map((building) => {
                const isSelected = selectedBuilding?.id === building.id;
                return (
                  <button
                    key={building.id}
                    onClick={() => setSelectedBuildingId(building.id)}
                    className={`w-full text-left rounded-xl border p-4 transition cursor-pointer ${
                      isSelected
                        ? 'border-amber-500/70 bg-slate-900 shadow-lg shadow-amber-500/5'
                        : 'border-slate-800/90 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-semibold text-white">{building.name}</h2>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                          <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          {building.address} • {building.neighborhood}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-slate-800 px-2 py-1 text-xs font-mono text-slate-300">
                        {building.corpNumber}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          building.lockboxAllowed
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        <Lock className="h-3 w-3" />
                        {building.lockboxAllowed ? 'Lockbox Permitted' : 'No On-Site Lockbox'}
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
                        <DollarSign className="h-3 w-3 text-amber-400" />
                        {building.feeAmount || 'Fee TBD'}
                      </span>
                    </div>
                  </button>
                );
              })}

              {filteredBuildings.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
                  <p className="text-sm text-slate-400">No buildings match your search.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setLockboxFilter('all');
                    }}
                    className="mt-2 text-xs font-medium text-amber-400 hover:underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>

            {/* Right Detailed Protocol Card */}
            <div className="lg:col-span-7">
              {selectedBuilding ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-mono font-semibold text-amber-400 border border-amber-500/30">
                          {selectedBuilding.corpNumber || 'Condo Corp'}
                        </span>
                        <span className="text-xs text-slate-400">{selectedBuilding.neighborhood}</span>
                      </div>
                      <h2 className="mt-2 text-2xl font-bold text-white">{selectedBuilding.name}</h2>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300">
                        <MapPin className="h-4 w-4 text-amber-400" />
                        {selectedBuilding.address}, Toronto, ON
                      </p>
                    </div>

                    <div
                      className={`rounded-xl px-3.5 py-2 text-xs font-semibold border ${
                        selectedBuilding.lockboxAllowed
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {selectedBuilding.lockboxAllowed
                        ? '✓ On-Site Lockbox Allowed'
                        : '✕ Strict No-Lockbox Building'}
                    </div>
                  </div>

                  {/* Key Listing Details Grid */}
                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                        <Lock className="h-4 w-4" />
                        Lockbox &amp; Key Policy
                      </div>
                      <p className="mt-2 text-sm text-slate-200 leading-relaxed">
                        {selectedBuilding.lockboxPolicy || 'Not specified yet'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                        <DollarSign className="h-4 w-4" />
                        Required Listing / Key Fee
                      </div>
                      <p className="mt-2 text-lg font-bold text-white">
                        {selectedBuilding.feeAmount || 'N/A'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{selectedBuilding.feeMethod}</p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:col-span-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                        <FileCheck className="h-4 w-4" />
                        Required Authorization &amp; Paperwork
                      </div>
                      <p className="mt-2 text-sm text-slate-200 leading-relaxed">
                        {selectedBuilding.authorizationRequired || 'Standard MLS Listing Agreement'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:col-span-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                        <Car className="h-4 w-4" />
                        Visitor &amp; Showing Parking
                      </div>
                      <p className="mt-2 text-sm text-slate-200 leading-relaxed">
                        {selectedBuilding.visitorParking || 'Check with concierge upon arrival'}
                      </p>
                    </div>
                  </div>

                  {/* Contacts Section */}
                  <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <ShieldCheck className="h-4 w-4 text-amber-400" />
                      Property Management &amp; Concierge Contacts
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-slate-400">Management Company</p>
                        <p className="text-sm font-semibold text-white">
                          {selectedBuilding.managementCompany || 'Not listed'}
                        </p>
                        <div className="mt-2 space-y-1 text-xs text-slate-300">
                          {selectedBuilding.managementPhone && (
                            <p className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-amber-400" />
                              {selectedBuilding.managementPhone}
                            </p>
                          )}
                          {selectedBuilding.managementEmail && (
                            <p className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-amber-400" />
                              {selectedBuilding.managementEmail}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">24/7 Concierge / Security Desk</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white">
                          <Clock className="h-4 w-4 text-amber-400" />
                          {selectedBuilding.conciergePhone || 'Not listed'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Realtor Field Notes */}
                  {selectedBuilding.notes && (
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                      <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                          Listing Agent Field Tip
                        </p>
                        <p className="mt-1 text-sm text-amber-100/90 leading-relaxed">
                          {selectedBuilding.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>

      {/* Add Building Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Add Toronto Condo Protocol</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddBuilding} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300">Building Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g., Theatre Park"
                    value={newBuilding.name}
                    onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Street Address *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g., 224 King St W"
                    value={newBuilding.address}
                    onChange={(e) => setNewBuilding({ ...newBuilding, address: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Neighborhood</label>
                  <input
                    type="text"
                    placeholder="e.g., Entertainment District"
                    value={newBuilding.neighborhood}
                    onChange={(e) => setNewBuilding({ ...newBuilding, neighborhood: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Condo Corp #</label>
                  <input
                    type="text"
                    placeholder="e.g., TSCC 2431"
                    value={newBuilding.corpNumber}
                    onChange={(e) => setNewBuilding({ ...newBuilding, corpNumber: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3">
                <input
                  id="lockboxAllowed"
                  type="checkbox"
                  checked={newBuilding.lockboxAllowed}
                  onChange={(e) =>
                    setNewBuilding({ ...newBuilding, lockboxAllowed: e.target.checked })
                  }
                  className="h-4 w-4 accent-amber-500"
                />
                <label htmlFor="lockboxAllowed" className="text-sm text-slate-200">
                  Physical Realtor lockboxes are permitted on site
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300">Lockbox / Key Policy</label>
                  <input
                    type="text"
                    placeholder="e.g., Concierge key release only"
                    value={newBuilding.lockboxPolicy}
                    onChange={(e) =>
                      setNewBuilding({ ...newBuilding, lockboxPolicy: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Required Fee</label>
                  <input
                    type="text"
                    placeholder="e.g., $75.00"
                    value={newBuilding.feeAmount}
                    onChange={(e) => setNewBuilding({ ...newBuilding, feeAmount: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Payment Method</label>
                  <input
                    type="text"
                    placeholder="e.g., Bank draft payable to TSCC..."
                    value={newBuilding.feeMethod}
                    onChange={(e) => setNewBuilding({ ...newBuilding, feeMethod: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Management Company</label>
                  <input
                    type="text"
                    placeholder="e.g., FirstService Residential"
                    value={newBuilding.managementCompany}
                    onChange={(e) =>
                      setNewBuilding({ ...newBuilding, managementCompany: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Management Phone</label>
                  <input
                    type="text"
                    placeholder="(416) 555-0100"
                    value={newBuilding.managementPhone}
                    onChange={(e) =>
                      setNewBuilding({ ...newBuilding, managementPhone: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Concierge Phone</label>
                  <input
                    type="text"
                    placeholder="(416) 555-0101"
                    value={newBuilding.conciergePhone}
                    onChange={(e) =>
                      setNewBuilding({ ...newBuilding, conciergePhone: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Required Authorization / Paperwork
                </label>
                <input
                  type="text"
                  placeholder="e.g., Owner authorization form + MLS listing agreement"
                  value={newBuilding.authorizationRequired}
                  onChange={(e) =>
                    setNewBuilding({ ...newBuilding, authorizationRequired: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Visitor Parking Details</label>
                <input
                  type="text"
                  placeholder="e.g., P1 visitor parking; register plate with concierge"
                  value={newBuilding.visitorParking}
                  onChange={(e) =>
                    setNewBuilding({ ...newBuilding, visitorParking: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Field Notes / Tips</label>
                <textarea
                  rows={2}
                  placeholder="Any insider tips for listing agents..."
                  value={newBuilding.notes}
                  onChange={(e) => setNewBuilding({ ...newBuilding, notes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving to Cloud...' : 'Save Building'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}