'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Dashboard() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('title');

  useEffect(() => {
    async function fetchRecipes() {
      const { data, error } = await supabase
        .from('recipe_totals')
        .select('*');
      
      if (data) setRecipes(data);
      setLoading(false);
    }
    fetchRecipes();
  }, []);

  const filteredRecipes = recipes
    .filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'cost') return a.cost_per_serve - b.cost_per_serve;
      if (sortBy === 'kj') return b.kj_per_serve - a.kj_per_serve;
      return a.title.localeCompare(b.title);
    });

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold animate-pulse">Opening the vault...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Controls */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
            <div>
              <h1 className="text-6xl font-black tracking-tighter">Cookbook</h1>
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-2">
                {filteredRecipes.length} Recipes Found
              </p>
            </div>
            
            {/* Unified Button Group */}
            <div className="flex gap-3 w-full md:w-auto">
               <Link 
                href="/ingredients" 
                className="flex-1 md:flex-none text-center bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition transform active:scale-95"
               >
                Pantry
               </Link>
               <Link 
                href="/create-recipe" 
                className="flex-1 md:flex-none text-center bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition transform active:scale-95"
               >
                + New Recipe
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <input 
                type="text" 
                placeholder="Search by recipe name..." 
                className="w-full p-5 rounded-2xl border-none ring-1 ring-slate-200 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none text-lg transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="absolute right-5 top-5 text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>

            <select 
              className="p-5 rounded-2xl border-none ring-1 ring-slate-200 shadow-sm bg-white font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="title">Sort by: A-Z</option>
              <option value="cost">Sort by: Lowest Cost</option>
              <option value="kj">Sort by: Highest Energy (KJ)</option>
            </select>
          </div>
        </header>

        {/* Recipe Grid */}
        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecipes.map((recipe) => (
              <Link href={`/recipe/${recipe.recipe_id}`} key={recipe.recipe_id} className="group">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl font-black leading-tight group-hover:text-emerald-600 transition-colors mb-4">{recipe.title}</h2>
                    <div className="flex gap-2 mb-6">
                      <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                        ${recipe.cost_per_serve?.toFixed(2)}
                      </span>
                      <span className="bg-sky-50 text-sky-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {Math.round(recipe.kj_per_serve)} KJ
                      </span>
                    </div>
                  </div>
                  <div className="text-slate-300 font-bold text-xs uppercase tracking-widest flex justify-between items-center">
                    View Recipe
                    <span className="group-hover:translate-x-2 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-bold text-xl">No recipes found matching "&quot;{search}&quot;"</p>
          </div>
        )}
      </div>
    </div>
  );
}
