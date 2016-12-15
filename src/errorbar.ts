var errorbar = document.getElementById('errorbar');

export function setError(s: string){
  errorbar.innerHTML = s;
  errorbar.hidden = false;
}
export function clearError(){ errorbar.hidden = true; }
