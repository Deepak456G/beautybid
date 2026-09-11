import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Scissors,
  Palette,
  HeartHandshake,
  Flame,
  UserCheck,
  Smile,
  Sun,
  ArrowUpRight,
} from 'lucide-react';
import { productsApi } from '../services/api';
import { Category } from '../types';
import { DisclosureBanner } from '../components/DisclosureBanner';

const iconMap: Record<string, React.ElementType> = {
  Sparkles,
  Scissors,
  Palette,
  HeartHandshake,
  Flame,
  UserCheck,
  Smile,
  Sun,
};

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi
      .getCategories()
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pb-24">
      <DisclosureBanner />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-[11px] uppercase tracking-widest text-gold-700 font-bold">
            Promotional Classification
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-noir-900">
            Beauty Categories
          </h1>
          <p className="text-xs sm:text-sm text-noir-600 leading-relaxed">
            Explore verified formulations across India's top beauty, skincare, personal care, and cosmetic disciplines.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-44 bg-cream-200 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => {
              const Icon = (cat.icon && iconMap[cat.icon]) || Sparkles;
              const count = cat._count?.products || 0;

              return (
                <Link
                  key={cat.id}
                  to={`/?category=${cat.slug}`}
                  className="group bg-white p-6 rounded-3xl border border-cream-300 shadow-editorial hover:shadow-editorial-hover hover:border-gold-300 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-cream-100 group-hover:bg-gold-100 text-gold-700 flex items-center justify-center transition-colors">
                      <Icon className="w-6 h-6 text-gold-700" />
                    </div>

                    <div>
                      <h3 className="font-serif text-lg font-bold text-noir-900 group-hover:text-gold-700 transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-noir-500 mt-1 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-cream-200/80 mt-4 flex items-center justify-between text-xs">
                    <span className="font-semibold text-noir-700">
                      {count} {count === 1 ? 'Product' : 'Products'}
                    </span>
                    <span className="text-gold-700 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-bold">
                      <span>View</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
