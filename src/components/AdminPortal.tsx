import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, CheckCircle, X, Check, Users, MessageSquare, ShoppingBag, Loader2, Activity, Settings, Home } from 'lucide-react';
import { Button } from './ui/button';
import { useAetherStore } from '../store/useAetherStore';
import { supabaseAdmin } from '../lib/supabase';

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'OWNERS' | 'USERS' | 'QUERIES' | 'STORE' | 'SETTINGS'>('OVERVIEW');
  const user = useAetherStore((state) => state.user);
  const isDemoMode = useAetherStore((state) => state.isDemoMode);
  const email = user?.email || 'ksumit0724@gmail.com';
  const role = (user?.user_metadata?.role || user?.role || '').toLowerCase();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    owners: 0,
    pilots: 0,
    individuals: 0,
    pending: 0,
    queries: 0,
    listings: 0
  });

  const [gymOwners, setGymOwners] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userFilter, setUserFilter] = useState('ALL');
  const [queries, setQueries] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if ((email !== 'ksumit0724@gmail.com' && role !== 'super_admin') && !isDemoMode) {
      window.location.href = '/';
      return;
    }
    fetchData();
    
    if (supabaseAdmin && !isDemoMode) {
      const sub = supabaseAdmin
        .channel('admin-stats')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData)
        .subscribe();
      return () => { supabaseAdmin.removeChannel(sub); };
    }
  }, [user, email, role, isDemoMode]);

  const fetchData = async () => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }
    if (!supabaseAdmin) return;
    
    setLoading(true);
    setFetchError(null);
    try {
      // Problem 1: Stats Fix
      const [
        { count: totalUsers }, 
        { count: owners }, 
        { count: pilots }, 
        { count: individuals }, 
        { count: pending }, 
        { count: queriesCount }, 
        { count: listingsCount }
      ] = await Promise.all([
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'super_admin'),
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'gym_owner'),
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'pilot'),
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'individual'),
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'gym_owner').eq('is_verified', false),
        supabaseAdmin.from('user_queries').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('store_listings').select('*', { count: 'exact', head: true })
      ]);
      
      setStats({
        totalUsers: totalUsers || 0,
        owners: owners || 0,
        pilots: pilots || 0,
        individuals: individuals || 0,
        pending: pending || 0,
        queries: queriesCount || 0,
        listings: listingsCount || 0
      });

      // Problem 2: Users Table Fix
      const { data: profiles, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('*, gyms(id, gym_name, pilot_code)')
        .neq('role', 'super_admin')
        .order('created_at', { ascending: false });

      if (profileErr) {
        console.error("FETCH ERROR", profileErr);
        setFetchError(profileErr.message);
      }
      
      if (profiles) {
         setAllUsers(profiles);
         
         const ownerProfiles = profiles.filter(p => p.role === 'gym_owner');
         
         const membersCountMap = new Map();
         profiles.filter(p => p.role === 'pilot').forEach(p => {
            if (p.gym_id) {
               membersCountMap.set(p.gym_id, (membersCountMap.get(p.gym_id) || 0) + 1);
            }
         });
         
         const mappedOwners = ownerProfiles.map(o => ({
            ...o,
            gymName: o.gyms?.gym_name || o.gyms?.[0]?.gym_name || 'No Gym',
            pilotCode: o.gyms?.pilot_code || o.gyms?.[0]?.pilot_code || 'N/A',
            memberCount: o.gyms?.id ? (membersCountMap.get(o.gyms.id) || 0) : (o.gyms?.[0]?.id ? (membersCountMap.get(o.gyms[0].id) || 0) : 0)
         }));
         
         setGymOwners(mappedOwners);
      }
      
      const { data: qs } = await supabaseAdmin.from('user_queries').select('*, profiles(neural_id, username)').order('created_at', { ascending: false });
      if (qs) setQueries(qs);
      
      const { data: ls } = await supabaseAdmin.from('store_listings').select('*, profiles(neural_id, username), gyms(gym_name)').order('created_at', { ascending: false });
      if (ls) setListings(ls);

    } catch (e: any) {
      console.error("Unexpected fetch error:", e);
      setFetchError(e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const setGymOwnerVerification = async (id: string, is_verified: boolean) => {
    if (!supabaseAdmin) return;
    await supabaseAdmin.from('profiles').update({ is_verified }).eq('id', id);
    fetchData();
  };

  const deleteUser = async (id: string) => {
    if (!supabaseAdmin || !window.confirm("Delete this user permanently?")) return;
    await supabaseAdmin.auth.admin.deleteUser(id);
    fetchData();
  };
  
  const updateRole = async (id: string, newRole: string) => {
    if (!supabaseAdmin) return;
    await supabaseAdmin.from('profiles').update({ role: newRole }).eq('id', id);
    fetchData();
  };

  const updateQueryStatus = async (id: string, status: string) => {
    if (!supabaseAdmin) return;
    await supabaseAdmin.from('user_queries').update({ status }).eq('id', id);
    fetchData();
  };

  const deleteQuery = async (id: string) => {
    if (!supabaseAdmin) return;
    await supabaseAdmin.from('user_queries').delete().eq('id', id);
    fetchData();
  };

  const updateListingStatus = async (id: string, is_active: boolean) => {
    if (!supabaseAdmin) return;
    await supabaseAdmin.from('store_listings').update({ is_active }).eq('id', id);
    fetchData();
  };

  const deleteListing = async (id: string) => {
    if (!supabaseAdmin) return;
    await supabaseAdmin.from('store_listings').delete().eq('id', id);
    fetchData();
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'gym_owner': return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-bold">OWNER</span>;
      case 'pilot': return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-bold">PILOT</span>;
      case 'individual': default: return <span className="bg-white/10 text-white/70 border border-white/20 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-bold">INDIVIDUAL</span>;
    }
  };

  // Nav Items
  const navItems = [
    { id: 'OVERVIEW', label: 'Overview', icon: <Home className="w-4 h-4" /> },
    { id: 'OWNERS', label: 'Gym Owners', icon: <Shield className="w-4 h-4" /> },
    { id: 'USERS', label: 'All Users', icon: <Users className="w-4 h-4" /> },
    { id: 'QUERIES', label: 'Queries', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'STORE', label: 'Store', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'SETTINGS', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#0b0e14] text-white font-mono overflow-hidden">
      
      {/* Left Sidebar */}
      <div className="w-64 border-r border-red-500/20 bg-black/40 flex flex-col pt-8 pb-4">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest uppercase text-red-500">AETHER ADMIN</h1>
            <p className="text-[8px] text-white/40 tracking-widest uppercase">Command Center</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all \${activeTab === item.id ? 'bg-red-500/10 text-red-500 border border-red-500/30 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]' : 'text-white/40 border border-transparent hover:bg-white/5 hover:text-white/70'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        {loading ? (
          <div className="flex-1 flex justify-center items-center h-full">
            <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
          </div>
        ) : fetchError ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-2xl w-full">
            <h3 className="font-bold text-lg mb-2">FETCH_ERROR</h3>
            <p className="font-mono text-xs">{fetchError}</p>
          </div>
        ) : (
          <div className="space-y-8 max-w-7xl mx-auto">
            {activeTab === 'OVERVIEW' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <StatCard title="TOTAL USERS" value={stats.totalUsers} icon={<Users />} />
                  <StatCard title="OWNERS" value={stats.owners} icon={<Shield />} color="text-purple-400" />
                  <StatCard title="PILOTS" value={stats.pilots} icon={<Activity />} color="text-blue-400" />
                  <StatCard title="INDIVIDUALS" value={stats.individuals} icon={<Users />} color="text-white/70" />
                  <StatCard title="PENDING" value={stats.pending} icon={<CheckCircle />} color="text-amber-500" highlight />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recent Registrations */}
                  <div className="glass-panel p-6 border-t-2 border-t-red-500/30 bg-black/40">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 border-b border-white/10 pb-4">Recent Registrations</h3>
                    <div className="space-y-4">
                      {allUsers.slice(0, 5).map(u => (
                        <div key={u.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                          <div>
                            <div className="text-[11px] font-bold text-[#deff9a] uppercase tracking-wider">{u.neural_id || u.username}</div>
                            <div className="text-[9px] text-white/30">{new Date(u.created_at).toLocaleDateString()}</div>
                          </div>
                          {getRoleBadge(u.role)}
                        </div>
                      ))}
                      {allUsers.length === 0 && <div className="text-xs text-white/30 text-center py-4">NO USERS FOUND</div>}
                    </div>
                  </div>

                  {/* Recent Queries */}
                  <div className="glass-panel p-6 border-t-2 border-t-red-500/30 bg-black/40">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 border-b border-white/10 pb-4">Recent Queries</h3>
                    <div className="space-y-4">
                      {queries.slice(0, 5).map(q => (
                        <div key={q.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                          <div className="max-w-[70%]">
                            <div className="text-[11px] font-bold text-white tracking-wider truncate">{q.subject}</div>
                            <div className="text-[9px] text-white/30">{new Date(q.created_at).toLocaleDateString()}</div>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-1 uppercase rounded-lg \${q.status === 'resolved' ? 'bg-cyan-500/20 text-cyan-400' : q.status === 'pending' ? 'bg-amber-500/20 text-amber-500' : 'bg-white/10 text-white/40'}`}>
                            {q.status}
                          </span>
                        </div>
                      ))}
                      {queries.length === 0 && <div className="text-xs text-white/30 text-center py-4">NO QUERIES FOUND</div>}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'OWNERS' && (
              <div className="glass-panel p-6 border-t-2 border-t-red-500/30 bg-black/40">
                <h3 className="text-lg font-black uppercase tracking-widest text-white mb-6">Gym Owners Management</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs uppercase tracking-widest">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40">
                        <th className="pb-4 font-black">Neural ID</th>
                        <th className="pb-4 font-black">Gym Name</th>
                        <th className="pb-4 font-black">Pilot Code</th>
                        <th className="pb-4 font-black">Members</th>
                        <th className="pb-4 font-black">Verified</th>
                        <th className="pb-4 font-black text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gymOwners.map(owner => (
                        <tr key={owner.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                          <td className="py-4 text-purple-400 font-bold">{owner.neural_id || owner.username}</td>
                          <td className="py-4 text-white/80">{owner.gymName}</td>
                          <td className="py-4 text-[#deff9a] bg-black/50 px-2 rounded font-bold">{owner.pilotCode}</td>
                          <td className="py-4"><span className="bg-white/10 px-2 py-1 rounded text-white/70">{owner.memberCount} Pilots</span></td>
                          <td className="py-4">
                             {owner.is_verified ? (
                               <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded font-bold">VERIFIED</span>
                             ) : (
                               <span className="text-[9px] bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-1 rounded font-bold">PENDING</span>
                             )}
                          </td>
                          <td className="py-4 text-right space-x-2 whitespace-nowrap opacity-50 group-hover:opacity-100 transition-opacity">
                             {owner.is_verified ? (
                               <Button onClick={() => setGymOwnerVerification(owner.id, false)} className="bg-amber-500/20 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white h-7 text-[9px] px-3 uppercase tracking-widest rounded transition-all">Revoke</Button>
                             ) : (
                               <Button onClick={() => setGymOwnerVerification(owner.id, true)} className="bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-white h-7 text-[9px] px-3 uppercase tracking-widest rounded transition-all">Authorize</Button>
                             )}
                             <Button onClick={() => deleteUser(owner.id)} className="bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white h-7 text-[9px] px-3 uppercase tracking-widest rounded transition-all">Delete</Button>
                          </td>
                        </tr>
                      ))}
                      {gymOwners.length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-white/30 border-none font-bold">NO_OWNERS_FOUND</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'USERS' && (
              <div className="glass-panel p-6 border-t-2 border-t-red-500/30 bg-black/40">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <h3 className="text-lg font-black uppercase tracking-widest text-white">All Users</h3>
                  <div className="flex bg-black/50 p-1 rounded-xl border border-white/10 overflow-x-auto w-full md:w-auto">
                    {['ALL', 'gym_owner', 'pilot', 'individual'].map(f => (
                       <button 
                         key={f} 
                         onClick={() => setUserFilter(f)} 
                         className={`px-4 py-2 text-[10px] uppercase font-bold rounded-lg transition-all whitespace-nowrap \${userFilter === f ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
                       >
                         {f === 'ALL' ? 'ALL' : f.replace('_', ' ')}
                       </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs uppercase tracking-widest">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40">
                        <th className="pb-4 font-black">Neural ID</th>
                        <th className="pb-4 font-black">Email</th>
                        <th className="pb-4 font-black">Role</th>
                        <th className="pb-4 font-black">Joined Date</th>
                        <th className="pb-4 font-black text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.filter(u => userFilter === 'ALL' || u.role === userFilter).map(u => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                          <td className="py-4 font-bold text-[#deff9a]">{u.neural_id || u.username}</td>
                          <td className="py-4 text-white/60 lowercase font-sans text-sm">{u.email}</td>
                          <td className="py-4">
                            <select 
                              value={u.role || 'individual'} 
                              onChange={(e) => updateRole(u.id, e.target.value)}
                              className="bg-black/50 border border-white/20 p-1.5 rounded text-[10px] uppercase font-bold tracking-widest text-white outline-none focus:border-red-500 transition-colors cursor-pointer"
                            >
                               <option value="individual">Individual</option>
                               <option value="pilot">Pilot</option>
                               <option value="gym_owner">Gym Owner</option>
                            </select>
                          </td>
                          <td className="py-4 text-white/30">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="py-4 text-right opacity-50 group-hover:opacity-100 transition-opacity">
                             <Button onClick={() => deleteUser(u.id)} className="bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white h-7 text-[9px] px-3 uppercase tracking-widest rounded transition-all">Delete</Button>
                          </td>
                        </tr>
                      ))}
                      {allUsers.filter(u => userFilter === 'ALL' || u.role === userFilter).length === 0 && (
                        <tr><td colSpan={5} className="py-8 text-center text-white/30 border-none font-bold">NO_USERS_FOUND</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'QUERIES' && (
              <div className="glass-panel p-6 border-t-2 border-t-red-500/30 bg-black/40">
                <h3 className="text-lg font-black uppercase tracking-widest text-white mb-6">User Queries</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs uppercase tracking-widest">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40">
                        <th className="pb-4 font-black">User</th>
                        <th className="pb-4 font-black">Subject</th>
                        <th className="pb-4 font-black">Message</th>
                        <th className="pb-4 font-black">Date</th>
                        <th className="pb-4 font-black">Status</th>
                        <th className="pb-4 font-black text-right min-w-[200px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queries.map(q => (
                        <tr key={q.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                          <td className="py-4">
                            <div className="font-bold text-[#deff9a]">{q.profiles?.neural_id || q.profiles?.username || 'GUEST'}</div>
                            <div className="text-white/30 text-[9px] lowercase font-sans">{q.email}</div>
                          </td>
                          <td className="py-4 text-white/90 font-bold max-w-[150px] truncate" title={q.subject}>{q.subject}</td>
                          <td className="py-4 text-white/50 max-w-[200px] truncate lowercase font-sans tracking-tight" title={q.message}>{q.message}</td>
                          <td className="py-4 text-white/30 text-[10px]">{new Date(q.created_at).toLocaleDateString()}</td>
                          <td className="py-4">
                             <span className={`text-[9px] px-2 py-1 rounded font-bold border \${q.status === 'resolved' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : q.status === 'closed' ? 'bg-white/5 text-white/30 border-white/10' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'}`}>
                               {q.status}
                             </span>
                          </td>
                          <td className="py-4 text-right space-x-2 whitespace-nowrap opacity-50 group-hover:opacity-100 transition-opacity">
                             <Button onClick={() => updateQueryStatus(q.id, 'resolved')} className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-white h-7 text-[9px] px-2 uppercase tracking-widest rounded transition-all">Resolve</Button>
                             <Button onClick={() => updateQueryStatus(q.id, 'closed')} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white h-7 text-[9px] px-2 uppercase tracking-widest rounded transition-all">Close</Button>
                             <Button onClick={() => deleteQuery(q.id)} className="bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white h-7 text-[9px] px-2 uppercase tracking-widest rounded transition-all">Delete</Button>
                          </td>
                        </tr>
                      ))}
                      {queries.length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-white/30 border-none font-bold">NO_QUERIES_FOUND</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'STORE' && (
              <div className="glass-panel p-6 border-t-2 border-t-red-500/30 bg-black/40">
                <h3 className="text-lg font-black uppercase tracking-widest text-white mb-6">Store Moderation</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs uppercase tracking-widest">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40">
                        <th className="pb-4 font-black">Product</th>
                        <th className="pb-4 font-black">Gym</th>
                        <th className="pb-4 font-black">Price</th>
                        <th className="pb-4 font-black">Category</th>
                        <th className="pb-4 font-black">Date</th>
                        <th className="pb-4 font-black text-right min-w-[150px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map(l => (
                        <tr key={l.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                          <td className="py-4">
                            <div className="font-bold text-white tracking-wider">{l.product_name}</div>
                            <div className="text-white/30 text-[9px]">by {l.profiles?.neural_id}</div>
                          </td>
                          <td className="py-4 text-[#deff9a] font-bold">{l.gyms?.gym_name || l.gyms?.[0]?.gym_name || 'Local'}</td>
                          <td className="py-4 font-mono text-xl tracking-tighter">₹{l.price}</td>
                          <td className="py-4 text-white/50">{l.category}</td>
                          <td className="py-4 text-white/30 text-[10px]">{new Date(l.created_at).toLocaleDateString()}</td>
                          <td className="py-4 text-right space-x-2 whitespace-nowrap opacity-50 group-hover:opacity-100 transition-opacity">
                             {l.is_active ? (
                               <Button onClick={() => updateListingStatus(l.id, false)} className="bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white h-7 text-[9px] px-3 uppercase tracking-widest rounded transition-all">Hide</Button>
                             ) : (
                               <Button onClick={() => updateListingStatus(l.id, true)} className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-white h-7 text-[9px] px-3 uppercase tracking-widest rounded transition-all">Approve</Button>
                             )}
                             <Button onClick={() => deleteListing(l.id)} className="bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white h-7 text-[9px] px-3 uppercase tracking-widest rounded transition-all">Delete</Button>
                          </td>
                        </tr>
                      ))}
                      {listings.length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-white/30 border-none font-bold">NO_STORE_LISTINGS_FOUND</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'SETTINGS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 border-t-2 border-t-red-500/30 bg-black/40">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-500" /> Admin Identity
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-white/30 mb-1">EMAIL</p>
                      <p className="text-sm font-bold text-white font-sans lowercase">{email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 mb-1">AUTHORIZATION LEVEL</p>
                      <span className="bg-red-500/20 text-red-500 border border-red-500/30 px-3 py-1 rounded text-[10px] uppercase font-black tracking-widest inline-block mt-1">SUPER_ADMIN</span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 border-t-2 border-t-amber-500/50 bg-black/40 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 w-full h-full pointer-events-none opacity-5">
                     <Settings className="w-full h-full text-amber-500 animate-[spin_30s_linear_infinite] origin-center" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-amber-500 mb-6 border-b border-white/10 pb-4 relative z-10 flex items-center gap-2">
                    Danger Zone
                  </h3>
                  <div className="space-y-4 relative z-10">
                    <Button variant="outline" className="w-full justify-start bg-black/50 border-white/10 text-white hover:bg-amber-500/20 hover:border-amber-500/50 hover:text-amber-500 h-12 uppercase tracking-widest text-[10px] font-bold">
                      Reset All Pending Verifications
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-black/50 border-white/10 text-white hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-400 h-12 uppercase tracking-widest text-[10px] font-bold">
                      Export All User Data (CSV)
                    </Button>
                    <p className="text-[9px] text-white/30 mt-4 leading-relaxed font-sans italic">
                      These actions are irreversible and will affect the entire neural network. Use with extreme caution.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color = "text-white", highlight = false }: { title: string, value: number, icon: any, color?: string, highlight?: boolean }) => (
  <div className={`glass-panel p-5 flex flex-col gap-2 relative overflow-hidden group bg-black/40 \${highlight ? 'border-t-2 border-t-amber-500' : 'border-t-2 border-t-transparent'}`}>
    <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500 \${color}`}>
       {React.cloneElement(icon, { className: 'w-24 h-24' })}
    </div>
    <div className={`\${color} mb-1 flex items-center gap-2 opacity-80`}>
      {React.cloneElement(icon, { className: 'w-4 h-4' })}
      <div className="text-[9px] uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">{title}</div>
    </div>
    <div className="text-3xl font-black font-mono tracking-tighter text-white z-10">{value}</div>
  </div>
);

