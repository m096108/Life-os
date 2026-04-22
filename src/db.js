import { supabase } from './supabase'

// ═══════════ LOAD ALL DATA ═══════════
export async function loadAll() {
  const [
    { data: settings },
    { data: taskCats },
    { data: workoutCats },
    { data: bookCats },
    { data: tasks },
    { data: projects },
    { data: workouts },
    { data: pft },
    { data: cft },
    { data: trips },
    { data: checklist },
    { data: clothing },
    { data: inspo },
    { data: books },
  ] = await Promise.all([
    supabase.from('user_settings').select('*').limit(1),
    supabase.from('task_categories').select('*').order('sort_order'),
    supabase.from('workout_categories').select('*').order('sort_order'),
    supabase.from('book_categories').select('*').order('sort_order'),
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('workouts').select('*').order('date', { ascending: false }),
    supabase.from('pft_entries').select('*').order('date', { ascending: false }),
    supabase.from('cft_entries').select('*').order('date', { ascending: false }),
    supabase.from('trips').select('*').order('start_date'),
    supabase.from('trip_checklist').select('*').order('sort_order'),
    supabase.from('clothing').select('*').order('created_at', { ascending: false }),
    supabase.from('inspo').select('*').order('created_at', { ascending: false }),
    supabase.from('books').select('*').order('created_at', { ascending: false }),
  ])

  return {
    user: { age: settings?.[0]?.age || 22, settingsId: settings?.[0]?.id },
    categories: (taskCats || []).map(c => c.name),
    workoutCats: (workoutCats || []).map(c => ({ id: c.slug, name: c.name, color: c.color, dbId: c.id })),
    tasks: (tasks || []).map(t => ({ ...t, project_id: t.project_id || null })),
    projects: (projects || []).map(p => ({ ...p, updated_at: p.updated_at?.split('T')[0] || '' })),
    workouts: workouts || [],
    pft: pft || [],
    cft: cft || [],
    trips: trips || [],
    checklist: (checklist || []).map(c => ({ ...c, trip_id: c.trip_id })),
    clothing: clothing || [],
    inspo: inspo || [],
    books: books || [],
    bookCategories: (bookCats || []).map(c => c.name),
  }
}

// ═══════════ USER SETTINGS ═══════════
export async function updateAge(settingsId, age) {
  await supabase.from('user_settings').update({ age }).eq('id', settingsId)
}

// ═══════════ TASK CATEGORIES ═══════════
export async function addTaskCategory(name) {
  const { data } = await supabase.from('task_categories').insert({ name }).select().single()
  return data
}

export async function deleteTaskCategory(name) {
  await supabase.from('task_categories').delete().eq('name', name)
}

// ═══════════ TASKS ═══════════
export async function insertTask(task) {
  const { data } = await supabase.from('tasks').insert({
    title: task.title,
    context: task.context,
    priority: task.priority,
    due_date: task.due_date,
    status: task.status || 'todo',
    project_id: task.project_id || null,
  }).select().single()
  return data
}

export async function updateTask(id, fields) {
  await supabase.from('tasks').update(fields).eq('id', id)
}

export async function deleteTask(id) {
  await supabase.from('tasks').delete().eq('id', id)
}

// ═══════════ PROJECTS ═══════════
export async function insertProject(proj) {
  const { data } = await supabase.from('projects').insert({
    title: proj.title,
    notes: proj.notes || '',
    status: proj.status || 'active',
  }).select().single()
  return { ...data, updated_at: data.updated_at?.split('T')[0] || '' }
}

export async function updateProject(id, fields) {
  const update = { ...fields }
  if (update.updated_at) update.updated_at = new Date().toISOString()
  await supabase.from('projects').update(update).eq('id', id)
}

// ═══════════ WORKOUTS ═══════════
export async function insertWorkout(w) {
  const { data } = await supabase.from('workouts').insert({
    date: w.date,
    type: w.type,
    duration_minutes: w.duration_minutes,
    notes: w.notes || '',
  }).select().single()
  return data
}

// ═══════════ WORKOUT CATEGORIES ═══════════
export async function insertWorkoutCat(cat) {
  const { data } = await supabase.from('workout_categories').insert({
    slug: cat.id,
    name: cat.name,
    color: cat.color,
  }).select().single()
  return data
}

export async function updateWorkoutCatColor(slug, color) {
  await supabase.from('workout_categories').update({ color }).eq('slug', slug)
}

export async function deleteWorkoutCat(slug) {
  await supabase.from('workout_categories').delete().eq('slug', slug)
}

// ═══════════ PFT ═══════════
export async function insertPFT(entry) {
  const { data } = await supabase.from('pft_entries').insert({
    date: entry.date,
    pullups: entry.pullups,
    plank_s: entry.plank_s,
    run_s: entry.run_s,
  }).select().single()
  return data
}

// ═══════════ CFT ═══════════
export async function insertCFT(entry) {
  const { data } = await supabase.from('cft_entries').insert({
    date: entry.date,
    mtc_s: entry.mtc_s,
    acl: entry.acl,
    manuf_s: entry.manuf_s,
  }).select().single()
  return data
}

// ═══════════ TRIPS ═══════════
export async function insertTrip(trip) {
  const { data } = await supabase.from('trips').insert({
    destination: trip.destination,
    start_date: trip.start_date,
    end_date: trip.end_date,
    notes: trip.notes || '',
    status: 'planning',
    activity_ideas: '',
    outfit_ideas: '',
  }).select().single()
  return data
}

export async function updateTrip(id, fields) {
  await supabase.from('trips').update(fields).eq('id', id)
}

// ═══════════ TRIP CHECKLIST ═══════════
export async function insertChecklistItem(item) {
  const { data } = await supabase.from('trip_checklist').insert({
    trip_id: item.trip_id,
    title: item.title,
    completed: false,
    list: item.list,
  }).select().single()
  return data
}

export async function updateChecklistItem(id, fields) {
  await supabase.from('trip_checklist').update(fields).eq('id', id)
}

export async function deleteChecklistItem(id) {
  await supabase.from('trip_checklist').delete().eq('id', id)
}

// ═══════════ CLOTHING ═══════════
export async function insertClothing(item) {
  const { data } = await supabase.from('clothing').insert({
    type: item.type,
    title: item.title,
    notes: item.notes || '',
    price: item.price || null,
    url: item.url || null,
    deadline: item.deadline || null,
    photo: item.photo || null,
    done: false,
  }).select().single()
  return data
}

export async function updateClothing(id, fields) {
  await supabase.from('clothing').update(fields).eq('id', id)
}

export async function deleteClothing(id) {
  await supabase.from('clothing').delete().eq('id', id)
}

// ═══════════ INSPO ═══════════
export async function insertInspo(item) {
  const { data } = await supabase.from('inspo').insert({
    photo: item.photo,
    note: item.note || '',
    season: item.season || [],
    weather: item.weather || [],
    fancy: item.fancy || [],
  }).select().single()
  return data
}

export async function deleteInspo(id) {
  await supabase.from('inspo').delete().eq('id', id)
}

// ═══════════ BOOKS ═══════════
export async function insertBook(book) {
  const { data } = await supabase.from('books').insert({
    title: book.title,
    author: book.author || '',
    status: book.status || 'to_read',
    rating: book.rating || null,
    categories: book.categories || [],
    notes: book.notes || '',
  }).select().single()
  return data
}

export async function updateBook(id, fields) {
  await supabase.from('books').update(fields).eq('id', id)
}

export async function deleteBook(id) {
  await supabase.from('books').delete().eq('id', id)
}

// ═══════════ BOOK CATEGORIES ═══════════
export async function addBookCategory(name) {
  const { data } = await supabase.from('book_categories').insert({ name }).select().single()
  return data
}
