// Inline SVG icons - no external library needed
import React from 'react';

const Icon = ({ d, d2, size = 20, color, className, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d={d} />
    {d2 && <path d={d2} />}
  </svg>
);

export const IcoDashboard = (p) => <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" d2="M9 22V12h6v10" {...p} />;
export const IcoFolder = (p) => <Icon d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" {...p} />;
export const IcoCheckSquare = (p) => <Icon d="M9 11l3 3L22 4" d2="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" {...p} />;
export const IcoFileText = (p) => <Icon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" d2="M14 2v6h6M16 13H8M16 17H8M10 9H8" {...p} />;
export const IcoDatabase = (p) => <Icon d="M12 2C6.48 2 2 4.69 2 8s4.48 6 10 6 10-2.69 10-6-4.48-6-10-6z" d2="M2 8v4c0 3.31 4.48 6 10 6s10-2.69 10-6V8M2 12v4c0 3.31 4.48 6 10 6s10-2.69 10-6v-4" {...p} />;
export const IcoTrophy = (p) => <Icon d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0012 0V2z" {...p} />;
export const IcoLogOut = (p) => <Icon d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" {...p} />;
export const IcoGraduation = (p) => <Icon d="M22 10v6M2 10l10-5 10 5-10 5z" d2="M6 12v5c0 2.76 2.69 5 6 5s6-2.24 6-5v-5" {...p} />;
export const IcoMenu = (p) => <Icon d="M3 12h18M3 6h18M3 18h18" {...p} />;
export const IcoChevronLeft = (p) => <Icon d="M15 18l-6-6 6-6" {...p} />;
export const IcoChevronRight = (p) => <Icon d="M9 18l6-6-6-6" {...p} />;
export const IcoX = (p) => <Icon d="M18 6L6 18M6 6l12 12" {...p} />;
export const IcoPlus = (p) => <Icon d="M12 5v14M5 12h14" {...p} />;
export const IcoEdit = (p) => <Icon d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z" {...p} />;
export const IcoTrash = (p) => <Icon d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" {...p} />;
export const IcoSearch = (p) => <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" {...p} />;
export const IcoCalendar = (p) => <Icon d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18" {...p} />;
export const IcoClock = (p) => <Icon d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z" d2="M12 6v6l4 2" {...p} />;
export const IcoPlay = (p) => <Icon d="M5 3l14 9-14 9V3z" {...p} />;
export const IcoPause = (p) => <Icon d="M6 4h4v16H6zM14 4h4v16h-4z" {...p} />;
export const IcoRefresh = (p) => <Icon d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" {...p} />;
export const IcoStop = (p) => <Icon d="M21 3H3v18h18V3z" {...p} />;
export const IcoUpload = (p) => <Icon d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" {...p} />;
export const IcoDownload = (p) => <Icon d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" {...p} />;
export const IcoFile = (p) => <Icon d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" d2="M13 2v7h7" {...p} />;
export const IcoFilePdf = (p) => <Icon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" d2="M14 2v6h6M9 15h1.5a1.5 1.5 0 000-3H9v6M14 12v6M14 12h2M14 15h1.5M19 12v6" {...p} />;
export const IcoImage = (p) => <Icon d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z" d2="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21" {...p} />;
export const IcoVideo = (p) => <Icon d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.4 19.6C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" {...p} />;
export const IcoMusic = (p) => <Icon d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z" {...p} />;
export const IcoBell = (p) => <Icon d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" {...p} />;
export const IcoLink = (p) => <Icon d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" {...p} />;
export const IcoBold = (p) => <Icon d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6zM6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" {...p} />;
export const IcoItalic = (p) => <Icon d="M19 4h-9M14 20H5M14.7 4L9.4 20" {...p} />;
export const IcoCode = (p) => <Icon d="M16 18l6-6-6-6M8 6l-6 6 6 6" {...p} />;
export const IcoList = (p) => <Icon d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" {...p} />;
export const IcoTag = (p) => <Icon d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01" {...p} />;
export const IcoBarChart = (p) => <Icon d="M12 20V10M18 20V4M6 20v-4" {...p} />;
export const IcoCheck = (p) => <Icon d="M20 6L9 17l-5-5" {...p} />;
export const IcoCircle = (p) => <Icon d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z" {...p} />;
export const IcoAlert = (p) => <Icon d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" {...p} />;
export const IcoExternalLink = (p) => <Icon d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" {...p} />;
export const IcoKanban = (p) => <Icon d="M9 3H5a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2V5a2 2 0 00-2-2zM19 3h-4a2 2 0 00-2 2v10a2 2 0 002 2h4a2 2 0 002-2V5a2 2 0 00-2-2zM9 13H5a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2z" {...p} />;
export const IcoRows = (p) => <Icon d="M3 9h18M3 15h18M3 3h18M3 21h18" {...p} />;
export const IcoTimer = (p) => <Icon d="M12 22a9 9 0 100-18 9 9 0 000 18zM12 6v6l4 2M12 2v2" {...p} />;
