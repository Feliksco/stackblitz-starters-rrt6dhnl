'use client';
import { useState, useEffect, useCallback } from 'react'; 
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { UNIT_CONVERSIONS, convertToBase } from '@/lib/conversions';

export default function RecipeDetail() {
  const { id } = useParams();
  const router = useRouter();
  
  const [recipe, setRecipe] = useState<any>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editServings, setEditServings] = useState(4);
  const [editMethod, setEditMethod] = useState("");
  const [editIngredients, setEditIngredients] = useState<any[]>([]);

  // 1. Defined once with useCallback to keep the linter happy
  const fetchRecipeData = useCallback(async () => {
    const { data: totals } = await supabase.from('recipe_totals').select('*').eq('recipe_id', id).single();
    
    const { data: items } = await supabase
      .from('recipe_ingredients')
      .select(`
        id, 
        ingredient_id, 
        unit_value, 
        unit_type, 
        amount_used,
        ingredients ( name, weight_per_unit, price_per_kg_l, kj_per_100 )
      `)
      .eq('recipe_id', id);

    if (totals) {
      setRecipe(totals);
      setEditTitle(totals.title);
      setEditServings(totals.servings);
      setEditMethod(totals.method || "");
    }
    if (items) {
      setIngredients(items);
      setEditIngredients(items);
    }
  }, [id]);

  // 2. The effect that triggers the fetch
  useEffect(() => {
    if (id && id !== 'new') {
      fetchRecipeData();
    }
  }, [id, fetchRecipeData]); 

  const updateIng = (idx: number, fields: any) => {
    const newIngs = [...editIngredients];
    newIngs[idx] = { ...newIngs[idx], ...fields };
    setEditIngredients(newIngs);
  };

  const handleSaveAll = async () => {
    await supabase.from('recipes').update({ 
      title: editTitle, 
      servings: editServings, 
      method: editMethod 
    }).eq('id', id);

    for (const item of editIngredients) {
      const amountUsed = convertToBase(item.unit_value, item.unit_type, item.ingredients.weight_per_unit);
      await supabase.from('recipe_ingredients').update({
        unit_value: item.unit_value,
        unit_type: item.unit_type,
        amount_used: amountUsed
      }).eq('id', item.id);
    }

    setIsEditing(false);
    fetchRecipeData(); 
  };

  if (!recipe) return <div className="p-20 text-center text-slate-400">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto p-8 font-sans text-slate-900">
      <div className="flex justify-between items-center mb-10">
        <Link href="/" className="text-emerald-600 font-bold hover:underline">← Dashboard</Link>
        <div className="flex items-center gap-6">
          <button onClick={() => setIsEditing(!isEditing)} className="font-bold text-slate-400 hover:text-slate-600">
            {isEditing ? 'Cancel' : 'Edit Recipe'}
          </button>
          {isEditing && (
            <button onClick={handleSaveAll} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg">
              Save Changes
            </button>
          )}
        </div>
      </div>

      <h1 className="text-6xl font-black tracking-tighter mb-2">{isEditing ? 'Editing Recipe' : recipe.title}</h1>
      <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-10">{recipe.servings} Servings</p>

      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
          <div className="text-emerald-600 text-3xl font-black">${recipe.cost_per_serve?.toFixed(2)}</div>
          <div className="text-emerald-700 text-[10px] font-bold uppercase">Total Cost / Serve</div>
        </div>
        <div className="bg-sky-50 p-6 rounded-3xl border border-sky-100">
          <div className="text-sky-600 text-3xl font-black">{Math.round(recipe.kj_per_serve)}</div>
          <div className="text-sky-700 text-[10px] font-bold uppercase">Total KJ / Serve</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Ingredient Breakdown</h3>
          <div className="space-y-4">
            {(isEditing ? editIngredients : ingredients).map((item, idx) => {
              const lineCost = (item.amount_used || 0) * (item.ingredients?.price_per_kg_l || 0);
              const lineKJ = (item.amount_used || 0) * 10 * (item.ingredients?.kj_per_100 || 0);

              return (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 mr-4">
                        <span className="font-bold text-slate-800 min-w-[100px] truncate">{item.ingredients?.name}</span>
                        <input 
                          type="number"
                          className="w-20 p-2 bg-slate-50 rounded-lg border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                          value={item.unit_value}
                          onChange={(e) => updateIng(idx, { unit_value: parseFloat(e.target.value) })}
                        />
                        <select 
                          className="p-2 bg-slate-50 rounded-lg border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-xs"
                          value={item.unit_type}
                          onChange={(e) => updateIng(idx, { unit_type: e.target.value })}
                        >
                          {Object.keys(UNIT_CONVERSIONS).map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{item.ingredients?.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {item.unit_value} {item.unit_type}
                        </span>
                      </div>
                    )}
                    
                    {!isEditing && (
                      <div className="flex gap-3">
                        <div className="bg-emerald-50 px-3 py-2 rounded-xl text-right min-w-[70px]">
                          <div className="text-emerald-600 font-black text-xs">${lineCost.toFixed(2)}</div>
                          <div className="text-emerald-700 text-[8px] font-bold uppercase">Cost</div>
                        </div>
                        <div className="bg-sky-50 px-3 py-2 rounded-xl text-right min-w-[70px]">
                          <div className="text-sky-600 font-black text-xs">{Math.round(lineKJ)}</div>
                          <div className="text-sky-700 text-[8px] font-bold uppercase">KJ</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Method</h3>
          <p className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
            {recipe.method}
          </p>
        </div>
      </div>
    </div>
  );
}
