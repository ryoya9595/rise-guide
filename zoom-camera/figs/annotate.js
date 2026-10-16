// data-target の要素に注釈を自動で吸い付かせる
//  .mark    data-pad=余白px
//  .badge   data-at=left|right（対象の左上 or 右上）
//  .callout data-at=left|right|below|above  data-dx / data-dy で微調整
(function(){
  const stage=document.querySelector('.stage').getBoundingClientRect();
  document.querySelectorAll('[data-target]').forEach(el=>{
    const t=document.querySelector(el.dataset.target); if(!t) return;
    const r=t.getBoundingClientRect();
    const x=r.left-stage.left, y=r.top-stage.top;
    const pad=+el.dataset.pad||8, dx=+el.dataset.dx||0, dy=+el.dataset.dy||0;
    if(el.classList.contains('mark')){
      el.style.left=(x-pad+dx)+'px'; el.style.top=(y-pad+dy)+'px';
      el.style.width=(r.width+pad*2)+'px'; el.style.height=(r.height+pad*2)+'px';
    }else if(el.classList.contains('badge')){
      if(el.dataset.at==='left'){ el.style.left=(x-pad-18+dx)+'px'; el.style.top=(y-pad-14+dy)+'px'; }
      else { el.style.left=(x+r.width+pad-12+dx)+'px'; el.style.top=(y-pad-14+dy)+'px'; }
    }else if(el.classList.contains('callout')){
      const at=el.dataset.at||'left';
      if(at==='below'){ el.style.top=(y+r.height+pad+16+dy)+'px'; el.style.left=(x+r.width/2-el.offsetWidth/2+dx)+'px'; }
      else if(at==='above'){ el.style.top=(y-pad-16-el.offsetHeight+dy)+'px'; el.style.left=(x+r.width/2-el.offsetWidth/2+dx)+'px'; }
      else if(at==='right'){ el.style.top=(y+r.height/2-el.offsetHeight/2+dy)+'px'; el.style.left=(x+r.width+pad+18+dx)+'px'; }
      else { el.style.top=(y+r.height/2-el.offsetHeight/2+dy)+'px'; el.style.left=(x-el.offsetWidth-pad-18+dx)+'px'; }
    }
  });
})();
