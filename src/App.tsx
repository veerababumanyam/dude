import { useState, useEffect, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { get, set, del } from 'idb-keyval';
import { siteFormSchema, SiteFormData } from './schema';
import { FormSectionA } from './components/FormSectionA';
import { FormSectionB } from './components/FormSectionB';
import { FormSectionC } from './components/FormSectionC';
import { FormSectionD } from './components/FormSectionD';
import { Button } from './components/ui/Button';
import { STATUS_OPTIONS, UNIT_TYPES, HANDOVER_INFO } from './constants';
import { formatCurrency } from './utils';
import { Bell, ArrowLeft, Plus, Briefcase, MapPin, LayoutDashboard, FileText, UserCircle, Download, Search, ChevronDown, Loader2, Inbox, MoreVertical, Trash2, Copy, Mail, History, BarChart2, Edit2, Filter, Settings, Eye, X, CheckSquare, FileDown, Target, Clock, Map as MapIcon, RotateCcw, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import html2pdf from 'html2pdf.js';
import { toast } from 'sonner';

// Fix leaflet default icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Haversine formula for distance
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

const BASE_LAT = 12.9716;
const BASE_LNG = 77.5946;

export default function App() {
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard');
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"date-desc" | "date-asc" | "window-asc" | "window-desc" | "val-desc" | "val-asc" | "status">("date-desc");
  const [isLoading, setIsLoading] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [historyModalProposal, setHistoryModalProposal] = useState<any>(null);
  const [detailsModalProposal, setDetailsModalProposal] = useState<any>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [unitTypeFilter, setUnitTypeFilter] = useState<string[]>([]);
  const [handoverFilter, setHandoverFilter] = useState<string[]>([]);
  const [distanceRadius, setDistanceRadius] = useState<number | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [statuses, setStatuses] = useState(STATUS_OPTIONS);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [submissions, setSubmissions] = useState<(SiteFormData & { id: string, statusHistory?: {status: string, date: string}[], lat?: number, lng?: number })[]>([]);

  useEffect(() => {
    get('karya_recent_searches').then((savedSearches) => {
      if (savedSearches) setRecentSearches(savedSearches);
    });
    get('karya_submissions').then((saved) => {
      if (saved) {
        setSubmissions(saved);
      } else {
        setSubmissions([
          {
            id: "KRY-001",
            siteName: "Prestige Lakeside Habitat",
            location: "Whitefield, Bangalore",
            lat: 12.9698,
            lng: 77.7499,
            unitType: "Apartment",
            overallSqft: 150000,
            clubhouseSqft: 20000,
            services: ["housekeeping", "security"],
            pocType: "Facility Manager",
            handoverType: "Builder",
            tenureValue: 12,
            tenureUnit: "Months",
            handoverMoment: "2024-07-01T10:00",
            esiPf: "Yes",
            status: "Quotation Sent",
            priority: "High",
            timings: ["Residential"],
            quotationValue: 450000,
            createdAt: new Date().toISOString(), // Created today
          },
          {
            id: "KRY-002",
            siteName: "Brigade Tech Park",
            location: "Brookefield, Bangalore",
            lat: 12.9644,
            lng: 77.7170,
            unitType: "Commercial Complex",
            overallSqft: 350000,
            clubhouseSqft: 0,
            services: ["mep", "security"],
            pocType: "Property Manager",
            handoverType: "Others",
            handoverOther: "Management Company",
            tenureValue: 24,
            tenureUnit: "Months",
            handoverMoment: "2024-08-15T09:00",
            esiPf: "Yes",
            status: "Need to Send Quotation",
            priority: "Medium",
            timings: ["Commercial"],
            quotationValue: 850000,
            createdAt: addDays(new Date(), -70).toISOString(), // Created 70 days ago, 20 days left (triggering 30-day alert)
          }
        ]);
      }
      setIsDataLoaded(true);
    });
  }, []);

  // Save to idb-keyval whenever submissions change
  useEffect(() => {
    if (isDataLoaded) {
      set("karya_submissions", submissions);
    }
  }, [submissions, isDataLoaded]);

  const methods = useForm<SiteFormData>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      services: [],
      timings: [],
      pestControl: false,
    }
  });

  useEffect(() => {
    const subscription = methods.watch((value) => {
      if (view === 'form' && !editingId) {
        set('karya_draft', value);
      }
    });
    return () => subscription.unsubscribe();
  }, [methods.watch, view, editingId]);

  const handleCreateNew = async () => {
    setEditingId(null);
    const draft = await get('karya_draft');
    if (draft) {
      methods.reset(draft as any);
    } else {
      methods.reset({ services: [], timings: [], pestControl: false });
    }
    setView('form');
  };

  const handleEdit = (sub: any) => {
    setOpenActionMenuId(null);
    setEditingId(sub.id);
    methods.reset(sub);
    setView('form');
  };

  const onSubmit = (data: SiteFormData) => {
    setIsLoading(true);
    setView('dashboard');
    setTimeout(() => {
      if (editingId) {
        setSubmissions(submissions.map(s => {
          if (s.id === editingId) {
            const statusChanged = s.status !== data.status;
            const newHistory = statusChanged 
              ? [...(s.statusHistory || []), { status: data.status, date: new Date().toISOString() }] 
              : s.statusHistory;
            return { ...s, ...data, statusHistory: newHistory };
          }
          return s;
        }));
        setEditingId(null);
        toast.success(`Proposal ${editingId} updated successfully`);
      } else {
        const newId = `KRY-00${submissions.length + 1}`;
        const newEntry = {
          ...data,
          id: newId,
          lat: BASE_LAT + (Math.random() - 0.5) * 0.1, // Mock coordinate near base
          lng: BASE_LNG + (Math.random() - 0.5) * 0.1,
          createdAt: new Date().toISOString(),
          statusHistory: [{ status: data.status, date: new Date().toISOString() }]
        };
        setSubmissions([newEntry, ...submissions]);
        toast.success(`New proposal ${newId} created successfully`);
      }
      methods.reset({ services: [], timings: [], pestControl: false });
      del('karya_draft');
      setIsLoading(false);
    }, 800); // Simulate network delay
  };

  const handleDuplicate = (sub: any) => {
    setOpenActionMenuId(null);
    const newId = `KRY-00${submissions.length + 1}`;
    const newEntry = {
      ...sub,
      id: newId,
      createdAt: new Date().toISOString(),
      statusHistory: [{ status: sub.status, date: new Date().toISOString() }]
    };
    setSubmissions([newEntry, ...submissions]);
    toast.success(`Proposal duplicated as ${newId}`);
  };

  const handleArchive = (id: string) => {
    setOpenActionMenuId(null);
    setSubmissions(submissions.filter(s => s.id !== id));
    toast.success(`Proposal ${id} archived`);
  };

  const handleEmailClient = () => {
    setOpenActionMenuId(null);
    toast.info("Email client integration would open here.");
  };

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.bg || 'bg-neutral-100 text-neutral-800';
  };

  const handleExportCSV = () => {
    exportProposalsToCSV(submissions);
  };

  const exportProposalsToCSV = (dataToExport: any[]) => {
    const headers = ["ID", "Site Name", "Location", "Unit Type", "Status", "Quotation Value", "Days Remaining", "Created At"];
    const csvRows = [headers.join(",")];
    
    dataToExport.forEach(sub => {
      const createdDate = new Date(sub.createdAt!);
      const deadlineDate = addDays(createdDate, 90);
      const daysRemaining = differenceInDays(deadlineDate, new Date());
      
      const row = [
        sub.id,
        `"${sub.siteName}"`,
        `"${sub.location}"`,
        `"${sub.unitType}"`,
        `"${sub.status}"`,
        sub.quotationValue || 0,
        daysRemaining,
        format(createdDate, 'yyyy-MM-dd')
      ];
      csvRows.push(row.join(","));
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "karya_proposals.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkArchive = () => {
    setSubmissions(submissions.filter(s => !selectedIds.includes(s.id)));
    toast.success(`Archived ${selectedIds.length} proposals`);
    setSelectedIds([]);
  };

  const handleBulkExport = () => {
    const dataToExport = submissions.filter(s => selectedIds.includes(s.id));
    exportProposalsToCSV(dataToExport);
    toast.success(`Exported ${selectedIds.length} proposals`);
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSubmissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubmissions.map(s => s.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      const newSearches = [searchQuery.trim(), ...recentSearches.filter(s => s !== searchQuery.trim())].slice(0, 5);
      setRecentSearches(newSearches);
      set('karya_recent_searches', newSearches);
      setShowRecentSearches(false);
    }
  };

  const handleSearchSelect = (query: string) => {
    setSearchQuery(query);
    setShowRecentSearches(false);
    const newSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newSearches);
    set('karya_recent_searches', newSearches);
  };

  const filteredSubmissions = submissions.filter(sub => {
    let match = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      match = match && (sub.siteName.toLowerCase().includes(q) || 
             sub.id.toLowerCase().includes(q) || 
             sub.location.toLowerCase().includes(q));
    }
    if (statusFilter.length > 0) {
      match = match && statusFilter.includes(sub.status);
    }
    if (unitTypeFilter.length > 0) {
      match = match && unitTypeFilter.includes(sub.unitType);
    }
    if (handoverFilter.length > 0) {
      match = match && handoverFilter.includes(sub.handoverType);
    }
    if (distanceRadius) {
      if (sub.lat && sub.lng) {
        const dist = getDistanceFromLatLonInKm(BASE_LAT, BASE_LNG, sub.lat, sub.lng);
        match = match && (dist <= distanceRadius);
      } else {
        match = false;
      }
    }
    return match;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt!).getTime();
    const dateB = new Date(b.createdAt!).getTime();
    const daysA = differenceInDays(addDays(new Date(a.createdAt!), 90), new Date());
    const daysB = differenceInDays(addDays(new Date(b.createdAt!), 90), new Date());
    
    switch (sortOrder) {
      case "date-desc": return dateB - dateA;
      case "date-asc": return dateA - dateB;
      case "window-asc": return daysA - daysB;
      case "window-desc": return daysB - daysA;
      case "val-desc": return (b.quotationValue || 0) - (a.quotationValue || 0);
      case "val-asc": return (a.quotationValue || 0) - (b.quotationValue || 0);
      case "status": return (a.status || "").localeCompare(b.status || "");
      default: return 0;
    }
  });

  const analyticsData = STATUS_OPTIONS.map(opt => {
    const subsInStatus = submissions.filter(s => s.status === opt.value);
    const totalValue = subsInStatus.reduce((sum, sub) => sum + (sub.quotationValue || 0), 0);
    return {
      name: opt.value,
      count: subsInStatus.length,
      value: totalValue,
      color: opt.color
    };
  }).filter(d => d.count > 0);

  const totalActiveProposals = submissions.filter(s => s.status !== 'Lost').length;
  const totalPipelineValue = submissions.reduce((sum, sub) => sum + (sub.quotationValue || 0), 0);
  
  // Calculate avg conversion window based on existing proposals
  const validWindows = submissions.filter(s => s.createdAt).map(s => {
      const createdDate = new Date(s.createdAt!);
      const deadlineDate = addDays(createdDate, 90);
      return differenceInDays(deadlineDate, new Date());
  });
  const avgConversionWindow = validWindows.length > 0 
    ? Math.round(validWindows.reduce((a, b) => a + b, 0) / validWindows.length) 
    : 0;

  const pdfRef = useRef<HTMLDivElement>(null);
  const handleDownloadPDF = async () => {
    if (!pdfRef.current || !detailsModalProposal) return;
    
    const element = pdfRef.current;
    const opt = {
      margin: 10,
      filename: `Proposal_${detailsModalProposal.id}_${detailsModalProposal.siteName.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-neutral-50 font-sans text-neutral-900">
      {/* Sidebar (Desktop only) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-brand-500/20 flex-col shrink-0 z-20">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center text-white shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c-1.2 0-2.4.6-3 1.7A5 5 0 0 0 2 10c0 4.4 7 11 10 11s10-6.6 10-11a5 5 0 0 0-7-5.3c-.6-1.1-1.8-1.7-3-1.7z"/></svg>
          </div>
          <h1 className="text-2xl font-serif font-bold text-brand-700 tracking-tight">Karya</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${view === 'dashboard' ? 'bg-brand-50 text-brand-700' : 'text-neutral-600 hover:bg-brand-50/50'}`}>
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button onClick={handleCreateNew} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${view === 'form' ? 'bg-brand-50 text-brand-700' : 'text-neutral-600 hover:bg-brand-50/50'}`}>
            <FileText className="w-5 h-5" />
            New Proposal
          </button>
          <button onClick={() => setShowSettingsModal(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors text-neutral-600 hover:bg-brand-50/50">
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </nav>
        <div className="p-6 border-t border-brand-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500 border-2 border-white shadow-sm flex items-center justify-center text-white">
              <UserCircle className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-neutral-900 leading-tight">Arjun Mehta</p>
              <p className="text-xs text-neutral-600">Regional Manager</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="md:hidden bg-white border-b border-brand-500/10 flex items-center justify-between px-4 h-16 shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-2 text-brand-700">
            <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c-1.2 0-2.4.6-3 1.7A5 5 0 0 0 2 10c0 4.4 7 11 10 11s10-6.6 10-11a5 5 0 0 0-7-5.3c-.6-1.1-1.8-1.7-3-1.7z"/></svg>
            </div>
            <h1 className="text-xl font-serif font-bold tracking-tight">Karya</h1>
          </div>
          {view === 'dashboard' ? (
            <Button size="sm" onClick={handleCreateNew} className="shadow-sm">
              <Plus className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setView('dashboard')} className="-mr-2 text-brand-700">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex h-20 bg-white/80 backdrop-blur-md border-b border-brand-500/10 items-center justify-between px-8 shrink-0 z-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-1">
              {view === 'dashboard' ? 'Operational Dashboard' : 'Operational Form'}
            </p>
            <h2 className="text-xl font-serif font-bold text-neutral-900">
              {view === 'dashboard' ? 'Active Pipelines' : 'Site Survey & Commercial Matrix'}
            </h2>
          </div>
          <div className="flex gap-4">
            {view === 'dashboard' ? (
              <Button size="default" onClick={handleCreateNew} className="shadow-lg shadow-brand-700/20">
                <Plus className="w-5 h-5 mr-1.5" />
                New Quotation
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setView('dashboard')}>
                  Cancel
                </Button>
                <Button type="submit" form="proposal-form" className="shadow-lg shadow-brand-700/20">
                  Save Entry
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-neutral-50">
          <div className="max-w-6xl mx-auto">
            {view === 'dashboard' && (
              <div className="space-y-6">
                <div className="md:hidden flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-1">Operational Dashboard</p>
                    <h2 className="text-xl font-serif font-bold text-neutral-900 tracking-tight">Active Pipelines</h2>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-brand-500/10 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-500">Active Proposals</p>
                      <p className="text-2xl font-serif font-bold text-neutral-900">{totalActiveProposals}</p>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-brand-500/10 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-500">Pipeline Value</p>
                      <p className="text-2xl font-serif font-bold text-neutral-900">{formatCurrency(totalPipelineValue)}</p>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-brand-500/10 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-500">Avg Conv. Window</p>
                      <p className="text-2xl font-serif font-bold text-neutral-900">{avgConversionWindow} <span className="text-sm font-sans font-medium text-neutral-500">days</span></p>
                    </div>
                  </div>
                </div>

                {/* Summary Chart */}
                <AnimatePresence>
                  {showAnalytics && analyticsData.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      className="bg-white p-4 md:p-6 rounded-2xl border border-brand-500/10 shadow-sm flex flex-col md:flex-row items-stretch gap-6"
                    >
                      <div className="w-full md:w-1/3 flex flex-col">
                        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4">Pipeline by Status</h3>
                        <div className="flex-1 min-h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analyticsData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="count"
                              >
                                {analyticsData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                formatter={(value: number, name: string) => [value + " proposals", name]}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-1/3 flex flex-col border-t md:border-t-0 md:border-l border-neutral-100 pt-6 md:pt-0 md:pl-6">
                        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4">Pipeline Value (₹)</h3>
                        <div className="flex-1 min-h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: 20, bottom: 25 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: '#737373' }} 
                                interval={0}
                                angle={-25}
                                textAnchor="end"
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`} 
                                tick={{ fontSize: 10, fill: '#737373' }}
                              />
                              <RechartsTooltip 
                                cursor={{ fill: '#f5f5f5' }}
                                formatter={(value: number) => [formatCurrency(value), "Total Value"]}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                              />
                              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {analyticsData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-1/3 flex flex-col border-t md:border-t-0 md:border-l border-neutral-100 pt-6 md:pt-0 md:pl-6">
                        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center"><MapIcon className="w-4 h-4 mr-2" /> Site Map</h3>
                        <div className="flex-1 min-h-[200px] rounded-xl overflow-hidden border border-neutral-200 z-0 relative">
                          <MapContainer center={[12.9716, 77.5946]} zoom={10} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                            <TileLayer
                              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            {submissions.filter(s => s.lat && s.lng).map(s => (
                              <Marker key={s.id} position={[s.lat!, s.lng!]}>
                                <Popup>
                                  <div className="text-xs">
                                    <strong>{s.siteName}</strong><br/>
                                    {s.status}<br/>
                                    {formatCurrency(s.quotationValue || 0)}
                                  </div>
                                </Popup>
                              </Marker>
                            ))}
                          </MapContainer>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Dashboard Controls */}
                <div className="flex flex-col gap-4 bg-white p-3 md:p-4 rounded-xl border border-brand-500/10 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:max-w-xs flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input 
                          ref={searchInputRef}
                          type="text" 
                          placeholder="Search ID, Site Name, Location..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={handleSearchSubmit}
                          onFocus={() => setShowRecentSearches(true)}
                          onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
                          className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                        />
                        <AnimatePresence>
                          {showRecentSearches && recentSearches.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 shadow-lg rounded-lg overflow-hidden z-20"
                            >
                              <div className="px-3 py-2 text-xs font-bold text-neutral-500 uppercase tracking-wider bg-neutral-50 border-b border-neutral-100 flex items-center justify-between">
                                <span>Recent Searches</span>
                                <button onMouseDown={(e) => { e.preventDefault(); setRecentSearches([]); set('karya_recent_searches', []); }} className="hover:text-brand-600 transition-colors">Clear</button>
                              </div>
                              {recentSearches.map((search, idx) => (
                                <button
                                  key={idx}
                                  onMouseDown={(e) => { e.preventDefault(); handleSearchSelect(search); }}
                                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                                  {search}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <Button variant={showFilters ? 'default' : 'outline'} size="sm" onClick={() => setShowFilters(!showFilters)} className="px-3">
                        <Filter className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex w-full sm:w-auto items-center gap-3">
                      <div className="relative w-full sm:w-auto">
                        <select 
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as any)}
                          className="w-full sm:w-auto appearance-none pl-4 pr-10 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                        >
                          <option value="date-desc">Newest First</option>
                          <option value="date-asc">Oldest First</option>
                          <option value="window-asc">Closing Soon</option>
                          <option value="window-desc">Closing Later</option>
                          <option value="val-desc">Value (High - Low)</option>
                          <option value="val-asc">Value (Low - High)</option>
                          <option value="status">Status</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setShowAnalytics(!showAnalytics)} className={`hidden sm:flex whitespace-nowrap transition-colors ${showAnalytics ? 'bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100 hover:text-brand-800' : ''}`}>
                        <BarChart2 className="w-4 h-4 mr-2" />
                        {showAnalytics ? 'Hide Insights' : 'Show Insights'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExportCSV} className="hidden sm:flex whitespace-nowrap">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </div>
                  
                  {/* Filters Menu */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-4 border-t border-neutral-100 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div>
                            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Status</h4>
                            <div className="flex flex-col gap-2">
                              {statuses.map(status => (
                                <label key={status.value} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer group">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                                    checked={statusFilter.includes(status.value)}
                                    onChange={(e) => {
                                      if (e.target.checked) setStatusFilter([...statusFilter, status.value]);
                                      else setStatusFilter(statusFilter.filter(s => s !== status.value));
                                    }}
                                  />
                                  <span className="group-hover:text-neutral-900">{status.value}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Property Type</h4>
                            <div className="flex flex-col gap-2">
                              {UNIT_TYPES.map(type => (
                                <label key={type} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer group">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                                    checked={unitTypeFilter.includes(type)}
                                    onChange={(e) => {
                                      if (e.target.checked) setUnitTypeFilter([...unitTypeFilter, type]);
                                      else setUnitTypeFilter(unitTypeFilter.filter(t => t !== type));
                                    }}
                                  />
                                  <span className="group-hover:text-neutral-900">{type}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Handover Info</h4>
                            <div className="flex flex-col gap-2">
                              {HANDOVER_INFO.map(info => (
                                <label key={info} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer group">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                                    checked={handoverFilter.includes(info)}
                                    onChange={(e) => {
                                      if (e.target.checked) setHandoverFilter([...handoverFilter, info]);
                                      else setHandoverFilter(handoverFilter.filter(h => h !== info));
                                    }}
                                  />
                                  <span className="group-hover:text-neutral-900">{info}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Distance From Base</h4>
                            <div className="flex flex-col gap-2">
                              <select
                                className="w-full bg-white border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                value={distanceRadius}
                                onChange={(e) => setDistanceRadius(e.target.value ? Number(e.target.value) : '')}
                              >
                                <option value="">Any Distance</option>
                                <option value="5">Within 5 km</option>
                                <option value="10">Within 10 km</option>
                                <option value="25">Within 25 km</option>
                                <option value="50">Within 50 km</option>
                                <option value="100">Within 100 km</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        {(statusFilter.length > 0 || unitTypeFilter.length > 0 || handoverFilter.length > 0 || distanceRadius !== '') && (
                          <div className="flex justify-end mt-4">
                            <Button variant="ghost" size="sm" onClick={() => { setStatusFilter([]); setUnitTypeFilter([]); setHandoverFilter([]); setDistanceRadius(''); }}>
                              Clear All Filters
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                  {/* Bulk Actions Bar */}
                  <AnimatePresence>
                    {selectedIds.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-brand-50 mb-6 p-3 rounded-xl border border-brand-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-brand-100 text-brand-700 px-2 py-1 rounded-md text-sm font-bold">
                            {selectedIds.length} Selected
                          </div>
                          <button onClick={() => setSelectedIds([])} className="text-sm text-brand-600 hover:text-brand-800 font-medium">Clear Selection</button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="bg-white" onClick={handleBulkExport}>
                            <FileDown className="w-4 h-4 mr-2" /> Export Selected
                          </Button>
                          <Button size="sm" variant="outline" className="bg-white text-status-error border-red-200 hover:bg-red-50 hover:text-status-error" onClick={handleBulkArchive}>
                            <Trash2 className="w-4 h-4 mr-2" /> Archive Selected
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                <div className="flex items-center justify-between mb-4 mt-2">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={toggleSelectAll} 
                      className={`flex items-center justify-center w-5 h-5 rounded border ${selectedIds.length > 0 && selectedIds.length === filteredSubmissions.length ? 'bg-brand-500 border-brand-500 text-white' : 'border-neutral-300 text-transparent hover:border-brand-400'} transition-colors`}
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-neutral-500 ml-1">Select All ({filteredSubmissions.length})</span>
                  </div>
                </div>

                {submissions.filter(sub => {
                  const createdDate = new Date(sub.createdAt!);
                  const deadlineDate = addDays(createdDate, 90);
                  const daysRemaining = differenceInDays(deadlineDate, new Date());
                  return daysRemaining <= 30 && daysRemaining > 0;
                }).length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4 mb-6 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                      <Bell className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-900 mb-1">Tasks Due: Follow-ups Required</h3>
                      <p className="text-sm text-amber-800">
                        You have {submissions.filter(sub => {
                          const cd = new Date(sub.createdAt!);
                          const dd = addDays(cd, 90);
                          const dr = differenceInDays(dd, new Date());
                          return dr <= 30 && dr > 0;
                        }).length} proposals within the 30-day conversion deadline threshold. Please follow up.
                      </p>
                    </div>
                  </div>
                )}

                {(!isDataLoaded || isLoading) ? (
                  <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
                    <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
                    <h3 className="text-lg font-bold text-neutral-900 mb-1">Processing Data...</h3>
                    <p className="text-neutral-500 text-sm">Please wait while we prepare the dashboard.</p>
                  </div>
                ) : filteredSubmissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-2xl border border-brand-500/10 shadow-sm animate-in fade-in zoom-in-95">
                    <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6">
                      <Inbox className="w-10 h-10 text-brand-500" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-neutral-900 mb-2">No proposals found</h3>
                    <p className="text-neutral-500 max-w-md mx-auto mb-8">
                      {searchQuery 
                        ? "We couldn't find any proposals matching your search criteria. Try adjusting your filters or clearing the search." 
                        : "Your pipeline is currently empty. Start by creating a new proposal to track your site surveys and commercial matrices."}
                    </p>
                    {searchQuery ? (
                      <Button onClick={() => setSearchQuery("")} variant="outline">Clear Search</Button>
                    ) : (
                      <Button onClick={handleCreateNew} className="shadow-lg shadow-brand-700/20">
                        <Plus className="w-5 h-5 mr-2" />
                        Create your first proposal
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {filteredSubmissions.map((sub) => {
                        const createdDate = new Date(sub.createdAt!);
                        const deadlineDate = addDays(createdDate, 90);
                        const daysRemaining = differenceInDays(deadlineDate, new Date());
                        const needsAlert = daysRemaining <= 30 && daysRemaining > 0;
                        const isOverdue = daysRemaining <= 0;

                        return (
                          <motion.div 
                            key={sub.id} 
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={(e, { offset, velocity }) => {
                              const swipeThreshold = 100;
                              if (offset.x < -swipeThreshold) {
                                handleArchive(sub.id);
                              } else if (offset.x > swipeThreshold) {
                                handleArchive(sub.id);
                              }
                            }}
                            className="bg-white rounded-2xl border border-brand-500/10 shadow-sm flex flex-col relative"
                            style={{ touchAction: "pan-y" }}
                          >
                            <div className="p-6 flex-1 space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex gap-3">
                                  <div className="pt-1">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); toggleSelectOne(sub.id); }}
                                      className={`flex items-center justify-center w-5 h-5 rounded border ${selectedIds.includes(sub.id) ? 'bg-brand-500 border-brand-500 text-white' : 'border-neutral-300 text-transparent hover:border-brand-400'} transition-colors`}
                                    >
                                      <CheckSquare className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs font-mono font-bold text-neutral-600">{sub.id}</span>
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${getStatusColor(sub.status)}`}>
                                        {sub.status}
                                      </span>
                                      {sub.priority && (
                                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${sub.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' : sub.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                          <AlertTriangle className="w-3 h-3" />
                                          {sub.priority} Priority
                                        </span>
                                      )}
                                    </div>
                                    <h3 className="text-lg font-bold text-neutral-900">{sub.siteName}</h3>
                                    <div className="flex items-center text-sm font-medium text-neutral-600 mt-1">
                                      <MapPin className="w-4 h-4 mr-1 text-brand-500" />
                                      {sub.location}
                                    </div>
                                  </div>
                                </div>
                                <div className="relative">
                                  <button 
                                    onClick={() => setOpenActionMenuId(openActionMenuId === sub.id ? null : sub.id)}
                                    className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
                                  >
                                    <MoreVertical className="w-5 h-5" />
                                  </button>
                                  <AnimatePresence>
                                    {openActionMenuId === sub.id && (
                                      <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-1 w-48 bg-white border border-brand-500/10 shadow-xl rounded-xl py-1 z-10"
                                      >
                                        <button onClick={() => setDetailsModalProposal(sub)} className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 font-medium">
                                          <Eye className="w-4 h-4" />
                                          View Details
                                        </button>
                                        <button onClick={() => handleEdit(sub)} className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 font-medium">
                                          <Edit2 className="w-4 h-4" />
                                          Edit Proposal
                                        </button>
                                        <button onClick={() => setHistoryModalProposal(sub)} className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 font-medium">
                                          <History className="w-4 h-4" />
                                          Status History
                                        </button>
                                        <button onClick={() => handleDuplicate(sub)} className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 font-medium">
                                          <Copy className="w-4 h-4" />
                                          Duplicate
                                        </button>
                                        <button onClick={handleEmailClient} className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 font-medium">
                                          <Mail className="w-4 h-4" />
                                          Email Client
                                        </button>
                                        <div className="h-px bg-neutral-100 my-1"></div>
                                        <button onClick={() => handleArchive(sub.id)} className="w-full text-left px-4 py-2 text-sm text-status-error hover:bg-red-50 flex items-center gap-2 font-medium">
                                          <Trash2 className="w-4 h-4" />
                                          Archive
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-4 text-sm pt-2">
                                <div className="flex items-center gap-1.5 font-bold text-neutral-700">
                                  <Briefcase className="w-4 h-4 text-brand-500" />
                                  <span>{sub.services?.length || 0} Services</span>
                                </div>
                                <div className="flex items-center gap-1.5 font-bold text-brand-700 font-mono text-base">
                                  {formatCurrency(sub.quotationValue)}
                                </div>
                              </div>
                            </div>

                            <div className={`p-4 border-t border-brand-500/10 flex items-center justify-between ${needsAlert ? 'bg-brand-50' : isOverdue ? 'bg-red-50/50' : 'bg-neutral-50/50'}`}>
                              <div>
                                <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-tighter mb-0.5">Conversion Window</div>
                                {isOverdue ? (
                                  <div className="text-sm font-mono font-bold text-status-error">Expired</div>
                                ) : (
                                  <div className="text-sm font-mono font-bold text-brand-700">
                                    {daysRemaining} Days Remaining
                                  </div>
                                )}
                              </div>

                              {needsAlert && (
                                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded-md shadow-sm">
                                  <Bell className="w-3 h-3" />
                                  Tasks Due: Follow-up
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {view === 'form' && (
              <FormProvider {...methods}>
                <form id="proposal-form" onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Mobile Title */}
                  <div className="md:hidden mb-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-1">Operational Form</p>
                    <h2 className="text-xl font-serif font-bold text-neutral-900 tracking-tight">Site Survey & Matrix</h2>
                  </div>

                  {/* Responsive Form Grid */}
                  <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">
                    <div className="lg:col-span-5 space-y-6 lg:space-y-8">
                      <FormSectionA />
                      <FormSectionC />
                    </div>
                    <div className="lg:col-span-7 space-y-6 lg:space-y-8 flex flex-col">
                      <FormSectionB />
                      <FormSectionD statuses={statuses} />
                    </div>
                  </div>
                  
                  {/* Mobile Save Button Area */}
                  <div className="md:hidden flex flex-col sm:flex-row gap-4 pt-6 mt-8 border-t border-brand-500/10">
                    <Button type="button" variant="ghost" size="lg" onClick={() => setView('dashboard')}>
                      Cancel
                    </Button>
                    <Button type="submit" size="lg" className="shadow-lg shadow-brand-700/20">
                      Save Entry
                    </Button>
                  </div>
                </form>
              </FormProvider>
            )}
          </div>
        </main>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {historyModalProposal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <div>
                  <h3 className="font-serif font-bold text-lg text-neutral-900">Status History</h3>
                  <p className="text-sm text-neutral-500 font-mono">{historyModalProposal.id}</p>
                </div>
                <button onClick={() => setHistoryModalProposal(null)} className="text-neutral-400 hover:text-neutral-900 transition-colors p-2 rounded-full hover:bg-neutral-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-6">
                  {historyModalProposal.statusHistory?.length > 0 ? (
                    historyModalProposal.statusHistory.map((historyItem: any, index: number) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                          {index < historyModalProposal.statusHistory.length - 1 && (
                            <div className="w-px h-full bg-neutral-200 mt-2 mb-1" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900">{historyItem.status}</p>
                          <p className="text-sm text-neutral-500">{format(new Date(historyItem.date), 'MMM d, yyyy h:mm a')}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      <History className="w-8 h-8 mx-auto text-neutral-300 mb-3" />
                      <p>No history recorded</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end">
                <Button onClick={() => setHistoryModalProposal(null)}>Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {detailsModalProposal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-mono font-bold text-neutral-500">{detailsModalProposal.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${getStatusColor(detailsModalProposal.status)}`}>
                      {detailsModalProposal.status}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-2xl text-neutral-900">{detailsModalProposal.siteName}</h3>
                </div>
                <button onClick={() => setDetailsModalProposal(null)} className="text-neutral-400 hover:text-neutral-900 transition-colors p-2 rounded-full hover:bg-neutral-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-neutral-50 custom-scrollbar" ref={pdfRef}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* General Info */}
                  <div className="space-y-6">
                    <section className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
                      <h4 className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-4 flex items-center gap-2"><MapPin className="w-4 h-4" /> General Details</h4>
                      <div className="space-y-3">
                        <div><span className="text-neutral-500 text-sm">Location:</span> <span className="font-medium">{detailsModalProposal.location}</span></div>
                        <div><span className="text-neutral-500 text-sm">Property Type:</span> <span className="font-medium">{detailsModalProposal.unitType}</span></div>
                        <div><span className="text-neutral-500 text-sm">Total Area:</span> <span className="font-medium">{detailsModalProposal.overallSqft?.toLocaleString() || 0} sq.ft</span></div>
                        {detailsModalProposal.clubhouseSqft > 0 && <div><span className="text-neutral-500 text-sm">Clubhouse Area:</span> <span className="font-medium">{detailsModalProposal.clubhouseSqft.toLocaleString()} sq.ft</span></div>}
                        {detailsModalProposal.priority && <div><span className="text-neutral-500 text-sm">Priority:</span> <span className={`font-medium ${detailsModalProposal.priority === 'High' ? 'text-red-600' : detailsModalProposal.priority === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`}>{detailsModalProposal.priority}</span></div>}
                      </div>
                    </section>
                    
                    <section className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
                      <h4 className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-4 flex items-center gap-2"><UserCircle className="w-4 h-4" /> Contact & Handover</h4>
                      <div className="space-y-3">
                        <div><span className="text-neutral-500 text-sm">POC:</span> <span className="font-medium">{detailsModalProposal.pocType}</span></div>
                        <div><span className="text-neutral-500 text-sm">Handover By:</span> <span className="font-medium">{detailsModalProposal.handoverType} {detailsModalProposal.handoverOther ? `(${detailsModalProposal.handoverOther})` : ''}</span></div>
                        <div><span className="text-neutral-500 text-sm">Tenure:</span> <span className="font-medium">{detailsModalProposal.tenureValue} {detailsModalProposal.tenureUnit}</span></div>
                        <div><span className="text-neutral-500 text-sm">Target Date:</span> <span className="font-medium">{detailsModalProposal.handoverMoment ? format(new Date(detailsModalProposal.handoverMoment), 'MMM d, yyyy h:mm a') : 'N/A'}</span></div>
                      </div>
                    </section>
                  </div>

                  {/* Commercials */}
                  <div className="space-y-6">
                    <section className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
                      <h4 className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Services Setup</h4>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {detailsModalProposal.services?.map((svc: string) => (
                          <span key={svc} className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-md text-xs font-bold uppercase tracking-wide border border-brand-200">
                            {svc}
                          </span>
                        )) || <span className="text-sm text-neutral-500">No services selected</span>}
                      </div>
                      
                      {detailsModalProposal.timings?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-neutral-100">
                          <span className="text-neutral-500 text-sm block mb-2">Timings:</span>
                          <div className="flex flex-wrap gap-2">
                            {detailsModalProposal.timings.map((t: string) => (
                              <span key={t} className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs font-medium">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {detailsModalProposal.timingNotes && (
                        <div className="mt-3 p-3 bg-neutral-50 rounded-md text-sm text-neutral-600 italic">
                          "{detailsModalProposal.timingNotes}"
                        </div>
                      )}
                    </section>

                    <section className="bg-brand-50 p-5 rounded-xl border border-brand-200 shadow-sm">
                      <h4 className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-4">Commercial Overview</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-brand-200/50">
                          <span className="text-neutral-600">ESI & PF Included</span>
                          <span className="font-bold">{detailsModalProposal.esiPf || 'No'}</span>
                        </div>
                        <div className="flex justify-between items-end pt-2">
                          <span className="text-brand-700 font-serif font-bold text-lg">Final Quotation</span>
                          <span className="text-3xl font-mono font-bold text-brand-700">{formatCurrency(detailsModalProposal.quotationValue || 0)}</span>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-neutral-100 flex justify-between bg-white shrink-0">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setDetailsModalProposal(null); handleEdit(detailsModalProposal); }}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button variant="outline" onClick={handleDownloadPDF} className="bg-white border-brand-200 text-brand-700 hover:bg-brand-50">
                    <Download className="w-4 h-4 mr-2" /> PDF
                  </Button>
                </div>
                <Button onClick={() => setDetailsModalProposal(null)}>Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
                <div>
                  <h3 className="font-serif font-bold text-lg text-neutral-900">Application Settings</h3>
                  <p className="text-sm text-neutral-500">Configure global preferences</p>
                </div>
                <button onClick={() => setShowSettingsModal(false)} className="text-neutral-400 hover:text-neutral-900 transition-colors p-2 rounded-full hover:bg-neutral-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-8">
                
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-neutral-900">Custom Statuses</h4>
                      <p className="text-sm text-neutral-500">Add or remove proposal statuses</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => {
                      setStatuses([...statuses, { value: 'New Status', color: '#94a3b8', bg: 'bg-slate-100 text-slate-800 border-slate-200' }]);
                    }}>
                      <Plus className="w-4 h-4 mr-2" /> Add Status
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {statuses.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                        <input type="color" value={s.color} onChange={(e) => {
                          const newStatuses = [...statuses];
                          newStatuses[i].color = e.target.value;
                          setStatuses(newStatuses);
                        }} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" value={s.value} onChange={(e) => {
                          const newStatuses = [...statuses];
                          newStatuses[i].value = e.target.value;
                          setStatuses(newStatuses);
                        }} className="flex-1 bg-white border border-neutral-300 rounded px-3 py-1.5 text-sm" />
                        <input type="text" value={s.bg} placeholder="Tailwind Classes" onChange={(e) => {
                          const newStatuses = [...statuses];
                          newStatuses[i].bg = e.target.value;
                          setStatuses(newStatuses);
                        }} className="flex-1 bg-white border border-neutral-300 rounded px-3 py-1.5 text-sm font-mono text-neutral-500" />
                        <button onClick={() => {
                          setStatuses(statuses.filter((_, idx) => idx !== i));
                        }} className="p-2 text-status-error hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
                
              </div>
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3 shrink-0">
                <Button variant="outline" onClick={() => {
                  setStatuses(STATUS_OPTIONS);
                  set('karya_statuses', STATUS_OPTIONS);
                }}>Reset Defaults</Button>
                <Button onClick={() => {
                  set('karya_statuses', statuses);
                  setShowSettingsModal(false);
                }}>Save Settings</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
