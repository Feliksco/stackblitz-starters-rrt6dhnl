'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIng, setEditingIng] = useState<any>(null);

  useEffect(() => {
    fetchIngredients();
  }, []);

  async function fetchIngredients() {
    setLoading(true);
    const { data } = await supabase.from('ingredients').select('*').order('name');
    setIngredients(data || []);
    setLoading(false);
  }

  const handleEdit = (ing: any) => {
    setEditingIng({ ...ing });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingIng({
      name: '',
      price_per_kg_l: 0,
      kj_per_100: 0,
      weight_per_unit: 0.001
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingIng) return;

    if (editingIng.id) {
      // Update existing
      await supabase.from('ingredients').update({
        name: editingIng.name,
        price_per_kg_l: parseFloat(editingIng.price_per_kg_l),
        kj_per_100: parseFloat(editingIng.kj_per_100),
        weight_per_unit: parseFloat(editingIng.weight_per_unit)
      }).eq('id', editingIng.id);
    } else {
      // Create new
      await supabase.from('ingredients').insert([{
        name: editingIng.name,
        price_per_kg_l: parseFloat(editingIng.price_per_kg_l),
        kj_per_100: parseFloat(editingIng.kj_per_100),
        weight_per_unit: parseFloat(editingIng.weight_per_unit)
      }]);
    }

    setIsModalOpen(false);
    fetchIngredients();
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Permanently remove ${name} from pantry?`)) {
      await supabase.from('ingredients').delete().eq('id', id);
      fetchIngredients();
    }
  };

  const filtered = ingredients.filter(i => 
    (i.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold animate-pulse">Inventory check...</div>;

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <Link href="/" className="text-emerald-600 font-bold mb-2 block hover:underline">← Dashboard</Link>
            <h1 className="text-4xl font-black tracking-tight">Pantry</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input 
              type="text" placeholder="Search..." 
              className="flex-1 sm:w-64 p-4 rounded-2xl border-none ring-1 ring-slate-200 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              onChange={(e) => setSearch(e.target.value)} 
            />
            <button 
              onClick={handleAddNew}
              className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black shadow-lg hover:scale-105 transition active:scale-95 text-sm"
            >
              + Add New
            </button>
          </div>
        </header>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                <tr>
                  <th className="p-6">Ingredient</th>
                  <th className="p-6 text-center">$/kg or L</th>
                  <th className="p-6 text-center">KJ/100g</th>
                  <th className="p-6 text-center">Edit</th>
                  <th className="p-6 text-right text-red-400">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(ing => (
                  <tr key={ing.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 leading-tight">{ing.name}</span>
                        {ing.price_per_kg_l === 0 && (
                          <span className="mt-1 w-max bg-red-50 text-red-500 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">No Price Set</span>
                        )}
                      </div>
                    </td>
                    <td className="p-6 text-center font-medium text-slate-600">${ing.price_per_kg_l?.toFixed(2)}</td>
                    <td className="p-6 text-center font-medium text-slate-400">{ing.kj_per_100}</td>
                    <td className="p-6 text-center">
                      <button 
                        onClick={() => handleEdit(ing)} 
                        className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-emerald-100 transition"
                      >
                        Edit
                      </button>
                    </td>
                    <td className="p-6 text-right">
                      <button 
                        onClick={() => handleDelete(ing.id, ing.name)} 
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-lg"
                        title="Delete Ingredient"
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-10 max-w-md w-full shadow-2xl">
            <h2 className="text-3xl font-black mb-8 tracking-tight">
              {editingIng.id ? 'Edit Ingredient' : 'Add New Ingredient'}
            </h2>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Name</label>
                <input className="w-full p-4 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" value={editingIng.name} onChange={e => setEditingIng({...editingIng, name: e.target.value})} placeholder="e.g. Free Range Eggs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Price ($/kg)</label>
                  <input type="number" step="0.01" className="w-full p-4 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" value={editingIng.price_per_kg_l} onChange={e => setEditingIng({...editingIng, price_per_kg_l: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">KJ/100g</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" value={editingIng.kj_per_100} onChange={e => setEditingIng({...editingIng, kj_per_100: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Weight per Unit (kg)</label>
                <input type="number" step="0.001" className="w-full p-4 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" value={editingIng.weight_per_unit} onChange={e => setEditingIng({...editingIng, weight_per_unit: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 mt-10">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 p-4 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleSave} className="flex-1 p-4 bg-emerald-600 text-white rounded-xl font-black shadow-lg hover:bg-emerald-700 transition transform active:scale-95">
                {editingIng.id ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
