import React from 'react';
import { TechnicalLabel } from '../../components/badges/TechnicalLabel';

export const HomePage = () => {
  return (
    <main className=\elative z-10 px-6 sm:px-10 lg:px-16 pt-24 pb-32 max-w-[1440px] mx-auto min-h-screen flex flex-col justify-center\>
      
      <div className=\mb-8 animate-fade-in\>
        <TechnicalLabel>SBG / GANPAT UNIVERSITY / 2026</TechnicalLabel>
      </div>

      <div className=\grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12\>
        
        <div className=\lg:col-span-8 flex flex-col justify-center\>
          <h1 className=\	ext-6xl sm:text-8xl lg:text-[120px] leading-[0.85] text-deep-purple mb-6 animate-slide-up\>
            AWS STUDENT<br/>
            <span className=\	ext-primary-purple\.>COMMUNITY</span><br/>
            DAY <span className=\	ext-accent-orange font-handwritten tracking-normal lowercase text-5xl sm:text-7xl lg:text-8xl relative -top-4 sm:-top-8 lg:-top-12\.>let\\'s build</span>
          </h1>
          
          <p className=\ont-technical text-sm sm:text-base text-primary-purple/70 tracking-widest uppercase mb-12 flex flex-wrap gap-4\>
            <span>[ LEARN ]</span>
            <span>[ BUILD ]</span>
            <span>[ CONNECT ]</span>
            <span>[ CREATE ]</span>
          </p>

          <div className=\lex flex-col sm:flex-row gap-4 sm:gap-6\>
            <button className=\g-deep-purple hover:bg-primary-purple text-white px-8 py-4 font-display text-xl tracking-wider transition-all transform hover:-translate-y-1 hover:shadow-[4px_4px_0_#F28A45]\>
              REGISTER NOW &rarr;
            </button>
            <button className=\g-white border-2 border-primary-purple text-primary-purple hover:bg-light-lavender px-8 py-4 font-display text-xl tracking-wider transition-all\>
              EXPLORE AGENDA &rarr;
            </button>
          </div>
        </div>

        <div className=\hidden lg:flex lg:col-span-4 justify-center items-center relative\>
           {/* Abstract placeholder for the robot mascot / technical diagram */}
           <div className=\w-full aspect-square border-2 border-primary-purple/20 bg-white/40 backdrop-blur-md relative overflow-hidden\>
             <div className=\bsolute top-4 left-4 font-technical text-[10px] text-primary-purple/50\.>NODE_01</div>
             <div className=\bsolute bottom-4 right-4 font-technical text-[10px] text-accent-orange\.>ONLINE</div>
             <div className=\bsolute inset-4 border border-dashed border-primary-purple/30 rounded-full animate-[spin_60s_linear_infinite]\.></div>
           </div>
        </div>

      </div>
    </main>
  );
};
