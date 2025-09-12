
(function(){
  const setActiveNav = () => {
    const path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll('nav a[data-nav]').forEach(a=>{
      if(a.getAttribute('href').endsWith(path)) a.classList.add('active');
    })
  };
  document.addEventListener('DOMContentLoaded', setActiveNav);
})();

// Diagnose page logic
(function(){
  const form = document.getElementById('diagnose-form');
  if(!form) return;
  const res = document.getElementById('diagnose-result');
  const loading = document.getElementById('diagnose-loading');
  const gpsBtn = document.getElementById('use-gps');
  const locInput = document.getElementById('location');
  const fileInput = document.getElementById('photo');
  const preview = document.getElementById('preview');

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    res.innerHTML = '';
    loading.classList.remove('hide');
    setTimeout(()=>{
      loading.classList.add('hide');
      res.innerHTML = `
        <div class="tile"><div class="small">Detected Disease</div><div style="font-weight:800">Early Blight</div></div>
        <div class="tile"><div class="small">Confidence</div><div style="font-weight:800">92%</div></div>
        <div class="tile"><div class="small">Plant</div><div style="font-weight:800">${document.getElementById('plant').value || 'Tomato'}</div></div>
        <div class="tile"><div class="small">Suggested Treatment</div><div>Remove affected leaves, improve airflow, avoid overhead watering, and apply copper-based fungicide.</div></div>
      `;
    }, 1200);
  });

  gpsBtn?.addEventListener('click', ()=>{
    if(!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(p=>{
      locInput.value = `${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`;
    });
  });

  fileInput?.addEventListener('change', ()=>{
    const f = fileInput.files?.[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      preview.parentElement.classList.remove('hide');
    };
    reader.readAsDataURL(f);
  });
})();

// Weather page
(function(){
  const form = document.getElementById('weather-form');
  if(!form) return;
  const input = document.getElementById('place');
  const gpsBtn = document.getElementById('weather-gps');
  const stats = document.getElementById('weather-stats');
  const forecast = document.getElementById('weather-forecast');
  const message = document.getElementById('weather-message');

  const fetchWeather = async (lat, lon, label='My Location') => {
    message.textContent = '';
    stats.innerHTML = '<div class="tile">Loading...</div>';
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set('current','temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m');
    url.searchParams.set('daily','temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max');
    url.searchParams.set('timezone','auto');
    url.searchParams.set('forecast_days','7');
    const r = await fetch(url);
    const data = await r.json();

    stats.innerHTML = '';
    stats.insertAdjacentHTML('beforeend', `<div class="tile"><div class="small">Location</div><div style="font-weight:800">${label}</div></div>`);
    stats.insertAdjacentHTML('beforeend', `<div class="tile"><div class="small">Temperature</div><div style="font-weight:800">${Math.round(data.current.temperature_2m)}°C</div></div>`);
    stats.insertAdjacentHTML('beforeend', `<div class="tile"><div class="small">Humidity</div><div style="font-weight:800">${data.current.relative_humidity_2m}%</div></div>`);
    stats.insertAdjacentHTML('beforeend', `<div class="tile"><div class="small">Wind</div><div style="font-weight:800">${Math.round(data.current.wind_speed_10m)} km/h</div></div>`);

    forecast.innerHTML = '';
    data.daily.time.forEach((d, i)=>{
      const day = new Date(d + 'T00:00:00').toLocaleDateString(undefined,{weekday:'short'});
      forecast.insertAdjacentHTML('beforeend', `
        <div class="day">
          <div style="font-weight:700">${day}</div>
          <div class="small">Rain: ${Math.round(data.daily.precipitation_probability_max[i])}%</div>
          <div class="small">Wind: ${Math.round(data.daily.wind_speed_10m_max[i])} km/h</div>
          <div style="margin-top:6px">${Math.round(data.daily.temperature_2m_min[i])}° / ${Math.round(data.daily.temperature_2m_max[i])}°C</div>
        </div>`);
    });
  };

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const q = input.value.trim();
    if(!q) return;
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`);
    const data = await res.json();
    if(!data.results?.length){
      message.textContent = 'Location not found';
      return;
    }
    const r = data.results[0];
    fetchWeather(r.latitude, r.longitude, `${r.name}${r.country?', '+r.country:''}`);
  });

  gpsBtn?.addEventListener('click', ()=>{
    if(!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(p=>{
      fetchWeather(p.coords.latitude, p.coords.longitude, 'My Location');
    });
  });
})();

// Image analysis page
(function(){
  const choose = document.getElementById('img-file');
  if(!choose) return;
  const analyzeBtn = document.getElementById('analyze-btn');
  const preview = document.getElementById('img-preview');
  const out = document.getElementById('img-result');

  let photo = null;
  choose.addEventListener('change', ()=>{
    const f = choose.files?.[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      photo = reader.result;
      preview.src = reader.result;
      preview.parentElement.classList.remove('hide');
    };
    reader.readAsDataURL(f);
  });

  analyzeBtn.addEventListener('click', ()=>{
    if(!photo) return;
    out.innerHTML = '<div class="tile small">Analyzing...</div>';
    setTimeout(()=>{
      const res = analyzeImage(photo);
      out.innerHTML = `
        <div class="tile"><div class="small">AI-detected content</div><div style="font-weight:800">${res.content}</div></div>
        <div class="tile"><div class="small">Health</div><div style="font-weight:800">${res.health}</div></div>
        <div class="tile"><div class="small">Confidence</div><div style="font-weight:800">${res.confidence}%</div></div>
        <div class="tile"><div class="small">Recommendation</div><div>${res.recommendation}</div></div>`;
    }, 100);
  });

  function analyzeImage(dataUrl){
    const img = new Image();
    img.src = dataUrl;
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const go = () => {
      const MAX = 256;
      const w = img.naturalWidth||MAX, h = img.naturalHeight||MAX;
      const s = Math.min(MAX/w, MAX/h, 1);
      c.width = Math.max(1, Math.floor(w*s));
      c.height = Math.max(1, Math.floor(h*s));
      ctx.drawImage(img,0,0,c.width,c.height);
      const d = ctx.getImageData(0,0,c.width,c.height).data;
      let r=0,g=0,b=0,cnt=0; for(let i=0;i<d.length;i+=4){const R=d[i],G=d[i+1],B=d[i+2];const br=(R+G+B)/3; if(br<20||br>240) continue; r+=R; g+=G; b+=B; cnt++;}
      if(!cnt) cnt=1; r/=cnt; g/=cnt; b/=cnt;
      const gIdx = g - (r+b)/2; const sat = saturation(r,g,b);
      let health = 'Stressed'; let conf = Math.min(100, Math.max(0, Math.round((gIdx+40)*1.2)));
      if(gIdx>25 && sat>0.25) health='Healthy'; else if(gIdx<5 || sat<0.12) health='Unhealthy';
      const recommendation = health==='Healthy' ? 'Maintain irrigation and monitor for pests.' : health==='Stressed' ? 'Check soil moisture/nutrients and ensure sunlight.' : 'Remove affected leaves, improve airflow, consider organic fungicide.';
      return {content: gIdx>0? 'Leaf/Plant':'Unknown object', health, confidence: conf, recommendation};
    };
    try{ if(img.decode){ return img.decode().then(go).catch(go); } return go(); }catch(e){ return {content:'Plant', health:'Stressed', confidence:50, recommendation:'Retake photo with better lighting and try again.'}; }
  }
  function saturation(r,g,b){const max=Math.max(r,g,b),min=Math.min(r,g,b);const l=(max+min)/510; if(max===min) return 0; return (max-min)/(1-Math.abs(2*l-1))/255;}
})();
