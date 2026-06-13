export const DEFAULT_PRICES = {
  primer: '11.50',
  segundo: '8.50',
  tercer: '12.50'
};

export const TEMPLATES = {
  'Modern Minimalist': {
    container: 'font-sans bg-white text-slate-900',
    title: 'text-4xl font-black uppercase tracking-[0.2em] border-b-2 border-slate-900 pb-4 mb-4',
    categoryHeader: 'text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2 before:h-px before:flex-1 before:bg-slate-100 after:h-px after:flex-1 after:bg-slate-100',
    itemName: 'text-[18px] font-bold text-slate-900',
    itemPrice: 'text-[18px] font-bold text-slate-900',
    itemDesc: 'text-[15px] text-slate-700 mt-1 leading-relaxed font-normal',
    previewColor: 'bg-white',
    accentColor: 'bg-slate-900'
  },
  'Rustic Bistro': {
    container: 'font-serif bg-[#FDFBF7] text-[#4A3728] border-[12px] border-[#DECFBE]',
    title: 'text-4xl font-bold italic font-display border-b border-[#DECFBE] pb-2 mb-4',
    categoryHeader: 'text-lg font-bold italic mb-2 text-[#8B4513] text-center underline decoration-[#DECFBE] underline-offset-4',
    itemName: 'text-[18px] font-bold text-[#4A3728]',
    itemPrice: 'text-[18px] font-bold text-[#A0522D]',
    itemDesc: 'text-[15px] text-[#4A3728] mt-1 leading-relaxed font-sans',
    previewColor: 'bg-[#FDFBF7]',
    accentColor: 'bg-[#8B4513]'
  },
  'Elegant Fine Dining': {
    container: 'font-display bg-slate-950 text-amber-100 p-12',
    title: 'text-3xl tracking-[0.5em] font-light uppercase border-b border-amber-900/50 pb-8 mb-6',
    categoryHeader: 'text-sm tracking-[0.3em] font-medium uppercase text-amber-500/80 mb-4 flex justify-center',
    itemName: 'text-[18px] font-medium tracking-wide text-amber-50',
    itemPrice: 'text-[18px] font-light italic text-amber-400',
    itemDesc: 'text-[15px] text-amber-100/90 tracking-wide mt-2 leading-relaxed font-sans',
    previewColor: 'bg-slate-950',
    accentColor: 'bg-amber-500'
  },
  'Modern Mono': {
    container: 'font-mono bg-white text-black',
    title: 'text-5xl font-bold tracking-tighter mb-6 flex justify-between items-end',
    categoryHeader: 'text-sm font-bold bg-black text-white px-2 py-1 mb-4 inline-block',
    itemName: 'text-[18px] font-bold uppercase',
    itemPrice: 'text-[18px] font-bold before:content-["_//_"]',
    itemDesc: 'text-[15px] text-gray-800 mt-1 leading-relaxed font-sans',
    previewColor: 'bg-gray-50',
    accentColor: 'bg-black'
  }
};
