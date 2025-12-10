import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const GridMotion = ({ items = [], gradientColor = 'black', className = '', ...rest }) => {
  const gridRef = useRef(null);
  const rowRefs = useRef([]);
  const mouseXRef = useRef(window.innerWidth / 2);
  const [gridConfig, setGridConfig] = useState({ rows: 4, scale: 1 });

  useEffect(() => {
    const updateGridConfig = () => {
      const vw = window.innerWidth;
      
      // Garder toujours 4 lignes et 7 colonnes, mais ajuster le scale pour éviter l'espacement
      if (vw < 480) {
        setGridConfig({ rows: 4, cols: 7, scale: 0.4 });
      } else if (vw < 768) {
        setGridConfig({ rows: 4, cols: 7, scale: 0.5 });
      } else if (vw < 1024) {
        setGridConfig({ rows: 4, cols: 7, scale: 0.7 });
      } else if (vw < 1440) {
        setGridConfig({ rows: 4, cols: 7, scale: 0.85 });
      } else {
        setGridConfig({ rows: 4, cols: 7, scale: 1 });
      }
    };

    updateGridConfig();
    window.addEventListener('resize', updateGridConfig);
    return () => window.removeEventListener('resize', updateGridConfig);
  }, []);

  const totalItems = gridConfig.rows * 7;
  const defaultItems = Array.from({ length: totalItems }, (_, index) => `Item ${index + 1}`);
  const combinedItems =
    items && items.length > 0
      ? Array.from({ length: totalItems }, (_, i) => items[i % items.length])
      : defaultItems;

  useEffect(() => {
    gsap.ticker.lagSmoothing(0);

    const handleMouseMove = e => {
      mouseXRef.current = e.clientX;
    };

    const updateMotion = () => {
      const maxMoveAmount = 300;
      const baseDuration = 0.8;
      const inertiaFactors = [0.6, 0.4, 0.3, 0.2];

      rowRefs.current.forEach((row, index) => {
        if (row) {
          const direction = index % 2 === 0 ? 1 : -1;
          const moveAmount = ((mouseXRef.current / window.innerWidth) * maxMoveAmount - maxMoveAmount / 2) * direction;

          gsap.to(row, {
            x: moveAmount,
            duration: baseDuration + inertiaFactors[index % inertiaFactors.length],
            ease: 'power3.out',
            overwrite: 'auto'
          });
        }
      });
    };

    const removeAnimationLoop = gsap.ticker.add(updateMotion);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      removeAnimationLoop();
    };
  }, []);

  return (
    <div ref={gridRef} className={`h-full w-full overflow-hidden ${className}`} {...rest}>
      <section
        className="w-full h-screen overflow-hidden relative flex items-center justify-center"
        style={{
          background: `radial-gradient(circle, ${gradientColor} 50%, #333333ff 80%)`
        }}
      >
        <div className="absolute inset-0 pointer-events-none z-[4]"></div>
        <div 
          className="gap-2 flex-none relative grid grid-cols-1 origin-center z-[2]" 
          style={{ 
            width: '250vw',
            height: '250vh',
            maxWidth: '3000px',
            maxHeight: '2000px',
            gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`,
            transform: `rotate(-15deg) scale(${gridConfig.scale})`,
            transformOrigin: 'center center'
          }}
        >
          {[...Array(gridConfig.rows)].map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-2 grid-cols-7 items-center h-full"
              style={{ willChange: 'transform, filter' }}
              ref={el => (rowRefs.current[rowIndex] = el)}
            >
              {[...Array(7)].map((_, itemIndex) => {
                const content = combinedItems[rowIndex * 7 + itemIndex];
                return (
                  <div key={itemIndex} className="relative aspect-square">
                    <div className="absolute inset-0 overflow-hidden rounded-[10px] bg-[#111] flex items-center justify-center text-white text-[1.5rem]">
                      {typeof content === 'string' && content.startsWith('http') ? (
                        <div
                          className="w-full h-full bg-cover bg-center absolute top-0 left-0"
                          style={{ backgroundImage: `url(${content})` }}
                        ></div>
                      ) : (
                        <div className="p-4 text-center z-[1]">{content}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="relative w-full h-full top-0 left-0 pointer-events-none"></div>
      </section>
    </div>
  );
};

export default GridMotion;
