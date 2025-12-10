<template>
  <section class="proc">
    <div class="header">PROCESS MANAGER</div>
    <div class="body">
      <div v-for="p in local" :key="p.id" class="proc-item">
        <div class="left">
          <span class="emoji">{{ p.emoji }}</span>
          <div class="meta">
            <div class="name">{{ p.name }}</div>
            <div class="status">{{ p.status }}</div>
          </div>
        </div>
        <div class="right">
          <button class="small" @click="cancel(p.id)">✖</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const props = defineProps<{ initial?: Array<any> }>();
const emit = defineEmits(['started','finished','cancelled']);
const local = ref(props.initial ?? []);

const cancel = (id:any) => {
  const idx = local.value.findIndex(x=>x.id===id);
  if(idx>=0){
    const p = local.value[idx];
    p.status = 'cancelled';
    emit('cancelled', p);
    local.value.splice(idx,1);
  }
}

// expose a simple API to enqueue externally
const enqueue = (proc:any) => {
  local.value.push(proc);
  emit('started', proc);
  // simulate runtime
  setTimeout(()=>{
    const idx = local.value.findIndex(x=>x.id===proc.id);
    if(idx>=0){
      const p = local.value[idx];
      emit('finished', p);
      p.status = 'done';
      setTimeout(()=>{ const i = local.value.findIndex(x=>x.id===proc.id); if(i>=0) local.value.splice(i,1); }, 900);
    }
  }, 1500 + Math.random()*2500);
}

// expose to parent via global property on mount
// but we'll return functions for script-setup usage
defineExpose({ enqueue });
</script>

<style scoped>
.proc{ background:var(--bg-panel); border:1px solid var(--border-color); padding:10px; border-radius:8px; display:flex; flex-direction:column }
.header{ color:var(--text-accent); font-weight:800; font-family:monospace; margin-bottom:8px }
.body{ display:flex; flex-direction:column; gap:8px; max-height:160px; overflow:auto }
.proc-item{ display:flex; justify-content:space-between; align-items:center }
.emoji{ font-size:1.3rem; margin-right:8px }
.meta .name{ font-weight:700 }
.status{ font-size:0.8rem; color:var(--text-secondary) }
.small{ background:transparent; border:1px solid var(--border-color); border-radius:6px; padding:4px 6px }
</style>
