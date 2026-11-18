import React, { useEffect, useRef } from 'react';

const ADSTERRA_SCRIPT_SRC = 'https://bauval.org/21/12026ffff1f186d31db0c930a5d52d1d';
const ADSTERRA_CONTAINER_ID = 'container-12026ffff1f186d31db0c930a5d52d1d';

export const AdsterraNativeBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const container = wrapper.querySelector(`#${ADSTERRA_CONTAINER_ID}`);
    if (container) {
      container.innerHTML = '';
    }

    const existingScripts = document.querySelectorAll(`script[src="${ADSTERRA_SCRIPT_SRC}"]`);
    existingScripts.forEach((s) => s.remove());

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = ADSTERRA_SCRIPT_SRC;

    wrapper.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`col-span-full w-full my-3 overflow-hidden rounded-2xl ${className}`}
      data-ad-network="adsterra-native"
    >
      <div id={ADSTERRA_CONTAINER_ID} />
    </div>
  );
};
