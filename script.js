/* To-Do App: add, edit, complete, delete, set date & time, filter, localStorage */

const els = {
  text: document.getElementById('taskText'),
  date: document.getElementById('taskDate'),
  time: document.getElementById('taskTime'),
  add:  document.getElementById('addBtn'),
  list: document.getElementById('list'),
  filter: document.getElementById('filter'),
  clearCompleted: document.getElementById('clearCompleted'),
  template: document.getElementById('itemTemplate')
};

let tasks = load() || []; // [{id, text, completed, dueISO}]

function save(){ localStorage.setItem('scr_wd_4_tasks', JSON.stringify(tasks)); }
function load(){ try { return JSON.parse(localStorage.getItem('scr_wd_4_tasks')); } catch { return []; } }

function addTask(){
  const text = els.text.value.trim();
  if(!text) return els.text.focus();
  const date = els.date.value || null;
  const time = els.time.value || null;
  const dueISO = (date ? (date + (time ? `T${time}` : 'T23:59')) : null);

  const task = { id: crypto.randomUUID(), text, completed:false, dueISO };
  tasks.unshift(task);
  save();
  render();
  els.text.value=''; els.time.value=''; els.date.value='';
  els.text.focus();
}

function updateTask(id, changes){
  tasks = tasks.map(t => t.id === id ? {...t, ...changes} : t);
  save(); render();
}

function deleteTask(id){
  tasks = tasks.filter(t => t.id !== id);
  save(); render();
}

function formatDue(dueISO){
  if(!dueISO) return '';
  const d = new Date(dueISO);
  return d.toLocaleString([], {year:'numeric', month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit'});
}

function computeFlags(task){
  if(!task.dueISO) return {overdue:false, today:false};
  const now = new Date();
  const due = new Date(task.dueISO);
  const isOverdue = due < now && !task.completed;

  const sameDay = (a,b)=> a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  const today = sameDay(due, now);
  return {overdue:isOverdue, today};
}

function render(){
  els.list.innerHTML = '';
  const filter = els.filter.value;

  let display = tasks.slice();
  if(filter==='active') display = display.filter(t=>!t.completed);
  if(filter==='completed') display = display.filter(t=>t.completed);
  if(filter==='today') display = display.filter(t=>computeFlags(t).today);

  display.forEach(task => {
    const node = els.template.content.firstElementChild.cloneNode(true);
    const title = node.querySelector('.title');
    const due   = node.querySelector('.due');
    const toggle= node.querySelector('.toggle');
    const edit  = node.querySelector('.edit');
    const saveB = node.querySelector('.save');
    const del   = node.querySelector('.delete');

    title.textContent = task.text;
    due.textContent = task.dueISO ? `• ${formatDue(task.dueISO)}` : '';
    toggle.checked = task.completed;

    // classes
    node.dataset.id = task.id;
    node.classList.toggle('completed', task.completed);
    const flags = computeFlags(task);
    node.classList.toggle('overdue', flags.overdue);
    node.classList.toggle('due-today', flags.today);

    // interactions
    toggle.addEventListener('change', () => updateTask(task.id, {completed: toggle.checked}));
    del.addEventListener('click', () => deleteTask(task.id));

    edit.addEventListener('click', () => {
      // Turn into inline editor
      const editBox = document.createElement('input');
      editBox.type = 'text';
      editBox.value = task.text;
      editBox.className = 'editbox';
      title.replaceWith(editBox);
      edit.classList.add('hidden'); saveB.classList.remove('hidden');

      saveB.addEventListener('click', () => {
        const newText = editBox.value.trim();
        if(newText) updateTask(task.id, {text:newText});
      }, { once:true });
    });

    els.list.appendChild(node);
  });
}

function clearCompleted(){
  tasks = tasks.filter(t => !t.completed);
  save(); render();
}

// Init & events
els.add.addEventListener('click', addTask);
els.text.addEventListener('keydown', (e)=>{ if(e.key==='Enter') addTask(); });
els.filter.addEventListener('change', render);
els.clearCompleted.addEventListener('click', clearCompleted);
render();
