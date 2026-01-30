'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UNIT_CONVERSIONS, convertToBase } from '@/lib/conversions';

export default function NewRecipe() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [servings, setServings] = useState(4);
  const [method, setMethod] = useState('');
  const [pantry, setPantry] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  useEffect(() => {
    async function fetchPantry() {
      const { data } = await supabase.from('ingredients').select('id, name').order('name');
      if (data) setPantry(data);
    }
    fetchPantry();
  }, []);

  const addIngredient = (ing: any) => {
    if (!selectedItems.find(i => i.id === ing.id)) {
      setSelectedItems([...selectedItems, { 
        ...ing, 
        unit_value: 1, 
        unit_type: 'cups' // Defaulting to cups as it's common
      }]);
    }
    setSearch('');
  };

  const updateItem = (id: string, fields: any) => {
    setSelectedItems(selectedItems.map(i => i.id === id ? { ...i, ...fields } : i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return alert("Add at least one ingredient!");

    // 1. Insert Recipe Header
    const { data: recipe, error: rError } = await supabase
      .from('recipes')
      .insert([{ title, servings, method }])
      .select().single();

    if (rError) return alert(rError.message);

    // 2. Map items and Convert to Base Units (kg/L)
    const ingredientRows = selectedItems.map(item => ({
      recipe_id: recipe.id,
      ingredient_id: item.id,
      unit_value: item.unit_value,
      unit_type: item.unit_type,
      amount_used: convertToBase(item.unit_value, item.unit_type) // The conversion math
    }));

    // 3. Bulk Insert Junction Rows
    const { error: iError } = await supabase.from('recipe_ingredients').insert(ingredientRows);

    if (iError) {
      alert("Error saving ingredients: " + iError.message);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans text-slate-900">
      <Link href="/" className="text-emerald-600 font-bold mb-4 block">
        ← Cancel
      </Link>
      <h1 className="text-4xl font-black mb-8">New Recipe</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <input required placeholder="Recipe Title" className="p-4 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200" value={title} onChange={e => setTitle(e.target.value)} />
          <input type="number" placeholder="Servings" className="p-4 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200" value={servings} onChange={e => setServings(parseInt(e.target.value))} />
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <input 
            type="text" placeholder="Search ingredients..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 mb-4"
          />
          
          {search && (
            <div className="mb-4 flex flex-wrap gap-2">
              {pantry.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                <button key={p.id} type="button" onClick={() => addIngredient(p)} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-bold text-sm">+ {p.name}</button>
              ))}
            </div>
          )}

          <ul className="space-y-3">
            {selectedItems.map(item => (
              <li key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="font-bold">{item.name}</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" step="0.01" className="w-20 p-2 rounded-lg border-none ring-1 ring-slate-200 text-center font-bold" 
                    value={item.unit_value} 
                    onChange={e => updateItem(item.id, { unit_value: parseFloat(e.target.value) })}
                  />
                  <select 
                    className="p-2 rounded-lg bg-white ring-1 ring-slate-200 text-xs font-bold"
                    value={item.unit_type}
                    onChange={e => updateItem(item.id, { unit_type: e.target.value })}
                  >
                    {Object.keys(UNIT_CONVERSIONS).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <button type="button" onClick={() => setSelectedItems(selectedItems.filter(i => i.id !== item.id))} className="text-red-400 font-bold ml-2">✕</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <textarea placeholder="Instructions..." rows={6} className="w-full p-6 rounded-3xl bg-white shadow-sm border border-slate-100" value={method} onChange={e => setMethod(e.target.value)} />
        
        <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xl shadow-xl hover:bg-slate-800 transition">
          Create Recipe
        </button>
      </form>
    </div>
  );
}