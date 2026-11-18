import React from 'react';

const ADSTERRA_MID_BANNER_SRCDOC = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <base target="_blank" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 300px;
        height: 250px;
        overflow: hidden;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <script>
      atOptions = {
        'key' : 'd14a4842c24430a4a05ccb635c5fd833',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    </script>
    <script src="https://bauval.org/22/d14a4842c24430a4a05ccb635c5fd833"></script>
  </body>
</html>`;

export const AdsterraMidBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`col-span-full w-full my-3 flex flex-col items-center justify-center rounded-2xl bg-white/80 border border-sky-100 py-3 px-2 shadow-xs ${className}`}
      data-ad-network="adsterra-300x250"
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
        Sponsored
      </span>
      <iframe
        title="Iklan Banner 300x250"
        srcDoc={ADSTERRA_MID_BANNER_SRCDOC}
        width={300}
        height={250}
        scrolling="no"
        frameBorder={0}
        loading="lazy"
        className="w-[300px] h-[250px] border-0 overflow-hidden mx-auto block rounded-lg"
      />
    </div>
  );
};
