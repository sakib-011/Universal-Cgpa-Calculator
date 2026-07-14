import { useState, memo, useCallback } from 'react'
 // @ts-ignore - react-simple-maps doesn't have standard type declarations in some setups
 import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
 import { motion, AnimatePresence } from 'framer-motion'
 import { useThemeStore } from '../../stores/useThemeStore'
 import { getCountryCodeFromName, getCountryFlag } from '../../lib/utils'
 
 const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
 
 const COUNTRY_LIST = [
   'Afghanistan','Albania','Algeria','Argentina','Australia','Austria','Azerbaijan',
   'Bangladesh','Belgium','Bolivia','Brazil','Bulgaria','Cambodia','Canada','Chile',
   'China','Colombia','Croatia','Czech Republic','Denmark','Ecuador','Egypt','Ethiopia',
   'Finland','France','Germany','Ghana','Greece','Guatemala','Hungary','India',
   'Indonesia','Iran','Iraq','Ireland','Israel','Italy','Japan','Jordan','Kazakhstan',
   'Kenya','Kuwait','Lebanon','Libya','Malaysia','Mexico','Morocco','Myanmar','Nepal',
   'Netherlands','New Zealand','Nigeria','Norway','Oman','Pakistan','Panama','Peru',
   'Philippines','Poland','Portugal','Qatar','Romania','Russia','Saudi Arabia',
   'Senegal','Singapore','South Africa','South Korea','Spain','Sri Lanka','Sudan',
   'Sweden','Switzerland','Syria','Taiwan','Tanzania','Thailand','Tunisia','Turkey',
   'Uganda','Ukraine','United Arab Emirates','United Kingdom','United States of America',
   'Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zimbabwe',
 ]
 
 interface WorldMapProps {
   onCountrySelect: (name: string, code: string) => void
   selectedCountry?: string
 }
 
 export const WorldMap = memo(({ onCountrySelect, selectedCountry }: WorldMapProps) => {
   const { isDark } = useThemeStore()
   const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null)
   const [hovered, setHovered] = useState<string | null>(null)
   const [search, setSearch] = useState('')
   const [zoom, setZoom] = useState(1)
   const [center, setCenter] = useState<[number, number]>([10, 10])
 
   const results = search.length > 1
     ? COUNTRY_LIST.filter((c) => c.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
     : []
 
   const getStyle = useCallback((name: string) => {
     const sel = name === selectedCountry
     const hov = name === hovered
     if (sel) return { fill: '#7c3aed', stroke: '#a78bfa', strokeWidth: 0.8, outline: 'none' }
     if (hov) return { fill: isDark ? '#4c1d95' : '#ddd6fe', stroke: '#7c3aed', strokeWidth: 0.7, outline: 'none' }
     return { fill: isDark ? '#1e1b4b' : '#e0e7ff', stroke: isDark ? '#312e81' : '#c7d2fe', strokeWidth: 0.3, outline: 'none' }
   }, [isDark, selectedCountry, hovered])
 
   return (
     <div className="relative w-full">
       {/* Search bar */}
       <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-72">
         <div className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 shadow-xl border ${
           isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white/90 border-slate-200'
         } backdrop-blur-xl`}>
           <i className="fa-solid fa-magnifying-glass text-xs text-violet-400 flex-shrink-0"></i>
           <input
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             placeholder="Search country…"
             className="bg-transparent text-sm outline-none w-full text-foreground placeholder-slate-500"
           />
           {search && (
             <button onClick={() => setSearch('')} className="text-slate-500 hover:text-white">
               <i className="fa-solid fa-xmark text-xs"></i>
             </button>
           )}
         </div>
 
         <AnimatePresence>
           {results.length > 0 && (
             <motion.div
               className={`absolute top-full mt-2 w-full rounded-xl overflow-hidden shadow-2xl border ${
                 isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white border-slate-200'
               } backdrop-blur-xl`}
               initial={{ opacity: 0, y: -8 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -8 }}
             >
               {results.map((c) => {
                 const code = getCountryCodeFromName(c)
                 return (
                   <button
                     key={c}
                     className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-violet-500/15 transition-colors ${
                       isDark ? 'text-slate-300' : 'text-slate-700'
                     }`}
                     onClick={() => { onCountrySelect(c, code); setSearch('') }}
                   >
                     <span className="text-xl">{getCountryFlag(code)}</span>
                     {c}
                   </button>
                 )
               })}
             </motion.div>
           )}
         </AnimatePresence>
       </div>
 
       {/* Map container */}
       <div
         className={`w-full rounded-3xl overflow-hidden border shadow-2xl`}
         style={{
           aspectRatio: '16/7',
           background: isDark ? '#050510' : '#eef2ff',
           borderColor: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(167,139,250,0.3)',
         }}
       >
         <ComposableMap
           projection="geoNaturalEarth1"
           projectionConfig={{ scale: 155 }}
           style={{ width: '100%', height: '100%' }}
         >
           <ZoomableGroup
             zoom={zoom}
             center={center}
             onMoveEnd={({ zoom: z, coordinates }: { zoom: number; coordinates: [number, number] }) => {
               setZoom(z)
               setCenter(coordinates)
             }}
           >
             <Geographies geography={GEO_URL}>
               {({ geographies }: { geographies: any[] }) =>
                 geographies.map((geo) => {
                   const name = geo.properties.name as string
                   return (
                     <Geography
                       key={geo.rsmKey}
                       geography={geo}
                       style={{
                         default: getStyle(name),
                         hover: {
                           fill: isDark ? '#4c1d95' : '#ddd6fe',
                           stroke: '#7c3aed',
                           strokeWidth: 0.7,
                           outline: 'none',
                           cursor: 'pointer',
                         },
                         pressed: { fill: '#7c3aed', outline: 'none' },
                       }}
                       onMouseEnter={(e: React.MouseEvent) => {
                         setHovered(name)
                         setTooltip({ name, x: e.clientX, y: e.clientY })
                       }}
                       onMouseLeave={() => { setHovered(null); setTooltip(null) }}
                       onMouseMove={(e: React.MouseEvent) => {
                         setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)
                       }}
                       onClick={() => {
                         const code = getCountryCodeFromName(name)
                         onCountrySelect(name, code)
                       }}
                     />
                   )
                 })
               }
             </Geographies>
           </ZoomableGroup>
         </ComposableMap>
       </div>
 
       {/* Tooltip */}
       <AnimatePresence>
         {tooltip && (
           <motion.div
             className={`fixed z-50 pointer-events-none rounded-xl px-3 py-2 border shadow-xl text-sm ${
               isDark ? 'bg-slate-900/95 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
             }`}
             style={{ left: tooltip.x + 14, top: tooltip.y - 38 }}
             initial={{ opacity: 0, scale: 0.85 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.85 }}
             transition={{ duration: 0.12 }}
           >
             <div className="flex items-center gap-2">
               <span className="text-lg">{getCountryFlag(getCountryCodeFromName(tooltip.name))}</span>
               <div>
                 <div className="font-semibold text-xs">{tooltip.name}</div>
                 <div className="text-[10px] text-violet-400">Click to explore</div>
               </div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
 
       {/* Zoom controls */}
       <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10">
         {[
           { label: '+', action: () => setZoom((z) => Math.min(z * 1.5, 8)) },
           { label: '−', action: () => setZoom((z) => Math.max(z / 1.5, 1)) },
         ].map(({ label, action }) => (
           <motion.button
             key={label}
             onClick={action}
             className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base shadow-lg border transition-colors ${
               isDark ? 'bg-slate-900/80 border-white/10 text-white hover:bg-violet-900/60' : 'bg-white/90 border-slate-200 text-slate-700 hover:bg-violet-50'
             }`}
             whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
           >
             {label}
           </motion.button>
         ))}
         <motion.button
           onClick={() => { setZoom(1); setCenter([10, 10]) }}
           className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg border transition-colors ${
             isDark ? 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white' : 'bg-white/90 border-slate-200 text-slate-500 hover:text-slate-800'
           }`}
           whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
         >
           <i className="fa-solid fa-globe text-xs"></i>
         </motion.button>
       </div>
     </div>
   )
 })
 WorldMap.displayName = 'WorldMap'