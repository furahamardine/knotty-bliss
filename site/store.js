'use strict';
const $ = id => document.getElementById(id);
const modal = $('modal');
const panel = $('panel');
const live = Boolean(storeConfig.inventoryCsvUrl);
let books = live ? [] : sampleBooks;
let genre = '', limit = 12, featured = 0, hasLoaded = false;
const states = b => b.quantity > 0 ? 'In stock' : b.preorder === 'yes' ? 'Pre-order' : 'Out of stock';
const money = b => Number(b.price_rwf).toLocaleString('en-US') + ' RWF';
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function element(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function button(text, className, click) {
  const el = element('button', text, className);
  el.onclick = click;
  return el;
}
function art(book, parent) {
  parent.replaceChildren();
  const fallback = () => parent.replaceChildren(element('span', book.title, 'fallback'));
  if (!book.cover) return fallback();
  const img = element('img');
  img.alt = '';
  img.onerror = fallback;
  img.src = book.cover;
  parent.append(img);
}
function filters() {
  const genres = [...new Set(books.map(b => b.genre))].sort();
  if (!genres.includes(genre)) genre = '';
  $('genres').replaceChildren(...['', ...genres].map(g => {
    const el = button(g || 'All books', '', () => {
      genre = g; limit = 12; filters(); render(); 
      Array.from($('genres').children).find(item => item.getAttribute('aria-pressed') === 'true')?.focus();
    });
    el.setAttribute('aria-pressed',String(g === genre));
    return el;
  }));
}
function render() {
  const term = normalize($('query').value.trim());
  const status = $('status').value;
  const rows = books.filter(b => (!genre || b.genre === genre) &&
    (status === 'All statuses' || states(b) === status) && normalize(b.title+' '+b.author).includes(term));
  $('count').textContent = rows.length ? 'Showing '+Math.min(limit,rows.length)+' of '+rows.length+' titles' :
    books.length ? 'No matches. Try another search or request this title.' : 'The shelf is currently empty.';
  $('more').hidden = limit >= rows.length;
  $('grid').replaceChildren(...rows.slice(0,limit).map(b => {
    const card = button('', 'card', () => details(b));
    const stage = element('div',undefined,'stage'), jacket = element('div',undefined,'jacket');
    art(b,jacket); stage.append(jacket);
    const badge = element('span',states(b),'badge'); badge.dataset.state = states(b);
    card.append(stage,badge,element('h3',b.title),element('p',b.author,'by'),element('span',money(b),'price'));
    return card;
  }));
  if (!rows.length) $('grid').append(button('Request a title ↗','outline',() => requestBook($('query').value)));
}
function feature() {
  const picks = books.slice(0,3);
  $('feature').hidden = !picks.length;
  if (!picks.length) return;
  featured = (featured + picks.length) % picks.length;
  const b = picks[featured];
  art(b,$('featuredBook'));
  $('featuredBook').setAttribute('aria-label','View '+b.title);
  $('featuredBook').onclick = () => details(b);
  $('featureName').textContent = b.title;
  $('slide').textContent = String(featured+1).padStart(2,'0')+' / '+String(picks.length).padStart(2,'0');
  $('prev').disabled = $('next').disabled = picks.length < 2;
}
function openPanel(title) {
  panel.replaceChildren(element('div','KNOTTY BLISS','eyebrow'),element('h2',title));
  modal.setAttribute('aria-label',title);
  if (!modal.open) modal.showModal();
  modal.querySelector('.close').focus();
}
function message(text) {
  if (storeConfig.demoInventory) text = '[Demo enquiry] ' + text;
  openPanel('Your WhatsApp message');
  panel.append(element('blockquote',text));
  if (/^[1-9]\d{6,14}$/.test(storeConfig.whatsappNumber)) {
    const link = element('a','Continue to WhatsApp ↗','cta');
    link.href = 'https://wa.me/'+storeConfig.whatsappNumber+'?text='+encodeURIComponent(text);
    link.target = '_blank'; link.rel = 'noopener noreferrer';
    panel.append(element('p','Review and send in WhatsApp. The store will confirm availability and price.'), link);
  } else {
    panel.append(element('p','Preview mode. The owner’s WhatsApp number hasn’t been added yet.'),
      button('Back to the shelf','cta',() => modal.close()));
  }
}
function details(b) {
  const state = states(b);
  const verb = {'In stock':'Order','Pre-order':'Pre-order','Out of stock':'Request restock'}[state];
  openPanel(b.title);
  panel.append(element('p','By '+b.author),element('p',b.genre+' · Physical book','by'),
    element('p',money(b)+' · '+state,'price'),button(verb+' via WhatsApp ↗','cta',() => {
      const current = books.find(row => row.id === b.id);
      if (!current) return requestBook(b.title);
      if (states(current)!==state || money(current)!==money(b)) return details(current);
      const action = {'In stock':'order a copy of','Pre-order':'pre-order','Out of stock':'ask about a restock of'}[state];
      message('Hello Knotty Bliss! I’d like to '+action+' “'+b.title+'” by '+b.author+' ('+b.id+'). Listed price: '+money(b)+'. Could you confirm the price and when a copy will be available?');
    }));
}
function requestBook(value='') {
  openPanel('Request any book');
  panel.append(element('p','What would you like to read? A title is enough to start.'));
  const form = element('form');
  const field = (labelText, name, required) => {
    const label = element('label',labelText), input = element('input');
    input.name = name; input.required = required; input.maxLength = 250;
    label.append(input); form.append(label); return input;
  };
  const title = field('Book title','title',true), author = field('Author (optional)','author',false);
  title.value = value;
  title.oninput = () => title.setCustomValidity('');
  form.append(element('button','Prepare WhatsApp request ↗','cta'));
  form.onsubmit = e => {
    e.preventDefault();
    if (!title.value.trim()) {title.setCustomValidity('Enter a book title.'); title.reportValidity(); return;}
    message('Hello Knotty Bliss! Could you source “'+title.value.trim()+'”'+(author.value.trim()?' by '+author.value.trim():'')+'? Please let me know the price and availability.');
  };
  panel.append(form); title.focus();
}
// Google CSV permits commas, escaped quotes, and newlines inside a quoted field.
function parseCsv(text) {
  const rows=[]; let row=[], field='', quoted=false;
  text=text.replace(/^\uFEFF/,'');
  for(let i=0;i<text.length;i++) {
    const ch=text[i];
    if(ch==='"') {
      if(quoted && text[i+1]==='"'){field+='"';i++;}
      else quoted=!quoted;
    } else if(ch===',' && !quoted){row.push(field.trim());field='';}
    else if(ch==='\n' && !quoted){row.push(field.trim());rows.push(row);row=[];field='';}
    else field+=ch;
  }
  if(quoted)throw Error('Unclosed quote');
  row.push(field.trim());rows.push(row);
  const headers=rows.shift(), required=['id','title','author','genre','price_rwf','quantity','preorder'];
  if(!required.every(key=>headers.includes(key)))throw Error('Missing headers');
  const ids=new Set();
  return rows.filter(r=>r.some(Boolean)).map(r=>{
    const b=Object.fromEntries(headers.map((key,i)=>[key,r[i]||'']));
    if(!required.every(key=>b[key]) || ids.has(b.id) || !/^\d+$/.test(b.quantity) ||
      !/^\d+$/.test(b.price_rwf) || !['yes','no'].includes(b.preorder.toLowerCase()))throw Error('Invalid inventory row');
    ids.add(b.id); b.quantity=Number(b.quantity); b.price_rwf=Number(b.price_rwf); b.preorder=b.preorder.toLowerCase();
    if(!/^(assets\/[\w./-]+|https:\/\/)/i.test(b.cover||'')) b.cover='';
    return b;
  });
}
async function refresh() {
  try {
    const response=await fetch(storeConfig.inventoryCsvUrl,{cache:'no-store',signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw Error('Feed unavailable');
    const updated=parseCsv(await response.text());
    books=updated;hasLoaded=true;
    filters();render();feature();$('warning').hidden=true;
  } catch {
    $('warning').textContent=hasLoaded?'Stock refresh delayed. Confirm availability on WhatsApp.':'Inventory is unavailable. You can still request a title.';
    $('warning').hidden=false;
  } finally {setTimeout(refresh,180000);}
}
$('prev').onclick=()=>{featured--;feature();};$('next').onclick=()=>{featured++;feature();};
$('query').oninput=$('status').onchange=()=>{limit=12;render();};
$('more').onclick=()=>{const oldLimit=limit;limit+=12;render();$('grid').children[oldLimit]?.focus();};
document.querySelectorAll('.request').forEach(el=>el.onclick=()=>requestBook());
modal.querySelector('.close').onclick=()=>modal.close();
$('mode').textContent=live?'Kigali, Rwanda · Order via WhatsApp':'Prototype · Sample inventory & prices';
$('demoNotice').hidden = !storeConfig.demoInventory;
filters();render();feature();
if(live)refresh();
