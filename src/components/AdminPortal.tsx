import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, CheckCircle, X, Check, Users, MessageSquare, ShoppingBag, Loader2, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { useAetherStore } from '../store/useAetherStore';
import { supabaseAdmin } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'OWNERS' | 'USERS' | 'QUERIES' | 'STORE'>('OVERVIEW');
  const user = useAetherStore((state) => state.user);
  const isDemoMode = useAetherStore((state) => state.isDemoMode);
  const email = user?.email;
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

  useEffect(() => {
    if ((email !== 'ksumit0724@gmail.com' && role !== 'super_admin') && !isDemoMode) {
      window.location.href = '/';
      return;
    }
    fetchData();
    
    // Realtime subscription for stats update
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
    try {
      // Stats
      const [{ count: totalUsers }, { count: owners }, { count: pilots }, { count: individuals }, { count: pending }, { count: queriesCount }, { count: listingsCount }] = await Promise.all([
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
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

      const { data: profiles } = await supabaseAdmin.from('profiles').select('*, gyms(id, name, pilot_code)');
      
      if (profiles) {
         setAllUsers(profiles);
         
         const ownerProfiles = profiles.filter(p => p.role === 'gym_owner');
         
         // To get member counts, we count pilots per gym
         const membersCountMap = new Map();
         profiles.filter(p => p.role === 'pilot').forEach(p => {
            if (p.gym_id) {
               membersCountMap.set(p.gym_id, (membersCountMap.get(p.gym_id) || 0) + 1);
            }
         });
         
         const mappedOwners = ownerProfiles.map(o => ({
            ...o,
            gymName: o.gyms?.[0]?.name || 'No Gym',
            pilotCode: o.gyms?.[0]?.pilot_code || 'N/A',
            memberCount: o.gyms?.[0]?.id ? (membersCountMap.get(o.gyms[0].id) || 0) : 0
         }));
         
         setGymOwners(mappedOwners);
      }
      
      // Fetch Queries
      const { data: qs } = await supabaseAdmin.from('user_queries').select('*, profiles(neural_id, username)').order('created_at', { ascending: false });
      if (qs) setQueries(qs);
      
      // Fetch Listings
      const { data: ls } = await supabaseAdmin.from('store_listings').select('*, profiles(neural_id, username), gyms(name)').order('created_at', { ascending: false });
      if (ls) setListings(ls);

    } catch (e) {
      console.error(e);
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
  
  const updateRole = async (id: string, role: string) => {
    if (!supabaseAdmin) return;
    await supabaseAdmin.from('profiles').update({ role }).eq('id', id);
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

  return (
    <div className="min-h-screen bg-obsidian text-white p-4 md:p-8 relative overflow-hidden font-mono">
      <div className="absolute inset-0 bg-[#0b0e14] z-[-1]" />
      
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 z-10 relative">
        {/* Header */}
        <div className="glass-panel p-6 md:p-8 flex items-center gap-4 border-l-4 border-l-red-500">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-red-500">SUPER_ADMIN COMMAND CENTER</h1>
            <p className="text-white/40 text-xs font-mono tracking-widest">NEURAL NETWORK OVERSIGHT</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
          {['OVERVIEW', 'OWNERS', 'USERS', 'QUERIES', 'STORE'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap border \${activeTab === tab ? 'bg-red-500/20 text-red-500 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
           <div className="flex justify-center items-center py-20"><Loader2 className="w-10 h-10 text-red-500 animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'OVERVIEW' && (
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <StatCard title="TOTAL USERS" value={stats.totalUsers} icon={<Users />} />
                 <StatCard title="GYM OWNERS" value={stats.owners} icon={<Shield />} color="text-cyan-500" />
                 <StatCard title="PILOTS" value={stats.pilots} icon={<Activity />} color="text-purple-500" />
                 <StatCard title="INDIVIDUALS" value={stats.individuals} icon={<Users />} color="text-blue-500" />
                 <StatCard title="PENDING NODES" value={stats.pending} icon={<CheckCircle />} color="text-amber-500" />
                 <StatCard title="ACTIVE QUERIES" value={stats.queries} icon={<MessageSquare />} color="text-cyan-500" />
                 <StatCard title="STORE LISTINGS" value={stats.listings} icon={<ShoppingBag />} color="text-[#deff9a]" />
               </div>
            )}

            {activeTab === 'OWNERS' && (
               <div className="glass-panel p-6 overflow-x-auto border-t-2 border-t-red-500/30">
                 <h2 className="text-lg font-black uppercase tracking-widest text-white mb-6">Gym Owners Management</h2>
                 <table className="w-full text-left text-xs uppercase tracking-widest">
                   <thead>
                     <tr className="border-b border-white/10 text-white/40">
                       <th className="pb-4">Neural ID</th>
                       <th className="pb-4">Email</th>
                       <th className="pb-4">Gym Name</th>
                       <th className="pb-4">Pilot Code</th>
                       <th className="pb-4">Members</th>
                       <th className="pb-4">Status</th>
                       <th className="pb-4 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {gymOwners.map(owner => (
                       <tr key={owner.id} className="border-b border-white/5 hover:bg-white/5">
                         <td className="py-4 text-[#deff9a]">{owner.neural_id || owner.username}</td>
                         <td className="py-4 text-white/70">{owner.email}</td>
                         <td className="py-4">{owner.gymName}</td>
                         <td className="py-4 font-mono text-purple-400">{owner.pilotCode}</td>
                         <td className="py-4">{owner.memberCount}</td>
                         <td className="py-4">
                            {owner.is_verified ? <span className="text-cyan-500">Verified</span> : <span className="text-amber-500">Pending</span>}
                         </td>
                         <td className="py-4 text-right space-x-2 whitespace-nowrap">
                            {owner.is_verified ? (
                              <Button onClick={() => setGymOwnerVerification(owner.id, false)} className="bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white h-8 text-[10px] px-2 uppercase tracking-widest">Revoke</Button>
                            ) : (
                              <Button onClick={() => setGymOwnerVerification(owner.id, true)} className="bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500 hover:text-white h-8 text-[10px] px-2 uppercase tracking-widest">Authorize</Button>
                            )}
                            <Button onClick={() => deleteUser(owner.id)} className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white h-8 text-[10px] px-2 uppercase tracking-widest">Delete</Button>
                         </td>
                       </tr>
                     ))}
                     {gymOwners.length === 0 && (
                       <tr><td colSpan={7} className="py-8 text-center text-white/30">NO GYM OWNERS FOUND</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
            )}

            {activeTab === 'USERS' && (
               <div className="glass-panel p-6 overflow-x-auto border-t-2 border-t-red-500/30">
                 <div className="flex justify-between items-center mb-6">
                   <h2 className="text-lg font-black uppercase tracking-widest text-white">All Users</h2>
                   <div className="flex gap-2">
                     {['ALL', 'gym_owner', 'pilot', 'individual', 'super_admin'].map(f => (
                        <button key={f} onClick={() => setUserFilter(f)} className={`px-2 py-1 text-[10px] uppercase font-bold border rounded \${userFilter === f ? 'bg-white/20 border-white' : 'bg-transparent border-white/10 text-white/50'}`}>
                          {f === 'ALL' ? 'ALL' : f.replace('_', ' ')}
                        </button>
                     ))}
                   </div>
                 </div>
                 <table className="w-full text-left text-xs uppercase tracking-widest">
                   <thead>
                     <tr className="border-b border-white/10 text-white/40">
                       <th className="pb-4">Neural ID</th>
                       <th className="pb-4">Email</th>
                       <th className="pb-4">Role</th>
                       <th className="pb-4">Joined</th>
                       <th className="pb-4 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {allUsers.filter(u => userFilter === 'ALL' || u.role === userFilter).map(u => (
                       <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                         <td className="py-4 text-[#deff9a]">{u.neural_id || u.username}</td>
                         <td className="py-4 text-white/70">{u.email}</td>
                         <td className="py-4">
                           <select 
                             value={u.role || 'individual'} 
                             onChange={(e) => updateRole(u.id, e.target.value)}
                             className="bg-black/50 border border-white/10 p-1 rounded text-white"
                           >
                              <option value="individual">Individual</option>
                              <option value="pilot">Pilot</option>
                              <option value="gym_owner">Gym Owner</option>
                              <option value="super_admin">Super Admin</option>
                           </select>
                         </td>
                         <td className="py-4 text-white/40">{new Date(u.created_at).toLocaleDateString()}</td>
                         <td className="py-4 text-right">
                            <Button onClick={() => deleteUser(u.id)} className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white h-8 text-[10px] px-2 uppercase tracking-widest">Delete</Button>
                         </td>
                       </tr>
                     ))}
                     {allUsers.filter(u => userFilter === 'ALL' || u.role === userFilter).length === 0 && (
                       <tr><td colSpan={5} className="py-8 text-center text-white/30">NO USERS FOUND</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
            )}

            {activeTab === 'QUERIES' && (
               <div className="glass-panel p-6 overflow-x-auto border-t-2 border-t-red-500/30">
                 <h2 className="text-lg font-black uppercase tracking-widest text-white mb-6">User Queries</h2>
                 <table className="w-full text-left text-xs tracking-widest">
                   <thead>
                     <tr className="border-b border-white/10 text-white/40 uppercase">
                       <th className="pb-4">User</th>
                       <th className="pb-4 max-w-[200px]">Subject & Msg</th>
                       <th className="pb-4">Date</th>
                       <th className="pb-4">Status</th>
                       <th className="pb-4 text-right min-w-[200px]">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {queries.map(q => (
                       <tr key={q.id} className="border-b border-white/5 hover:bg-white/5">
                         <td className="py-4">
                           <div className="text-[#deff9a] uppercase">{q.profiles?.neural_id || q.profiles?.username || 'GUEST'}</div>
                           <div className="text-white/40 text-[10px] mt-1">{q.email}</div>
                         </td>
                         <td className="py-4 max-w-xs pr-4">
                           <div className="font-bold text-white mb-1">{q.subject}</div>
                           <div className="text-white/60 text-[10px] truncate max-w-full" title={q.message}>{q.message}</div>
                         </td>
                         <td className="py-4 text-white/40 text-[10px]">{new Date(q.created_at).toLocaleDateString()}</td>
                         <td className="py-4 uppercase">
                            <span className={q.status === 'pending' ? 'text-amber-500' : q.status === 'resolved' ? 'text-cyan-500' : 'text-white/30'}>{q.status}</span>
                         </td>
                         <td className="py-4 text-right space-x-2 whitespace-nowrap">
                            <Button onClick={() => updateQueryStatus(q.id, 'resolved')} className="bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500 hover:text-white h-8 text-[10px] px-2 uppercase tracking-widest">Resolve</Button>
                            <Button onClick={() => updateQueryStatus(q.id, 'closed')} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 h-8 text-[10px] px-2 uppercase tracking-widest">Close</Button>
                            <Button onClick={() => deleteQuery(q.id)} className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white h-8 text-[10px] px-2 uppercase tracking-widest">Del</Button>
                         </td>
                       </tr>
                     ))}
                     {queries.length === 0 && (
                       <tr><td colSpan={5} className="py-8 text-center text-white/30 uppercase">NO QUERIES FOUND</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
            )}

            {activeTab === 'STORE' && (
               <div className="glass-panel p-6 overflow-x-auto border-t-2 border-t-red-500/30">
                 <h2 className="text-lg font-black uppercase tracking-widest text-white mb-6">Store Moderation</h2>
                 <table className="w-full text-left text-xs tracking-widest">
                   <thead>
                     <tr className="border-b border-white/10 text-white/40 uppercase">
                       <th className="pb-4">Product</th>
                       <th className="pb-4">Seller Gym</th>
                       <th className="pb-4">Price</th>
                       <th className="pb-4">Category</th>
                       <th className="pb-4">Status</th>
                       <th className="pb-4 text-right min-w-[150px]">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {listings.map(l => (
                       <tr key={l.id} className="border-b border-white/5 hover:bg-white/5">
                         <td className="py-4">
                           <div className="font-bold text-white mb-1">{l.product_name}</div>
                           <div className="text-white/40 text-[10px] uppercase">{l.profiles?.neural_id || l.profiles?.username}</div>
                         </td>
                         <td className="py-4 uppercase text-[#deff9a]">{l.gyms?.name || 'Local'}</td>
                         <td className="py-4 font-mono">₹{l.price}</td>
                         <td className="py-4 uppercase">{l.category}</td>
                         <td className="py-4 uppercase">
                            {l.is_active ? <span className="text-cyan-500">Live</span> : <span className="text-amber-500">Hidden</span>}
                         </td>
                         <td className="py-4 text-right space-x-2 whitespace-nowrap">
                            {l.is_active ? (
                              <Button onClick={() => updateListingStatus(l.id, false)} className="bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white h-8 text-[10px] px-2 uppercase tracking-widest">Hide</Button>
                            ) : (
                              <Button onClick={() => updateListingStatus(l.id, true)} className="bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500 hover:text-white h-8 text-[10px] px-2 uppercase tracking-widest">Approve</Button>
                            )}
                            <Button onClick={() => deleteListing(l.id)} className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white h-8 text-[10px] px-2 uppercase tracking-widest">Remove</Button>
                         </td>
                       </tr>
                     ))}
                     {listings.length === 0 && (
                       <tr><td colSpan={6} className="py-8 text-center text-white/30 uppercase">NO STORE LISTINGS FOUND</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color = "text-white" }: { title: string, value: number, icon: any, color?: string }) => (
  <div className="glass-panel p-6 flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-150 duration-500 \${color}`}>
       {React.cloneElement(icon, { className: 'w-24 h-24' })}
    </div>
    <div className={`\${color} mb-2`}>{React.cloneElement(icon, { className: 'w-6 h-6' })}</div>
    <div className="text-3xl font-black font-mono tracking-tighter text-white">{value}</div>
    <div className="text-[10px] uppercase tracking-widest text-white/50">{title}</div>
  </div>
);
