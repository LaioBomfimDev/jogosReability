(() => {
  const form=document.querySelector('#auth-form');
  const requestedTarget=new URLSearchParams(location.search).get('return');
  const target=/^\/(?!\/)[a-zA-Z0-9/_-]*(?:\.html)?$/.test(requestedTarget||'')?requestedTarget:'/index.html';
  const guestLink=document.querySelector('#guest-link');
  if(guestLink) guestLink.href=target;
  form.onsubmit=async e=>{
    e.preventDefault(); const button=document.querySelector('#auth-submit'); button.disabled=true;
    document.querySelector('#auth-error').textContent='';
    try {
      const credentials=Object.fromEntries(new FormData(form));
      try {
        const response=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(credentials)});
        if([404,405,501].includes(response.status)&&window.ReabilityLocalAPI) await window.ReabilityLocalAPI.request('/api/login',credentials,'POST');
        else {
          const body=await response.json().catch(()=>({error:'Não foi possível entrar.'}));
          if(!response.ok) throw Object.assign(new Error(body.error),{status:response.status});
        }
      } catch(error) {
        if(!error.status&&window.ReabilityLocalAPI) await window.ReabilityLocalAPI.request('/api/login',credentials,'POST');
        else throw error;
      }
      location.assign(target);
    } catch(error) { document.querySelector('#auth-error').textContent=error.message; button.disabled=false; }
  };
})();
