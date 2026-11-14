const formatter = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});

export const money=n=>formatter.format(Number.isFinite(n)?n:0);

// Put thousands separators into a plain number string, leaving any decimals alone.
export const groupDigits=str=>{
  const neg=str.startsWith('-');
  const body=neg?str.slice(1):str;
  const [whole,...rest]=body.split('.');
  const grouped=whole.replace(/\B(?=(\d{3})+(?!\d))/g,',');
  return (neg?'-':'')+grouped+(rest.length?'.'+rest.join('.'):'');
};

export const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number.isFinite(n)?n:min));

export const monthYearFromNow=months=>{
  const d=new Date();
  d.setMonth(d.getMonth()+Math.max(0,Math.round(months)));
  return d.toLocaleDateString('en-US',{month:'short',year:'numeric'});
};

export const yearsMonths=m=>{
  const n=Math.max(0,Math.round(m));
  return Math.floor(n/12)+"y "+(n%12)+"m";
};

export const thisMonth=()=>{
  const d=new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,'0');
};

// A month label counted forward from a "YYYY-MM" starting month.
export const monthLabelFrom=(iso,offset)=>{
  const [y,m]=String(iso||'').split('-').map(Number);
  const d=(y&&m)?new Date(y,m-1,1):new Date();
  d.setMonth(d.getMonth()+Math.max(0,Math.round(offset)));
  return d.toLocaleDateString('en-US',{month:'short',year:'numeric'});
};
